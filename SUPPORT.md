# Support

Use the channel that matches the nature and sensitivity of the request. The project is an MVP and support responses are not a substitute for an organization's security, privacy, legal, or operational review.

| Need | Use | Do not use |
|---|---|---|
| Reproducible defect | GitHub issue with the bug form | Public issue for a suspected vulnerability or secret |
| Proposed capability | GitHub issue with the feature form | A pull request that introduces an unscoped feature without discussion |
| Architecture or policy question | GitHub Discussions or an RFC | A security report in a public thread |
| Deployment or local setup help | Discussions, then a focused issue if a defect is confirmed | Sharing credentials or private keys for diagnosis |
| Private vulnerability | `security@example.com` as described in [`SECURITY.md`](SECURITY.md) | Issues, Discussions, chat, or social media |
| Conduct concern | `conduct@example.com` as described in [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Public debate about a report |
| Community chat | `https://discord.example.com` after an official server is approved | Treating informal chat as the canonical record |

The email addresses and Discord URL in this document are placeholders. Replace them with official, monitored channels before public launch.

## Before asking for help

Search existing issues and discussions, read the README and architecture documents, and confirm the commit or release version. Include the operating system, runtime versions, exact command, expected result, actual result, relevant sanitized logs, and whether the problem affects local development, a testnet, or a production deployment.

Never share seed phrases, private keys, access tokens, passwords, real identity records, unredacted wallet addresses when sensitive, or data that an organization has not approved for public disclosure. Redact logs before posting them.

## Support expectations

Maintainers and community members may help reproduce a problem, explain a documented behavior, or suggest a safe diagnostic step. There is no guarantee of response time for general questions while the project remains an MVP. High-impact security matters should use the private reporting process rather than waiting for community support.

If a question reveals an ambiguity in the architecture, convert the final decision into an issue, RFC, ADR, or documentation update so future contributors can find the answer. Support conversations should not become an undocumented source of authorization or deployment policy.
