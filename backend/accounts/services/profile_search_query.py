"""
SRP: build the canonical *searchable-user* queryset (privacy exclusions only).

DIP: SearchProfilesView and tests depend on this function, not on raw ORM in the view.

Strategy / Template analogue: callers apply filters afterward via django-filter backends.
"""

from django.contrib.auth.base_user import AbstractBaseUser

from ..models import CustomUser
from .blocked_user_service import get_blocked_ids


def searchable_users_for_viewer(viewer: AbstractBaseUser):
    """
    Primary key queryset of ``CustomUser`` rows that may appear in search:

    - must have an attached ``profile`` row (DB-wide discovery, excluding incomplete users)
    - excludes the authenticated viewer
    - excludes viewers get_blocked_ids (either direction — same semantics as messaging)
    """
    if viewer is None or not getattr(viewer, 'is_authenticated', False):
        return CustomUser.objects.none()

    blocked = get_blocked_ids(viewer)
    return (
        CustomUser.objects.select_related('profile')
        .filter(profile__isnull=False)
        .exclude(pk=viewer.pk)
        .exclude(pk__in=blocked)
        .order_by('pk')
    )
