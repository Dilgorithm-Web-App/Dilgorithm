import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

#We need to tell the server: "If it's a normal web request, handle it normally. If it's a chat message (WebSocket), send it to the chat engine."
# The ProtocolTypeRouter is like a traffic cop that directs HTTP requests to the standard Django ASGI application and WebSocket requests to our custom URL router defined in accounts.routing. The AllowedHostsOriginValidator ensures that only requests from allowed hosts can establish WebSocket connections, adding a layer of security against unauthorized access.

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize standard Django ASGI application early
django_asgi_app = get_asgi_application()

# We will import our websocket URLs in a moment
import accounts.routing 

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        URLRouter(
            accounts.routing.websocket_urlpatterns
        )
    ),
})