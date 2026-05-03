from .models import CustomUser

def calculate_compatibility_score(user_interest, candidate_interest):
    """
    Simulates the Native LLM scoring logic based on UC-19.
    Compares two Interest objects and returns a score from 0.0 to 100.0.
    """
    score = 0.0
    
    reasons = []
    
    # 1. Compare Shared Interests (List intersection)
    user_list = set(user_interest.interestList)
    candidate_list = set(candidate_interest.interestList)
    
    shared_interests = user_list.intersection(candidate_list)
    
    # Give points for each shared interest (max 50 points)
    if user_list:
        match_percentage = len(shared_interests) / len(user_list)
        score += (match_percentage * 50)
        if shared_interests:
            reasons.append(f"Shared {len(shared_interests)} interest(s)")
        
    # 2. Check Partner Criteria Constraints (e.g., Sect, Age)
    user_criteria = user_interest.partnerCriteria
    candidate_criteria = candidate_interest.partnerCriteria
    
    # Example constraint check: Sect matching (Religious constraint)
    if user_criteria.get('sect') and candidate_criteria.get('sect'):
        if user_criteria.get('sect') == candidate_criteria.get('sect'):
            score += 30 # Heavy weight for religious alignment
            reasons.append("Sect match")
            
    # Example constraint check: Location preference
    if user_criteria.get('location') and candidate_criteria.get('location'):
         if user_criteria.get('location') == candidate_criteria.get('location'):
             score += 20
             reasons.append("Location match")
             
    # 3. Family Background Matching
    user = user_interest.user
    candidate = candidate_interest.user
    try:
        user_families = list(user.profile.family_members.all())
        candidate_families = list(candidate.profile.family_members.all())
    except Exception:
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
    reason_string = ", ".join(reasons) if reasons else ""
    
    if not reason_string:
        if final_score >= 50:
            reason_string = "High overall compatibility potential"
        elif final_score > 20:
            reason_string = "Good potential based on core values"
        else:
            reason_string = "Exploring new possibilities together"
            
    return final_score, reason_string

def get_ranked_matches(user, filters=None):
    """
    Retrieves all candidates, filters out bots/banned users, 
    calculates scores, and returns a sorted list.
    """
    # Filter out the user themselves and banned/bot accounts
    candidates = CustomUser.objects.exclude(id=user.id).filter(accountStatus='Active')
    
    if filters:
        if filters.get('education'):
            candidates = candidates.filter(profile__education__iexact=filters['education'])
        if filters.get('caste'):
            candidates = candidates.filter(profile__caste__iexact=filters['caste'])
    
    try:
        user_interest = user.interests.first()
    except:
        return [] # Cannot match if user has no interests set
        
    if not user_interest:
        return []

    ranked_list = []
    
    for candidate in candidates:
        candidate_interest = candidate.interests.first()
        if candidate_interest:
            score, reason = calculate_compatibility_score(user_interest, candidate_interest)
            
            # Save the score to the database temporarily for the feed
            candidate_interest.compatibilityScore = score
            candidate_interest.save()
            
            # Only suggest users with a score > 20%
            if score > 20:
                ranked_list.append({
                    'candidate_id': candidate.id,
                    'email': candidate.email,
                    'score': score,
                    'reason': reason
                })
                
    # Sort the list so the highest score is at the top (Index 0)
    ranked_list.sort(key=lambda x: x['score'], reverse=True)
    return ranked_list