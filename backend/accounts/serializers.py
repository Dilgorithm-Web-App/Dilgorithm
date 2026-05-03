from rest_framework import serializers
from django.db.models import Q
from .models import (
    ChatMessage,
    CustomUser,
    FamilyConnection,
    FamilyMember,
    GroupChatMessage,
    Interest,
    Report,
    BlockedUser,
    UserProfile,
)

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
    images = serializers.SerializerMethodField()
    profileImage = serializers.CharField(source='profile.profileImage', read_only=True)
    location = serializers.CharField(source='profile.location', read_only=True)
    sect = serializers.CharField(source='profile.sect', read_only=True)
    education = serializers.CharField(source='profile.education', read_only=True)
    caste = serializers.CharField(source='profile.caste', read_only=True)
    profession = serializers.CharField(source='profile.profession', read_only=True)
    maritalStatus = serializers.CharField(source='profile.maritalStatus', read_only=True)
    age = serializers.IntegerField(source='profile.age', read_only=True)
    dateOfBirth = serializers.DateField(source='profile.dateOfBirth', read_only=True)
    is_favorite = serializers.SerializerMethodField()
    is_online = serializers.BooleanField(read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'username', 'fullName', 'bio', 'images', 'profileImage',
            'location', 'sect', 'education', 'caste', 'profession', 'maritalStatus',
            'age', 'dateOfBirth', 'is_favorite', 'is_online',
        )

    def get_images(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.images_as_list() if profile else []

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                return obj in request.user.profile.favorites.all()
            except Exception:
                return False
        return False


class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = ('interestList', 'partnerCriteria')


class UserProfileSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(read_only=True)
    profileImage = serializers.CharField(read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            'fullName', 'bio', 'images', 'profileImage', 'identityDocs',
            'profession', 'education', 'location', 'maritalStatus',
            'sect', 'caste', 'dateOfBirth', 'age',
        )

    def validate_images(self, value):
        """Reject clearing or emptying photos via API; replacements must include a non-empty image."""
        if value is None:
            raise serializers.ValidationError('Profile photo is required.')
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError('Profile photo is required.')
        first = value[0]
        if not isinstance(first, str) or not first.strip():
            raise serializers.ValidationError('Profile photo is required.')
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        imgs = instance.images_as_list()
        data['images'] = imgs
        data['profileImage'] = imgs[0] if imgs else None
        data['userId'] = instance.user_id
        return data


class GroupChatMessageSerializer(serializers.ModelSerializer):
    """Same wire shape as ChatMessageSerializer (recipientId null for groups)."""

    senderId = serializers.IntegerField(source='sender.id', read_only=True)
    recipientId = serializers.SerializerMethodField()
    senderName = serializers.SerializerMethodField()
    groupId = serializers.IntegerField(source='group.id', read_only=True)

    class Meta:
        model = GroupChatMessage
        fields = ('id', 'senderId', 'recipientId', 'senderName', 'message', 'createdAt', 'groupId')

    def get_recipientId(self, obj):
        return None

    def get_senderName(self, obj):
        profile_name = getattr(getattr(obj.sender, 'profile', None), 'fullName', None)
        return profile_name or obj.sender.username or obj.sender.email


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
    fullName = serializers.SerializerMethodField()
    profileImage = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    roomName = serializers.SerializerMethodField()
    is_online = serializers.BooleanField(read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'username',
            'email',
            'fullName',
            'profileImage',
            'images',
            'status',
            'roomName',
            'is_online',
        )

    def get_fullName(self, obj):
        try:
            return obj.profile.fullName
        except Exception:
            return obj.username or obj.email or ''

    def get_profileImage(self, obj):
        try:
            return obj.profile.profileImage
        except Exception:
            return None

    def get_images(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.images_as_list() if profile else []

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


class FamilyConnectionSerializer(serializers.ModelSerializer):
    linkedMemberEmail = serializers.EmailField(source='linkedMember.email', read_only=True)
    linkedMemberName = serializers.CharField(source='linkedMember.profile.fullName', read_only=True)

    class Meta:
        model = FamilyConnection
        fields = ('id', 'linkedMember', 'linkedMemberEmail', 'linkedMemberName', 'memberRole', 'permissions')


class ReportSerializer(serializers.ModelSerializer):
    reporterEmail = serializers.EmailField(source='reporter.email', read_only=True)
    reportedEmail = serializers.EmailField(source='reportedUser.email', read_only=True)

    class Meta:
        model = Report
        fields = ('id', 'reporter', 'reportedUser', 'reporterEmail', 'reportedEmail', 'reason', 'verdict', 'createdAt')
        read_only_fields = ('id', 'reporter', 'verdict', 'createdAt')


class BlockedUserSerializer(serializers.ModelSerializer):
    blockedEmail = serializers.EmailField(source='blocked.email', read_only=True)
    blockedUsername = serializers.CharField(source='blocked.username', read_only=True)
    blockedName = serializers.SerializerMethodField()

    class Meta:
        model = BlockedUser
        fields = ('id', 'blocked', 'blockedEmail', 'blockedUsername', 'blockedName', 'createdAt')

    def get_blockedName(self, obj):
        try:
            return obj.blocked.profile.fullName
        except Exception:
            return obj.blocked.username
class FamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = ('id', 'relationship', 'occupation', 'education')
