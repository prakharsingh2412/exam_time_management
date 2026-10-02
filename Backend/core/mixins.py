from rest_framework import status
from core.responses import success, error


class EnvelopeResponseMixin:
    """Provides success_response() and error_response() shortcuts."""

    def success_response(self, data=None, message="OK", status_code=status.HTTP_200_OK):
        return success(data=data, message=message, status=status_code)

    def error_response(self, message="Error", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        return error(message=message, errors=errors, status=status_code)