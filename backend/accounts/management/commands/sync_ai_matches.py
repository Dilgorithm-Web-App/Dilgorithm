import random

from django.core.management.base import BaseCommand

from accounts.ai_engine import get_ranked_matches
from accounts.match_storage import replace_match_recommendations
from accounts.models import BlockedUser, CustomUser, Interest

INTEREST_POOL = [
    "Reading",
    "Traveling",
    "Cooking",
    "Sports",
    "Music",
    "Art",
    "Technology",
    "Gaming",
    "Photography",
    "Fitness",
    "Movies",
    "Dancing",
    "Foodie",
    "Nature",
    "Pets",
]

# Shared by all seeded users so pairwise scores often exceed the feed threshold.
BASE_OVERLAP = ["Reading", "Music", "Sports"]


def _blocked_ids_for(user):
    blocked_out = set(BlockedUser.objects.filter(blocker=user).values_list("blocked_id", flat=True))
    blocked_in = set(BlockedUser.objects.filter(blocked=user).values_list("blocker_id", flat=True))
    return blocked_out | blocked_in


class Command(BaseCommand):
    help = (
        "Recompute AI match rankings and persist MatchRecommendation rows for each active user. "
        "Optional --seed-interests fills empty interest lists so more pairs score above the feed threshold."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--seed-interests",
            action="store_true",
            help="Assign overlapping default interests to users with empty interestList (creates Interest if missing).",
        )

    def handle(self, *args, **options):
        if options["seed_interests"]:
            self._seed_interests()

        qs = CustomUser.objects.filter(accountStatus="Active", is_active=True)
        # Materialize IDs first — MSSQL/pyodbc can raise HY010 if .iterator() stays open
        # while get_ranked_matches runs nested queries on the same connection.
        users = list(qs)
        total = len(users)
        done = 0
        for user in users:
            ranked = get_ranked_matches(user, filters=None)
            blocked = _blocked_ids_for(user)
            ranked = [r for r in ranked if r["candidate_id"] not in blocked]
            replace_match_recommendations(user, ranked)
            done += 1
            if done % 50 == 0 or done == total:
                self.stdout.write(f"Synced {done}/{total} users…")

        self.stdout.write(self.style.SUCCESS(f"Finished: {done} users, recommendations stored."))

    def _seed_interests(self):
        updated = 0
        for user in list(CustomUser.objects.filter(accountStatus="Active", is_active=True)):
            interest = user.interests.first()
            if interest is None:
                interest = Interest.objects.create(
                    user=user,
                    interestList=[],
                    partnerCriteria={},
                )
            lst = list(interest.interestList or [])
            if lst:
                continue
            rest = [x for x in INTEREST_POOL if x not in BASE_OVERLAP]
            k = min(4, len(rest))
            extra = random.sample(rest, k=k) if k else []
            interest.interestList = BASE_OVERLAP + extra
            # Light criteria overlap helps scoring when profiles align
            try:
                prof = user.profile
                interest.partnerCriteria = {
                    "sect": (prof.sect or "").strip() or None,
                    "location": (prof.location or "").strip() or None,
                }
            except Exception:
                interest.partnerCriteria = {}
            interest.save(update_fields=["interestList", "partnerCriteria"])
            updated += 1
        self.stdout.write(self.style.NOTICE(f"Seeded interests for {updated} users (had empty lists)."))
