from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from core.mixins import EnvelopeResponseMixin
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    tokens_for_user,
)


class RegisterView(EnvelopeResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = tokens_for_user(user)
        return self.success_response(
            data={"user": UserSerializer(user).data, "tokens": tokens},
            message="Account created successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(EnvelopeResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = tokens_for_user(user)
        return self.success_response(
            data={"user": UserSerializer(user).data, "tokens": tokens},
            message="Logged in successfully.",
        )


class MeView(EnvelopeResponseMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return self.success_response(data=UserSerializer(request.user).data)


class LogoutView(EnvelopeResponseMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return self.success_response(message="Logged out successfully.")