# Phase 6.10 evidence: Base UI component normalization

- Date: 2026-10-14
- Outcome: complete
- Scope completed: introduced restrained Badge, Base UI Button, Alert, and StatusBadge components; migrated recurring status, action, and feedback treatments; retained purpose-built native semantics and console behavior.

## Automated verification

| Command | Result | Notes |
|---|---|---|
| `npm run test --workspace @agentflow/frontend -- tests/ui-primitives.test.tsx` | pass | The test first failed because the three primitive modules did not exist, then all three component-contract tests passed after implementation. |
| `npm run test --workspace @agentflow/frontend` | pass | All 38 frontend tests passed, including existing workflow, SSE, alert, keyboard-relevant semantics, console following, and new primitive assertions. |
| `PUBLIC_API_URL=http://localhost:3000 npm run typecheck --workspace @agentflow/frontend` | pass | Astro reported 39 files with zero errors, warnings, or hints. |
| `PUBLIC_API_URL=http://localhost:3000 npm run build` | pass | Both backend and frontend production builds completed. A build without `PUBLIC_API_URL` was also confirmed to fail closed as intended. |
| `PUBLIC_API_URL=http://localhost:3000 npm run verify` | pass | Final repository gate passed after implementation and tracking updates. |
| `git diff --check` | pass | No whitespace errors were found in the Phase 6.10 diff. |

## Manual verification

- [x] Started the freshly built backend and frontend on localhost and opened the application in headed Chromium. The watch-mode command was not used for final evidence because this host hit its open-file watcher limit (`EMFILE`); production processes started successfully and were the browser-test target.
- [x] Reviewed 1440 by 1000 and 390 by 844 layouts. Simulation, scenario, priority, and step badges retained their hierarchy and fit without crowding; the narrow viewport reported no page-level horizontal overflow.
- [x] Ran the application-access workflow to its deterministic terminal failure. The execution exposed Completed connection status, four completed steps, explicit Failed and Skipped labels, the failure reason, and Run again without changing engine or SSE behavior.
- [x] Confirmed the browser console contained zero errors and zero warnings on the correctly configured localhost origin.
- [x] Reloaded the retained execution and checked keyboard order: first Tab focused Skip to main content, and subsequent Tabs reached the workflow selector and Run again action with their accessible names intact.
- [x] Inspected the migrated alert semantics during component tests and preserved explicit `role="alert"`; status live regions remain owned by the execution summary rather than embedded into generic badges.

## Files and decisions

- Key files changed: `frontend/src/components/ui/{alert,badge,button}.tsx`, `frontend/src/components/StatusBadge.tsx`, recurring badge/button/alert consumers, focused frontend tests, and Phase 6.10 tracking/evidence.
- Decisions recorded: use shared primitives only where they reduce repeated semantics or interaction styling. Keep native `details`/`summary` and `progress`, the custom log region/autoscroll implementation, identity initials, and structural panels unchanged.
- Dependency decision: no new package was required. Button composes the locked `@base-ui/react` dependency; Badge and Alert are local shadcn-style semantic components. Heroicons remain the only icon library used by product code.
- Specification deviations: none. The workflow engine, shared contracts, REST API, and SSE protocol were not changed.

## Remaining risks

- Browser review remains Chromium-based. Existing Phase 5 and Phase 6 evidence covers the broader accessibility and release-candidate matrix.
- The local watch process can hit this machine's open-file limit in the current workspace. This did not affect tests, strict typechecking, production builds, production starts, or browser behavior and is not caused by the component changes.

## Next phase readiness

- [x] All Phase 6.10 acceptance criteria in `tasks/todo.md` are evidenced.
- [x] Earlier phase tests and build gates still pass.
- [x] Phase 7 remains ready and unstarted pending a new explicit user instruction.
- [x] `tasks/progress.md` is accurate.
