import logging
from .models import CustomUser
from .matching_patterns import (
    build_filters_from_request,
    calculate_compatibility_from_interests,
    ranked_match_records,
)

logger = logging.getLogger(__name__)

def calculate_compatibility_score(user_interest, candidate_interest):
    """
    UC-19 compatibility scoring (delegates to Template Method + Adapter in matching_patterns).
    Includes family background matching.
    """
    score, reason_string = calculate_compatibility_from_interests(user_interest, candidate_interest)
    
    reasons = [reason_string] if reason_string and reason_string != "Exploring new possibilities together" else []
    
    # 3. Family Background Matching
    user = user_interest.user
    candidate = candidate_interest.user
    try:
        user_families = list(user.profile.family_members.all())
        candidate_families = list(candidate.profile.family_members.all())
    except Exception as e:
        logger.warning("Could not fetch family members for AI matching: %s", e)
        user_families = []
        candidate_families = []
        
    user_occupations = {f.occupation.lower() for f in user_families if f.occupation}
    candidate_occupations = {f.occupation.lower() for f in candidate_families if f.occupation}
    shared_occupations = user_occupations.intersection(candidate_occupations)
    if shared_occupations:
        score += 15
        occupations_str = "/".join([o.title() for o in shared_occupations])
        reasons.append(f"Both families have a background in {occupations_str}")
        
    user_educations = {f.education.lower() for f in user_families if f.education}
    candidate_educations = {f.education.lower() for f in candidate_families if f.education}
    shared_educations = user_educations.intersection(candidate_educations)
    if shared_educations:
        score += 10
        education_str = "/".join([e.title() for e in shared_educations])
        reasons.append(f"Both families have {education_str} education level")
        
    # Cap score at 100
    final_score = min(score, 100.0)
    final_reason = ", ".join(reasons) if reasons else "Exploring new possibilities together"
            
    return final_score, final_reason

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
    except Exception as e:
        logger.error("Error fetching user interests for user %s: %s", user.id, e)
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
