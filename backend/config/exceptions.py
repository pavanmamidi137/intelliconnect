"""Global exception handling.

Converts framework and application errors into a consistent JSON shape
without ever leaking stack traces or internal implementation details.
"""

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class ApplicationError(Exception):
    """Base class for domain errors raised by services."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Something went wrong. Please try again."
    code = "application_error"

    def __init__(self, detail=None, code=None, status_code=None):
        self.detail = detail or self.default_detail
        self.code = code or self.code
        if status_code is not None:
            self.status_code = status_code
        super().__init__(self.detail)


class FileValidationError(ApplicationError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "This file type isn't supported."
    code = "file_validation_error"


class AIProviderError(ApplicationError):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "We couldn't analyze this meeting. Your transcript is safe. Please retry."
    code = "ai_provider_error"


class AIOutputError(ApplicationError):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "The AI returned an unexpected result. Your transcript is safe. Please retry."
    code = "ai_output_error"


class StorageError(ApplicationError):
    status_code = status.HTTP_507_INSUFFICIENT_STORAGE
    default_detail = "We couldn't store this file. Please try again."
    code = "storage_error"


class NotFoundError(ApplicationError):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "The requested resource was not found."
    code = "not_found"


class PermissionDeniedError(ApplicationError):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You don't have permission to access this resource."
    code = "permission_denied"


def intelliconnect_exception_handler(exc, context):
    """Return a friendly, consistent error payload for every request."""

    response = exception_handler(exc, context)

    if isinstance(exc, ApplicationError):
        return _build_response(exc.detail, exc.status_code, exc.code)

    if response is not None:
        # DRF validation / auth / not-found errors keep their status code
        # and field-level detail but are normalised into a stable envelope.
        detail = response.data
        code = getattr(exc, "default_code", None) or "error"
        if isinstance(detail, dict):
            flattened = _flatten_errors(detail)
            message = flattened.get("non_field_errors", []) or _first_value(flattened)
        else:
            message = detail if isinstance(detail, list) and detail else str(detail)
        return _build_response(message, response.status_code, code)

    # Anything unexpected: log server-side, return a generic client message.
    import logging

    logger = logging.getLogger("intelliconnect")
    logger.exception("Unhandled exception", exc_info=exc)
    return _build_response(
        "Something went wrong on our end. Please try again.",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "internal_error",
    )


def _build_response(detail, status_code, code):
    from rest_framework.response import Response

    return Response(
        {"error": True, "code": code, "detail": detail},
        status=status_code,
    )


def _flatten_errors(data: dict) -> dict:
    """Keep DRF field errors, but convert lists-of-strings to single strings."""
    result = {}
    for key, value in data.items():
        if isinstance(value, list):
            result[key] = value
        elif isinstance(value, dict):
            result[key] = value
    return result


def _first_value(data: dict):
    for value in data.values():
        if isinstance(value, list) and value:
            return value[0]
        if isinstance(value, str):
            return value
    return "Please check the information you entered."
