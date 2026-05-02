from rest_framework import serializers
from django.db.models import Q
from .models import CustomUser, Interest, UserProfile
from .models import ChatMessage

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


class ChatMessageSerializer(serializers.ModelSerializer):
    senderId = serializers.IntegerField(source='sender.id', read_only=True)
    recipientId = serializers.IntegerField(source='recipient.id', read_only=True)
    senderName = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ('id', 'senderId', 'recipientId', 'senderName', 'message', 'createdAt')

    def get_senderName(self, obj):
        profile_name = getattr(getattr(obj.sender, 'profile', None), 'fullName', None)
        return profile_name or obj.sender.username or obj.sender.email


class ChatContactSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    roomName = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'status', 'roomName')

    def get_status(self, obj):
        request = self.context.get('request')
        me = request.user if request else None
        if not me or not me.is_authenticated:
            return 'Tap to open chat'

        last_message = (
            ChatMessage.objects.filter(
                Q(sender=me, recipient=obj) | Q(sender=obj, recipient=me)
            )
            .order_by('-createdAt')
            .first()
        )
        if last_message:
            return last_message.message[:60]
        return 'Start a conversation'

    def get_roomName(self, obj):
        return f'room_{obj.id}'