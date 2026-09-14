import os
import time
import hashlib
from typing import Dict, List, Optional, Tuple
from services.api.database.connection import db
from services.api.database.models import ConsentRecord, AuditLogRecord

# Try to import Asset and AccessLog from models, define them if they aren't there
try:
    from services.api.database.models import Asset, AccessLog
except ImportError:
    # Defining dummy classes if not present, though task suggests they exist
    class Asset:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    class AccessLog:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

try:
    from web3 import Web3
    from services.api.contract_loader import load_deployment_addresses, load_contract_abi
    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False

class BlockchainService:
    def __init__(self):
        self.web3 = None
        self.contracts = {}
        self.use_web3 = False
        self._init_web3()

    def _init_web3(self):
        rpc_url = os.environ.get("ETH_RPC_URL", "")
        if WEB3_AVAILABLE and rpc_url:
            try:
                self.web3 = Web3(Web3.HTTPProvider(rpc_url))
                if self.web3.is_connected():
                    addresses = load_deployment_addresses()
                    self._load_contracts(addresses)
                    self.use_web3 = True
                    print(f"BlockchainService: Connected to EVM node at {rpc_url}")
                else:
                    print(f"BlockchainService: Could not connect to {rpc_url}, using simulation mode")
            except Exception as e:
                print(f"BlockchainService: Web3 init error: {e}, using simulation mode")
        else:
            print("BlockchainService: No ETH_RPC_URL configured, using simulation mode")

    def _load_contracts(self, addresses: dict):
        for name in ["SecureAssetPlatform", "AccessControlManager", "IdentityRegistry", 
                     "OrganizationRegistry", "ConsentManager", "AuditRegistry"]:
            addr = addresses.get(name)
            if addr:
                abi = load_contract_abi(name)
                if abi:
                    self.contracts[name] = self.web3.eth.contract(
                        address=Web3.to_checksum_address(addr), abi=abi
                    )
        
        # Start event polling thread if connected
        if self.use_web3 and "SecureAssetPlatform" in self.contracts:
            import threading
            self.stop_polling = False
            self.poll_thread = threading.Thread(target=self._poll_access_decisions, daemon=True)
            self.poll_thread.start()

    def _poll_access_decisions(self):
        contract = self.contracts["SecureAssetPlatform"]
        # Try to get latest block
        try:
            last_block = self.web3.eth.block_number
        except:
            last_block = 0
            
        while not getattr(self, 'stop_polling', False):
            try:
                current_block = self.web3.eth.block_number
                if current_block > last_block:
                    events = contract.events.AccessDecision.create_filter(fromBlock=last_block + 1, toBlock=current_block).get_all_entries()
                    for event in events:
                        args = event.args
                        if not args.get('success', True):
                            from services.api.database.models import IncidentLog
                            incident = IncidentLog(
                                log_id=f"inc_{event.transactionHash.hex()}",
                                requester=args.get('requester', 'Unknown'),
                                token_id=args.get('tokenId', 0),
                                asset_id="",
                                reason="Access Denied",
                                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                            )
                            # Avoid duplicates
                            if not any(log.log_id == incident.log_id for log in db.incident_logs):
                                db.incident_logs.insert(0, incident)
                    last_block = current_block
            except Exception as e:
                print(f"BlockchainService poll error: {e}")
            time.sleep(10)

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
            "role": "USER",
            "name": f"User {wallet_address[:6]}",
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

    def mint_asset(self, sender_key: str, recipient: str, asset_id: str, metadata_hash: str) -> dict:
        if self.use_web3 and "SecureAssetPlatform" in self.contracts:
            contract = self.contracts["SecureAssetPlatform"]
            account = self.web3.eth.account.from_key(sender_key)
            tx = contract.functions.mintAndAllocateAsset(
                Web3.to_checksum_address(recipient),
                asset_id,
                bytes.fromhex(metadata_hash.replace("0x", "").ljust(64, "0"))
            ).build_transaction({
                'from': account.address,
                'nonce': self.web3.eth.get_transaction_count(account.address),
                'gas': 300000,
                'gasPrice': self.web3.eth.gas_price,
            })
            signed = self.web3.eth.account.sign_transaction(tx, sender_key)
            tx_hash = self.web3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Simple simulation of token_id for now
            token_id = len(getattr(db, "assets", {})) + 1 
            return {"tx_hash": tx_hash.hex(), "token_id": token_id, "status": "confirmed"}
        else:
            if not hasattr(db, "assets"):
                db.assets = {}
            token_id = len(db.assets) + 1
            asset = Asset(
                token_id=token_id,
                asset_id=asset_id,
                metadata_hash=metadata_hash,
                owner_wallet=recipient.lower(),
                status="ACTIVE",
                minted_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            )
            db.assets[token_id] = asset
            return {"tx_hash": f"0xsim_{token_id:064x}", "token_id": token_id, "status": "simulated"}

    def check_access(self, requester: str, token_id: int, action: str) -> bool:
        if self.use_web3 and "SecureAssetPlatform" in self.contracts:
            contract = self.contracts["SecureAssetPlatform"]
            try:
                # We could attempt calling a function if one existed, using a dummy true for now to illustrate
                return True
            except Exception:
                return False
        else:
            if not hasattr(db, "assets"):
                return False
            asset = db.assets.get(token_id)
            if not asset:
                return False
            if asset.owner_wallet.lower() == requester.lower():
                return True
            if not hasattr(db, "access_rules"):
                db.access_rules = []
            for rule in db.access_rules:
                if (rule.get("token_id") == token_id and 
                    rule.get("requester").lower() == requester.lower() and 
                    rule.get("action") == action and 
                    rule.get("allowed") == True):
                    return True
            return False

    def log_access(self, requester: str, token_id: int, action: str, granted: bool):
        if not hasattr(db, "access_logs"):
            db.access_logs = []
        log = AccessLog(
            log_id=len(db.access_logs) + 1,
            token_id=token_id,
            requester=requester,
            action=action,
            granted=granted,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        )
        db.access_logs.append(log)
        return log

    def get_user_role(self, wallet_address: str) -> str:
        if self.use_web3 and "AccessControlManager" in self.contracts:
            return "USER" # placeholder logic
        else:
            for org in db.organizations.values():
                if isinstance(org, dict):
                    if org.get("wallet_address", "").lower() == wallet_address.lower():
                        return org.get("role", "UNKNOWN")
                else:
                    if getattr(org, "wallet_address", "").lower() == wallet_address.lower():
                        return getattr(org, "role", "UNKNOWN")
            return "UNKNOWN"

    def get_assets_by_owner(self, wallet_address: str) -> list:
        assets = []
        if not hasattr(db, "assets"):
            return assets
        for asset in db.assets.values():
            if asset.owner_wallet.lower() == wallet_address.lower():
                assets.append(asset)
        return assets

    def set_access_rule(self, sender_key: str, token_id: int, requester: str, action: str, allowed: bool, expires_at: int):
        if self.use_web3 and "SecureAssetPlatform" in self.contracts:
            contract = self.contracts["SecureAssetPlatform"]
            account = self.web3.eth.account.from_key(sender_key)
            try:
                tx = contract.functions.setAccessRule(
                    token_id,
                    Web3.to_checksum_address(requester),
                    action,
                    allowed,
                    expires_at
                ).build_transaction({
                    'from': account.address,
                    'nonce': self.web3.eth.get_transaction_count(account.address),
                    'gas': 300000,
                    'gasPrice': self.web3.eth.gas_price,
                })
                signed = self.web3.eth.account.sign_transaction(tx, sender_key)
                tx_hash = self.web3.eth.send_raw_transaction(signed.raw_transaction)
                self.web3.eth.wait_for_transaction_receipt(tx_hash)
                return {"tx_hash": tx_hash.hex(), "status": "confirmed"}
            except Exception as e:
                return {"status": "error", "message": str(e)}
        else:
            if not hasattr(db, "access_rules"):
                db.access_rules = []
            db.access_rules.append({
                "token_id": token_id,
                "requester": requester,
                "action": action,
                "allowed": allowed,
                "expires_at": expires_at
            })
            return {"tx_hash": f"0xsim_rule_{len(db.access_rules)}", "status": "simulated"}

    def transfer_asset(self, sender_key: str, from_addr: str, to_addr: str, token_id: int):
        if self.use_web3 and "SecureAssetPlatform" in self.contracts:
            contract = self.contracts["SecureAssetPlatform"]
            account = self.web3.eth.account.from_key(sender_key)
            try:
                tx = contract.functions.safeTransferFrom(
                    Web3.to_checksum_address(from_addr),
                    Web3.to_checksum_address(to_addr),
                    token_id
                ).build_transaction({
                    'from': account.address,
                    'nonce': self.web3.eth.get_transaction_count(account.address),
                    'gas': 300000,
                    'gasPrice': self.web3.eth.gas_price,
                })
                signed = self.web3.eth.account.sign_transaction(tx, sender_key)
                tx_hash = self.web3.eth.send_raw_transaction(signed.raw_transaction)
                self.web3.eth.wait_for_transaction_receipt(tx_hash)
                return {"tx_hash": tx_hash.hex(), "status": "confirmed"}
            except Exception as e:
                return {"status": "error", "message": str(e)}
        else:
            if not hasattr(db, "assets"):
                return {"status": "error", "message": "Asset not found"}
            asset = db.assets.get(token_id)
            if asset and asset.owner_wallet.lower() == from_addr.lower():
                asset.owner_wallet = to_addr.lower()
                return {"tx_hash": f"0xsim_transfer_{token_id}", "status": "simulated"}
            return {"status": "error", "message": "Asset not found or not owned by from_addr"}

blockchain_service = BlockchainService()
