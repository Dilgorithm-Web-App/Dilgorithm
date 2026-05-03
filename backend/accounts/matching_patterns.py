"""
Design patterns in the matching pipeline (course / architecture documentation).

- Adapter: ORM ``Interest`` → plain dict (DTO) so scoring stays framework-agnostic.
- Template Method: ``CompatibilityScoringTemplate`` fixes the scoring algorithm steps;
  subclasses could override hooks without changing the overall flow (Open/Closed).
- Composite: ``ProfileFilterComposite`` treats leaf filters and nested groups uniformly
  when narrowing the candidate queryset (Single Responsibility per filter).
- Iterator: ``ranked_match_records`` yields ranked results for sequential consumption.

Principles: SRP per class, DIP via adapter boundary, OCP via template hooks.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Iterator, List, Optional, Tuple

from .models import Interest


class InterestAdapter:
    """Adapter — converts Django Interest ORM instances to a dict the scorer understands."""

    @staticmethod
    def to_dto(interest) -> Optional[dict[str, Any]]:
        if interest is None:
            return None
        return {
            "interestList": list(interest.interestList or []),
            "partnerCriteria": dict(interest.partnerCriteria or {}),
        }


class CompatibilityScoringTemplate(ABC):
    """
    Template Method — defines the skeleton of the compatibility algorithm.
    Concrete steps are hook methods; ``run`` is the invariant orchestration.
    """

    def run(self, user_dto: dict, candidate_dto: dict) -> Tuple[float, str]:
        score = 0.0
        reasons: List[str] = []
        score += self._shared_interests_contribution(user_dto, candidate_dto, reasons)
        score += self._partner_criteria_contribution(user_dto, candidate_dto, reasons)
        final_score = min(score, 100.0)
        reason_string = self._finalize_reasons(final_score, reasons)
        return final_score, reason_string

    def _shared_interests_contribution(
        self, user_dto: dict, candidate_dto: dict, reasons: List[str]
    ) -> float:
        user_list = set(user_dto.get("interestList") or [])
        candidate_list = set(candidate_dto.get("interestList") or [])
        shared = user_list.intersection(candidate_list)
        if not user_list:
            return 0.0
        match_pct = len(shared) / len(user_list)
        points = match_pct * 50
        if shared:
            reasons.append(f"Shared {len(shared)} interest(s)")
        return points

    def _partner_criteria_contribution(
        self, user_dto: dict, candidate_dto: dict, reasons: List[str]
    ) -> float:
        uc = user_dto.get("partnerCriteria") or {}
        cc = candidate_dto.get("partnerCriteria") or {}
        extra = 0.0
        if uc.get("sect") and cc.get("sect") and uc.get("sect") == cc.get("sect"):
            extra += 30
            reasons.append("Sect match")
        if uc.get("location") and cc.get("location") and uc.get("location") == cc.get("location"):
            extra += 20
            reasons.append("Location match")
        return extra

    def _finalize_reasons(self, final_score: float, reasons: List[str]) -> str:
        reason_string = ", ".join(reasons) if reasons else ""
        if reason_string:
            return reason_string
        if final_score >= 50:
            return "High overall compatibility potential"
        if final_score > 20:
            return "Good potential based on core values"
        return "Exploring new possibilities together"


class DefaultCompatibilityScoring(CompatibilityScoringTemplate):
    """Concrete template — default hooks match original UC-19 behaviour."""

    pass


class CandidateQueryFilter(ABC):
    """Composite leaf / component — one queryset transformation."""

    @abstractmethod
    def apply(self, queryset):
        ...


class EducationFilter(CandidateQueryFilter):
    def __init__(self, value: Optional[str]):
        self.value = (value or "").strip()

    def apply(self, queryset):
        if not self.value:
            return queryset
        return queryset.filter(profile__education__iexact=self.value)


class CasteFilter(CandidateQueryFilter):
    def __init__(self, value: Optional[str]):
        self.value = (value or "").strip()

    def apply(self, queryset):
        if not self.value:
            return queryset
        return queryset.filter(profile__caste__iexact=self.value)


class LocationFilter(CandidateQueryFilter):
    """Composite leaf — filters candidates by profile location (case-insensitive)."""

    def __init__(self, value: Optional[str]):
        self.value = (value or "").strip()

    def apply(self, queryset):
        if not self.value:
            return queryset
        return queryset.filter(profile__location__icontains=self.value)


class SectFilter(CandidateQueryFilter):
    """Composite leaf — filters candidates by profile sect (case-insensitive)."""

    def __init__(self, value: Optional[str]):
        self.value = (value or "").strip()

    def apply(self, queryset):
        if not self.value:
            return queryset
        return queryset.filter(profile__sect__icontains=self.value)


class ProfileFilterComposite(CandidateQueryFilter):
    """Composite — apply many filters as one operation."""

    def __init__(self, children: List[CandidateQueryFilter]):
        self.children = children

    def apply(self, queryset):
        qs = queryset
        for child in self.children:
            qs = child.apply(qs)
        return qs


def build_filters_from_request(
    filters: Optional[dict], user=None
) -> ProfileFilterComposite:
    """
    Factory — builds a ProfileFilterComposite from request query params.

    Preference Fallback: if the request does not include location/sect filters
    and a *user* is provided, the user's saved ``Interest.partnerCriteria``
    values are applied as default hard filters (DIP — depends on abstraction,
    not on where the value originates).
    """
    if not filters:
        filters = {}

    # --- Preference fallback for location & sect (Task 3) ---
    location_val = filters.get("location")
    sect_val = filters.get("sect")

    if user and (not location_val or not sect_val):
        try:
            interest = Interest.objects.filter(user=user).first()
            if interest:
                criteria = interest.partnerCriteria or {}
                if not location_val:
                    location_val = criteria.get("location")
                if not sect_val:
                    sect_val = criteria.get("sect")
        except Exception:
            pass  # Graceful degradation — proceed without defaults

    return ProfileFilterComposite(
        [
            EducationFilter(filters.get("education")),
            CasteFilter(filters.get("caste")),
            LocationFilter(location_val),
            SectFilter(sect_val),
        ]
    )


def calculate_compatibility_from_interests(user_interest, candidate_interest) -> Tuple[float, str]:
    """Facade used by ``ai_engine`` — Adapter + Template Method."""
    u = InterestAdapter.to_dto(user_interest)
    c = InterestAdapter.to_dto(candidate_interest)
    if not u or not c:
        return 0.0, "Exploring new possibilities together"
    return DefaultCompatibilityScoring().run(u, c)


def ranked_match_records(ranked_list: List[dict]) -> Iterator[dict]:
    """Iterator — sequential access over ranked match dicts without indexing internals."""
    yield from ranked_list
