from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """Wrap DRF errors in a consistent envelope."""
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "success": False,
            "message": _extract_message(response.data),
            "errors": response.data,
        }
    return response


def _extract_message(data):
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        first_key = next(iter(data))
        first_val = data[first_key]
        if isinstance(first_val, list) and first_val:
            return f"{first_key}: {first_val[0]}"
    return "Request failed"