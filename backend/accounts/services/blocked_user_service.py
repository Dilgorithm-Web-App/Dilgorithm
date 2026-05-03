"""Blocked-user helpers for services layer (avoids importing views)."""

from ..models import BlockedUser


def get_blocked_ids(user):
    """Return set of user IDs that this user has blocked OR is blocked by."""
    blocked_out = set(BlockedUser.objects.filter(blocker=user).values_list("blocked_id", flat=True))
    blocked_in = set(BlockedUser.objects.filter(blocked=user).values_list("blocker_id", flat=True))
    return blocked_out | blocked_in
