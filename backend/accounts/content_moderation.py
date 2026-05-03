"""
Shared text moderation for chat and other user-generated content (single source of truth).
"""

# Substring scan (lowercased message). Keep tokens short enough to avoid obvious false positives where possible.
PROFANITY_LIST = (
    "badword1",
    "badword2",
    "hate",
    "scam",
    "fraud",
    "abuse",
    "threat",
    "harass",
    "stalk",
    "racist",
    "sexist",
    "slur",
    "damn",
    "crap",
    "idiot",
    "stupid",
    "moron",
    "loser",
    "jerk",
    "creep",
    "pervert",
    "kill",
    "die",
    "rape",
    "molest",
    "attack",
    "bomb",
    "terror",
    "porn",
    "nude",
    "naked",
    "prostitut",
    "escort",
    "drug",
    "cocaine",
    "heroin",
    "meth",
    "weed",
    "gambling",
    "bitcoin",
    "crypto",
    "invest",
    "ponzi",
    "phishing",
    "malware",
    "virus",
    "hack",
    "spam",
    "fake",
    "catfish",
)

PROFANITY_REJECTION_DETAIL = "Message blocked: Violates community guidelines."


def is_message_clean(message: str) -> bool:
    if not message:
        return True
    lower_msg = message.lower()
    return not any(word in lower_msg for word in PROFANITY_LIST)
