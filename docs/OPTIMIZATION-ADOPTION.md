# Optimization Adoption Record

## Purpose

This record applies the user-requested Ponytail repository as a **process reference**, not a runtime dependency, plugin, submodule, copied ruleset, or production service. Its reference-ledger row remains `process-reference` with the existing owner-led review status. The project retains its own architecture, controls, tests, and documentation.

## Reviewed reference snapshot

| Field | Evidence |
|---|---|
| Source | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) |
| Snapshot inspected | `2ed6c52c9d7e5e56942508591085fd45dea277d3` on the upstream `main` branch |
| License reported by upstream metadata | MIT |
| Applicable pattern | Read the real flow first; prefer no change, existing code, standard platform capability, or installed dependency before adding custom code; never remove validation, security, error handling, or accessibility. |
| Non-adoption | No Ponytail code, hooks, plugins, instructions, lifecycle automation, dependencies, submodules, or agent authority were added. |

## Applied optimization

The Evidence Ledger had exactly one bounded, fail-closed audit read. The `@tanstack/react-query` runtime dependency and provider were removed in favor of a small project-owned React effect with cancellation, explicit loading/error state, filtered refresh, request credential omission inherited from the existing API client, and the same unavailable-state behavior. This is appropriate because the console is a static read-only demonstration, has one audit request, and does not need cache invalidation, mutation, retry orchestration, authentication state, or cross-route query sharing.

The optimization was checked against the project’s safety boundaries: it did not add a signer, browser secret storage, automatic retry, authentication bypass, mock chain data, or change to canonical authority. Existing web unit tests, browser E2E, axe checks, strict TypeScript, and static build remain required.

The repository also enforces a project-owned production bundle budget after each web build. The gate limits JavaScript to 450 KiB raw and 128 KiB gzip-compressed, and CSS to 16 KiB raw. It is intentionally a lightweight regression guard rather than a claim that a byte-count alone represents browser performance, accessibility, security, or production capacity.

## Measured result

| Measurement | Before | After | Change |
|---|---:|---:|---:|
| Web source lines | 347 | Project-owned lifecycle remains within the same bounded console surface | No completeness claim from line count alone. |
| Production JavaScript asset | 457,049 bytes | 416,243 bytes | 40,806 bytes smaller; 8.92% reduction. |
| Reported gzip JavaScript asset | 133.14 KiB | 120.46 KiB | 12.68 KiB smaller; 9.52% reduction. |
| Security/accessibility behavior | Existing fail-closed unit/E2E/axe evidence | Re-run after change | Preserved; see validation evidence in the corresponding change commit. |

## Reusable optimization rule

Before adding or retaining a dependency or abstraction, the project must demonstrate the requirement cannot safely be met by existing project code, a standard platform capability, or a smaller project-owned pattern. This rule never authorizes removal of security, validation, accessibility, deterministic testing, failure handling, provenance, or evidence controls. Any future removal must retain or improve equivalent behavior and be measured with the relevant build, test, and security gates.

## Boundaries

This optimization affects only the static Evidence Ledger bundle. It does not change the canonical contract, FastAPI/SQLAlchemy/PostgreSQL architecture, durable indexer, storage/key boundaries, queue decisions, identity integration, deployment policy, or production maturity label.
