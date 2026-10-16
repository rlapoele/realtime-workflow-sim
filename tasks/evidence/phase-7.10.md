# Phase 7.10 evidence: Public-demo trigger safeguards

- Date: 2026-10-16
- Outcome: complete
- Scope completed: trigger-route burst and sustained rate limits, shared `429` errors, a 25-active-execution admission cap, real HTTP coverage, production-artifact smoke verification, and owner documentation. No workflow, execution-state, GET recovery, or SSE contract changed.

## Automated verification

| Command | Result | Notes |
|---|---|---|
| `npm view @nestjs/throttler version peerDependencies engines --json` | pass | Resolved `@nestjs/throttler` 6.7.1; its peer range includes Nest 12 and its engine range includes Node 22.12. The exact version is recorded in the root lockfile. |
| `npm run test --workspace=backend -- execution-service.test.ts` before implementation | expected fail | Red test proved the active-cap behavior was absent before implementation. |
| `npm run test --workspace=backend -- execution-api.test.ts trigger-rate-limit.test.ts` before endpoint wiring | expected fail | Red tests proved both shared capacity-error mapping and trigger throttling were absent. |
| `npm run test --workspace=backend -- trigger-rate-limit.test.ts` | pass | Two real HTTP tests cover 3-per-10-second blocking, 10-per-minute blocking across burst windows, headers, the shared error body, per-client isolation, and unthrottled health requests. |
| `npm run test --workspace=backend -- execution-service.test.ts` with `>=` temporarily mutated to `>` | expected fail | The capacity test detects an off-by-one admission regression; the correct comparison was restored immediately. |
| `npm run test --workspace=backend -- trigger-rate-limit.test.ts` with the burst limit temporarily mutated from 3 to 4 | expected fail | The HTTP test detects an incorrect configured threshold; the value 3 was restored immediately. |
| `npm ci --cache /private/tmp/agentflow-npm-cache` | pass | Clean lockfile install completed with 466 packages audited and zero vulnerabilities. |
| `npm audit --audit-level=high` | pass | Registry advisory check reported zero vulnerabilities. |
| `PUBLIC_API_URL=http://localhost:3000 npm run verify` | pass | 53 backend tests and 40 frontend tests passed; both strict typechecks, Astro diagnostics with zero errors/warnings/hints, and both production builds passed. |
| Built backend on `PORT=3100` plus loopback `curl` smoke checks | pass | `/health` returned `200`; four immediate trigger attempts returned `202`, `202`, `202`, `429`; the rejection included `Retry-After-burst: 10` and the shared `too_many_requests` body. |
| `git diff --check` | pass | No whitespace errors in the final scoped diff. |

## Manual verification

- [x] Reviewed correctness, readability, architecture, security, and performance. The guard is route-scoped, limits are named and explicit, active counting is bounded by the 25-run admission policy plus retained terminal records, and no unrelated endpoint is guarded.
- [x] Verified the unknown-workflow lookup occurs before capacity admission, preserving the existing `404` contract even at capacity.
- [x] Verified active-cap release occurs only through the existing terminal state transition; active runs are neither evicted nor cancelled.
- [x] Verified Railway documents `X-Real-IP` as the client remote-IP header and the guard accepts it only when it contains a valid IPv4 or IPv6 address, with the framework request IP as fallback.
- [x] Reviewed the single-package lockfile addition and confirmed no unrelated transitive dependency change.
- [x] No Railway setting, service, domain, variable, deployment, Git remote, or production branch was changed.

## Files and decisions

- Key files changed: `backend/src/workflows/trigger-throttler.guard.ts`, `backend/src/workflows/workflows.controller.ts`, `backend/src/executions/execution.service.ts`, `backend/src/app.module.ts`, backend tests, root dependency lockfile, `README.md`, `docs/local-testing.md`, `docs/railway-deployment.md`, and phase tracking.
- Decisions recorded: use official `@nestjs/throttler` 6.7.1; scope both named windows to the trigger route; identify Railway callers through its validated `X-Real-IP`; retain the shared API error envelope; set the process-local active cap to 25; preserve one backend replica.
- Official sources: NestJS [rate limiting](https://docs.nestjs.com/security/rate-limiting), NestJS Throttler [README and named throttlers](https://github.com/nestjs/throttler/blob/master/README.md), and Railway [public-network request headers](https://docs.railway.com/networking/public-networking/specs-and-limits).
- Specification deviations: none. This user-authorized post-release hardening increment adds admission safeguards while preserving the specification's unauthenticated, single-process, in-memory scope and its rule that active executions are never evicted.

## Remaining risks

- Both controls are in-memory and per backend process. They are appropriate only while the documented one-backend-replica invariant remains in force; a multi-replica deployment would need shared throttler/admission state.
- Client-IP limiting is coarse: people behind one NAT may share an allowance, and it is not an identity or authentication boundary.
- The public demo remains unauthenticated. These controls reduce accidental and basic automated load, but do not replace an edge firewall, bot mitigation, authentication, or continuous monitoring.

## Next phase readiness

- [x] All Phase 7.10 acceptance criteria in `tasks/todo.md` are evidenced.
- [x] Earlier phase checks still pass.
- [x] `tasks/progress.md` remains complete and records this post-release increment.
- [x] Deployment and promotion of `releases` remain explicit owner decisions.
