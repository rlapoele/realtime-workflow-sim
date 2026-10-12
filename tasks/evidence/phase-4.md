# Phase 4 evidence: Sequenced real-time streaming and recovery

- Date: 2026-10-12
- Outcome: complete
- Scope completed: named execution-scoped SSE, monotonic sequences, snapshot-first ordering, heartbeats, terminal/disconnect cleanup, frontend cache reconciliation, gap recovery, stale-response protection, visible connection state, and adversarial lifecycle verification.

## Automated verification

| Command | Result | Notes |
|---|---|---|
| `npm run test --workspace=backend -- execution-stream.test.ts execution-api.test.ts` | pass | 13 focused tests covered SSE route metadata/serialization, snapshot-first ordering, filtering, no historical delta replay, heartbeats, disconnect isolation, terminal completion, and 404 behavior. |
| `npm run test --workspace=frontend -- workflow-stream-hook.test.tsx workflow-stream.test.ts executions.test.ts` | pass | 14 focused tests covered runtime event validation, duplicate/old/gap sequences, immutable deltas, status preservation, authoritative recovery, heartbeat behavior, targeted invalidation, Strict Mode cleanup, ID changes, and terminal closure. |
| `PUBLIC_API_URL=http://localhost:3000 npm run verify` | pass | 47 backend tests and 28 frontend tests passed; both strict typechecks and both production builds passed. |
| Focused mutation: changed duplicate guard from `<=` to `<`, then ran `npm run test --workspace=frontend -- workflow-stream.test.ts` | pass | The exact-once test failed with duplicated text as expected; the mutation was restored and the focused test returned green. |
| `git diff --check` | pass | No whitespace errors. |
| Case-insensitive repository scan for the prohibited company name | pass | No matches in authored source, documentation, tests, or task tracking outside ignored build/dependency data. |

## Manual verification

- [x] Built production NestJS and Astro services started together through `npm start` on ports 3000 and 4321. The first sandboxed attempt was denied local binding with `EPERM`; the approved unsandboxed localhost start passed and both processes shut down cleanly afterward.
- [x] In an isolated real browser, started `app-access` and observed `Connection: connected`, progressive per-step logs, disabled active controls, deterministic step-four failure, the final skipped step, and terminal `Connection: completed`.
- [x] Started `employee-onboarding`, refreshed its execution URL while the fifth step was still running, and observed the authoritative accumulated logs and statuses restored with the live connection re-established as `connected`.
- [x] Blocked only `**/workflows/stream?**` in the isolated browser while the backend simulation continued; the UI exposed `Connection: reconnecting`. After removing the block, EventSource reconnected and the UI converged to the complete authoritative snapshot with every step and log present once.
- [x] The intentional request abort produced expected browser network errors during the interruption. A fresh isolated browser session loading the retained execution reported zero console errors and zero warnings.

## Files and decisions

- Key files changed: shared event contracts/runtime parsing; `ExecutionService` and `/workflows/stream`; `useWorkflowStream` and its sequence reducer; execution query integration and connection-state display; backend/frontend adversarial tests; README and Phase 4 ADR.
- Decision recorded: `docs/decisions/0004-sequenced-sse-recovery.md` defines snapshot-first, no-history-replay recovery; direct log deltas; targeted status invalidation; and Effect cleanup.
- Official sources checked: NestJS SSE, TanStack Query cache update/invalidation, React Effect cleanup/Strict Mode, and MDN EventSource named events/reconnection.
- Specification deviations: none.

## Remaining risks

- Recovery remains intentionally process-local. A backend restart expires executions, and multiple backend replicas remain out of scope.
- Browser network panels surface failed SSE requests during a real interruption; these are expected transport errors while the user-facing state reports reconnecting.

## Next phase readiness

- [x] All acceptance criteria in `tasks/todo.md` are evidenced.
- [x] Earlier phase checks still pass.
- [x] `tasks/progress.md` is accurate.
