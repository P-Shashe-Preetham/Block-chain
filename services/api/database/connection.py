"""
In-Memory / SQLite Database Manager for Open Banking Backend
"""

from typing import Dict, List, Optional
from services.api.database.models import User, Organization, BankAccount, BankTransaction, ConsentRecord, AuditLogRecord

class DatabaseStore:
    def __init__(self):
        self.users: Dict[str, User] = {}  # wallet_address -> User
        self.organizations: Dict[str, Organization] = {}  # wallet_address -> Organization
        self.accounts: Dict[str, BankAccount] = {}  # account_id -> BankAccount
        self.transactions: Dict[str, List[BankTransaction]] = {}  # account_id -> List[BankTransaction]
        self.consents: Dict[str, ConsentRecord] = {}  # consent_id -> ConsentRecord
        self.audit_logs: List[AuditLogRecord] = []

db = DatabaseStore()
