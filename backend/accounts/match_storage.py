from django.db import transaction

from .models import MatchRecommendation


def replace_match_recommendations(viewer, ranked_items):
    """
    Replace all stored AI recommendations for viewer with ranked_items.

    ranked_items: list of dicts with keys candidate_id, score, reason (same shape as get_ranked_matches).
    """
    with transaction.atomic():
        MatchRecommendation.objects.filter(viewer=viewer).delete()
        if not ranked_items:
            return
        MatchRecommendation.objects.bulk_create(
            [
                MatchRecommendation(
                    viewer=viewer,
                    candidate_id=item["candidate_id"],
                    score=float(item["score"]),
                    reason=item.get("reason") or "",
                )
                for item in ranked_items
            ],
            batch_size=200,
        )
