"""
DIP: ASGI stack authenticates WebSocket via JWT query param (?token=...) without coupling consumers to token parsing.
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from .models import CustomUser


@database_sync_to_async
def _user_from_token(token_string: str):
    try:
        access = AccessToken(token_string)
        uid = access["user_id"]
        return CustomUser.objects.get(pk=uid)
    except (InvalidToken, TokenError, KeyError, CustomUser.DoesNotExist):
        return None


class JWTAuthMiddleware:
    """Populates scope['user'] from ?token= JWT (browser WebSockets cannot set Authorization headers)."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        qs = scope.get("query_string", b"").decode()
        token = (parse_qs(qs).get("token") or [None])[0]
        if token:
            user = await _user_from_token(token)
            scope = dict(scope)
            scope["user"] = user if user is not None else AnonymousUser()
        else:
            scope = dict(scope)
            scope["user"] = AnonymousUser()
        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
