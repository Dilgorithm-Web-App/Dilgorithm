from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
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
import logging
import random
import urllib.parse
import urllib.request
from .models import (
    BlockedUser,
    ChatGroupMember,
    ChatMessage,
    CustomUser,
    FamilyConnection,
    FamilyMember,
    GroupChatMessage,
    Interest,
    Report,
    UserProfile,
)
from .serializers import (
    RegisterSerializer,
    MatchFeedSerializer,
    InterestSerializer,
    UserProfileSerializer,
    ChatMessageSerializer,
    ChatContactSerializer,
    FamilyConnectionSerializer,
    GroupChatMessageSerializer,
    ReportSerializer,
    BlockedUserSerializer,
    FamilyMemberSerializer,
    AdminReportSerializer,
    AdminBlockedUserSerializer,
)
from .ai_engine import get_ranked_matches
from .match_storage import replace_match_recommendations
from .services.chat_message_service import create_chat_message
from .services.group_chat_service import (
    create_family_group_chat,
    create_group_chat_message,
    get_group_if_member,
)
# ---- Design Patterns (Singleton, Observer, Factory, State) ----
from .patterns import (
    event_bus,                # Observer pattern
    ViewResponseFactory,      # Factory pattern
    AccountStateMachine,      # State pattern
    notification_service,     # Singleton pattern
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
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


def get_blocked_ids(user):
    """Return set of user IDs that this user has blocked OR is blocked by."""
    blocked_out = set(BlockedUser.objects.filter(blocker=user).values_list('blocked_id', flat=True))
    blocked_in = set(BlockedUser.objects.filter(blocked=user).values_list('blocker_id', flat=True))
    return blocked_out | blocked_in


# ---------------------------------------------------------------------------
# Auth views
# ---------------------------------------------------------------------------
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        ensure_user_records(user)
        # Observer pattern — publish registration event
        event_bus.publish("user.registered", {"email": user.email})


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

        # Touch lastSeen on login
        try:
            user = CustomUser.objects.get(email=request.data.get("email"))
            user.touch_last_seen()
        except CustomUser.DoesNotExist:
            pass

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

        user.touch_last_seen()

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
                "profile": request.data.get("profile", {}),
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
            logger.exception("Registration OTP email failed (check Mailtrap SMTP in backend/.env)")
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

        # Store DOB from registration profile data
        profile_data = cached.get("profile", {})
        if profile_data.get("dob"):
            try:
                from datetime import date
                dob_str = profile_data["dob"]
                # Try parsing common date formats
                for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
                    try:
                        parsed = date(*[int(x) for x in dob_str.replace("/", "-").split("-")])
                        user.profile.dateOfBirth = parsed
                        break
                    except Exception:
                        continue
                if profile_data.get("name"):
                    user.profile.fullName = profile_data["name"]
                user.profile.save()
            except Exception:
                pass

        cache.delete(f"register_2fa:{email}")

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "detail": "Registration verified and completed.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "email": user.email,
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Feed / Match views
# ---------------------------------------------------------------------------
class MatchFeedView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = MatchFeedSerializer

    def get(self, request, *args, **kwargs):
        user = request.user
        user.touch_last_seen()

        # All four front-end search filters forwarded to the Composite pipeline
        filters = {
            'education': request.query_params.get('education'),
            'caste': request.query_params.get('caste'),
            'location': request.query_params.get('location'),
            'sect': request.query_params.get('sect'),
        }

        ranked_data = get_ranked_matches(user, filters=filters)

        # Exclude blocked users
        blocked_ids = get_blocked_ids(user)
        ranked_data = [r for r in ranked_data if r['candidate_id'] not in blocked_ids]

        replace_match_recommendations(user, ranked_data)

        candidate_ids = [item['candidate_id'] for item in ranked_data]

        if not candidate_ids:
            return Response([], status=status.HTTP_200_OK)

        preserved_order = models.Case(*[models.When(pk=pk, then=pos) for pos, pk in enumerate(candidate_ids)])
        candidates = CustomUser.objects.filter(id__in=candidate_ids).order_by(preserved_order)
        serializer = self.get_serializer(candidates, many=True)

        response_data = serializer.data
        for i, item in enumerate(response_data):
            item['compatibility_score'] = ranked_data[i]['score']
            item['match_reason'] = ranked_data[i]['reason']

        return Response(response_data, status=status.HTTP_200_OK)


class UserSearchView(APIView):
    """
    Searchable directory of registered users (same card shape as /feed/).
    Excludes the current user and anyone blocked (either direction).
    Only includes users that have a UserProfile row (serializer expects profile.*).
    Optional ?q= narrows by username, email, display name, or bio (server-side).
    Optional ?limit= caps rows (default 400, max 500).
    """

    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        user = request.user
        try:
            lim = int(request.query_params.get("limit", "400"))
        except ValueError:
            lim = 400
        lim = max(1, min(lim, 500))

        blocked = get_blocked_ids(user)
        qs = (
            CustomUser.objects.exclude(pk=user.pk)
            .filter(is_active=True)
            .filter(profile__isnull=False)
            .select_related("profile")
        )
        if blocked:
            qs = qs.exclude(pk__in=blocked)

        q = (request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(
                Q(username__icontains=q)
                | Q(email__icontains=q)
                | Q(profile__fullName__icontains=q)
                | Q(profile__bio__icontains=q)
            )

        candidates = list(qs.order_by("profile__fullName", "username", "id")[:lim])
        serializer = MatchFeedSerializer(candidates, many=True, context={"request": request})
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Profile / Preferences views
# ---------------------------------------------------------------------------
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

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to inject is_staff flag for frontend admin link."""
        response = super().retrieve(request, *args, **kwargs)
        response.data['is_staff'] = request.user.is_staff or request.user.is_superuser
        return response


class UserDetailView(APIView):
    """Public (authenticated) view of another user's profile."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, user_id, *args, **kwargs):
        try:
            target = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = MatchFeedSerializer(target, context={'request': request})
        data = serializer.data

        # Include user interests
        interest = target.interests.first()
        if interest:
            data['interestList'] = interest.interestList

        data['is_blocked'] = BlockedUser.objects.filter(
            blocker=request.user, blocked=target
        ).exists()

        return Response(data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Settings sub-pages
# ---------------------------------------------------------------------------
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
        blocked_accounts = BlockedUser.objects.filter(blocker=user).count()

        return Response(
            {
                "sentRequests": sent_requests,
                "receivedRequests": received_requests,
                "matchHistory": sent_requests + received_requests,
                "blockedAccounts": blocked_accounts,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Chat views
# ---------------------------------------------------------------------------
class ChatContactsView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ChatContactSerializer

    def get_queryset(self):
        user = self.request.user
        sent_messages = ChatMessage.objects.filter(sender=user).values_list('recipient', flat=True)
        received_messages = ChatMessage.objects.filter(recipient=user).values_list('sender', flat=True)
        contact_ids = set(sent_messages).union(set(received_messages))

        # Exclude blocked users
        blocked_ids = get_blocked_ids(user)
        contact_ids -= blocked_ids

        return (
            CustomUser.objects.filter(id__in=contact_ids)
            .exclude(id=user.id)
            .select_related('profile')
            .order_by('id')
        )


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

        # Check if blocked
        blocked_ids = get_blocked_ids(request.user)
        if contact.id in blocked_ids:
            return Response({"detail": "This user is blocked."}, status=status.HTTP_403_FORBIDDEN)

        messages = ChatMessage.objects.filter(
            Q(sender=request.user, recipient=contact) | Q(sender=contact, recipient=request.user)
        ).order_by("createdAt")
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, contact_id, *args, **kwargs):
        contact = self.get_contact(request, contact_id)
        if not contact:
            return Response({"detail": "Contact not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if blocked
        blocked_ids = get_blocked_ids(request.user)
        if contact.id in blocked_ids:
            return Response({"detail": "Cannot send messages to this user."}, status=status.HTTP_403_FORBIDDEN)

        chat_message, err = create_chat_message(request.user, contact, request.data.get("message"))
        if err:
            return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ChatMessageSerializer(chat_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Favorites
# ---------------------------------------------------------------------------
class ToggleFavoriteView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        target_id = request.data.get('target_id')
        if not target_id:
            # Factory pattern — uniform error response
            return ViewResponseFactory.error("target_id is required")

        try:
            target_user = CustomUser.objects.get(id=target_id)
            user_profile = request.user.profile

            if target_user in user_profile.favorites.all():
                user_profile.favorites.remove(target_user)
                # Observer pattern — publish favorite event
                event_bus.publish("favorite.toggled", {"user": request.user.email, "target": target_user.email, "is_favorite": False})
                return ViewResponseFactory.success("Removed from favorites", {"is_favorite": False})
            else:
                user_profile.favorites.add(target_user)
                event_bus.publish("favorite.toggled", {"user": request.user.email, "target": target_user.email, "is_favorite": True})
                return ViewResponseFactory.success("Added to favorites", {"is_favorite": True})

        except CustomUser.DoesNotExist:
            return ViewResponseFactory.not_found("User not found")
        except Exception as e:
            return ViewResponseFactory.error(str(e), http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------------------
# Available data endpoints
# ---------------------------------------------------------------------------
class AvailableInterestsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        interests = [
            "Reading", "Traveling", "Cooking", "Sports", "Music", "Art",
            "Technology", "Gaming", "Photography", "Fitness", "Movies",
            "Dancing", "Foodie", "Nature", "Pets"
        ]
        return Response({"interests": interests}, status=status.HTTP_200_OK)


class AvailableFiltersView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        filters = {
            "locations": [
                "Karachi",
                "Lahore",
                "Islamabad",
                "Rawalpindi",
                "Faisalabad",
                "Multan",
                "Peshawar",
                "Quetta",
                "Other",
            ],
            "sects": ["Sunni", "Shia", "Just Muslim", "Other"],
            "caste": ["Syed", "Sheikh", "Pathan", "Mughal", "Rajput", "Arain", "Jat", "Other"],
            "education": ["High School", "Bachelors", "Masters", "PhD", "Other"],
        }
        return Response(filters, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Group chat (family room from 1:1 chat)
# ---------------------------------------------------------------------------
class CreateFamilyGroupChatView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        contact_user_id = request.data.get('contact_user_id')
        email = (request.data.get('email') or '').strip()
        role = request.data.get('role', 'Family Member')

        if not contact_user_id or not email:
            return Response(
                {"detail": "contact_user_id and email are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            contact = CustomUser.objects.get(id=int(contact_user_id))
        except (ValueError, TypeError, CustomUser.DoesNotExist):
            return Response({"detail": "Contact not found."}, status=status.HTTP_404_NOT_FOUND)

        if contact.id == request.user.id:
            return Response({"detail": "Invalid contact."}, status=status.HTTP_400_BAD_REQUEST)

        blocked_ids = get_blocked_ids(request.user)
        if contact.id in blocked_ids:
            return Response({"detail": "Cannot create a group with a blocked user."}, status=status.HTTP_403_FORBIDDEN)

        try:
            third = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User with this email not found."}, status=status.HTTP_404_NOT_FOUND)

        if third.id == request.user.id:
            return Response({"detail": "Cannot add yourself."}, status=status.HTTP_400_BAD_REQUEST)

        group, err = create_family_group_chat(request.user, contact, third)
        if err:
            return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)

        if not FamilyConnection.objects.filter(user=request.user, linkedMember=third).exists():
            FamilyConnection.objects.create(
                user=request.user,
                linkedMember=third,
                memberRole=role,
                permissions={"can_view_matches": True, "can_chat": True},
            )

        return Response(
            {
                "detail": "Group chat ready.",
                "group_id": group.id,
                "roomName": f"group_{group.id}",
            },
            status=status.HTTP_201_CREATED,
        )


class GroupChatListView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        memberships = ChatGroupMember.objects.filter(user=request.user).select_related('group')
        out = []
        for m in memberships:
            g = m.group
            other_members = (
                ChatGroupMember.objects.filter(group=g)
                .exclude(user=request.user)
                .select_related('user', 'user__profile')
            )
            names = []
            for om in other_members:
                u = om.user
                try:
                    names.append(u.profile.fullName or u.username or u.email)
                except Exception:
                    names.append(u.username or u.email)
            last = GroupChatMessage.objects.filter(group=g).order_by('-createdAt').first()
            preview = last.message[:60] if last else 'Start the group conversation'
            out.append({
                'id': g.id,
                'roomName': f'group_{g.id}',
                'fullName': ', '.join(names) if names else f'Group {g.id}',
                'status': preview,
                'isGroup': True,
            })
        return Response(out)


class GroupChatMessagesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, group_id, *args, **kwargs):
        group = get_group_if_member(request.user, group_id)
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        msgs = GroupChatMessage.objects.filter(group=group).select_related('sender', 'sender__profile')
        return Response(GroupChatMessageSerializer(msgs, many=True).data)

    def post(self, request, group_id, *args, **kwargs):
        group = get_group_if_member(request.user, group_id)
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        gm, err = create_group_chat_message(request.user, group, request.data.get('message'))
        if err:
            return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)
        return Response(GroupChatMessageSerializer(gm).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Family connections
# ---------------------------------------------------------------------------
class FamilyConnectionView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = FamilyConnectionSerializer

    def get_queryset(self):
        return FamilyConnection.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        role = request.data.get('role', 'Family Member')

        if not email:
            return Response({"detail": "Email is required to add family member."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            linked_member = CustomUser.objects.get(email=email)
            if linked_member == request.user:
                return Response({"detail": "Cannot add yourself as family."}, status=status.HTTP_400_BAD_REQUEST)

            if FamilyConnection.objects.filter(user=request.user, linkedMember=linked_member).exists():
                return Response({"detail": "Family connection already exists."}, status=status.HTTP_400_BAD_REQUEST)

            connection = FamilyConnection.objects.create(
                user=request.user,
                linkedMember=linked_member,
                memberRole=role,
                permissions={"can_view_matches": True, "can_chat": False}
            )
            serializer = self.get_serializer(connection)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User with this email not found."}, status=status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# Report & Block
# ---------------------------------------------------------------------------
class ReportUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        reported_user_id = request.data.get('reported_user_id')
        reason = (request.data.get('reason') or '').strip()

        if not reported_user_id or not reason:
            # Factory pattern — uniform error response
            return ViewResponseFactory.error("reported_user_id and reason are required.")

        try:
            reported_user = CustomUser.objects.get(id=reported_user_id)
        except CustomUser.DoesNotExist:
            return ViewResponseFactory.not_found("User not found.")

        if reported_user == request.user:
            return ViewResponseFactory.error("Cannot report yourself.")

        report = Report.objects.create(
            reporter=request.user,
            reportedUser=reported_user,
            reason=reason,
        )
        serializer = ReportSerializer(report)
        # Observer pattern — publish report event
        event_bus.publish("report.created", {
            "reporter_email": request.user.email,
            "target_email": reported_user.email,
        })
        return ViewResponseFactory.created("Report submitted successfully.", {"report": serializer.data})


class BlockUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        target_id = request.data.get('target_id')
        if not target_id:
            return ViewResponseFactory.error("target_id is required.")

        try:
            target = CustomUser.objects.get(id=target_id)
        except CustomUser.DoesNotExist:
            return ViewResponseFactory.not_found("User not found.")

        if target == request.user:
            return ViewResponseFactory.error("Cannot block yourself.")

        existing = BlockedUser.objects.filter(blocker=request.user, blocked=target).first()
        if existing:
            existing.delete()
            # Observer pattern — publish block event
            event_bus.publish("user.blocked", {
                "blocker_email": request.user.email,
                "blocked_email": target.email,
                "is_blocked": False,
            })
            return ViewResponseFactory.success("User unblocked.", {"is_blocked": False})
        else:
            BlockedUser.objects.create(blocker=request.user, blocked=target)
            event_bus.publish("user.blocked", {
                "blocker_email": request.user.email,
                "blocked_email": target.email,
                "is_blocked": True,
            })
            return ViewResponseFactory.created("User blocked.", {"is_blocked": True})


class BlockedUsersListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = BlockedUserSerializer

    def get_queryset(self):
        return BlockedUser.objects.filter(blocker=self.request.user).order_by('-createdAt')


# ---------------------------------------------------------------------------
# Password Reset (via OTP email)
# ---------------------------------------------------------------------------
class PasswordResetRequestView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.filter(email=email).first()
        if not user:
            # Don't reveal whether the email exists to the client
            if settings.DEBUG:
                logger.info(
                    "Password reset: no local user for %r — no email sent. "
                    "Use an email that exists in this machine's database.",
                    email,
                )
            return Response({"detail": "If an account with this email exists, a reset code has been sent."}, status=status.HTTP_200_OK)

        otp = f"{random.randint(0, 999999):06d}"
        cache.set(f"password_reset:{email}", {"otp": otp}, timeout=600)

        try:
            send_mail(
                subject="Dilgorithm Password Reset Code",
                message=f"Your password reset code is: {otp}",
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@dilgorithm.local"),
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Password reset email failed (check Mailtrap SMTP in backend/.env)")
            return Response(
                {
                    "detail": "Could not send reset email. Check SMTP (Mailtrap) settings in backend/.env and try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"detail": "If an account with this email exists, a reset code has been sent."}, status=status.HTTP_200_OK)


class PasswordResetVerifyView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        email = (request.data.get("email") or "").strip().lower()
        otp = (request.data.get("otp") or "").strip()
        new_password = request.data.get("new_password") or ""

        if not email or not otp or not new_password:
            return Response({"detail": "Email, OTP, and new_password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({"detail": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)

        cached = cache.get(f"password_reset:{email}")
        if not cached or cached.get("otp") != otp:
            return Response({"detail": "Invalid or expired reset code."}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save()
        cache.delete(f"password_reset:{email}")

        return Response({"detail": "Password has been reset successfully. You can now log in."}, status=status.HTTP_200_OK)
class FamilyMemberView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = FamilyMemberSerializer

    def get_queryset(self):
        # Return family members for the currently authenticated user's profile
        if hasattr(self.request.user, 'profile'):
            return self.request.user.profile.family_members.all()
        return FamilyMember.objects.none()

    def perform_create(self, serializer):
        # Create a profile if it somehow doesn't exist
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


# ---------------------------------------------------------------------------
# Admin Moderation Dashboard
# ---------------------------------------------------------------------------
class AdminPendingReportsView(generics.ListAPIView):
    """List all pending reports for admin review (is_staff / is_superuser only)."""
    permission_classes = (IsAdminUser,)
    serializer_class = AdminReportSerializer

    def get_queryset(self):
        return (
            Report.objects.filter(verdict='Pending')
            .select_related('reporter', 'reporter__profile', 'reportedUser', 'reportedUser__profile')
            .order_by('-createdAt')
        )


class AdminBlockListView(generics.ListAPIView):
    """List all blocked-user entries system-wide (is_staff / is_superuser only)."""
    permission_classes = (IsAdminUser,)
    serializer_class = AdminBlockedUserSerializer

    def get_queryset(self):
        return (
            BlockedUser.objects.all()
            .select_related('blocker', 'blocker__profile', 'blocked', 'blocked__profile')
            .order_by('-createdAt')
        )


class AdminResolveReportView(APIView):
    """
    Resolve a specific report: approve (block the reported user) or dismiss.

    POST /api/accounts/admin/reports/<id>/resolve/
    Body: { "action": "approve" | "dismiss" }

    Reuses existing block logic (BlockedUser.objects.create) and patterns
    (event_bus Observer, ViewResponseFactory Factory).
    """
    permission_classes = (IsAdminUser,)

    def post(self, request, report_id, *args, **kwargs):
        from django.utils import timezone

        action = (request.data.get('action') or '').strip().lower()
        if action not in ('approve', 'dismiss'):
            return ViewResponseFactory.error("action must be 'approve' or 'dismiss'.")

        try:
            report = Report.objects.select_related(
                'reporter', 'reportedUser'
            ).get(id=report_id)
        except Report.DoesNotExist:
            return ViewResponseFactory.not_found("Report not found.")

        if report.verdict != 'Pending':
            return ViewResponseFactory.error(
                f"Report already resolved with verdict '{report.verdict}'."
            )

        if action == 'approve':
            # Block the reported user (blocker = reporter, same as user-initiated block)
            blocked_pair = BlockedUser.objects.filter(
                blocker=report.reporter, blocked=report.reportedUser
            ).first()
            if not blocked_pair:
                BlockedUser.objects.create(
                    blocker=report.reporter,
                    blocked=report.reportedUser,
                )
                # Observer pattern — publish block event
                event_bus.publish("user.blocked", {
                    "blocker_email": report.reporter.email,
                    "blocked_email": report.reportedUser.email,
                    "is_blocked": True,
                    "admin_action": True,
                })

            report.verdict = 'Approved'
            report.resolvedAt = timezone.now()
            report.resolvedBy = request.user
            report.save(update_fields=['verdict', 'resolvedAt', 'resolvedBy'])

            # Observer pattern — publish report resolution event
            event_bus.publish("report.resolved", {
                "report_id": report.id,
                "action": "approve",
                "admin_email": request.user.email,
            })

            return ViewResponseFactory.success(
                "Report approved — user has been blocked.",
                {"verdict": report.verdict},
            )

        else:  # dismiss
            report.verdict = 'Dismissed'
            report.resolvedAt = timezone.now()
            report.resolvedBy = request.user
            report.save(update_fields=['verdict', 'resolvedAt', 'resolvedBy'])

            event_bus.publish("report.resolved", {
                "report_id": report.id,
                "action": "dismiss",
                "admin_email": request.user.email,
            })

            return ViewResponseFactory.success(
                "Report dismissed — no action taken.",
                {"verdict": report.verdict},
            )
