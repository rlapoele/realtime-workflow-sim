# Phase 6.20 evidence: Type-safe icon contracts

- Date: 2026-10-14
- Outcome: complete
- Scope completed: introduced one type-only icon component contract, applied it to shared icon-bearing props and feature-local presentation maps, and retained direct tree-shakeable Heroicons imports with no global registry or sprite layer.

## Automated verification

| Command | Result | Notes |
|---|---|---|
| `npm run test --workspace @agentflow/frontend` | pass | All 38 frontend tests passed without behavior-test changes. |
| `PUBLIC_API_URL=http://localhost:3000 npm run typecheck --workspace @agentflow/frontend` | pass | Astro checked 40 files with zero errors, warnings, or hints; the exhaustive map contracts and Heroicons assignments compile. |
| `PUBLIC_API_URL=http://localhost:3000 npm run verify` | pass | Final repository gate passed after implementation and tracking updates, including both production builds. `AppIcon` is imported with `import type` and introduces no runtime registry behavior. |
| `git diff --check` | pass | No whitespace errors were found in the complete Phase 6.20 diff. |

## Manual verification

- [x] Reviewed every frontend Heroicons import. One-off icons remain direct named imports from `@heroicons/react/24/outline`; no barrel or eager global map was introduced.
- [x] Reviewed the presentation boundaries. StatusBadge consumes the shared icon contract, while execution, connection, step-status, and known workflow-system associations remain colocated with their owning features.
- [x] Confirmed the existing `CircleStackIcon` fallback remains available for arbitrary validated seed system IDs rather than coupling authored JSON to frontend component names.
- [x] No browser rerun was required because the change is erased at compilation and does not alter JSX, styles, props, events, accessibility attributes, or runtime data flow; the unchanged UI behavior remains covered by the complete frontend suite and prior Phase 6.10 browser evidence.

## Files and decisions

- Key files changed: `frontend/src/components/icons/types.ts`, `StatusBadge.tsx`, `ExecutionSummary.tsx`, `WorkflowDetail.tsx`, and Phase 6.20 tracking/evidence.
- Decisions recorded: centralize only the icon component type. Keep semantic mappings feature-local and imports explicit so dependencies remain visible and bundlers can continue eliminating unused Heroicons.
- Intentionally excluded: SVG spritesheets, React context, global icon registry, dynamic string-to-icon component, icon barrel exports, new dependencies, and changes to authored workflow contracts.
- Specification deviations: none.

## Remaining risks

- `AppIcon` intentionally describes the SVG props consumed by this application rather than exposing every Heroicons-specific ref/title detail. Expand the contract only if a real component needs those capabilities.

## Next phase readiness

- [x] All Phase 6.20 acceptance criteria in `tasks/todo.md` are evidenced.
- [x] Earlier behavior remains covered and unchanged.
- [x] Phase 7 remains ready and unstarted pending a new explicit user instruction.
- [x] `tasks/progress.md` is accurate.
