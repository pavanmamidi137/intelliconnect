from django.urls import path
from .views import (
    AIProviderStatusView,
    ChangePasswordView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
    RequestOTPView,
    ResetPasswordView,
    SafeTokenRefreshView,
    VerifyOTPView,
)

app_name = "accounts"

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/otp/request/", RequestOTPView.as_view(), name="otp-request"),
    path("auth/otp/verify/", VerifyOTPView.as_view(), name="otp-verify"),
    path("auth/refresh/", SafeTokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", ProfileView.as_view(), name="me"),
    path("auth/ai-providers/", AIProviderStatusView.as_view(), name="ai-providers"),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/password/", ChangePasswordView.as_view(), name="change-password"),
]
