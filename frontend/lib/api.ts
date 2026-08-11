import { API_URL } from "./constants";

const ACCESS_KEY = "intelliconnect.access_token";
const REFRESH_KEY = "intelliconnect.refresh_token";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  get isAuthError() {
    return this.status === 401;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

function friendlyNetworkMessage() {
  return "Unable to connect to IntelliConnect. Please try again.";
}

type JsonRecord = Record<string, unknown>;

function errorCode(payload: unknown, status: number): string {
  const record = payload as JsonRecord | null;
  if (typeof record?.code === "string" && record.code) return record.code;
  if (status === 401) return "unauthorized";
  if (status === 403) return "permission_denied";
  return "error";
}

function extractDetail(payload: unknown): string {
  const fallback = "Something went wrong. Please try again.";
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload === "object") {
    const record = payload as JsonRecord;
    if (typeof record.detail === "string") return record.detail;
    if (Array.isArray(record.detail) && record.detail.length) {
      const first = record.detail[0];
      return typeof first === "string" ? first : JSON.stringify(first);
    }
    const key = Object.keys(record)[0];
    const value = key ? record[key] : undefined;
    if (Array.isArray(value) && value.length) {
      return typeof value[0] === "string" ? value[0] : JSON.stringify(value[0]);
    }
    if (typeof value === "string") return value;
  }
  return fallback;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = window.localStorage.getItem(ACCESS_KEY);
      this.refreshToken = window.localStorage.getItem(REFRESH_KEY);
    }
  }

  get isAuthenticated() {
    return Boolean(this.accessToken);
  }

  get access() {
    return this.accessToken;
  }

  setTokens(access: string, refresh?: string) {
    this.accessToken = access;
    if (refresh) {
      this.refreshToken = refresh;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCESS_KEY, access);
      if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACCESS_KEY);
      window.localStorage.removeItem(REFRESH_KEY);
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) return null;
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const response = await fetch(`${API_URL}/auth/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: this.refreshToken }),
          });
          if (!response.ok) {
            this.clearTokens();
            return null;
          }
          const data = await response.json();
          this.setTokens(data.access, data.refresh);
          return data.access as string;
        } catch {
          return null;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }
    return this.refreshPromise;
  }

  async request<T>(
    path: string,
    options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
  ): Promise<T> {
    const { method = "GET", body, headers } = options;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const perform = async (token: string | null): Promise<Response> => {
      const requestHeaders: Record<string, string> = { ...headers };
      if (token) requestHeaders.Authorization = `Bearer ${token}`;
      if (body && !isFormData) requestHeaders["Content-Type"] = "application/json";

      return fetch(`${API_URL}${path}`, {
        method,
        headers: requestHeaders,
        body:
          body && !isFormData ? JSON.stringify(body) : (body as BodyInit | undefined),
      });
    };

    let response = await perform(this.accessToken).catch(() => null);

    if (!response) {
      throw new ApiError(0, "network_error", friendlyNetworkMessage());
    }

    if (response.status === 401 && this.refreshToken) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        response = await perform(newToken).catch(() => null);
        if (!response) {
          throw new ApiError(0, "network_error", friendlyNetworkMessage());
        }
      }
    }

    if (response.status === 204) return undefined as T;

    let payload: unknown = null;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const detail = extractDetail(payload);
      const code = errorCode(payload, response.status);
      if (response.status === 401 && code === "unauthorized") {
        this.clearTokens();
      }
      throw new ApiError(response.status, code, detail);
    }

    return payload as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "POST", body });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PATCH", body });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PUT", body });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }

  /**
   * Upload multipart data with real upload progress reporting
   * (XMLHttpRequest supports upload progress; fetch does not).
   */
  uploadWithProgress<T>(path: string, formData: FormData, onProgress?: (percent: number) => void): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}${path}`);
      if (this.accessToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${this.accessToken}`);
      }
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = async () => {
        let payload: unknown = null;
        try {
          payload = JSON.parse(xhr.responseText) as unknown;
        } catch {
          payload = null;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload as T);
        } else {
          reject(new ApiError(xhr.status, errorCode(payload, xhr.status), extractDetail(payload)));
        }
      };
      xhr.onerror = () => reject(new ApiError(0, "network_error", friendlyNetworkMessage()));
      xhr.send(formData);
    });
  }

  /** Fetch a protected file (PDFs on local storage) as a blob. */
  async fetchBlob(pathOrUrl: string): Promise<Blob> {
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${API_URL}${pathOrUrl}`;
    const response = await fetch(url, {
      headers: this.accessToken
        ? { Authorization: `Bearer ${this.accessToken}` }
        : undefined,
    }).catch(() => null);
    if (!response || !response.ok) {
      throw new ApiError(
        response?.status ?? 0,
        "download_error",
        "We couldn't download this file. Please try again."
      );
    }
    return response.blob();
  }
}

export const api = new ApiClient();
