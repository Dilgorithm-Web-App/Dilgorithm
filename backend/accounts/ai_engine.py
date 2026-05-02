from .models import CustomUser
from .matching_patterns import (
    build_filters_from_request,
    calculate_compatibility_from_interests,
    ranked_match_records,
)


def calculate_compatibility_score(user_interest, candidate_interest):
    """
    UC-19 compatibility scoring (delegates to Template Method + Adapter in matching_patterns).
    """
    return calculate_compatibility_from_interests(user_interest, candidate_interest)


def get_ranked_matches(user, filters=None):
    """
    Retrieves candidates, applies Composite filters, scores via Adapter/Template pipeline,
    returns sorted list. Iterator helper available for sequential reads.
    """
    candidates = CustomUser.objects.exclude(id=user.id).filter(accountStatus="Active")
    filter_tree = build_filters_from_request(filters)
    candidates = filter_tree.apply(candidates)

    try:
        user_interest = user.interests.first()
    except Exception:
        return []

    if not user_interest:
        return []

    ranked_list = []

    for candidate in candidates:
        candidate_interest = candidate.interests.first()
        if candidate_interest:
            score, reason = calculate_compatibility_score(user_interest, candidate_interest)

            candidate_interest.compatibilityScore = score
            candidate_interest.save()

            if score > 20:
                ranked_list.append(
                    {
                        "candidate_id": candidate.id,
                        "email": candidate.email,
                        "score": score,
                        "reason": reason,
                    }
                )

    ranked_list.sort(key=lambda x: x["score"], reverse=True)
    # Iterator pattern: consumers may traverse without caring about list structure
    return list(ranked_match_records(ranked_list))
