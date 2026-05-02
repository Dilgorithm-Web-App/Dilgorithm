from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.db import models
from django.core.cache import cache
from django.core.mail import send_mail
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import json
import random
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


class RegisterInit2FAView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        username = (request.data.get("username") or "").strip()

        if not email or not password or not username:
            return Response({"detail": "Email, password, and username are required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 8:
            return Response({"detail": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)
        if CustomUser.objects.filter(email=email).exists():
            return Response({"detail": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        base_username = username.replace(" ", "_")[:30] or email.split("@")[0][:30]
        unique_username = base_username
        counter = 1
        while CustomUser.objects.filter(username=unique_username).exists():
            suffix = f"_{counter}"
            unique_username = f"{base_username[: 30 - len(suffix)]}{suffix}"
            counter += 1

        otp = f"{random.randint(0, 999999):06d}"
        cache.set(
            f"register_2fa:{email}",
            {
                "email": email,
                "password": password,
                "username": unique_username,
                "otp": otp,
            },
            timeout=600,
        )

        try:
            send_mail(
                subject="Dilgorithm verification code",
                message=f"Your verification code is: {otp}",
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@dilgorithm.local"),
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            return Response(
                {
                    "detail": "Could not send OTP email. Check SMTP settings in backend/.env and try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"detail": "Verification code sent. Enter OTP to complete registration."},
            status=status.HTTP_200_OK,
        )


class RegisterVerify2FAView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        email = (request.data.get("email") or "").strip().lower()
        otp = (request.data.get("otp") or "").strip()
        cached = cache.get(f"register_2fa:{email}")

        if not cached:
            return Response({"detail": "OTP expired or not requested."}, status=status.HTTP_400_BAD_REQUEST)
        if cached.get("otp") != otp:
            return Response({"detail": "Invalid OTP code."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RegisterSerializer(
            data={
                "email": cached["email"],
                "username": cached["username"],
                "password": cached["password"],
            }
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        cache.delete(f"register_2fa:{email}")

        return Response({"detail": "Registration verified and completed."}, status=status.HTTP_201_CREATED)