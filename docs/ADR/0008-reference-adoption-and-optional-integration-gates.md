# ADR 0008: Reference adoption and optional integration gates

- **Status:** Accepted
- **Date:** 2026-08-23
- **Decision owners:** Maintainer, security lead, license/provenance reviewer, architecture lead, privacy/legal owner, and relevant feature owner
- **Review trigger:** Before adding any supplied repository as source code, package, container, submodule, service, hosted integration, agent instruction, scraper, or generated asset

## Context

The project must use the supplied references to their fullest while preserving MIT licensing, source provenance, canonical contract authority, and explicit security boundaries. The sources include permissively licensed projects, source-available projects, copyleft infrastructure, tools with possible terms-of-service concerns, agent skill collections, and comparison-only alternatives. A blanket integration approach would make the final project less secure and could violate license or service terms.

## Decision

Every source adoption follows this sequence:

1. Record the exact upstream URL, commit/tag, review date, license, notice, dependencies, security history, and terms-of-service implications.
2. State the concrete product problem and why a project-owned implementation or current dependency is insufficient.
3. Classify the source as runtime dependency, local test tool, project-owned pattern, comparison, future-gated extension, reference-only, or research-only.
4. Create or update an ADR, threat-model section, data-flow, license decision, and remediation-register item.
5. Add only the minimum required code/configuration, with exact dependency/image/provider pinning and no hidden network access.
6. Add success, rejection, outage, supply-chain, privacy, and rollback/removal tests appropriate to the source.
7. Update `THIRD-PARTY-NOTICES.md`, the reference ledger, dependency manifests, SBOM expectations, and documentation in the same pull request.
8. Obtain the required human review before merging; external approval cannot be fabricated by automation.

The original 15 curated repositories remain preserved in their existing catalog and integration matrix. Only OpenZeppelin is currently adopted as an original runtime dependency. The expanded 96-source ledger may contain process references, comparisons, project-owned patterns, local test targets, and future-gated tools without implying runtime integration.

Known high-attention boundaries include the following:

| Source/category | Required boundary |
|---|---|
| n8n | Source-available Sustainable Use terms, patching, isolation, and no authorization/key/deployment authority |
| MinIO | AGPLv3 compatibility review before distribution or hosted production use; local disposable testing may be separately approved |
| Fileverse | GPL-3.0 compatibility review before code/assets; architecture reference by default |
| Terraform | Explicit BSL/commercial-policy review; OpenTofu is the default open-source IaC comparison candidate |
| Agent-Reach | Public-research and terms-of-service review; no private data, authentication, or production decisions |
| Agent skills/MCP/design utilities | Review, pin, sandbox, read-only or human-mediated operation; no merge, signing, key-release, or privacy authority |
| AI/ML/analytics | No canonical authority, identity assurance, legal-title, access, or key-release decisions; sanitized data and human review only |
| Marketplace/auction/payments | Out of core scope unless business, legal, custody, fraud, and compliance decisions are approved |

## Consequences

The repository preserves every supplied reference while reducing unapproved supply-chain and license risk. The project will sometimes choose a project-owned pattern instead of integrating source code, and those decisions must be explained as deliberate architecture rather than incomplete use. The reference ledger and notices become release artifacts and require maintenance.

## Required evidence

A deeper adoption is incomplete until the pull request links the exact upstream revision, license/provenance assessment, security review, tests, dependency/source-tree audit, updated notice, threat-model change, rollback/removal path, and owner. If those artifacts are unavailable, the source remains reference-only or future-gated.

## References

[1]: ../reference-ledger.md "Complete supplied-source utilization ledger"
[2]: ../REFERENCE-INTEGRATION.md "Original 15-source integration matrix"
[3]: ../../THIRD-PARTY-NOTICES.md "Third-party notices and attribution boundaries"
[4]: ../../LICENSE "Project MIT license"
