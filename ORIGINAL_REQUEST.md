# Original User Request

## 2026-09-06T03:34:22Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Requested team: [none — teamwork routes from the description]

Transform the SIH26125 blockchain-based secure platform from a hackathon prototype into a mass-production-ready system via a full rewrite of components, strictly adhering to the "Ponytail" philosophy (minimalist, YAGNI, ruthless deletion of over-engineered bloat).

Working directory: c:\Users\speed\Documents\antigravity\gallant-pythagoras
Integrity mode: development

## Requirements

### R1. Ruthless Bloat Deletion (Ponytail Audit)
Conduct a massive sweep to delete dead code, unused hackathon scaffolding, and speculative abstractions. If a feature isn't strictly required for Identity, Access Control, or Asset Passports, remove it. Favor standard libraries over heavy external dependencies. 

### R2. Production-Grade Smart Contracts & Backend
Rewrite and harden the Solidity contracts and FastAPI backend for production. Optimize for minimum gas usage on the EVM and maximum concurrency/simplicity on the backend. Ensure proper error handling, logging, and security best practices without adding architectural bloat.

### R3. Lean Frontend Architecture
Refactor the React/Vite frontend to be minimal and highly performant. Strip out unnecessary UI libraries, complex state management, or heavy assets. The build must be lean and robust.

## Acceptance Criteria

### Correctness & Health
- [ ] `docker compose up --build` boots the entire stack without errors.
- [ ] `npx hardhat test` (or equivalent) passes all remaining core tests with zero failures.
- [ ] `pnpm run build` succeeds in the frontend with zero TypeScript or ESLint errors.

### Ponytail Metrics
- [ ] The overall codebase line count is significantly reduced compared to the hackathon prototype.
- [ ] Smart contract deployment gas costs are lower due to removed bloat and optimized logic.
- [ ] The `package.json` and `requirements.txt` dependency lists are smaller (fewer external libraries).
