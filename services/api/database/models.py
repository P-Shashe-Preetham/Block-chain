"""
Database Data Models for Open Banking Backend System
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class User(BaseModel):
    user_id: str
    wallet_address: str
    did: str
    name: str
    email: str
    status: str = "PENDING"  # PENDING, VERIFIED, ACTIVE, SUSPENDED, REVOKED
    registered_at: str

class Organization(BaseModel):
    org_id: str
    wallet_address: str
    name: str
    role: str  # BANK, TSP, REGULATOR
    status: str = "PENDING"  # PENDING, APPROVED, SUSPENDED, REVOKED
    license_id: str
    registered_at: str

class BankAccount(BaseModel):
    account_id: str
    bank_id: str  # BANK_A, BANK_B, BANK_C
    bank_name: str
    user_wallet: str
    account_number: str
    account_type: str  # CHECKING, SAVINGS, INVESTMENT
    balance: float
    currency: str = "USD"

class BankTransaction(BaseModel):
    transaction_id: str
    account_id: str
    amount: float
    transaction_type: str  # CREDIT, DEBIT
    counterparty: str
    description: str
    timestamp: str

class ConsentRecord(BaseModel):
    consent_id: str
    user_wallet: str
    bank_wallet: str
    tsp_wallet: str
    data_type: str
    created_at: int
    expires_at: int
    active: bool = True

class AuditLogRecord(BaseModel):
    log_id: str
    user_wallet: str
    bank_wallet: str
    tsp_wallet: str
    data_type: str
    granted: bool
    reason: str
    timestamp: str
