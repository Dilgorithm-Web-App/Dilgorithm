from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    MatchFeedView,
    PreferencesView,
    ProfileView,
    AppConfigurationView,
    EngagementSummaryView,
    ChatContactsView,
    ChatMessagesView,
    CaptchaLoginView,
    GoogleLoginView,
    RegisterInit2FAView,
    RegisterVerify2FAView,
    ToggleFavoriteView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('register/init-2fa/', RegisterInit2FAView.as_view(), name='register_init_2fa'),
    path('register/verify-2fa/', RegisterVerify2FAView.as_view(), name='register_verify_2fa'),
    path('login/', CaptchaLoginView.as_view(), name='captcha_login'),
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('feed/', MatchFeedView.as_view(), name='match_feed'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('profile/', ProfileView.as_view(), name='profile'),
<<<<<<< HEAD
    path('favorites/toggle/', ToggleFavoriteView.as_view(), name='toggle_favorite'),
=======
    path('app-configuration/', AppConfigurationView.as_view(), name='app_configuration'),
    path('engagement-summary/', EngagementSummaryView.as_view(), name='engagement_summary'),
    path('chat/contacts/', ChatContactsView.as_view(), name='chat_contacts'),
    path('chat/messages/<int:contact_id>/', ChatMessagesView.as_view(), name='chat_messages'),
>>>>>>> bdf09bd5600ed89b2033b5a3b865a8d3e4f9373d
]
