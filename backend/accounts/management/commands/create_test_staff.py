from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import CustomUser, UserProfile


class Command(BaseCommand):
    help = (
        "Create or update a staff user for the in-app moderator login (/login/admin). "
        "For local testing only — change the password after first use in any shared environment."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            default="moderator@test.dilgorithm.local",
            help="Staff user email (default: moderator@test.dilgorithm.local).",
        )
        parser.add_argument(
            "--password",
            default="TestModerator123!",
            help="Password (default: TestModerator123!).",
        )
        parser.add_argument(
            "--superuser",
            action="store_true",
            help="Also set is_superuser=True (Django admin + all permissions).",
        )

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        password = options["password"]
        as_super = options["superuser"]

        username = email.split("@")[0][:30] or "moderator"

        with transaction.atomic():
            user = CustomUser.objects.filter(email=email).first()
            if user:
                user.set_password(password)
                user.is_staff = True
                if as_super:
                    user.is_superuser = True
                user.username = username
                user.is_active = True
                user.accountStatus = "Active"
                user.save()
                created = False
            else:
                user = CustomUser.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    is_staff=True,
                    is_superuser=as_super,
                    is_active=True,
                    isVerified=True,
                    accountStatus="Active",
                )
                created = True

            UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    "fullName": "Test Moderator",
                    "bio": "Staff account for local testing.",
                },
            )

        role = "superuser" if user.is_superuser else "staff"
        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} {role} user:\n"
                f"  Email:    {email}\n"
                f"  Password: (the value you passed with --password)\n"
                f"  Login at: /login/admin on the frontend"
            )
        )
