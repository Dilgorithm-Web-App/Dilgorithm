from rest_framework import serializers
from .models import CustomUser, Interest, UserProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ('email', 'username', 'password')

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user

class MatchFeedSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source='profile.fullName', read_only=True)
    bio = serializers.CharField(source='profile.bio', read_only=True)
    images = serializers.JSONField(source='profile.images', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'fullName', 'bio', 'images')

class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = ('interestList', 'partnerCriteria')


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('fullName', 'bio', 'images', 'identityDocs')