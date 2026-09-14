"""
In-Memory / SQLite Database Manager for Open Banking Backend
"""

from typing import Dict, List, Optional
from services.api.database.models import User, Organization, BankAccount, BankTransaction, ConsentRecord, AuditLogRecord, AuthNonce, Asset, AccessLog

class DatabaseStore:
    def __init__(self):
        self.users: Dict[str, User] = {}  # wallet_address -> User
        self.organizations: Dict[str, Organization] = {}  # wallet_address -> Organization
        self.accounts: Dict[str, BankAccount] = {}  # account_id -> BankAccount
        self.transactions: Dict[str, List[BankTransaction]] = {}  # account_id -> List[BankTransaction]
        self.consents: Dict[str, ConsentRecord] = {}  # consent_id -> ConsentRecord
        self.audit_logs: List[AuditLogRecord] = []
        self.nonces: Dict[str, AuthNonce] = {}  # keyed by wallet_address
        self.assets: Dict[int, Asset] = {}  # keyed by token_id
        self.access_logs: List[AccessLog] = []
        self.incident_logs: List[any] = []  # List of IncidentLog

    def create_nonce(self, wallet_address: str, nonce: AuthNonce) -> None:
        self.nonces[wallet_address.lower()] = nonce

    def get_nonce(self, wallet_address: str) -> Optional[AuthNonce]:
        return self.nonces.get(wallet_address.lower())

    def delete_nonce(self, wallet_address: str) -> None:
        if wallet_address.lower() in self.nonces:
            del self.nonces[wallet_address.lower()]

db = DatabaseStore()
