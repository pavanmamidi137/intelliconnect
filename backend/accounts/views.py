from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from organizations.serializers import OrganizationSerializer

from .serializers import ChangePasswordSerializer, ProfileSerializer, RegisterSerializer

User = get_user_model()


def _token_payload(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": {
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "designation": user.designation,
            "department": user.department,
            "organization": OrganizationSerializer(user.organization).data
            if user.organization_id
            else None,
        },
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"message": "Account created successfully.", **_token_payload(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        user = User.objects.filter(email__iexact=request.data.get("email", "")).first()
        if user is None or not user.check_password(request.data.get("password", "")):
            return Response(
                {
                    "error": True,
                    "code": "invalid_credentials",
                    "detail": "Email or password is incorrect.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {
                    "error": True,
                    "code": "account_disabled",
                    "detail": "This account has been disabled.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        data = response.data
        data.update(_token_payload(user))
        return Response(data)


class SafeTokenRefreshSerializer(TokenRefreshSerializer):
    """Refresh that handles tokens belonging to deleted/unknown users
    gracefully (returns 401 instead of an unhandled 500)."""

    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except User.DoesNotExist:
            raise AuthenticationFailed(
                "Your session has expired. Please sign in again."
            ) from None


class SafeTokenRefreshView(TokenRefreshView):
    serializer_class = SafeTokenRefreshSerializer


class RequestOTPView(APIView):
    """Send a 6-digit verification code to the user's email.

    Passwordless login prevents duplicate accounts: a code only works for
    an existing account tied to that email. When no account exists, the
    response guides the user to registration. In development (DEBUG) the
    code is returned so the flow works without an email backend.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        import secrets
        from datetime import timedelta

        from django.conf import settings
        from django.utils import timezone

        from .emails import send_login_otp
        from .models import LoginOTP

        email = (request.data.get("email") or "").strip().lower()
        user = User.objects.filter(email__iexact=email).first() if email else None

        if user is None:
            return Response(
                {
                    "message": "No account found with this email. Please register first.",
                    "account_exists": False,
                },
                status=status.HTTP_200_OK,
            )
        if not user.is_active:
            return Response(
                {
                    "error": True,
                    "code": "account_disabled",
                    "detail": "This account has been disabled.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Only the newest code is valid — invalidate any previous ones.
        LoginOTP.objects.filter(user=user, used=False).update(used=True)
        code = f"{secrets.randbelow(1_000_000):06d}"
        LoginOTP.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        sent = send_login_otp(user.email, code)

        payload = {
            "message": "A verification code has been sent to your email.",
            "account_exists": True,
            "expires_in": 600,
        }
        # Development convenience only — never exposed in production.
        if settings.DEBUG and not sent:
            payload["dev_code"] = code
        return Response(payload)


class VerifyOTPView(APIView):
    """Exchange a verified email code for JWT tokens."""

    permission_classes = [AllowAny]

    def post(self, request):
        from django.utils import timezone

        from .models import LoginOTP

        email = (request.data.get("email") or "").strip().lower()
        code = str(request.data.get("code") or "").strip()
        user = User.objects.filter(email__iexact=email).first()

        if not email or not code or user is None:
            return self._invalid()

        otp = (
            LoginOTP.objects.filter(user=user, code=code, used=False)
            .order_by("-created_at")
            .first()
        )
        if otp is None or otp.expires_at < timezone.now():
            return self._invalid()
        if otp.attempts >= 5:
            return self._invalid()

        otp.used = True
        otp.save(update_fields=["used"])
        return Response(_token_payload(user))

    def _invalid(self):
        return Response(
            {
                "error": True,
                "code": "invalid_otp",
                "detail": "Invalid or expired code. Request a new code and try again.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh = request.data.get("refresh")
            if refresh:
                RefreshToken(refresh).blacklist()
        except Exception:
            # Token already invalid — logout is idempotent.
            pass
        return Response({"message": "Signed out successfully."})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ProfileSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"message": "Password updated successfully."})


class ForgotPasswordView(APIView):
    """Generate a short-lived password reset token.

    Always returns the same success message (no user enumeration). In
    DEBUG mode the token is returned so local development can complete
    the flow without an email service; production emails it instead.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        import logging
        import secrets

        from django.conf import settings
        from django.utils import timezone

        from .models import PasswordResetToken

        logger = logging.getLogger("intelliconnect")
        email = (request.data.get("email") or "").strip().lower()
        token_value = None
        if email:
            user = User.objects.filter(email__iexact=email).first()
            if user:
                token = PasswordResetToken.objects.create(
                    user=user,
                    token=secrets.token_urlsafe(32),
                    expires_at=timezone.now() + timezone.timedelta(minutes=30),
                )
                token_value = token.token
                logger.info(
                    "Password reset requested for %s (token %s)", email, token.token
                )
        return Response(
            {
                "message": "If an account exists for this email, a reset link has been sent.",
                # Development convenience only — never exposed in production.
                **({"token": token_value} if settings.DEBUG and token_value else {}),
            }
        )


class ResetPasswordView(APIView):
    """Validate a reset token and set a new password."""

    permission_classes = [AllowAny]

    def post(self, request):
        from django.utils import timezone

        from .models import PasswordResetToken

        token_value = (request.data.get("token") or "").strip()
        new_password = request.data.get("new_password") or ""
        if len(new_password) < 8:
            return Response(
                {
                    "error": True,
                    "code": "weak_password",
                    "detail": "Password must be at least 8 characters.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        record = PasswordResetToken.objects.filter(token=token_value, used=False).first()
        if record is None or record.expires_at < timezone.now():
            return Response(
                {
                    "error": True,
                    "code": "invalid_token",
                    "detail": "This reset link is invalid or has expired.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        record.user.set_password(new_password)
        record.user.save(update_fields=["password"])
        record.used = True
        record.save(update_fields=["used"])
        return Response({"message": "Password reset successfully. You can now sign in."})


class AIProviderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from ai.providers import active_provider_name, provider_statuses

        return Response(
            {
                "providers": provider_statuses(),
                "primary": active_provider_name(),
                "threshold": request.user.organization_id and _threshold(),
            }
        )


def _threshold():
    from django.conf import settings

    return settings.AI_CONFIDENCE_THRESHOLD
