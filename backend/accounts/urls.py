from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, MatchFeedView, PreferencesView, CaptchaLoginView, GoogleLoginView, RegisterInit2FAView, RegisterVerify2FAView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('register/init-2fa/', RegisterInit2FAView.as_view(), name='register_init_2fa'),
    path('register/verify-2fa/', RegisterVerify2FAView.as_view(), name='register_verify_2fa'),
    path('login/', CaptchaLoginView.as_view(), name='captcha_login'),
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('feed/', MatchFeedView.as_view(), name='match_feed'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
]