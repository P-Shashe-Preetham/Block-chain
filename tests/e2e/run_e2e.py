"""
E2E Test Runner CLI for SIH26125 Blockchain Secure Platform.
Allows targeted execution of Tiers 1-4, URL override, and structured test reporting.

Usage:
    python tests/e2e/run_e2e.py [--tier {1,2,3,4,all}] [--url http://127.0.0.1:8000] [--verbose]
"""

from __future__ import annotations

import argparse
import os
import sys
import time

sys.path.insert(0, os.path.abspath("."))

import httpx
import pytest


TIER_MAPPING = {
    "1": ["tests/e2e/test_tier1_features.py"],
    "2": ["tests/e2e/test_tier2_boundaries.py"],
    "3": ["tests/e2e/test_tier3_combinations.py"],
    "4": ["tests/e2e/test_tier4_scenarios.py"],
    "all": [
        "tests/e2e/test_tier1_features.py",
        "tests/e2e/test_tier2_boundaries.py",
        "tests/e2e/test_tier3_combinations.py",
        "tests/e2e/test_tier4_scenarios.py"
    ]
}


def check_target_health(url: str) -> bool:
    """Probes whether the target HTTP server is responsive."""
    try:
        resp = httpx.get(f"{url.rstrip('/')}/healthz", timeout=2.0)
        return resp.status_code == 200
    except Exception:
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Run SIH26125 E2E Test Suite")
    parser.add_argument(
        "--tier",
        choices=["1", "2", "3", "4", "all"],
        default="all",
        help="Specify which tier to execute (default: all)"
    )
    parser.add_argument(
        "--url",
        default=os.environ.get("E2E_BASE_URL", "http://127.0.0.1:8000"),
        help="Backend API URL (default: http://127.0.0.1:8000)"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose pytest output"
    )
    parser.add_argument(
        "--tb",
        default="short",
        help="Traceback style: short, auto, line, native"
    )

    args = parser.parse_args()

    os.environ["E2E_BASE_URL"] = args.url

    print("=" * 70)
    print("  SIH26125 Blockchain Platform — Comprehensive E2E Test Suite")
    print("=" * 70)
    print(f"Target Base URL : {args.url}")
    print(f"Selected Tier   : {args.tier.upper()}")

    is_live = check_target_health(args.url)
    if is_live:
        print("Target Status   : ONLINE (Live network HTTP execution)")
    else:
        print("Target Status   : OFFLINE (In-process ASGI execution active)")

    test_files = TIER_MAPPING[args.tier]
    print(f"Target Files    : {', '.join(test_files)}")
    print("-" * 70)

    pytest_args = test_files.copy()
    if args.verbose:
        pytest_args.append("-v")
    pytest_args.extend(["--tb", args.tb])

    start_time = time.time()
    exit_code = pytest.main(pytest_args)
    duration = time.time() - start_time

    print("-" * 70)
    status_str = "SUCCESS" if exit_code == 0 else f"FAILED (exit code {exit_code})"
    print(f"Execution completed in {duration:.2f}s with status: {status_str}")
    print("=" * 70)

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
