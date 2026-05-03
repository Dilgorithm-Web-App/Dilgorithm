"""
Filtering for profile discovery (DIP: declarative lookups, OCP via new filters).

django-filter encapsulates queryset composition (similar intent to Composite:
multiple independent predicates combined uniformly).
"""

import django_filters

from ..models import CustomUser


class ProfileSearchFilterSet(django_filters.FilterSet):
    """
    Text filters use icontains for case-insensitive partial matches.

    Query params aligned with frontend:
    - ``username``: CustomUser.username
    - ``display_name`` / ``name``: profile.fullName
    - ``sect``, ``location``, ``caste``, ``education``: profile scalar fields
    """

    username = django_filters.CharFilter(field_name='username', lookup_expr='icontains')
    display_name = django_filters.CharFilter(field_name='profile__fullName', lookup_expr='icontains')
    name = django_filters.CharFilter(field_name='profile__fullName', lookup_expr='icontains')
    sect = django_filters.CharFilter(field_name='profile__sect', lookup_expr='icontains')
    location = django_filters.CharFilter(field_name='profile__location', lookup_expr='icontains')
    caste = django_filters.CharFilter(field_name='profile__caste', lookup_expr='icontains')
    education = django_filters.CharFilter(field_name='profile__education', lookup_expr='icontains')

    class Meta:
        model = CustomUser
        fields = []  # explicit CharFilters only
