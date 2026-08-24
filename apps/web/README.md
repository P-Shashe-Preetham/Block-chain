# Evidence Ledger Console

This is the repository-native Vite/React/TypeScript implementation selected by [ADR 0009](../../docs/ADR/0009-react-vite-web-console-boundary.md). It is written project-owned from the final-project data dictionary and acceptance scenarios; the separate Manus Evidence Ledger checkpoint is a first-party visual prototype, not imported code or a runtime dependency.

## Authority boundary

The console fetches only the bounded `GET /v1/audit` projection when `VITE_API_BASE_URL` is configured. It stores no token/secret in browser persistence and contains no signer, wallet, key-release, or chain-submission code. If the base URL, authentication provider, or API response contract is unavailable, the UI reports the state rather than presenting illustrative data as chain evidence.

## Local commands

| Command | Purpose |
|---|---|
| `pnpm --filter @blockchain-secure-platform/web-console dev` | Starts the console at port 3000 to match the local API CORS default. |
| `pnpm --filter @blockchain-secure-platform/web-console check` | Runs strict TypeScript checking. |
| `pnpm --filter @blockchain-secure-platform/web-console test` | Runs boundary/schema unit tests. |
| `pnpm --filter @blockchain-secure-platform/web-console build` | Produces a static production build. |

`VITE_API_BASE_URL` is a public browser configuration value, never a location for an access token or secret. Real authentication, approved API origin, independent verifier, accessibility automation, browser E2E, i18n, and deployment configuration remain release-gated work.
