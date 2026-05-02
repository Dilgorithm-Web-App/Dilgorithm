from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.core.cache import cache
from django.core.mail import send_mail
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import json
import random
import urllib.parse
import urllib.request
from .models import CustomUser, Interest, UserProfile, FamilyConnection, Report, ChatMessage
from .serializers import (
    RegisterSerializer,
    MatchFeedSerializer,
    InterestSerializer,
    UserProfileSerializer,
    ChatMessageSerializer,
    ChatContactSerializer,
)
from .ai_engine import get_ranked_matches


def ensure_user_records(user):
    default_name = user.username or user.email.split('@')[0]
    UserProfile.objects.get_or_create(
        user=user,
        defaults={"fullName": default_name},
    )
    Interest.objects.get_or_create(
        user=user,
        defaults={"interestList": [], "partnerCriteria": {}},
    )


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        ensure_user_records(user)

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


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserProfileSerializer

    def get_object(self):
        default_name = self.request.user.username or self.request.user.email.split('@')[0]
        obj, _ = UserProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'fullName': default_name}
        )
        return obj


class AppConfigurationView(APIView):
    permission_classes = (IsAuthenticated,)

    def _get_profile(self, user):
        default_name = user.username or user.email.split('@')[0]
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'fullName': default_name}
        )
        return profile

    def get(self, request, *args, **kwargs):
        profile = self._get_profile(request.user)
        docs = profile.identityDocs if isinstance(profile.identityDocs, dict) else {}
        app_config = docs.get("appConfig", {})
        permissions = app_config.get("permissions", {})

        return Response(
            {
                "language": app_config.get("language", "English"),
                "permissions": {
                    "location": bool(permissions.get("location", True)),
                    "notifications": bool(permissions.get("notifications", True)),
                    "camera": bool(permissions.get("camera", True)),
                },
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request, *args, **kwargs):
        profile = self._get_profile(request.user)

        language = (request.data.get("language") or "English").strip()[:50]
        incoming_permissions = request.data.get("permissions") or {}
        permissions = {
            "location": bool(incoming_permissions.get("location", True)),
            "notifications": bool(incoming_permissions.get("notifications", True)),
            "camera": bool(incoming_permissions.get("camera", True)),
        }

        docs = profile.identityDocs if isinstance(profile.identityDocs, dict) else {}
        docs["appConfig"] = {
            "language": language or "English",
            "permissions": permissions,
        }
        profile.identityDocs = docs
        profile.save(update_fields=["identityDocs"])

        return Response(docs["appConfig"], status=status.HTTP_200_OK)


class EngagementSummaryView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        user = request.user
        sent_requests = FamilyConnection.objects.filter(user=user).count()
        received_requests = FamilyConnection.objects.filter(linkedMember=user).count()
        blocked_accounts = (
            Report.objects.filter(reporter=user, verdict__in=["Suspended", "Banned"])
            .values("reportedUser")
            .distinct()
            .count()
        )

        return Response(
            {
                "sentRequests": sent_requests,
                "receivedRequests": received_requests,
                "matchHistory": sent_requests + received_requests,
                "blockedAccounts": blocked_accounts,
            },
            status=status.HTTP_200_OK,
        )


class ChatContactsView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ChatContactSerializer

    def get_queryset(self):
        return CustomUser.objects.exclude(id=self.request.user.id).order_by("id")


class ChatMessagesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_contact(self, request, contact_id):
        contact = CustomUser.objects.filter(id=contact_id).exclude(id=request.user.id).first()
        if not contact:
            return None
        return contact

    def get(self, request, contact_id, *args, **kwargs):
        contact = self.get_contact(request, contact_id)
        if not contact:
            return Response({"detail": "Contact not found."}, status=status.HTTP_404_NOT_FOUND)

        messages = ChatMessage.objects.filter(
            Q(sender=request.user, recipient=contact) | Q(sender=contact, recipient=request.user)
        ).order_by("createdAt")
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, contact_id, *args, **kwargs):
        contact = self.get_contact(request, contact_id)
        if not contact:
            return Response({"detail": "Contact not found."}, status=status.HTTP_404_NOT_FOUND)

        message = (request.data.get("message") or "").strip()
        if not message:
            return Response({"detail": "Message cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        profanity_list = ["badword1", "badword2", "hate", "scam"]
        lower_msg = message.lower()
        if any(word in lower_msg for word in profanity_list):
            return Response(
                {"detail": "Message blocked: Violates community guidelines."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        chat_message = ChatMessage.objects.create(
            sender=request.user,
            recipient=contact,
            message=message,
        )
        serializer = ChatMessageSerializer(chat_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
            ensure_user_records(user)

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
        user = serializer.save()
        ensure_user_records(user)
        cache.delete(f"register_2fa:{email}")

        return Response({"detail": "Registration verified and completed."}, status=status.HTTP_201_CREATED)
