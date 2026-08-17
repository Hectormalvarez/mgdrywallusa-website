"""DRF exception handler that wraps validation errors in {"errors": {...}} format."""

from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Return {"errors": {"field": ["msg"]}} for validation errors."""
    response = exception_handler(exc, context)

    if response is not None and isinstance(response.data, dict):
        # Wrap field-level errors
        response.data = {"errors": response.data}

    return response