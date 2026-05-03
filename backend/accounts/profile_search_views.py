"""
Search profiles across the accounts database (not feed-limited).

Patterns:
- **Singleton-ish pagination**: defaults via class attributes on ProfileSearchPagination.
- **DIP**: queryset construction delegated to searchable_users_for_viewer; filtering to ProfileSearchFilterSet.
- **Factory** (serializer context): implicit via DRF generic view passing request into serializer.
"""

from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from .serializers import MatchFeedSerializer
from .filters.profile_search_filters import ProfileSearchFilterSet
from .services.profile_search_query import searchable_users_for_viewer


class ProfileSearchPagination(PageNumberPagination):
    """Page-number pagination compatible with SPA query param ``page``."""

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class SearchProfilesView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = MatchFeedSerializer
    pagination_class = ProfileSearchPagination
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ProfileSearchFilterSet

    def get_queryset(self):
        return searchable_users_for_viewer(self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx
