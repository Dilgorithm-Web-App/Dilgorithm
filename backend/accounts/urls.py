from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MatchFeedView, PreferencesView, ProfileView

urlpatterns = [
    # UC-01: Registration
    path('register/', RegisterView.as_view(), name='auth_register'),
    
    # UC-03: Login (Returns JWT)
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # JWT Token Refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # UC-17: AI Match Feed
    path('feed/', MatchFeedView.as_view(), name='match_feed'),
    
    # UC-12 & UC-13: User AI Preferences
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('profile/', ProfileView.as_view(), name='profile'),
]