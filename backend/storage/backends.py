"""
Storage backends.

IntelliConnect never exposes Supabase service-role credentials to the
frontend — every privileged storage operation happens here, server-side.

Two backends are provided:
  * SupabaseStorageBackend — production. Files live in the Supabase
    Storage bucket (`meeting-files`) under the organization/meeting path
    convention. Downloads are served through signed URLs generated with
    the service-role key.
  * LocalStorageBackend — local development without a Supabase project.
    Files live under MEDIA_ROOT and are served by Django.

Select the backend with STORAGE_BACKEND=supabase|local in environment
configuration.
"""

from abc import ABC, abstractmethod
from pathlib import Path

from django.conf import settings

from config.exceptions import StorageError


def _bucket_name(bucket) -> str:
    """Bucket name from either a dict or a pydantic model (storage3 >= 0.9)."""
    if isinstance(bucket, dict):
        return bucket.get("name", "")
    return getattr(bucket, "name", "") or ""


_storage_instances: dict = {}


def get_storage():
    """Return the configured storage backend (cached per configuration).

    The Supabase backend's constructor calls `create_client` and a
    `list_buckets` network round trip, so a fresh instance per call would
    add hundreds of milliseconds of latency on every read/save. Cache the
    instance keyed by its configuration.
    """
    if settings.STORAGE_BACKEND == "supabase":
        key = ("supabase", settings.SUPABASE_URL, settings.SUPABASE_STORAGE_BUCKET)
    else:
        key = ("local", settings.MEDIA_ROOT)
    if key not in _storage_instances:
        if settings.STORAGE_BACKEND == "supabase":
            _storage_instances[key] = SupabaseStorageBackend(
                url=settings.SUPABASE_URL,
                service_role_key=settings.SUPABASE_SERVICE_ROLE_KEY,
                bucket=settings.SUPABASE_STORAGE_BUCKET,
            )
        else:
            _storage_instances[key] = LocalStorageBackend(root=settings.MEDIA_ROOT)
    return _storage_instances[key]


class BaseStorageBackend(ABC):
    """Common interface for meeting file storage."""

    @abstractmethod
    def save(self, path: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        """Persist bytes at `path` (relative to the storage root). Returns the stored path."""

    @abstractmethod
    def read(self, path: str) -> bytes:
        """Return file bytes at `path`."""

    @abstractmethod
    def url(self, path: str) -> str:
        """Return a URL (signed for remote backends) that can be fetched."""

    @abstractmethod
    def delete(self, path: str) -> None:
        """Remove the file at `path`; missing files are ignored."""

    @abstractmethod
    def exists(self, path: str) -> bool:
        ...


class SupabaseStorageBackend(BaseStorageBackend):
    def __init__(self, url: str, service_role_key: str, bucket: str):
        if not url or not service_role_key:
            raise StorageError(
                "Supabase storage is not configured. Set SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY in the backend environment."
            )
        self._bucket = bucket
        self._client = None
        try:
            from supabase import create_client

            self._client = create_client(url, service_role_key)
            self._ensure_bucket()
        except StorageError:
            raise
        except Exception as exc:  # pragma: no cover - depends on external service
            raise StorageError(f"Could not connect to Supabase Storage: {exc}") from exc

    def _ensure_bucket(self):
        try:
            buckets = self._client.storage.list_buckets()
            if not any(_bucket_name(b) == self._bucket for b in buckets):
                self._client.storage.create_bucket(
                    self._bucket, options={"public": False}
                )
        except Exception as exc:
            raise StorageError(f"Could not prepare storage bucket: {exc}") from exc

    def _content_type(self, path: str) -> str:
        ext = Path(path).suffix.lower()
        return {
            ".txt": "text/plain",
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".srt": "text/plain",
            ".vtt": "text/vtt",
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".m4a": "audio/mp4",
        }.get(ext, "application/octet-stream")

    def save(self, path, content, content_type=None):
        content_type = content_type or self._content_type(path)
        options = {"content-type": content_type}
        self._client.storage.from_(self._bucket).upload(
            path, content, {"content-type": content_type}
        )
        return path

    def read(self, path):
        if not path:
            raise StorageError("No file path provided.")
        try:
            result = self._client.storage.from_(self._bucket).download(path)
            return result
        except Exception as exc:
            raise StorageError(f"Could not read file from storage: {exc}") from exc

    def url(self, path):
        if not path:
            raise StorageError("No file path provided.")
        try:
            signed = self._client.storage.from_(self._bucket).create_signed_url(
                path, expires_in=3600
            )
            return signed.get("signedURL") or signed.get("signedUrl") or ""
        except Exception as exc:
            raise StorageError(f"Could not create download link: {exc}") from exc

    def delete(self, path):
        if not path:
            return
        try:
            self._client.storage.from_(self._bucket).remove([path])
        except Exception:
            # Removing a missing file is not an error worth surfacing.
            return

    def exists(self, path):
        if not path:
            return False
        try:
            self._client.storage.from_(self._bucket).get_public_url(path)
            return True
        except Exception:
            return False


class LocalStorageBackend(BaseStorageBackend):
    """Development backend writing under MEDIA_ROOT (served by Django)."""

    def __init__(self, root: str):
        self._root = Path(root)

    def _resolve(self, path: str) -> Path:
        # Guard against path traversal.
        root = self._root.resolve()
        candidate = (root / path).resolve()
        if root != candidate and root not in candidate.parents:
            raise StorageError("Invalid file path.")
        return candidate

    def save(self, path, content, content_type=None):
        target = self._resolve(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, "wb") as fh:
            fh.write(content)
        return path.replace("\\", "/")

    def read(self, path):
        if not path:
            raise StorageError("No file path provided.")
        target = self._resolve(path)
        if not target.exists():
            raise StorageError("File not found.")
        return target.read_bytes()

    def url(self, path):
        if not path:
            raise StorageError("No file path provided.")
        from django.urls import reverse

        return reverse("storage:file", kwargs={"path": path})

    def delete(self, path):
        if not path:
            return
        target = self._resolve(path)
        if target.exists():
            try:
                target.unlink()
            except OSError:
                return

    def exists(self, path):
        if not path:
            return False
        return self._resolve(path).exists()
