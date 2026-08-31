"""
Database Seed Data for Open Banking System (Bank A, Bank B, Bank C, TSPs, Users)
"""

from datetime import datetime, timezone
from services.api.database.connection import db
from services.api.database.models import User, Organization, BankAccount, BankTransaction

# Known Addresses for Simulation
USER1_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
BANK_A_WALLET = "0x3C44CdD05a57028476078453851002F133ca588a"
BANK_B_WALLET = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
BANK_C_WALLET = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
TSP_1_WALLET = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
TSP_2_WALLET = "0x976EA74026E726554dB657fA54763abd0C3a0aa9"
REGULATOR_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

def seed_database():
    db.users.clear()
    db.organizations.clear()
    db.accounts.clear()
    db.transactions.clear()
    db.consents.clear()
    db.audit_logs.clear()

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Seed Users
    user1 = User(
        user_id="usr_101",
        wallet_address=USER1_WALLET,
        did="did:openbanking:usr101",
        name="Alice Vance",
        email="alice.vance@example.com",
        status="ACTIVE",
        registered_at=now_iso
    )
    db.users[USER1_WALLET] = user1

    # 2. Seed Organizations
    bank_a = Organization(
        org_id="org_bank_a",
        wallet_address=BANK_A_WALLET,
        name="Bank A (Apex Financial)",
        role="BANK",
        status="APPROVED",
        license_id="BNK-APX-001",
        registered_at=now_iso
    )
    bank_b = Organization(
        org_id="org_bank_b",
        wallet_address=BANK_B_WALLET,
        name="Bank B (Beacon Trust)",
        role="BANK",
        status="APPROVED",
        license_id="BNK-BCN-002",
        registered_at=now_iso
    )
    bank_c = Organization(
        org_id="org_bank_c",
        wallet_address=BANK_C_WALLET,
        name="Bank C (Crest Capital)",
        role="BANK",
        status="APPROVED",
        license_id="BNK-CST-003",
        registered_at=now_iso
    )
    tsp_1 = Organization(
        org_id="org_tsp_1",
        wallet_address=TSP_1_WALLET,
        name="MintyPay Analytics",
        role="TSP",
        status="APPROVED",
        license_id="TSP-MNT-901",
        registered_at=now_iso
    )
    tsp_2 = Organization(
        org_id="org_tsp_2",
        wallet_address=TSP_2_WALLET,
        name="PulseBudget AI",
        role="TSP",
        status="PENDING",
        license_id="TSP-PLS-902",
        registered_at=now_iso
    )
    regulator = Organization(
        org_id="org_regulator",
        wallet_address=REGULATOR_WALLET,
        name="Federal Open Banking Authority (FOBA)",
        role="REGULATOR",
        status="APPROVED",
        license_id="REG-FED-000",
        registered_at=now_iso
    )

    db.organizations[BANK_A_WALLET] = bank_a
    db.organizations[BANK_B_WALLET] = bank_b
    db.organizations[BANK_C_WALLET] = bank_c
    db.organizations[TSP_1_WALLET] = tsp_1
    db.organizations[TSP_2_WALLET] = tsp_2
    db.organizations[REGULATOR_WALLET] = regulator

    # 3. Seed Bank A Accounts & Transactions
    acc_a1 = BankAccount(
        account_id="acc_banka_101",
        bank_id="BANK_A",
        bank_name="Bank A (Apex Financial)",
        user_wallet=USER1_WALLET,
        account_number="1000-8899-4411",
        account_type="CHECKING",
        balance=14250.75,
        currency="USD"
    )
    db.accounts[acc_a1.account_id] = acc_a1
    db.transactions[acc_a1.account_id] = [
        BankTransaction(
            transaction_id="tx_a1_01",
            account_id=acc_a1.account_id,
            amount=2500.00,
            transaction_type="CREDIT",
            counterparty="Tech Corp Direct Deposit",
            description="Payroll Direct Deposit",
            timestamp="2026-08-25T09:00:00Z"
        ),
        BankTransaction(
            transaction_id="tx_a1_02",
            account_id=acc_a1.account_id,
            amount=45.20,
            transaction_type="DEBIT",
            counterparty="Organic Grocery Market",
            description="POS Purchase",
            timestamp="2026-08-27T14:30:00Z"
        ),
        BankTransaction(
            transaction_id="tx_a1_03",
            account_id=acc_a1.account_id,
            amount=120.00,
            transaction_type="DEBIT",
            counterparty="Clean Energy Utility",
            description="Monthly Electric Bill",
            timestamp="2026-08-28T10:15:00Z"
        )
    ]

    # 4. Seed Bank B Accounts & Transactions
    acc_b1 = BankAccount(
        account_id="acc_bankb_202",
        bank_id="BANK_B",
        bank_name="Bank B (Beacon Trust)",
        user_wallet=USER1_WALLET,
        account_number="2000-5511-9988",
        account_type="SAVINGS",
        balance=48900.50,
        currency="USD"
    )
    db.accounts[acc_b1.account_id] = acc_b1
    db.transactions[acc_b1.account_id] = [
        BankTransaction(
            transaction_id="tx_b1_01",
            account_id=acc_b1.account_id,
            amount=5000.00,
            transaction_type="CREDIT",
            counterparty="High Yield Savings Dividend",
            description="Quarterly Dividend Interest",
            timestamp="2026-08-01T00:00:00Z"
        )
    ]

    # 5. Seed Bank C Accounts & Transactions
    acc_c1 = BankAccount(
        account_id="acc_bankc_303",
        bank_id="BANK_C",
        bank_name="Bank C (Crest Capital)",
        user_wallet=USER1_WALLET,
        account_number="3000-1122-3344",
        account_type="INVESTMENT",
        balance=85300.00,
        currency="USD"
    )
    db.accounts[acc_c1.account_id] = acc_c1
    db.transactions[acc_c1.account_id] = [
        BankTransaction(
            transaction_id="tx_c1_01",
            account_id=acc_c1.account_id,
            amount=1200.00,
            transaction_type="CREDIT",
            counterparty="S&P 500 Index Fund",
            description="Reinvested Capital Gain",
            timestamp="2026-08-15T16:00:00Z"
        )
    ]

# Seed immediately on import
seed_database()
