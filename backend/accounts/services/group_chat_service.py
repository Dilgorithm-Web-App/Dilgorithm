"""Group chat: create rooms, membership checks, and message validation (shared by REST + WebSocket)."""

from django.db import transaction
from django.db.models import Count

from ..models import ChatGroup, ChatGroupMember, CustomUser, GroupChatMessage
from .blocked_user_service import get_blocked_ids
from .chat_message_service import validate_chat_text


def members_mutually_unblocked(users: list[CustomUser]) -> bool:
    ids = {u.id for u in users}
    for u in users:
        if ids & get_blocked_ids(u):
            return False
    return True


def find_group_with_exact_members(member_ids: set[int]):
    n = len(member_ids)
    if n < 2:
        return None
    for g in ChatGroup.objects.annotate(mc=Count("memberships", distinct=True)).filter(mc=n):
        g_ids = set(ChatGroupMember.objects.filter(group=g).values_list("user_id", flat=True))
        if g_ids == member_ids:
            return g
    return None


@transaction.atomic
def create_family_group_chat(
    creator: CustomUser, contact: CustomUser, third: CustomUser
) -> tuple[ChatGroup | None, str | None]:
    users = [creator, contact, third]
    if len({u.id for u in users}) != 3:
        return None, "All three participants must be different users."
    if not all(u.is_active for u in users):
        return None, "All participants must have active accounts."
    if not members_mutually_unblocked(users):
        return None, "Cannot create a group chat with blocked users."
    existing = find_group_with_exact_members({creator.id, contact.id, third.id})
    if existing:
        return existing, None
    group = ChatGroup.objects.create(created_by=creator)
    for u in users:
        ChatGroupMember.objects.create(group=group, user=u)
    return group, None


def user_in_group(user: CustomUser, group_id: int) -> bool:
    return ChatGroupMember.objects.filter(group_id=group_id, user=user).exists()


def get_group_if_member(user: CustomUser, group_id: int) -> ChatGroup | None:
    if not group_id:
        return None
    g = ChatGroup.objects.filter(id=group_id).first()
    if not g or not user_in_group(user, group_id):
        return None
    return g


def create_group_chat_message(
    sender: CustomUser, group: ChatGroup, text
) -> tuple[GroupChatMessage | None, str | None]:
    if not user_in_group(sender, group.id):
        return None, "You are not a member of this group."
    message, err = validate_chat_text(text)
    if err:
        return None, err
    gm = GroupChatMessage.objects.create(group=group, sender=sender, message=message)
    return gm, None


def canonical_group_channel_name(group_id: int) -> str:
    return f"chatgroup_{group_id}"
