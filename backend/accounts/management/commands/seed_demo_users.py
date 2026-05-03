from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import CustomUser, Interest, UserProfile

LOCATIONS = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Multan"]
SECTS = ["Sunni", "Shia", "Just Muslim"]
CASTES = ["Syed", "Sheikh", "Pathan", "Arain", "Other"]
EDUCATION = ["Bachelors", "Masters", "PhD", "High School"]
INTEREST_POOL = [
    "Reading",
    "Music",
    "Sports",
    "Cooking",
    "Traveling",
    "Movies",
    "Fitness",
    "Technology",
]


class Command(BaseCommand):
    help = (
        "Create demo users in the database (CustomUser + UserProfile + Interest). "
        "Skips emails that already exist. Default password is shared for local testing only."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=12,
            help="Number of demo users to create (default: 12).",
        )
        parser.add_argument(
            "--password",
            default="demo1234",
            help="Password for all seeded users (default: demo1234).",
        )
        parser.add_argument(
            "--domain",
            default="demo.local",
            help="Email domain, e.g. user001@<domain> (default: demo.local).",
        )
        parser.add_argument(
            "--verified",
            action="store_true",
            help="Set isVerified=True on new users.",
        )

    def handle(self, *args, **options):
        count = max(0, options["count"])
        password = options["password"]
        domain = options["domain"].strip().lstrip("@")
        verified = options["verified"]

        created = 0
        skipped = 0

        for i in range(1, count + 1):
            email = f"demo{i:03d}@{domain}"
            username = f"demo{i:03d}"

            if CustomUser.objects.filter(email=email).exists():
                skipped += 1
                continue

            loc = LOCATIONS[(i - 1) % len(LOCATIONS)]
            sect = SECTS[(i - 1) % len(SECTS)]
            caste = CASTES[(i - 1) % len(CASTES)]
            edu = EDUCATION[(i - 1) % len(EDUCATION)]

            # Overlap: everyone shares first three tags so AI scores often exceed threshold.
            base = INTEREST_POOL[:3]
            extra = [INTEREST_POOL[(i + k) % len(INTEREST_POOL)] for k in range(0, 4)]
            interests = list(dict.fromkeys(base + extra))  # unique, stable order

            with transaction.atomic():
                user = CustomUser.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    isVerified=verified,
                    accountStatus="Active",
                )
                UserProfile.objects.create(
                    user=user,
                    fullName=f"Demo User {i}",
                    bio=f"Seeded profile {i} for local testing.",
                    profession="Software" if i % 2 == 0 else "Teacher",
                    education=edu,
                    location=loc,
                    maritalStatus="Single",
                    sect=sect,
                    caste=caste,
                    dateOfBirth=date(1995, 1, 1).replace(month=((i - 1) % 12) + 1),
                    images=[],
                )
                Interest.objects.create(
                    user=user,
                    interestList=interests,
                    partnerCriteria={"sect": sect, "location": loc},
                )

            created += 1
            self.stdout.write(f"  + {email} ({username})")

        msg = f"Done: created {created} user(s), skipped {skipped} existing email(s)."
        self.stdout.write(self.style.SUCCESS(msg))
        if created:
            self.stdout.write(f"Log in with any new account email and password: {password!r}")
