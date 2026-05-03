import json

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class CustomUser(AbstractUser):
    # Django provides password and username by default, we are adding the rest
    email = models.EmailField(unique=True)
    mfaStatus = models.BooleanField(default=False)
    isVerified = models.BooleanField(default=False)
    accountStatus = models.CharField(max_length=20, default='Active')
    lastSeen = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    def touch_last_seen(self):
        self.lastSeen = timezone.now()
        self.save(update_fields=['lastSeen'])

    @property
    def is_online(self):
        if not self.lastSeen:
            return False
        return (timezone.now() - self.lastSeen).total_seconds() < 300  # 5 min


class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    fullName = models.CharField(max_length=255)
    bio = models.TextField(blank=True, null=True)
    images = models.JSONField(default=list, blank=True)  # Stores URLs or base64 data
    identityDocs = models.JSONField(default=dict, blank=True)
    profession = models.CharField(max_length=255, blank=True, default='')
    education = models.CharField(max_length=255, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    maritalStatus = models.CharField(max_length=100, blank=True, default='')
    sect = models.CharField(max_length=100, blank=True, default='')
    caste = models.CharField(max_length=100, blank=True, default='')
    dateOfBirth = models.DateField(null=True, blank=True)
    favorites = models.ManyToManyField(CustomUser, related_name='favorited_by', blank=True)

    def images_as_list(self):
        """SQL Server / drivers sometimes surface JSON as a str; API and UI expect a list."""
        v = self.images
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return []
            try:
                parsed = json.loads(s)
                return parsed if isinstance(parsed, list) else []
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    @property
    def age(self):
        if not self.dateOfBirth:
            return None
        today = timezone.now().date()
        dob = self.dateOfBirth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    @property
    def profileImage(self):
        imgs = self.images_as_list()
        return imgs[0] if imgs else None

    def save(self, *args, **kwargs):
        if isinstance(self.images, str):
            self.images = self.images_as_list()
            uf = kwargs.get('update_fields')
            if uf is not None and 'images' not in uf:
                kwargs['update_fields'] = list(uf) + ['images']
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Profile of {self.user.email}"


class Interest(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='interests')
    interestList = models.JSONField(default=list)
    partnerCriteria = models.JSONField(default=dict)
    compatibilityScore = models.FloatField(default=0.0)

    def __str__(self):
        return f"Interests for {self.user.email}"


class FamilyConnection(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='family_connections')
    linkedMember = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='linked_to')
    memberRole = models.CharField(max_length=50)
    permissions = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.linkedMember.email} is {self.memberRole} to {self.user.email}"


class Report(models.Model):
    reporter = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reports_filed')
    reportedUser = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reports_received')
    reason = models.TextField()
    verdict = models.CharField(max_length=50, default='Pending')
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report by {self.reporter.email} against {self.reportedUser.email}"


class BlockedUser(models.Model):
    blocker = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='blocked_users')
    blocked = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='blocked_by')
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f"{self.blocker.email} blocked {self.blocked.email}"


class MatchRecommendation(models.Model):
    """AI-ranked feed matches persisted per viewer (refreshed on feed load and via sync_ai_matches)."""

    viewer = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="ai_match_recommendations_made",
    )
    candidate = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="ai_match_recommendations_received",
    )
    score = models.FloatField()
    reason = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-score", "candidate_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["viewer", "candidate"],
                name="unique_ai_match_viewer_candidate",
            ),
        ]

    def __str__(self):
        return f"{self.viewer.email} → {self.candidate.email} ({self.score})"


class ChatMessage(models.Model):
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='messages_sent')
    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='messages_received')
    message = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['createdAt']

    def __str__(self):
        return f"{self.sender.email} -> {self.recipient.email}"


class ChatGroup(models.Model):
    """Multi-user chat room (e.g. family group from 1:1 chat)."""

    createdAt = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="chat_groups_created"
    )

    def __str__(self):
        return f"ChatGroup {self.pk}"


class ChatGroupMember(models.Model):
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="chat_group_memberships")
    joinedAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["group", "user"], name="unique_chat_group_member"),
        ]

    def __str__(self):
        return f"{self.user.email} in group {self.group_id}"


class GroupChatMessage(models.Model):
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="group_messages_sent")
    message = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["createdAt"]

    def __str__(self):
        return f"{self.sender.email} in group {self.group_id}"


class FamilyMember(models.Model):
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='family_members')
    relationship = models.CharField(max_length=50) # e.g., Father, Mother, Sibling
    occupation = models.CharField(max_length=100, blank=True, null=True)
    education = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return f"{self.relationship} of {self.profile.user.email}"