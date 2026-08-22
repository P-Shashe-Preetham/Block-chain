from __future__ import annotations

import unittest

from services.api.rate_limit import BoundedWindowLimiter


class RateLimitTests(unittest.TestCase):
    def test_quota_and_sliding_window(self) -> None:
        now = [100.0]
        limiter = BoundedWindowLimiter(2, 10, clock=lambda: now[0])
        self.assertTrue(limiter.allow("principal:one").allowed)
        self.assertTrue(limiter.allow("principal:one").allowed)
        blocked = limiter.allow("principal:one")
        self.assertFalse(blocked.allowed)
        self.assertGreaterEqual(blocked.retry_after_seconds, 10)
        now[0] = 110.1
        self.assertTrue(limiter.allow("principal:one").allowed)

    def test_invalid_keys_fail_closed(self) -> None:
        limiter = BoundedWindowLimiter(1, 5)
        for key in ("", "bad\nkey", "x" * 129):
            with self.assertRaises(ValueError):
                limiter.allow(key)

    def test_new_keys_are_denied_at_memory_cap(self) -> None:
        limiter = BoundedWindowLimiter(1, 5, max_keys=1)
        self.assertTrue(limiter.allow("principal:one").allowed)
        blocked = limiter.allow("principal:two")
        self.assertFalse(blocked.allowed)
        self.assertEqual(blocked.remaining, 0)


if __name__ == "__main__":
    unittest.main()
