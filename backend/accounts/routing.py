from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(
        r"^ws/chat/group_(?P<group_id>\d+)/$",
        consumers.GroupChatConsumer.as_asgi(),
    ),
    re_path(
        r"^ws/chat/room_(?P<contact_id>\d+)/$",
        consumers.ChatConsumer.as_asgi(),
    ),
]
