"""
SRP: chat validation + persistence shared by REST and WebSocket (OCP: extend rules here).
"""
from ..models import ChatMessage, CustomUser

PROFANITY_LIST = ("badword1", "badword2", "hate", "scam")


def get_contact_user(for_user: CustomUser, contact_id: int) -> CustomUser | None:
    """Recipient exists and is not the requesting user (aligned with ChatMessagesView)."""
    if not contact_id or contact_id == for_user.id:
        return None
    return CustomUser.objects.filter(id=contact_id).exclude(id=for_user.id).first()


def validate_chat_text(text) -> tuple[str | None, str | None]:
    """Returns (normalized_message, error_detail)."""
    message = (text or "").strip()
    if not message:
        return None, "Message cannot be empty."
    lower_msg = message.lower()
    if any(word in lower_msg for word in PROFANITY_LIST):
        return None, "Message blocked: Violates community guidelines."
    return message, None


def create_chat_message(sender: CustomUser, recipient: CustomUser, text) -> tuple[ChatMessage | None, str | None]:
    """Returns (ChatMessage, error_detail)."""
    message, err = validate_chat_text(text)
    if err:
        return None, err
    cm = ChatMessage.objects.create(sender=sender, recipient=recipient, message=message)
    return cm, None


def canonical_chat_group_name(user_id: int, other_user_id: int) -> str:
    a, b = sorted((int(user_id), int(other_user_id)))
    return f"chat_{a}_{b}"
