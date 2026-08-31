"""PyTeal Smart Contracts for Algorand Secure Platform (DID, RBAC, Asset Vault)."""

from __future__ import annotations

from pyteal import (
    And,
    App,
    Approve,
    Assert,
    BoxPut,
    BoxGet,
    Bytes,
    Btoi,
    Concat,
    Cond,
    Global,
    Int,
    Itob,
    Log,
    Mode,
    OnComplete,
    Or,
    Reject,
    Return,
    Seq,
    Txn,
    TxnType,
    compileTeal,
)


def identity_registry_contract():
    """Smart contract for DID Identity registration and Rekeying references using AVM Box Storage."""
    on_create = Seq(
        App.globalPut(Bytes("creator"), Txn.sender()),
        App.globalPut(Bytes("identities_count"), Int(0)),
        Approve(),
    )

    is_admin = Txn.sender() == App.globalGet(Bytes("creator"))

    register_did = Seq(
        Assert(is_admin),
        Assert(Txn.application_args.length() == Int(3)),  # ["register", subject_did, public_key]
        BoxPut(Concat(Bytes("did:"), Txn.application_args[1]), Txn.application_args[2]),
        App.globalPut(Bytes("identities_count"), App.globalGet(Bytes("identities_count")) + Int(1)),
        Log(Concat(Bytes("DID_REGISTERED:"), Txn.application_args[1])),
        Approve(),
    )

    rekey_did = Seq(
        Assert(is_admin),
        Assert(Txn.application_args.length() == Int(3)),  # ["rekey", subject_did, new_public_key]
        BoxPut(Concat(Bytes("did:"), Txn.application_args[1]), Txn.application_args[2]),
        Log(Concat(Bytes("DID_REKEYED:"), Txn.application_args[1])),
        Approve(),
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_admin)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_admin)],
        [Txn.application_args.length() == Int(0), Reject()],
        [Txn.application_args[0] == Bytes("register"), register_did],
        [Txn.application_args[0] == Bytes("rekey"), rekey_did],
    )
    return program


def rbac_contract():
    """Smart contract for Role-Based Access Control (RBAC)."""
    on_create = Seq(
        App.globalPut(Bytes("admin"), Txn.sender()),
        Approve(),
    )

    is_admin = Txn.sender() == App.globalGet(Bytes("admin"))

    # Roles: 1 = USER, 2 = MANAGER, 3 = AUDITOR, 4 = ADMIN
    assign_role = Seq(
        Assert(is_admin),
        Assert(Txn.application_args.length() == Int(3)),  # ["assign_role", account_address, role_int_bytes]
        App.localPut(Txn.accounts[1], Bytes("role"), Btoi(Txn.application_args[2])),
        Log(Concat(Bytes("ROLE_ASSIGNED:"), Txn.application_args[1])),
        Approve(),
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.application_args.length() == Int(0), Reject()],
        [Txn.application_args[0] == Bytes("assign_role"), assign_role],
    )
    return program


def asset_vault_contract():
    """Smart contract for ASA Asset evaluation and Access Decisions."""
    on_create = Seq(
        App.globalPut(Bytes("owner"), Txn.sender()),
        App.globalPut(Bytes("paused"), Int(0)),
        Approve(),
    )

    is_owner = Txn.sender() == App.globalGet(Bytes("owner"))

    evaluate_access = Seq(
        Assert(App.globalGet(Bytes("paused")) == Int(0)),
        Assert(Txn.application_args.length() == Int(3)),  # ["request_access", asset_id, action_type]
        # Caller verification: caller must be owner or creator
        Assert(Or(is_owner, Txn.sender() == Global.creator_address())),
        # Log explicit access decision
        Log(Concat(Bytes("ACCESS_DECISION:GRANTED:ASSET:"), Txn.application_args[1])),
        Approve(),
    )

    pause = Seq(
        Assert(is_owner),
        App.globalPut(Bytes("paused"), Int(1)),
        Log(Bytes("PLATFORM_PAUSED")),
        Approve(),
    )

    unpause = Seq(
        Assert(is_owner),
        App.globalPut(Bytes("paused"), Int(0)),
        Log(Bytes("PLATFORM_UNPAUSED")),
        Approve(),
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.application_args.length() == Int(0), Reject()],
        [Txn.application_args[0] == Bytes("request_access"), evaluate_access],
        [Txn.application_args[0] == Bytes("pause"), pause],
        [Txn.application_args[0] == Bytes("unpause"), unpause],
    )
    return program


def compile_contracts():
    """Compile PyTeal contracts to TEAL source strings."""
    return {
        "identity_approval": compileTeal(identity_registry_contract(), Mode.Application, version=8),
        "rbac_approval": compileTeal(rbac_contract(), Mode.Application, version=8),
        "asset_vault_approval": compileTeal(asset_vault_contract(), Mode.Application, version=8),
    }


if __name__ == "__main__":
    compiled = compile_contracts()
    print("PyTeal compilation successful!")
    print("Identity TEAL length:", len(compiled["identity_approval"]))