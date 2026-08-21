# Governance

This document describes how the Blockchain Secure Platform makes technical, security, and community decisions while the project is in prototype/MVP stage. Governance is designed to keep decisions visible, reviewable, and reversible where practical without weakening emergency security response.

## Principles

The project favors evidence over authority, explicit trust boundaries over implied behavior, least privilege over convenience, and documented decisions over private consensus. A decision that affects identity assurance, authorization, ownership, privacy, or operational recovery must identify its affected stakeholders and security consequences.

Bharat Electronics Limited is the intended evaluation audience in the current project brief. This document does not assert that it owns, maintains, endorses, or operates the repository. Ownership and maintainer appointments must be recorded through an approved repository change.

## Roles

| Role | Responsibility | Minimum authority |
|---|---|---|
| Maintainer | Maintains repository health, reviews contributions, manages releases, and coordinates incidents | Merge approved changes and administer project process |
| Technical lead | Owns architecture coherence, ADR quality, and cross-component technical direction | Approve or request changes to architecture-impacting work |
| Security lead | Coordinates vulnerability triage, threat modeling, and security-sensitive reviews | Require mitigation or block unsafe security changes |
| Contract reviewer | Reviews Solidity, deployment scripts, permissions, events, and upgradeability | Approve contract-impacting changes with appropriate evidence |
| Community steward | Maintains Code of Conduct processes and contributor support | Coordinate respectful-community responses |
| Contributor | Proposes, implements, tests, and documents changes | No merge or production-deployment authority by default |
| Release manager | Prepares release notes, verifies artifacts, and communicates release status | Publish approved releases and rollback guidance |

A single person may temporarily hold multiple roles in an MVP, but production operations should separate proposal, review, approval, and deployment of privileged contract changes.

## Decision classes

Routine documentation, tests, and isolated bug fixes may be approved by one maintainer after review. Changes to public APIs, dependency policy, CI permissions, or deployment configuration require a maintainer and a relevant domain reviewer. Changes to smart-contract authorization, identity verification, ownership transfer, data retention, key management, upgradeability, or production network configuration require an RFC or an explicit security/architecture review record.

Emergency security actions may be taken by the maintainer and security lead without waiting for the ordinary RFC timeline. The action, rationale, affected versions, and follow-up decision must be documented after containment.

## RFC workflow

### Proposal

Open a GitHub Discussion or issue titled `RFC: <short decision name>` and include the problem, goals, non-goals, proposed design, alternatives, trust boundaries, data flow, threat considerations, migration plan, operational impact, test strategy, and open questions. Link any relevant issue, incident, or ADR.

### Review

Allow a review period appropriate to the impact. Routine architectural proposals should receive at least five business days of public review when practical. Security-sensitive proposals should include the security lead and avoid publishing exploitable details before mitigation. Contract interface changes should include executable tests or a clear test plan.

### Decision

The technical lead records the decision, dissenting views, assumptions, and follow-up work in an ADR. Maintainers may approve a proposal when the required domain reviewers have responded and unresolved risks are either accepted by an accountable owner or converted into blocking work.

### Implementation and verification

Merge implementation in focused pull requests linked to the RFC and ADR. The pull request must identify compatibility, migration, deployment, monitoring, rollback, and documentation steps. Close the RFC only after the decision is implemented or explicitly declined.

### Reconsideration

Reopen a decision when new evidence changes its assumptions, a security issue is discovered, the chosen dependency becomes unsupported, operational cost becomes material, or the project enters a new lifecycle stage. Amend the existing ADR or write a superseding ADR; do not silently rewrite history.

## Pull-request and release authority

The default branch should be protected with required reviews and passing CI once implementation begins. No pull request should self-approve a privileged contract deployment, modify security workflows without review, or bypass required checks. Release artifacts must identify the commit, contract addresses and network where applicable, compiler/tool versions, migration notes, and known limitations.

Semantic versioning is the default vocabulary for releases, but contract deployments may require a separate deployment version and migration policy. A version tag must never imply that a deployed contract is upgradeable, audited, or backward-compatible unless the release notes state the evidence.

## Conflict of interest and conduct

Contributors should disclose material conflicts of interest when they could affect a decision. Governance disagreements must remain professional and follow the [Code of Conduct](CODE_OF_CONDUCT.md). A maintainer with a conflict should request an independent review where available.

## Transparency

Decisions should be recorded in public repository artifacts unless disclosure would create a security, privacy, legal, or operational risk. Private security decisions should be summarized publicly once safe. Meeting notes, release decisions, and risk acceptances should identify owners and expiration or review dates.

## Review cadence

The maintainer group should review this document at each major release and at least every six months while the project is active. The review should verify that roles, support channels, security contacts, release authority, and production assumptions remain accurate.
