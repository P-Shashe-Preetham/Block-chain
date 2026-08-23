# ADR 0009: React/Vite web console boundary

- **Status:** Accepted for final-project client implementation
- **Date:** 2026-08-23
- **Decision owners:** Frontend/accessibility lead, backend lead, security lead, release owner
- **Review trigger:** Before introducing server-side rendering, browser wallet signing, a second backend, a mobile/desktop client, real identity data, or a public deployment

## Context

The final project needs an accessible evidence and transaction-intent console. A separate Evidence Ledger prototype already establishes the intended interaction model: ledger-derived evidence, explicit maturity boundaries, transaction-intent visibility, and no implied on-chain action. The target repository already uses FastAPI for its backend boundary and has no committed frontend runtime in `apps/web/`.

The supplied development defaults include both TypeScript full-stack scaffolds and a FastAPI-oriented full-stack reference. Adding a Next.js server or another TypeScript backend merely for client rendering would duplicate application authority and configuration without a demonstrated requirement.

## Decision

The project will implement `apps/web/` as a feature-oriented React/TypeScript Vite application that communicates with the versioned FastAPI API through a typed, redacted client boundary. The client will use project-owned accessible components, TanStack Query only when live API state/staleness requires it, React Hook Form and Zod for browser form validation, i18next for visible copy, and reduced-motion-safe UI transitions. The browser remains a presentation and intent layer.

The web client must never decide authorization, declare chain confirmation, generate/hold privileged secrets, store identity credentials or key material, or treat cached server state as canonical. It must visibly distinguish canonical, confirmed, unfinalized, uncertain, stale, unavailable, and approval-gated state. It must retain an independent verifier journey that does not trust browser cache or projection state.

## Consequences

The Evidence Ledger design can be migrated as source-owned React components without adding a second backend. FastAPI remains responsible for authentication, authorization, safe API contracts, and any future signer coordination. A future SSR, mobile, or desktop client needs a separate ADR proving a user-facing requirement, security analysis, accessibility plan, distribution policy, and compatibility with the canonical authority boundary.

## Required evidence

Before a final-project release, `apps/web/` must provide type-check/build evidence, API-contract tests, critical browser E2E tests, automated axe checks, keyboard and screen-reader review, localization checks, browser storage/secret inspection, responsive failure/stale/reorg states, and provenance for all components/assets.

## References

[1]: https://github.com/alan2207/bulletproof-react "Bulletproof React"
[2]: https://github.com/shadcn-ui/ui "shadcn/ui"
[3]: https://github.com/TanStack/query "TanStack Query"
[4]: https://github.com/react-hook-form/react-hook-form "React Hook Form"
[5]: https://github.com/colinhacks/zod "Zod"
[6]: https://github.com/i18next/i18next "i18next"
[7]: https://github.com/dequelabs/axe-core "axe-core"
