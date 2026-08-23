# Final Project Architecture Diagrams

> These Mermaid diagrams are **design and evidence artifacts**, not network approval, deployment evidence, a privacy determination, or a production architecture claim. The canonical authority, data placement, and external gates are defined by the [data dictionary](FINAL-PROJECT-DATA-DICTIONARY.md), [decision register](FINAL-PROJECT-DECISION-REGISTER.md), and [ADR 0007](ADR/0007-canonical-event-and-projection-schema.md).

## Authority and data-flow boundary

```mermaid
flowchart LR
    subgraph Client[Future repository-native Vite/React console]
        UI[Evidence and intent UI]
        Verify[Independent verifier journey]
    end

    subgraph API[FastAPI boundary]
        Auth[Fail-closed identity verifier boundary]
        Audit[Sanitized audit read]
        Intent[Intent record only]
    end

    subgraph Chain[Approved chain only after external decision]
        Contract[SecureAssetPlatform canonical state]
        Logs[Canonical event logs]
    end

    subgraph Derived[Recoverable derived evidence]
        Scanner[Read-only strict ABI scanner]
        Raw[Raw chain logs]
        Projection[Canonical-event projection]
        Drift[Reconciliation findings]
    end

    subgraph Storage[Future storage/KMS boundary]
        Classify[Declared classification gate]
        Envelope[AES-GCM reference envelope]
        Policy[Non-secret key-release policy]
        KMS[Approved KMS/HSM - external gate]
    end

    UI -->|bounded API request| Auth
    Auth --> Audit
    Auth --> Intent
    Audit -->|redacted projection only| Projection
    Intent -->|no signer / no submission| Derived
    Scanner -->|validated reads| Logs
    Logs --> Scanner
    Scanner --> Raw
    Scanner --> Projection
    Projection --> Drift
    Contract --> Logs
    Verify -. independently reads configured chain/ABI .-> Contract
    UI -. never authoritative .-> Contract
    Classify --> Envelope --> Policy
    Policy -. non-secret authorization metadata only .-> KMS
```

## Canonical-event recovery and uncertainty treatment

```mermaid
flowchart TD
    Start[Configured scan range] --> Rpc[Read-only JSON-RPC block/log query]
    Rpc --> Validate{Address, topic, ABI words valid?}
    Validate -- no --> Rollback[Abort transaction; persist no partial derived writes]
    Validate -- yes --> Raw[Append raw-log evidence]
    Raw --> Decode[Strict ABI decode]
    Decode --> Event[Versioned event key]
    Event --> Persist[Persist derived event + checkpoint]
    Persist --> Confirm{At configured confirmation boundary?}
    Confirm -- no --> Unfinalized[Status: unfinalized]
    Confirm -- yes --> Canonical[Status: canonical]
    Reorg[Reorg/replay detected] --> Uncertain[Mark affected derived history uncertain]
    Uncertain --> Replay[Replay eligible range]
    Replay --> Rpc
    Canonical --> Reconcile[Compare read model to canonical reads]
    Reconcile --> Finding[Persist open finding only; never auto-repair]
```

## Intent, chain outcome, and key-release non-authority boundaries

```mermaid
sequenceDiagram
    participant Caller as Verified caller (future)
    participant API as FastAPI
    participant DB as Intent/projection store
    participant Chain as Canonical contract
    participant KMS as Future approved KMS/HSM

    Caller->>API: POST typed intent + Idempotency-Key
    API->>DB: create-or-get requested intent
    API-->>Caller: intent metadata, on_chain_submission=false
    Note over API,Chain: Current implementation stops here: no signature or chain submission.
    Chain-->>DB: Future read-only indexed event path
    DB-->>API: Sanitized projection only
    API-->>Caller: bounded audit evidence
    Caller->>API: Future content/key-release request
    API-->>KMS: Future non-secret authorization metadata only
    Note over KMS: Requires approved identity, canonical evidence, IAM, and custody; no key traverses API/browser.
```

## Source and change-control path

```mermaid
flowchart LR
    Source[Supplied source] --> Ledger[96-source reference ledger]
    Ledger --> Classify[Runtime pattern / comparison / test / training / non-adoption]
    Classify --> ADR[ADR or decision register]
    ADR --> Implementation[Project-owned implementation]
    Implementation --> Tests[Tests and static/security checks]
    Tests --> Migration[Migration note if schema/contract/API/storage/env changes]
    Migration --> Release[Local final release gate]
    Release --> Push[One controlled push]
    Push --> Remote[Protected remote checks]
    Remote --> Review[Legitimate non-author review]
    Review --> Merge[Merge only if all gates are satisfied]
```

The source and change-control diagram does not imply that all upstream repositories are dependencies. Their approved use modes remain traceable in `docs/reference-ledger.md` and [ADR 0008](ADR/0008-reference-adoption-and-optional-integration-gates.md).
