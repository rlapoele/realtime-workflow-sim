# Phase 3 evidence: Deterministic execution vertical slice

- Date: 2026-10-12
- Outcome: complete
- Scope completed: deterministic in-memory runner, trigger/detail API contracts, bounded retention and logs, URL-restorable polling UI, terminal recovery/restart controls, and fake-timer/browser verification.

## Automated verification

| Command | Result | Notes |
|---|---|---|
| `npm run test --workspace=backend` | pass | 6 files and 39 tests passed, including three successful scenarios, required failure/skipping, isolation, concurrency, retention, log caps, shutdown cleanup, and route contracts. |
| `npm run test --workspace=frontend` | pass | 5 files and 16 tests passed, including trigger, active-control locking, polling to terminal state, URL restoration, missing-state recovery, and runtime contract validation. |
| `PUBLIC_API_URL=http://localhost:3000 npm run verify` | pass | Both test suites, strict backend TypeScript, Astro checks, backend build, seed copy, and frontend production build passed. |
| `npm run start` | pass | Built NestJS and Astro services started on ports 3000 and 4321; all Phase 3 routes were mapped and the built frontend served successfully. |
| `curl -sS -i -X POST http://localhost:3000/workflows/password-reset/trigger` | pass | Returned `202 Accepted` with a fresh pending `WorkflowExecution`. |
| `curl -sS -i http://localhost:3000/executions/missing-execution` | pass | Returned `404 Not Found` with `{ error: { code: "not_found", message } }`. |
| Focused mutation: changed active-status `pending OR running` to `pending AND running`, then ran `npm run test --workspace=frontend -- execution-workflow.test.tsx` | pass | The active-control test failed as expected; the mutation was reverted before the final green gate. |
| `git diff --check` | pass | No whitespace errors. |
| Case-insensitive repository scan for the prohibited company name | pass | No matches outside ignored dependency/build/Git data. |

## Manual verification

- [x] Opened the built app at `http://localhost:4321` in an isolated browser and confirmed the workflow catalogue rendered with accessible headings, selector, run control, request context, and ordered steps.
- [x] Triggered `app-access`; the selector and run control disabled while active, the URL gained an execution ID, steps 1–3 succeeded, step 4 failed with the authored license-capacity reason, and step 5 was skipped.
- [x] Refreshed the failure URL and confirmed the retained authoritative execution state was restored through `GET /executions/:executionId`.
- [x] Selected `employee-onboarding`; selecting a new workflow cleared the previous execution URL, all five steps reached success, authored logs/results rendered, and the terminal **Run again** affordance enabled.
- [x] Confirmed the browser console contained zero warnings or errors for the verified localhost runs.
- [x] Confirmed the UI consistently describes requests, integrations, approvals, and actions as fictional or simulated.

## Files and decisions

- Key files changed: `backend/src/executions/`, execution API controllers/providers, `shared/execution-schema.ts`, `frontend/src/lib/executions.ts`, `WorkflowCatalogue.tsx`, `WorkflowDetail.tsx`, Phase 3 tests, and `README.md`.
- Decisions recorded: polling authoritative GET snapshots at 250 ms is limited to Phase 3; SSE, reconnect recovery, and stale-event protection remain Phase 4. Every trigger creates a new non-idempotent execution. The process retains at most 50 completed runs and 64,000 log characters per execution, while active runs are never retention-evicted.
- Specification deviations: none.

## Remaining risks

- Execution retention is intentionally process-local, so a backend restart makes existing execution URLs expire; the UI provides the required recovery action.
- The source-watch development command encountered the host's current `EMFILE` watcher limit during this session. The same command was verified in Phase 1/2, and the non-watch production build/start path passed in this phase. This is a host resource condition rather than an application failure.
- Phase 3 uses snapshot polling only. Sequenced SSE delivery, gap recovery, duplicate/stale event handling, and connection-state presentation remain explicitly assigned to Phase 4.

## Next phase readiness

- [x] All acceptance criteria in `tasks/todo.md` are evidenced.
- [x] Earlier phase checks still pass.
- [x] `tasks/progress.md` is accurate.
