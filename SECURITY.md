# Security Policy

Security is a first-class concern because this project handles identity references, authorization decisions, cryptographic proofs, and digital-asset ownership. The repository is an MVP reference implementation and has **not** been represented as independently audited or production-ready.

## Supported versions

Only the latest release line and the default branch receive active security fixes while the project is in prototype/MVP stage. Support status will be updated when a formal release and maintenance policy are adopted.

| Version | Supported | Notes |
|---|---|---|
| `0.1.x` | Yes | MVP documentation and implementation baseline; security fixes may be breaking |
| `< 0.1.0` | No | Historical or pre-release material; upgrade to the latest version |
| Unreleased default branch | Best effort | May contain incomplete or experimental behavior |

A supported version does not imply that a deployment is safe for production. Operators must evaluate the deployed contract addresses, compiler settings, chain configuration, keys, infrastructure, and data-handling controls independently.

## Reporting a vulnerability

**Do not report security vulnerabilities through public GitHub issues, discussions, pull requests, chat, or social media.** Submit a private report to **security@example.com**. This address is a placeholder and must be replaced with an approved, monitored security channel before public launch.

The report should include:

- A concise description of the vulnerability and the affected component.
- The affected version, commit, contract address, network, API route, or deployment context.
- Reproduction steps or a minimal proof of concept that does not destroy data or funds.
- The potential impact, including whether identity data, privileged roles, assets, keys, or availability are affected.
- Any suggested mitigation and whether the issue is already known to others.
- A safe contact method and whether you request coordinated disclosure.

Do not send real personal data, private keys, seed phrases, exploit payloads that could harm a live system, or credentials. If the issue involves a live deployment or suspected key compromise, state that immediately so the response can prioritize containment.

## Response process

The maintainers will acknowledge a report within five business days, triage its severity and affected versions, and provide a status update when material progress is available. Timelines may change when the report requires coordination with a chain operator, dependency maintainer, hosting provider, or affected organization.

The response process normally includes validation, impact analysis, containment guidance, patch development, regression testing, coordinated release, and a public advisory or changelog entry when disclosure is safe. Reporter credit is provided only with permission. The project will not request payment, credentials, or remote access as a condition of triage.

## Severity guidance

Severity is contextual and will consider exploitability, required privileges, affected assets, privacy impact, scope, detectability, and whether a live deployment is affected. Examples include:

| Severity | Example impact | Expected response |
|---|---|---|
| Critical | Unauthorized minting, role escalation to administrator, private-key exposure, or theft/freeze of live assets | Immediate containment and coordinated emergency release |
| High | Bypass of authorization, forged ownership result, replayable allocation, or exposure of sensitive identity data | Priority patch and release coordination |
| Medium | Limited integrity or availability impact requiring a constrained account or workflow | Fix in the next security release when feasible |
| Low | Defense-in-depth issue, hardening opportunity, or low-impact information disclosure | Track and address through normal maintenance |

## Security boundaries for contributors

Never commit secrets or real identity data. Use deterministic test fixtures that do not resemble real credentials. Do not place private keys in `.env.example`, CI logs, screenshots, or documentation. Pull requests affecting contracts, authentication, role assignment, asset transfer, indexing, or data retention require focused security review.

Smart-contract changes should include tests for unauthorized callers, duplicate operations, malformed inputs, event correctness, reentrancy where relevant, pause or emergency behavior, and upgradeability assumptions. Off-chain services should enforce authentication and authorization independently rather than trusting client-provided roles.

## Disclosure and credits

The project follows coordinated disclosure where practical. A security advisory should state affected versions, impact, remediation, and whether deployed systems require an operator action. Do not publish an exploit or sensitive details until maintainers and affected operators have had a reasonable opportunity to mitigate.

## MVP contract controls and limitations

The MVP contract enforces identity activity at the ownership-change boundary, disables standard ERC-721 approval paths, and requires the manager role for transfers. NFT ownership is separate from access permission: `requestAccess` records a committed `AccessDecision` with `GRANTED` or `DENIED` rather than attempting to log a reverted transaction. Duplicate organizational asset IDs are rejected, identity registration cannot silently overwrite an existing record, and `replaceIdentityKey` suspends the old identity after an approved recovery decision.

The architecture requires encryption of sensitive payloads before IPFS or object-storage use. IPFS and a CID do not provide confidentiality, deletion, or key recovery automatically. The current repository does not claim an implemented enterprise KMS/HSM, multisignature custody, IPFS pinning service, API/indexer, client DLP, or independent smart-contract audit. Once an authorized user decrypts data, blockchain authorization cannot guarantee that the user will not copy or redistribute it.

## Related guidance

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for review expectations and [`ARCHITECTURE.md`](ARCHITECTURE.md) for trust boundaries. General GitHub repository security-hardening guidance is available from GitHub.[1]

## References

[1]: https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository "GitHub: Adding a security policy to your repository"
