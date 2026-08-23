from __future__ import annotations

import asyncio
import os
import unittest
from unittest.mock import patch

import httpx

from services.api.app import create_app
from services.api.audit import AuditEvent, MemoryAuditReader, ProjectionStatus
from services.api.auth import Principal, extract_bearer_token
from services.api.config import ConfigurationError, Settings
from services.api.rpc import verify_rpc_contract


app = create_app(
    Settings(
        app_env="local",
        auth_issuer=None,
        auth_audience=None,
        auth_jwks_url=None,
        chain_id=31337,
        rpc_url="http://127.0.0.1:8545",
        contract_address=None,
        cors_allowed_origins=("http://localhost:3000",),
    )
)


def request_for(application, method: str, path: str, headers: dict[str, str] | None = None) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=application)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.request(method, path, headers=headers)

    return asyncio.run(send())


def request(method: str, path: str, headers: dict[str, str] | None = None) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.request(method, path, headers=headers)

    return asyncio.run(send())


class FakeResponse:
    def __init__(self, payload: dict[str, object], status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code

    def json(self) -> dict[str, object]:
        return self._payload


class FakeClient:
    def __init__(self, responses: list[FakeResponse]) -> None:
        self.responses = responses

    def __enter__(self) -> "FakeClient":
        return self

    def __exit__(self, *_: object) -> None:
        return None

    def post(self, *_: object, **__: object) -> FakeResponse:
        return self.responses.pop(0)


class ApiBoundaryTests(unittest.TestCase):
    def test_health_endpoint_is_public_and_does_not_leak_configuration(self) -> None:
        response = request("GET", "/healthz")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "service": "api", "mode": "local"})
        self.assertNotIn("RPC_URL", response.text)

    def test_readiness_fails_closed_without_contract_configuration(self) -> None:
        response = request("GET", "/readyz")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "not_ready")

    def test_rpc_readiness_requires_matching_chain_and_deployed_code(self) -> None:
        settings = Settings(
            app_env="local",
            auth_issuer=None,
            auth_audience=None,
            auth_jwks_url=None,
            chain_id=31337,
            rpc_url="http://rpc.test",
            contract_address="0x0000000000000000000000000000000000000001",
            cors_allowed_origins=("http://localhost:3000",),
        )
        matching_factory = lambda **_: FakeClient([
            FakeResponse({"jsonrpc": "2.0", "id": 1, "result": "0x7a69"}),
            FakeResponse({"jsonrpc": "2.0", "id": 2, "result": "0x6000"}),
        ])
        mismatching_factory = lambda **_: FakeClient([
            FakeResponse({"jsonrpc": "2.0", "id": 1, "result": "0x1"}),
        ])
        self.assertTrue(verify_rpc_contract(settings, client_factory=matching_factory))
        self.assertFalse(verify_rpc_contract(settings, client_factory=mismatching_factory))

    def test_audit_requires_bearer_authentication(self) -> None:
        response = request("GET", "/v1/audit")
        self.assertEqual(response.status_code, 401)

    def test_bearer_auth_fails_closed_until_oidc_is_configured(self) -> None:
        response = request("GET", "/v1/audit", {"Authorization": "Bearer opaque-test-token"})
        self.assertEqual(response.status_code, 503)

    def test_audit_returns_sanitized_projection_records_and_filters_uncertain_status(self) -> None:
        settings = Settings(
            app_env="local",
            auth_issuer=None,
            auth_audience=None,
            auth_jwks_url=None,
            chain_id=31337,
            rpc_url="http://127.0.0.1:8545",
            contract_address=None,
            cors_allowed_origins=("http://localhost:3000",),
        )
        reader = MemoryAuditReader(
            (
                AuditEvent("event-canonical", 31337, "0x" + "1" * 40, "0x" + "2" * 64, 0, 1, "AssetRegistered", ProjectionStatus.CANONICAL),
                AuditEvent("event-uncertain", 31337, "0x" + "1" * 40, "0x" + "3" * 64, 0, 2, "AssetRegistered", ProjectionStatus.UNCERTAIN),
            )
        )
        principal = Principal("subject-fixture", frozenset({"AUDITOR_ROLE"}), frozenset(), "fixture", "fixture")
        application = create_app(settings, audit_reader=reader, principal_provider=lambda _: principal)
        response = request_for(
            application,
            "GET",
            "/v1/audit?limit=10&projection_status=uncertain",
            {"Authorization": "Bearer fixture-token"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["projection_only"], True)
        self.assertEqual([event["event_id"] for event in response.json()["events"]], ["event-uncertain"])
        self.assertNotIn("topics", response.json()["events"][0])
        self.assertNotIn("payload", response.json()["events"][0])

    def test_audit_projection_unavailable_fails_closed_after_authentication(self) -> None:
        settings = Settings(
            app_env="local",
            auth_issuer=None,
            auth_audience=None,
            auth_jwks_url=None,
            chain_id=31337,
            rpc_url="http://127.0.0.1:8545",
            contract_address=None,
            cors_allowed_origins=("http://localhost:3000",),
        )
        principal = Principal("subject-fixture", frozenset({"AUDITOR_ROLE"}), frozenset(), "fixture", "fixture")
        application = create_app(settings, principal_provider=lambda _: principal)
        response = request_for(application, "GET", "/v1/audit", {"Authorization": "Bearer fixture-token"})
        self.assertEqual(response.status_code, 503)

    def test_request_id_is_returned_and_invalid_control_characters_are_rejected(self) -> None:
        valid = request("GET", "/healthz", {"X-Request-ID": "test-request-001"})
        invalid = request("GET", "/healthz", {"X-Request-ID": "bad\nrequest"})
        self.assertEqual(valid.status_code, 200)
        self.assertEqual(valid.headers["X-Request-ID"], "test-request-001")
        self.assertEqual(invalid.status_code, 400)

    def test_bearer_parser_rejects_missing_or_wrong_scheme(self) -> None:
        with self.assertRaises(Exception):
            extract_bearer_token(None)
        with self.assertRaises(Exception):
            extract_bearer_token("Basic abc")
        self.assertEqual(extract_bearer_token("Bearer abc"), "abc")

    def test_production_settings_require_secure_trust_and_contract_configuration(self) -> None:
        production = {
            "APP_ENV": "production",
            "CHAIN_ID": "1",
            "RPC_URL": "http://rpc.example.invalid",
            "CONTRACT_ADDRESS": "0x0000000000000000000000000000000000000001",
            "AUTH_ISSUER": "https://issuer.example.invalid",
            "AUTH_AUDIENCE": "platform",
            "AUTH_JWKS_URL": "https://issuer.example.invalid/.well-known/jwks.json",
            "CORS_ALLOWED_ORIGINS": "https://console.example.invalid",
        }
        with patch.dict(os.environ, production, clear=False):
            with self.assertRaises(ConfigurationError):
                Settings.from_env()


if __name__ == "__main__":
    unittest.main()
