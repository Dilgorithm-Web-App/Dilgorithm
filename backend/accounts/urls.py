from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MatchFeedView, PreferencesView, test_api

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('feed/', MatchFeedView.as_view(), name='match_feed'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('test/', test_api, name='test_api'),
]