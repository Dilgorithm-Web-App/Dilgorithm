from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # This URL connects two users for a chat (e.g., ws://localhost:8000/ws/chat/room_name/)
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]