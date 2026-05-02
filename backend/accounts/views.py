from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.db import models
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import json
import urllib.parse
import urllib.request
from .models import CustomUser, Interest
from .serializers import RegisterSerializer, MatchFeedSerializer, InterestSerializer
from .ai_engine import get_ranked_matches

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class MatchFeedView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = MatchFeedSerializer

    def get(self, request, *args, **kwargs):
        user = request.user
        ranked_data = get_ranked_matches(user)
        candidate_ids = [item['candidate_id'] for item in ranked_data]
        
        if not candidate_ids:
            return Response([], status=status.HTTP_200_OK)
        
        preserved_order = models.Case(*[models.When(pk=pk, then=pos) for pos, pk in enumerate(candidate_ids)])
        candidates = CustomUser.objects.filter(id__in=candidate_ids).order_by(preserved_order)
        serializer = self.get_serializer(candidates, many=True)
        
        response_data = serializer.data
        for i, item in enumerate(response_data):
            item['compatibility_score'] = ranked_data[i]['score']
            
        return Response(response_data, status=status.HTTP_200_OK)

class PreferencesView(generics.RetrieveUpdateAPIView):
    """
    UC-12 & UC-13: Manage User Interests and Preferences[cite: 1].
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = InterestSerializer

    def get_object(self):
        obj, created = Interest.objects.get_or_create(user=self.request.user)
        return obj


def verify_recaptcha(captcha_token):
    if not settings.RECAPTCHA_SECRET_KEY:
        return False, "Missing RECAPTCHA_SECRET_KEY in backend environment."
    if not captcha_token:
        return False, "CAPTCHA token is required."

    payload = urllib.parse.urlencode(
        {
            "secret": settings.RECAPTCHA_SECRET_KEY,
            "response": captcha_token,
        }
    ).encode("utf-8")

    try:
        req = urllib.request.Request(
            "https://www.google.com/recaptcha/api/siteverify",
            data=payload,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
        if data.get("success"):
            return True, None
        return False, "Invalid CAPTCHA. Please try again."
    except Exception:
        return False, "Could not verify CAPTCHA. Please try again."


def build_unique_username_from_email(email):
    base = email.split("@")[0][:24] or "google_user"
    candidate = base
    counter = 1
    while CustomUser.objects.filter(username=candidate).exists():
        candidate = f"{base}_{counter}"[:30]
        counter += 1
    return candidate


class CaptchaLoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        captcha_token = request.data.get("captcha_token")
        is_valid, error = verify_recaptcha(captcha_token)
        if not is_valid:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class GoogleLoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        captcha_token = request.data.get("captcha_token")
        is_valid, error = verify_recaptcha(captcha_token)
        if not is_valid:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        google_credential = request.data.get("credential")
        if not google_credential:
            return Response(
                {"detail": "Google credential is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {"detail": "Missing GOOGLE_CLIENT_ID in backend environment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            token_info = id_token.verify_oauth2_token(
                google_credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except Exception:
            return Response(
                {"detail": "Invalid Google token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = token_info.get("email")
        if not email:
            return Response(
                {"detail": "Google account email not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = CustomUser.objects.filter(email=email).first()
        if not user:
            username = build_unique_username_from_email(email)
            user = CustomUser.objects.create_user(
                email=email,
                username=username,
                password=None,
            )
            user.isVerified = token_info.get("email_verified", False)
            user.save(update_fields=["isVerified"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "email": user.email,
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )