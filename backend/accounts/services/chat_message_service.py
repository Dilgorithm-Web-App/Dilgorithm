"""
SRP: chat validation + persistence shared by REST and WebSocket (OCP: extend rules here).
"""
from ..content_moderation import PROFANITY_REJECTION_DETAIL, is_message_clean
from ..models import ChatMessage, CustomUser
from .blocked_user_service import get_blocked_ids

BLOCKED_CHAT_DETAIL = "This user is blocked or has blocked you. Messaging is not allowed."


def get_contact_user(for_user: CustomUser, contact_id: int) -> CustomUser | None:
    """Recipient exists, not self, and not blocked (either direction — same as ChatMessagesView)."""
    if not contact_id or contact_id == for_user.id:
        return None
    contact = CustomUser.objects.filter(id=contact_id).exclude(id=for_user.id).first()
    if not contact:
        return None
    if contact.id in get_blocked_ids(for_user):
        return None
    return contact


def validate_chat_text(text) -> tuple[str | None, str | None]:
    """Returns (normalized_message, error_detail)."""
    message = (text or "").strip()
    if not message:
        return None, "Message cannot be empty."
    if not is_message_clean(message):
        return None, PROFANITY_REJECTION_DETAIL
    return message, None


def create_chat_message(sender: CustomUser, recipient: CustomUser, text) -> tuple[ChatMessage | None, str | None]:
    """Returns (ChatMessage, error_detail)."""
    if recipient.id in get_blocked_ids(sender):
        return None, BLOCKED_CHAT_DETAIL
    message, err = validate_chat_text(text)
    if err:
        return None, err
    cm = ChatMessage.objects.create(sender=sender, recipient=recipient, message=message)
    return cm, None


def canonical_chat_group_name(user_id: int, other_user_id: int) -> str:
    a, b = sorted((int(user_id), int(other_user_id)))
    return f"chat_{a}_{b}"
