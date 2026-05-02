from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    # Django provides password and username by default, we are adding the rest
    email = models.EmailField(unique=True)
    mfaStatus = models.BooleanField(default=False)
    isVerified = models.BooleanField(default=False)
    accountStatus = models.CharField(max_length=20, default='Active')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

# ... (your CustomUser code should still be above this) ...

class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    fullName = models.CharField(max_length=255)
    bio = models.TextField(blank=True, null=True)
    images = models.JSONField(default=list, blank=True) # Stores URLs or paths to images
    identityDocs = models.JSONField(default=dict, blank=True) # Stores verification docs
    location = models.CharField(max_length=100, blank=True, null=True)
    sect = models.CharField(max_length=50, blank=True, null=True)
    education = models.CharField(max_length=100, blank=True, null=True)
    caste = models.CharField(max_length=100, blank=True, null=True)
    favorites = models.ManyToManyField(CustomUser, related_name='favorited_by', blank=True)
    
    def __str__(self):
        return f"Profile of {self.user.email}"

class Interest(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='interests')
    interestList = models.JSONField(default=list) # e.g., ["Hiking", "Reading", "Coding"]
    partnerCriteria = models.JSONField(default=dict) # e.g., {"age_range": [25, 30], "sect": "Sunni"}
    compatibilityScore = models.FloatField(default=0.0) # Used later by the AI engine
    
    def __str__(self):
        return f"Interests for {self.user.email}"

class FamilyConnection(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='family_connections')
    linkedMember = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='linked_to')
    memberRole = models.CharField(max_length=50) # e.g., "Parent", "Guardian", "Sibling"
    permissions = models.JSONField(default=dict) # e.g., {"can_view_matches": True, "can_chat": False}
    
    def __str__(self):
        return f"{self.linkedMember.email} is {self.memberRole} to {self.user.email}"

class Report(models.Model):
    reporter = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reports_filed')
    reportedUser = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reports_received')
    reason = models.TextField()
    verdict = models.CharField(max_length=50, default='Pending') # Pending, Suspended, Banned, Dismissed
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report by {self.reporter.email} against {self.reportedUser.email}"