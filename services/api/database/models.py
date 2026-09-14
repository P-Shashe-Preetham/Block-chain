"""
Database Data Models for Open Banking Backend System
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from dataclasses import dataclass

@dataclass
class AuthNonce:
    wallet_address: str
    nonce: str
    message: str
    created_at: float  # time.time()
    expires_at: float  # created_at + 300 (5 min)

@dataclass
class Asset:
    token_id: int
    asset_id: str  # e.g. 'BEL-LAB-001'
    metadata_hash: str  # bytes32 hex
    owner_wallet: str
    status: str  # 'ACTIVE', 'SUSPENDED', 'REVOKED', 'RETIRED'
    minted_at: str  # ISO timestamp

@dataclass
class AccessLog:
    log_id: str
    requester_wallet: str
    token_id: int
    action: str
    granted: bool
    timestamp: str  # ISO timestamp

class User(BaseModel):
    user_id: str
    wallet_address: str
    did: str
    name: str
    email: str
    status: str = "PENDING"  # PENDING, VERIFIED, ACTIVE, SUSPENDED, REVOKED
    role: str = "USER"
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

class IncidentLog(BaseModel):
    log_id: str
    requester: str
    token_id: int
    asset_id: str
    reason: str
    timestamp: str
