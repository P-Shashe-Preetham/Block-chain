# Staging Authorization and Evidence Runbook

## Purpose and boundary

This runbook is the provider-neutral procedure for creating an isolated, **synthetic-data-only** staging environment after the accountable authorities approve Packets A–D in [Production Decision Packets](../PRODUCTION-DECISION-PACKETS.md). It is a template and execution checklist, not an approval, provider selection, deployment manifest, testnet authorization, or production release authorization.

> No deployer credential, wallet, identity record, real asset, production secret, or production customer data may be introduced while this document remains only a repository template.

The procedure maintains the project’s fail-closed boundary: an unavailable or unapproved identity, RPC, storage, key-management, database, or worker dependency must leave protected state unavailable rather than silently permit access or claim a healthy service.

## Entry authorization record

The following record must be completed by accountable human roles before any staging account, resource, secret, or network configuration is created. A blank cell, an unverified assertion, or a source-control commit is not authorization.

| Required record | Accountable role | Approved evidence location | Outcome | Date and approver |
|---|---|---|---|---|
| Hosting account, region, and topology | Platform owner |  |  |  |
| Synthetic-data classification and prohibition on real data | Data/privacy owner |  |  |  |
| Identity profile and test issuer/trust configuration | Identity and security owners |  |  |  |
| Chain/network and custody policy, if chain access is requested | Chain and custody owners |  |  |  |
| KMS/HSM, object storage, residency, and recovery policy | Security and data owners |  |  |  |
| Managed PostgreSQL TLS, backup, RPO/RTO, and restore ownership | Platform and data owners |  |  |  |
| SLOs, alert routing, incident escalation, and change window | Operations owner |  |  |  |
| Staging go/no-go authority and rollback authority | Release owner |  |  |  |

## Controlled environment contract

The selected implementation must be recorded in an ADR before infrastructure-as-code or environment-specific application configuration is added. The evidence must prove that immutable image provenance, secret injection, constrained ingress and egress, database TLS, network isolation, and least privilege meet the approved design. Passwords, private keys, recovery material, tenancy data, provider tokens, wallet addresses under custody, and connection strings must not be committed to this repository.

| Control area | Required staging property | Evidence to retain | Failure outcome to prove |
|---|---|---|---|
| Workload artifacts | Reproducible image build with immutable digest and SBOM/provenance retained. | Build record, image digest, SBOM, vulnerability scan. | Unapproved or mutable artifact cannot be deployed. |
| Secrets | Approved secret manager injects runtime values; no plaintext secret is logged or baked into an image. | Redacted deployment configuration and secret-scan result. | Missing/unreadable secret leaves affected protected route unavailable. |
| Network | TLS ingress, explicit egress policy, private database path, and documented service identities. | Reviewed topology and connectivity test. | A forbidden path is denied; database is not publicly reachable. |
| Database | Managed PostgreSQL with TLS, migration job, backup policy, and approved RPO/RTO targets. | Migration output, encrypted backup metadata, restore/reconcile drill. | Failed migration or unavailable database returns non-ready status without data corruption. |
| Identity | Approved synthetic issuer/profile only; validated audience, expiry, signature, tenant, and revocation semantics. | Sanitized negative-test report. | Invalid, expired, revoked, cross-tenant, or unavailable identity input fails closed. |
| RPC/indexer | Approved synthetic-network settings only, finality/reorg threshold, and reconciliation bounds. | Sanitized health, reorg, and reconciliation evidence. | Unapproved RPC or uncertainty state cannot become canonical. |
| Storage/KMS | Approved synthetic object/key boundary with classification and recovery plan. | Synthetic upload/failure-drill record. | KMS/storage/classification failure does not expose plaintext or authorize release. |
| Observability | Redacted structured logs, metrics, traces, dashboards, synthetic probes, and alert routing. | Dashboard/alert test references and redaction review. | Dependency failure creates a visible alert without sensitive payloads. |

## Execution sequence

The release owner should establish a short-lived staging change record that links the completed entry authorization, ADR, threat-model delta, change set, and rollback plan. The infrastructure implementation must use the approved provider/account/region and should make no attempt to infer those selections from developer defaults or local Compose configuration.

First, build the exact revision through the approved pipeline and record its commit, immutable artifact digest, dependency/SBOM evidence, and vulnerability result. Next, create only the approved isolated staging resources and inject approved synthetic configuration through the designated secret manager. Run the schema migration as a separately observable job, preserving its sanitized output and refusing application readiness when the expected schema is unavailable.

Then execute the application health, readiness, authorization-denial, direct-RPC verifier, indexer-reconciliation, storage/KMS-denial, browser accessibility, and synthetic observability checks. The console remains non-authoritative: it must not sign transactions, retain custody material, make authorization decisions, or present an audit projection as canonical chain evidence. Finally, run the agreed backup, restore, replay/reconciliation, rollback, and alert-routing drills before any request for testnet authorization.

## Evidence register

Use one row per execution. Store only sanitized paths or immutable record identifiers; never paste secrets, tokens, personal data, raw private logs, or custody material into this document.

| Exercise | Required result | Evidence locator | Observed duration | Pass/fail | Reviewer role and date |
|---|---|---|---|---|---|
| Reproducible build and artifact provenance | Exact commit maps to immutable image/SBOM. |  |  |  |  |
| Migration and readiness | Migration succeeds; `/healthz` and fail-closed `/readyz` behavior are recorded. |  |  |  |  |
| Authentication outage and invalid-input denial | Protected API path denies access without a configured/valid identity. |  |  |  |  |
| Database outage and recovery | Readiness fails; recovery preserves approved synthetic state. |  |  |  |  |
| RPC uncertainty/reorg/reconciliation | Uncertain data is not presented as canonical; reconciler finding is retained. |  |  |  |  |
| KMS/storage denial | No plaintext or key-release decision is exposed. |  |  |  |  |
| Direct verifier walkthrough | Verifier validates only approved synthetic contract inputs and detects a mismatch. |  |  |  |  |
| Backup, restore, and reconciliation | Restore and reconciliation meet the approved RPO/RTO. |  |  |  |  |
| Rollback | The prior immutable artifact is restored under the approved rollback authority. |  |  |  |  |
| Load, capacity, and alert routing | Approved synthetic load threshold, dashboard, alert, and escalation tests pass. |  |  |  |  |
| Manual accessibility review | Named reviewer completes keyboard, zoom, screen-reader, and cross-browser checks. |  |  |  |  |

## Stop conditions and escalation

Stop the staging exercise and notify the designated security, operations, and release authorities if a secret appears in source, image, CI log, browser storage, trace, or evidence artifact; if any identity, tenant, authorization, custody, key-release, or canonicality boundary fails open; if real data or asset material is proposed; if an approval is missing or contradictory; or if backup/restore/reconciliation outcomes cannot be reconciled with the approved RPO/RTO. Do not substitute a local Compose result for staging evidence: the current sandbox cannot establish the required Docker bridge network, so Compose runtime health must be captured on the approved Docker-capable staging host.

## Exit criteria

Staging may be submitted for testnet authorization only after the entry record is complete, all required evidence rows pass, an independent non-author reviewer has reviewed the staging configuration and findings, and the accountable release authority records a go/no-go decision. The result authorizes neither a real-network deployment nor a pilot or production release; those remain governed by Packets A–E and the final release gate.

## References

[1] [NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

[2] [NIST SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems](https://csrc.nist.gov/pubs/sp/800/34/r1/final)
