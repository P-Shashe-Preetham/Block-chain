"""
Blockchain Integration Service
Interacts with deployed smart contracts (OrganizationRegistry, IdentityRegistry, ConsentManager, AccessControlManager, AuditRegistry).
"""

import time
import hashlib
from typing import Dict, List, Optional, Tuple
from services.api.database.connection import db
from services.api.database.models import ConsentRecord, AuditLogRecord

class BlockchainService:
    def __init__(self):
        pass

    def register_organization(self, name: str, role: str, license_id: str, wallet_address: str) -> dict:
        """Simulate OrganizationRegistry.registerOrganization()"""
        org_id = f"org_{hashlib.sha256((wallet_address + name).encode()).hexdigest()[:8]}"
        org = {
            "org_id": org_id,
            "wallet_address": wallet_address,
            "name": name,
            "role": role,
            "status": "PENDING",
            "license_id": license_id,
            "registered_at": int(time.time())
        }
        db.organizations[wallet_address] = org
        db.organizations[wallet_address.lower()] = org
        return org

    def approve_organization(self, wallet_address: str) -> bool:
        """Simulate OrganizationRegistry.approveOrganization()"""
        found = False
        for key in list(db.organizations.keys()):
            if key.lower() == wallet_address.lower():
                org = db.organizations[key]
                if isinstance(org, dict):
                    org["status"] = "APPROVED"
                else:
                    setattr(org, "status", "APPROVED")
                found = True
        return found

    def is_organization_approved(self, wallet_address: str) -> bool:
        """Simulate OrganizationRegistry.isOrganizationApproved()"""
        for key, org in db.organizations.items():
            if key.lower() == wallet_address.lower():
                status = org.get("status") if isinstance(org, dict) else getattr(org, "status", None)
                if status == "APPROVED":
                    return True
        return False

    def register_identity(self, did: str, pii_data: str, wallet_address: str) -> dict:
        """Simulate IdentityRegistry.registerIdentity()"""
        pii_hash = hashlib.sha256(pii_data.encode()).hexdigest()
        user_record = {
            "user_id": f"usr_{hashlib.sha256(wallet_address.encode()).hexdigest()[:6]}",
            "wallet_address": wallet_address,
            "did": did,
            "pii_hash": pii_hash,
            "status": "PENDING",
            "registered_at": int(time.time())
        }
        db.users[wallet_address] = user_record
        db.users[wallet_address.lower()] = user_record
        return user_record

    def verify_identity(self, wallet_address: str) -> bool:
        """Simulate IdentityRegistry.verifyIdentity()"""
        found = False
        for key in list(db.users.keys()):
            if key.lower() == wallet_address.lower():
                user = db.users[key]
                if isinstance(user, dict):
                    user["status"] = "ACTIVE"
                else:
                    setattr(user, "status", "ACTIVE")
                found = True
        return found

    def is_identity_active(self, wallet_address: str) -> bool:
        """Simulate IdentityRegistry.isIdentityActive()"""
        for key, user in db.users.items():
            if key.lower() == wallet_address.lower():
                status = user.get("status") if isinstance(user, dict) else getattr(user, "status", None)
                if status in ["ACTIVE", "VERIFIED"]:
                    return True
        return False

    def grant_consent(
        self, user_wallet: str, bank_wallet: str, tsp_wallet: str, data_type: str, duration_sec: int
    ) -> ConsentRecord:
        """Simulate ConsentManager.grantConsent()"""
        created_at = int(time.time())
        expires_at = created_at + duration_sec
        consent_id = f"cst_{hashlib.sha256(f'{user_wallet}{bank_wallet}{tsp_wallet}{data_type}{created_at}'.encode()).hexdigest()[:12]}"

        record = ConsentRecord(
            consent_id=consent_id,
            user_wallet=user_wallet,
            bank_wallet=bank_wallet,
            tsp_wallet=tsp_wallet,
            data_type=data_type,
            created_at=created_at,
            expires_at=expires_at,
            active=True
        )
        db.consents[consent_id] = record
        return record

    def revoke_consent(self, consent_id: str, user_wallet: str) -> bool:
        """Simulate ConsentManager.revokeConsent()"""
        consent = db.consents.get(consent_id)
        if consent and consent.user_wallet.lower() == user_wallet.lower():
            consent.active = False
            return True
        return False

    def check_consent(self, user_wallet: str, bank_wallet: str, tsp_wallet: str, data_type: str) -> bool:
        """Simulate ConsentManager.checkConsent()"""
        now = int(time.time())
        for c in db.consents.values():
            expires_at = c.expires_at if hasattr(c, 'expires_at') else getattr(c, 'expiresAt', 0)
            if (
                c.user_wallet.lower() == user_wallet.lower()
                and c.bank_wallet.lower() == bank_wallet.lower()
                and c.tsp_wallet.lower() == tsp_wallet.lower()
                and c.data_type.upper() == data_type.upper()
                and c.active
                and now <= expires_at
            ):
                return True
        return False

    def is_access_allowed(
        self, user_wallet: str, bank_wallet: str, tsp_wallet: str, data_type: str
    ) -> Tuple[bool, str]:
        """Simulate AccessControlManager.isAccessAllowed()"""
        if not self.is_identity_active(user_wallet):
            return False, "User identity is inactive or pending verification."
        if not self.is_organization_approved(bank_wallet):
            return False, "Bank organization is not approved by Regulator."
        if not self.is_organization_approved(tsp_wallet):
            return False, "TSP organization is not approved by Regulator."
        if not self.check_consent(user_wallet, bank_wallet, tsp_wallet, data_type):
            return False, "No active, valid user consent found for this data scope."

        return True, "Authorization granted."

    def log_audit_event(
        self, user_wallet: str, bank_wallet: str, tsp_wallet: str, data_type: str, granted: bool, reason: str
    ) -> AuditLogRecord:
        """Simulate AuditRegistry.logAccessAttempt()"""
        log_id = f"aud_{len(db.audit_logs) + 1:04d}"
        record = AuditLogRecord(
            log_id=log_id,
            user_wallet=user_wallet,
            bank_wallet=bank_wallet,
            tsp_wallet=tsp_wallet,
            data_type=data_type,
            granted=granted,
            reason=reason,
            timestamp=str(int(time.time()))
        )
        db.audit_logs.insert(0, record)
        return record

blockchain_service = BlockchainService()
