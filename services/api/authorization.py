"""Reference authorization policy for future API routes.

The contract remains canonical. This pure policy module is deliberately not a
substitute for current on-chain reads, tenant policy, or a route middleware.
Unknown operations and stale/missing context fail closed.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import FrozenSet


class AssetStatus(StrEnum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    REVOKED = "REVOKED"
    RETIRED = "RETIRED"


class Operation(StrEnum):
    READ_ASSET = "read_asset"
    REQUEST_ACCESS = "request_access"
    TRANSFER_ASSET = "transfer_asset"
    SET_ASSET_STATUS = "set_asset_status"
    ADMINISTER = "administer"


@dataclass(frozen=True)
class AuthorizationContext:
    identity_active: bool
    roles: FrozenSet[str]
    owns_asset: bool = False
    asset_status: AssetStatus = AssetStatus.ACTIVE
    destination_identity_active: bool = True


@dataclass(frozen=True)
class AuthorizationDecision:
    allowed: bool
    reason: str


def authorize(operation: Operation | str, context: AuthorizationContext) -> AuthorizationDecision:
    if not isinstance(context, AuthorizationContext):
        raise ValueError("authorization context is required")
    try:
        operation = Operation(operation)
    except ValueError:
        return AuthorizationDecision(False, "unknown_operation")
    if not context.identity_active:
        return AuthorizationDecision(False, "identity_inactive")

    if operation is Operation.READ_ASSET:
        allowed = context.owns_asset or _has_any_role(context, "MANAGER_ROLE", "AUDITOR_ROLE")
        return AuthorizationDecision(allowed, "allowed" if allowed else "read_policy_denied")
    if operation is Operation.REQUEST_ACCESS:
        return AuthorizationDecision(True, "allowed")
    if operation is Operation.TRANSFER_ASSET:
        if context.asset_status is not AssetStatus.ACTIVE:
            return AuthorizationDecision(False, "asset_not_transferable")
        if not context.destination_identity_active:
            return AuthorizationDecision(False, "destination_identity_inactive")
        allowed = _has_role(context, "MANAGER_ROLE")
        return AuthorizationDecision(allowed, "allowed" if allowed else "manager_role_required")
    if operation is Operation.SET_ASSET_STATUS:
        allowed = context.asset_status is not AssetStatus.RETIRED and _has_role(context, "MANAGER_ROLE")
        return AuthorizationDecision(allowed, "allowed" if allowed else "manager_role_required_or_terminal_asset")
    if operation is Operation.ADMINISTER:
        allowed = _has_role(context, "DEFAULT_ADMIN_ROLE")
        return AuthorizationDecision(allowed, "allowed" if allowed else "default_admin_required")
    return AuthorizationDecision(False, "unknown_operation")


def _has_role(context: AuthorizationContext, role: str) -> bool:
    return role in context.roles


def _has_any_role(context: AuthorizationContext, *roles: str) -> bool:
    return any(role in context.roles for role in roles)
