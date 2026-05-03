import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

from .serializers import ChatMessageSerializer, GroupChatMessageSerializer
from .services.chat_message_service import (
    canonical_chat_group_name,
    create_chat_message,
    get_contact_user,
)
from .services.group_chat_service import (
    canonical_group_channel_name,
    create_group_chat_message,
    get_group_if_member,
)


@database_sync_to_async
def _persist_chat_and_serialize(sender, recipient, text):
    cm, err = create_chat_message(sender, recipient, text)
    if err:
        return None, err
    return ChatMessageSerializer(cm).data, None


@database_sync_to_async
def _persist_group_chat_and_serialize(sender, group_id, text):
    group = get_group_if_member(sender, group_id)
    if not group:
        return None, "Group not found."
    gm, err = create_group_chat_message(sender, group, text)
    if err:
        return None, err
    return GroupChatMessageSerializer(gm).data, None


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket chat: JWT user required, room path room_<contact_id> verified against DB.
    Messages persist via shared chat_message_service (SRP, aligned with REST).
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close(code=4001)
            return

        try:
            self.contact_id = int(self.scope["url_route"]["kwargs"]["contact_id"])
        except (KeyError, ValueError, TypeError):
            await self.close(code=4002)
            return

        contact = await database_sync_to_async(get_contact_user)(user, self.contact_id)
        if not contact:
            await self.close(code=4003)
            return

        self.user = user
        self.contact = contact
        self.room_group_name = canonical_chat_group_name(user.id, self.contact_id)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        if not hasattr(self, "user") or not hasattr(self, "contact"):
            return
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps({"type": "error", "detail": "Invalid JSON payload."})
            )
            return

        if payload.get("type") != "chat.message":
            return

        text = payload.get("message")
        data, err = await _persist_chat_and_serialize(self.user, self.contact, text)
        if err:
            await self.send(text_data=json.dumps({"type": "error", "detail": err}))
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat.broadcast", "message": data},
        )

    async def chat_broadcast(self, event):
        await self.send(
            text_data=json.dumps({"type": "chat.event", "message": event["message"]})
        )


class GroupChatConsumer(AsyncWebsocketConsumer):
    """WebSocket for multi-user group rooms (path group_<id>)."""

    async def connect(self):
        user = self.scope.get("user")
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close(code=4001)
            return

        try:
            self.group_id = int(self.scope["url_route"]["kwargs"]["group_id"])
        except (KeyError, ValueError, TypeError):
            await self.close(code=4002)
            return

        group = await database_sync_to_async(get_group_if_member)(user, self.group_id)
        if not group:
            await self.close(code=4003)
            return

        self.user = user
        self.room_group_name = canonical_group_channel_name(self.group_id)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        if not hasattr(self, "user"):
            return
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps({"type": "error", "detail": "Invalid JSON payload."})
            )
            return

        if payload.get("type") != "chat.message":
            return

        text = payload.get("message")
        data, err = await _persist_group_chat_and_serialize(self.user, self.group_id, text)
        if err:
            await self.send(text_data=json.dumps({"type": "error", "detail": err}))
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "group_chat.broadcast", "message": data},
        )

    async def group_chat_broadcast(self, event):
        await self.send(
            text_data=json.dumps({"type": "chat.event", "message": event["message"]})
        )
