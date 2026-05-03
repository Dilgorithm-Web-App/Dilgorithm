"""
Design patterns for the accounts application (dashboard / views layer).

Complements matching_patterns.py (which covers Adapter, Template, Composite, Iterator)
by adding the four remaining GoF patterns used in the project:

- Singleton:  NotificationService — one shared instance for dispatching alerts.
- State:      AccountStateMachine — encapsulates accountStatus transitions.
- Observer:   EventBus — pub/sub for domain events (user.registered, report.created …).
- Factory:    ViewResponseFactory — uniform API Response construction.

SOLID principles applied:
  SRP  — each class has a single, well-defined responsibility.
  OCP  — new observers / states / response types can be added without modifying
         existing code.
  LSP  — all state classes are substitutable through the same transition interface.
  ISP  — each pattern exposes only the methods its consumers need.
  DIP  — views depend on factory/bus abstractions, not concrete Response construction.
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Dict, List, Optional

from rest_framework import status
from rest_framework.response import Response

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. SINGLETON — NotificationService
# ---------------------------------------------------------------------------
class NotificationService:
    """
    Singleton pattern: a single shared notification service instance.

    Provides a central place for dispatching notifications (log, email, push)
    without coupling individual views to notification implementation details.
    """

    _instance: Optional["NotificationService"] = None

    def __new__(cls) -> "NotificationService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True
        self._log = logging.getLogger(f"{__name__}.NotificationService")
        self._log.info("NotificationService singleton created.")

    # --- public API (Interface Segregation: narrow surface) -----------------

    def notify_user_registered(self, email: str) -> None:
        """Log / dispatch notification for new registration."""
        self._log.info("EVENT  user.registered  email=%s", email)

    def notify_report_created(self, reporter_email: str, target_email: str) -> None:
        """Log / dispatch notification when a report is filed."""
        self._log.info(
            "EVENT  report.created  reporter=%s  target=%s",
            reporter_email,
            target_email,
        )

    def notify_user_blocked(self, blocker_email: str, blocked_email: str) -> None:
        """Log / dispatch notification when a user is blocked."""
        self._log.info(
            "EVENT  user.blocked  blocker=%s  blocked=%s",
            blocker_email,
            blocked_email,
        )


# Module-level singleton instance (Singleton pattern)
notification_service = NotificationService()


# ---------------------------------------------------------------------------
# 2. STATE — AccountStateMachine
# ---------------------------------------------------------------------------
class AccountState:
    """
    State pattern: base class for account status states.

    Each concrete state encapsulates the allowed transitions from that status.
    The state machine delegates to the current state object, making transitions
    explicit and preventing invalid status changes (Open/Closed principle).
    """

    name: str = ""

    def activate(self) -> "AccountState":
        raise InvalidTransitionError(self.name, "Active")

    def suspend(self) -> "AccountState":
        raise InvalidTransitionError(self.name, "Suspended")

    def ban(self) -> "AccountState":
        raise InvalidTransitionError(self.name, "Banned")


class ActiveState(AccountState):
    """Concrete state — Active.  Can be suspended or banned."""

    name = "Active"

    def suspend(self) -> "AccountState":
        return SuspendedState()

    def ban(self) -> "AccountState":
        return BannedState()


class SuspendedState(AccountState):
    """Concrete state — Suspended.  Can be re-activated or banned."""

    name = "Suspended"

    def activate(self) -> "AccountState":
        return ActiveState()

    def ban(self) -> "AccountState":
        return BannedState()


class BannedState(AccountState):
    """Concrete state — Banned.  Can only be re-activated (admin action)."""

    name = "Banned"

    def activate(self) -> "AccountState":
        return ActiveState()


class InvalidTransitionError(Exception):
    """Raised when a state transition is not allowed."""

    def __init__(self, from_state: str, to_state: str) -> None:
        super().__init__(f"Cannot transition from '{from_state}' to '{to_state}'.")
        self.from_state = from_state
        self.to_state = to_state


_STATE_MAP: Dict[str, AccountState] = {
    "Active": ActiveState(),
    "Suspended": SuspendedState(),
    "Banned": BannedState(),
}


class AccountStateMachine:
    """
    State pattern (context): wraps a user model and delegates status
    transitions to the current AccountState object.

    Usage:
        sm = AccountStateMachine(user)
        sm.suspend()   # user.accountStatus → "Suspended"
        sm.activate()  # user.accountStatus → "Active"
    """

    def __init__(self, user) -> None:
        self._user = user
        self._state = _STATE_MAP.get(user.accountStatus, ActiveState())

    @property
    def current(self) -> str:
        return self._state.name

    def _apply(self, new_state: AccountState) -> None:
        self._state = new_state
        self._user.accountStatus = new_state.name
        self._user.save(update_fields=["accountStatus"])

    def activate(self) -> None:
        self._apply(self._state.activate())

    def suspend(self) -> None:
        self._apply(self._state.suspend())

    def ban(self) -> None:
        self._apply(self._state.ban())


# ---------------------------------------------------------------------------
# 3. OBSERVER — EventBus
# ---------------------------------------------------------------------------
class EventBus:
    """
    Observer pattern: a lightweight publish / subscribe event bus.

    Views publish domain events; any number of handlers (observers) can
    subscribe and react without the publisher knowing about them (OCP).

    Usage:
        event_bus.subscribe("user.registered", my_handler)
        event_bus.publish("user.registered", {"email": "a@b.com"})
    """

    def __init__(self) -> None:
        self._subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_name: str, handler: Callable) -> None:
        """Register *handler* to be called whenever *event_name* is published."""
        self._subscribers.setdefault(event_name, []).append(handler)

    def unsubscribe(self, event_name: str, handler: Callable) -> None:
        """Remove a previously registered handler."""
        handlers = self._subscribers.get(event_name, [])
        if handler in handlers:
            handlers.remove(handler)

    def publish(self, event_name: str, data: Any = None) -> None:
        """Notify all subscribers of *event_name* with optional *data*."""
        for handler in self._subscribers.get(event_name, []):
            try:
                handler(data)
            except Exception:
                logger.exception(
                    "EventBus handler error for '%s'", event_name
                )


# Module-level event bus singleton
event_bus = EventBus()


# --- Default observers (wired once at module load) -------------------------

def _on_user_registered(data: Any) -> None:
    notification_service.notify_user_registered(data.get("email", ""))


def _on_report_created(data: Any) -> None:
    notification_service.notify_report_created(
        data.get("reporter_email", ""), data.get("target_email", "")
    )


def _on_user_blocked(data: Any) -> None:
    notification_service.notify_user_blocked(
        data.get("blocker_email", ""), data.get("blocked_email", "")
    )


event_bus.subscribe("user.registered", _on_user_registered)
event_bus.subscribe("report.created", _on_report_created)
event_bus.subscribe("user.blocked", _on_user_blocked)


# ---------------------------------------------------------------------------
# 4. FACTORY — ViewResponseFactory
# ---------------------------------------------------------------------------
class ViewResponseFactory:
    """
    Factory pattern: creates uniform DRF Response objects.

    Centralises response construction so that views don't repeat boilerplate
    and all error/success responses share a consistent shape (SRP, DRY).
    """

    @staticmethod
    def success(detail: str = "OK", extra: Optional[dict] = None,
                http_status: int = status.HTTP_200_OK) -> Response:
        payload: Dict[str, Any] = {"detail": detail}
        if extra:
            payload.update(extra)
        return Response(payload, status=http_status)

    @staticmethod
    def created(detail: str = "Created", extra: Optional[dict] = None) -> Response:
        return ViewResponseFactory.success(
            detail=detail, extra=extra, http_status=status.HTTP_201_CREATED
        )

    @staticmethod
    def error(detail: str = "Bad request",
              http_status: int = status.HTTP_400_BAD_REQUEST) -> Response:
        return Response({"detail": detail}, status=http_status)

    @staticmethod
    def not_found(detail: str = "Not found") -> Response:
        return ViewResponseFactory.error(
            detail=detail, http_status=status.HTTP_404_NOT_FOUND
        )
