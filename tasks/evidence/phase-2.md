# Phase 2 evidence: Workflow catalogue vertical slice

- Date: 2026-10-12
- Outcome: complete
- Scope completed: shared public runtime validation, private backend seed validation, exactly four JSON-authored scenarios, startup catalogue loading, `GET /workflows`, fresh public mapping, TanStack Query catalogue states, Base UI-backed workflow selection, fictional request context, ordered pending steps, focused tests, built-seed smoke verification, and real-browser desktop/mobile checks.
- Implementation commit: `e83dea9 feat: add validated workflow catalogue`

## Automated verification

| Command | Result | Notes |
|---|---|---|
| Focused backend tests before implementation | expected failure | The two new suites failed to import the not-yet-created loader, service, and controller, establishing the red state. |
| `npm run test --workspace=backend -- --run tests/workflow-seed-loader.test.ts tests/workflow-catalogue.test.ts` | pass | 17 tests cover four valid authored files, the GET route mapping, fresh public copies, private-script exclusion, unsupported schema versions, invalid/missing fields, duplicate workflow/step IDs, unknown/non-bijective script references, invalid durations, empty/blank logs, missing failure reasons, and scenario inconsistency. |
| `npm run test --workspace=frontend -- --run tests/workflow-catalogue.test.tsx tests/dashboard-app.test.tsx` | pass | 6 tests cover loading, successful rendering, Base UI selection, empty data, HTTP failure, malformed external data, and the no-execution phase boundary. |
| Mutated the positive-duration guard, then ran `npm run test --workspace=backend -- --run tests/workflow-seed-loader.test.ts` | expected failure | The zero-duration test failed when the lower bound was weakened; the guard was restored before final verification. |
| `PUBLIC_API_URL=http://localhost:3000 npm run verify` | pass | Backend: 26 tests across 4 files; frontend: 10 tests across 3 files; both strict typechecks and both production builds passed. Astro Check reported 0 errors, warnings, or hints. |
| Built backend started from `/private/tmp` with `PORT=3102` | pass | The compiled service loaded copied seed assets independently of the process working directory and mapped `/health` and `/workflows`. |
| Local summary request to the built `GET /workflows` | pass | Returned HTTP 200, count 4, IDs `app-access`, `employee-offboarding`, `employee-onboarding`, and `password-reset`, with `exposesSimulation: false`. |
| `git diff --check` | pass | No whitespace errors before the implementation commit or in the evidence/tracking diff. |
| Repository policy/name/secret scan with `rg` | pass | No prohibited company-name occurrence, private-key/credential pattern, required-feature TODO, Radix import, `asChild`, or application Lucide import was found outside the documented shadcn metadata and instruction text. |

## Manual verification

- [x] Started both attached development services with `npm run dev`; both NestJS and Astro remained available until stopped with `Ctrl+C`.
- [x] Opened `http://localhost:4321` in headed Chromium through Playwright and confirmed the Simulation label, browse-only notice, accessible Workflow combobox, fictional request context, scenario indicator, and ordered Pending steps.
- [x] Confirmed the selector exposes exactly the four required options and selected each example; the expected subject/context appeared for Nora Martin, Maya Patel, Alex Chen, and Jules Bernard.
- [x] Resized Chromium to 390 × 844 and measured `innerWidth: 390`, `scrollWidth: 390`, and `overflow: false`; the stacked steps and request context remained readable.
- [x] Reopened the browser after the development-runtime injection fix and confirmed zero console errors and zero warnings.
- [x] Confirmed no Run action, execution state, or real-time behavior from Phases 3–4 was introduced.

## Files and decisions

- Key files changed: `shared/workflow-schema.ts`, `backend/seeds/workflows/*.json`, `backend/src/workflows/`, backend/frontend catalogue tests, `frontend/src/components/WorkflowCatalogue.tsx`, the Base UI-backed Select wrapper, build asset copying, semantic UI tokens, `README.md`, and ADR-003.
- Decisions recorded: ADR-003 now records the executable shared ESM boundary, compiled seed asset copy, process-working-directory-independent lookup, and official Base UI/TanStack references.
- Current official references checked: [NestJS providers](https://docs.nestjs.com/providers), [NestJS testing](https://docs.nestjs.com/fundamentals/testing), [shadcn Base UI Select](https://ui.shadcn.com/docs/components/base/select), [Base UI Select](https://base-ui.com/react/components/select), and [TanStack Query `useQuery`](https://tanstack.com/query/latest/docs/framework/react/reference/functions/useQuery).
- Code review: approved after correcting the executable shared module format, adding explicit Nest injection for the `tsx` development runtime, formatting the catalogue component, and verifying correctness, readability, architecture, security, performance, dependency scope, seed privacy, and phase boundaries.
- Specification deviations: none.

## Remaining risks

- The private simulation scripts are structurally validated but intentionally are not executed until Phase 3.
- Phase 5 remains responsible for the final full-dashboard accessibility and visual-polish acceptance matrix; this phase verified the catalogue controls, semantics, and narrow-layout baseline only.

## Next phase readiness

- [x] All Phase 2 acceptance criteria in `tasks/todo.md` are evidenced.
- [x] Earlier phase checks still pass through the root verification command.
- [x] `tasks/progress.md` makes Phase 3 ready for a separate user-authorized turn.
