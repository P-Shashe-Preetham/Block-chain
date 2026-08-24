"""Bounded rate-limit reference primitive for the future API service.

This is not a production limiter: it is process-local, does not identify
trusted proxy clients, and is not shared across replicas. Production must use
an approved distributed store and abuse-response policy.
"""

from __future__ import annotations

from collections import OrderedDict, deque
from dataclasses import dataclass
from time import monotonic
from typing import Callable


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    remaining: int
    retry_after_seconds: int = 0


class BoundedWindowLimiter:
    def __init__(
        self,
        max_requests: int,
        window_seconds: float,
        *,
        max_keys: int = 10_000,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        if max_requests < 1 or window_seconds <= 0 or max_keys < 1:
            raise ValueError("rate-limit values must be positive")
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._max_keys = max_keys
        self._clock = clock
        self._events: OrderedDict[str, deque[float]] = OrderedDict()

    def allow(self, key: str) -> RateLimitDecision:
        if not isinstance(key, str) or not key or len(key) > 128 or any(ord(char) < 32 for char in key):
            raise ValueError("rate-limit key is invalid")
        now = self._clock()
        events = self._events.get(key)
        if events is None:
            if len(self._events) >= self._max_keys:
                return RateLimitDecision(False, 0, int(self._window_seconds))
            events = deque()
            self._events[key] = events
        else:
            self._events.move_to_end(key)
        self._prune(events, now)
        if len(events) >= self._max_requests:
            retry_after = max(1, int(events[0] + self._window_seconds - now + 0.999))
            return RateLimitDecision(False, 0, retry_after)
        events.append(now)
        return RateLimitDecision(True, self._max_requests - len(events), 0)

    def clear(self) -> None:
        self._events.clear()

    def _prune(self, events: deque[float], now: float) -> None:
        cutoff = now - self._window_seconds
        while events and events[0] <= cutoff:
            events.popleft()
