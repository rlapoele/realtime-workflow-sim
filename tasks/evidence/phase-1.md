# Phase 1 evidence: Compatible foundation and shared contracts

- Date: 2026-10-11
- Outcome: complete
- Scope completed: npm-workspaces foundation, pinned compatible toolchain, shared TypeScript contracts, NestJS health service, Astro/React server shell, environment validation, local scripts, tests, builds, browser smoke check, and owner-facing local commands.
- Implementation commit: `4832826 build: establish the shared application foundation`

## Automated verification

| Command | Result | Notes |
|---|---|---|
| `node --version && npm --version` | pass | Node `v24.14.1`; npm `11.17.0`, both satisfy the documented minimums. |
| `git branch --format='%(refname:short) %(objectname:short)'` | pass | Before implementation all three local branches were at `e78dd89`; after the implementation commit only `dev` advanced to `4832826`. |
| `git ls-remote --heads origin dev main releases` | pass | All three remote refs remained at bootstrap revision `e78dd89`; no Phase 1 push or promotion occurred. |
| `npm ci` | pass | Clean root install completed from the committed root lockfile with 462 packages. |
| `npm test` before implementation | expected failure | Both backend suites failed because the tested source modules did not yet exist, establishing the red test state. |
| `PUBLIC_API_URL=http://localhost:3000 npm run verify` | pass | Backend: 9 tests; frontend: 5 tests; both typechecks passed; both production builds passed. |
| `env -u PUBLIC_API_URL npm run build --workspace=frontend` | expected failure | Production configuration stopped with `PUBLIC_API_URL is required for production builds`. |
| `npx --yes shadcn@4.21.4 info` from `frontend/` | pass | Detected Astro, Tailwind v4, `base-nova`, and Base UI (`base`) with the configured aliases. No shadcn components were added in this phase. |
| `npm audit --audit-level=high` | pass | Reported zero vulnerabilities after the unused shadcn generator was removed from project dependencies. |
| Mutated backend upper-port guard, then `npm run test --workspace=backend -- --run tests/config.test.ts` | expected failure | The `PORT=65536` case failed, demonstrating that the boundary test detects the removed guard; the source was restored and the focused suite passed 8/8. |
| `npm run dev` | pass | Both attached development services stayed running on ports 3000 and 4321; `Ctrl+C` stopped both. |
| `npm start` | pass | Both built standalone services stayed running on ports 3000 and 4321. |
| `curl -i -sS -H 'Origin: http://localhost:4321' http://127.0.0.1:3000/health` | pass | Returned HTTP 200, the exact allowed CORS origin, and `{"service":"agentflow-backend","status":"ok"}`. |
| `curl -sS http://127.0.0.1:4321/` | pass | Returned the built shell containing `AgentFlow Live`, `Simulation`, and `Workflow executions`. |
| `git diff --check` | pass | No whitespace errors before the implementation commit. |
| Name and secret-pattern scans with `rg` | pass | No occurrence of the prohibited company name and no credential/private-key pattern were found outside ignored dependencies/build output. |

## Manual verification

- [x] Opened the built frontend at `http://localhost:4321` in Chromium through Playwright.
- [x] Confirmed the hydrated accessibility snapshot exposed banner, main region, level-one heading, simulation label, service-status heading, and `Backend available` status.
- [x] Confirmed the browser console had no errors or warnings after the favicon fix.
- [x] Reviewed a viewport screenshot: the minimal shell is readable, coherent, and contains no workflow catalogue or execution behavior from later phases.
- [x] Confirmed production processes stopped cleanly after the smoke check.

## Files and decisions

- Key files changed: root and workspace manifests, `package-lock.json`, `shared/types.ts`, `backend/src/`, `frontend/src/`, focused tests, environment examples, `README.md`, and ADR-003.
- Decisions recorded: [ADR-003](../../docs/decisions/0003-compatible-toolchain-and-build-boundaries.md) records the exact toolchain, TypeScript 6 compatibility choice, shared build boundary, Astro public environment rule, attached development lifecycle, and shadcn/Base UI with Heroicons policy.
- Code review: approved after aligning `@types/node` with the Node 22.12 minimum; correctness, readability, architecture, security, performance, dependency, lockfile, and verification checks had no remaining required findings.
- Specification deviations: none.

## Remaining risks

- `components.json` must retain shadcn's supported icon metadata, while the application policy requires Heroicons. Future generated components must be reviewed and any generated icon imports replaced, as recorded in ADR-003.
- The current health response is runtime-validated in the frontend. Runtime schemas for workflow and execution payloads belong to later phases and were not implemented early.

## Next phase readiness

- [x] All acceptance criteria in `tasks/todo.md` are evidenced.
- [x] Earlier phase checks still pass.
- [x] `tasks/progress.md` makes Phase 2 ready for a separate user-authorized turn.
