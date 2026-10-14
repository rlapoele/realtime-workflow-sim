# AgentFlow Live phased checklist

Only work on the phase marked current in `tasks/progress.md`. Check boxes require evidence, not intent.

## Phase 1: Compatible foundation and shared contracts

**Outcome:** A minimal monorepo proves the specified tools and `/shared` boundary work together before feature code is added.

**Tasks:**

- [x] Verify current official setup guidance and select mutually compatible stable versions.
- [x] Confirm the local repository has `dev`, `releases`, and `main` at the documented bootstrap revision, with `dev` checked out.
- [x] Create npm workspaces, root scripts, one lockfile, strict shared TypeScript contracts, and runtime-safe environment handling.
- [x] Scaffold minimal NestJS and Astro/React server applications, separate Vitest environments, Tailwind, Heroicons, TanStack Query, and shadcn configured for Base UI.
- [x] Add backend health endpoint and a minimal frontend shell/health indication sufficient to prove both production starts.
- [x] Add `.env.example` files and replace planning-only README commands with verified commands.
- [x] Record compatible versions and any significant setup decision.

**Acceptance criteria:**

- [x] One root install resolves with a committed lockfile and no duplicate shared contract definitions.
- [x] Routine implementation and phase commits remain on `dev`; neither `releases` nor `main` advances during Phase 1.
- [x] Both apps consume a type-only contract from `shared/types.ts` in typecheck and production build.
- [x] Root development, test, typecheck, build, and workspace start scripts are real and documented.
- [x] No product workflow behavior from later phases is implemented.

**Verification:**

- [x] Clean root install succeeds.
- [x] Backend and frontend focused tests pass.
- [x] Both strict typechecks pass.
- [x] Both production builds pass.
- [x] Both production start commands bind to configured ports; backend `/health` responds.

**Dependencies:** None.

## Phase 2: Workflow catalogue vertical slice

**Outcome:** The browser displays all four backend-authored workflow definitions and fictional request contexts before any execution exists.

**Tasks:**

- [x] Define the seed runtime schema and public mapping without weakening shared contracts.
- [x] Add exactly four required JSON seeds and startup loading with actionable filename errors.
- [x] Implement `GET /workflows` and its consistent error/runtime validation boundaries.
- [x] Build the TanStack Query catalogue UI with selection, request context, scenario indicator, and ordered pending steps.
- [x] Add seed, loader, API, and catalogue component tests, including invalid and duplicate cases.

**Acceptance criteria:**

- [x] JSON is the only authored source for scenario-specific definitions/scripts.
- [x] All four workflows render from API data with loading, empty, and error handling.
- [x] Private simulation scripts are absent from public responses.
- [x] Fresh immutable/public objects prevent consumer mutation of seed state.

**Verification:**

- [x] Loader tests cover all specified invalid cases and four valid files.
- [x] Backend API and frontend catalogue tests pass.
- [x] Typechecks and builds pass.
- [x] Built backend loads seed assets when started from a different working directory.
- [x] Browser check confirms all four examples and no page-level mobile overflow.

**Dependencies:** Phase 1.

## Phase 3: Deterministic execution vertical slice

**Outcome:** The UI can trigger an isolated run and inspect authoritative state, including the required deterministic failure, without real-time streaming yet.

**Tasks:**

- [x] Implement injectable-clock/timing execution state, generic sequential scripts, concurrency, and shutdown cleanup.
- [x] Implement `POST /workflows/:workflowId/trigger` and `GET /executions/:executionId` with 202/404 contracts.
- [x] Implement bounded logs and completed-run retention without evicting active runs.
- [x] Connect frontend mutation, execution-specific query, URL execution ID, disabled active controls, restart/expiry recovery, and terminal restart affordances.
- [x] Add fake-timer tests for success, failure/skipping, isolation, concurrency, retention, and cleanup.

**Acceptance criteria:**

- [x] Three scenarios succeed and `app-access` fails at step 4 with step 5 skipped.
- [x] Every trigger owns fresh request, step, and log state; seeds remain unchanged.
- [x] URL refresh restores retained authoritative state, and missing state has a clear recovery action.
- [x] The UI never implies a real integration or interactive approval.

**Verification:**

- [x] Engine and API tests pass under fake timers.
- [x] Frontend trigger/restore/error tests pass.
- [x] Typechecks and builds pass.
- [x] Browser check runs one success and the failure to terminal state using authoritative GET data.

**Dependencies:** Phase 2.

## Phase 4: Sequenced real-time streaming and recovery

**Outcome:** Live statuses and progressive logs survive reconnects and races without missing or duplicating text.

**Tasks:**

- [x] Implement named discriminated SSE events, per-execution sequence IDs, heartbeats, filtered multicast subscriptions, and snapshot-first race-safe ordering.
- [x] Complete streams only after pending text and terminal state; release subscriptions without cancelling runs.
- [x] Implement `useWorkflowStream` with execution-scoped keys, direct/batched log cache deltas, targeted status invalidation, sequence reducer, gap recovery, stale-response protection, and cleanup.
- [x] Expose accurate connection states and preserve per-step logs through refetch.
- [x] Add adversarial backend/frontend tests for ordering, duplicate/old/gap events, stale HTTP, Strict Mode, cleanup, and terminal flush.

**Acceptance criteria:**

- [x] Logs appear progressively and exactly once.
- [x] Refresh/reconnect converges to authoritative state without historical chunk replay.
- [x] A sequence gap forces snapshot recovery before newer deltas apply.
- [x] Heartbeats do not refetch; text chunks do not cause per-chunk GET requests.
- [x] Unmount, ID change, and completion close the stream and batching work.

**Verification:**

- [x] Event ordering and subscription-race tests pass.
- [x] Frontend reducer/hook lifecycle tests pass.
- [x] Typechecks and builds pass.
- [x] Browser checks cover mid-run refresh and a simulated connectivity interruption/recovery.

**Dependencies:** Phase 3.

## Phase 5: Production-quality responsive interface

**Outcome:** The full dashboard communicates operational state clearly and meets the specified original visual and accessibility direction.

**Tasks:**

- [x] Implement semantic color/spacing/type/radius tokens with verified contrast and restrained emerald/teal use.
- [x] Complete top bar, Simulation badge, workflow controls, vertical nodes/connectors, request context, progress/run facts, connection status, and dark console.
- [x] Implement near-bottom autoscroll, pause-on-user-scroll, Jump to latest, contained wrapping/scrolling, and no per-chunk live-region announcements.
- [x] Implement mobile reading order and accessible collapsible context without horizontal page overflow.
- [x] Verify keyboard behavior, focus, status redundancy, reduced motion, labels, errors, loading, reconnecting, and terminal states.

**Acceptance criteria:**

- [x] Desktop and mobile layouts match the specification without copied third-party assets or out-of-scope navigation/KPIs.
- [x] Base UI composition preserves refs, handlers, ARIA attributes, and keyboard behavior; no Radix or `asChild` is present.
- [x] Long IDs/logs stay contained and statuses never rely on color alone.
- [x] The main action and execution state remain visually dominant.

**Verification:**

- [x] Component/accessibility tests pass.
- [x] Typechecks and builds pass.
- [x] Real-browser desktop and narrow-viewport screenshots are reviewed.
- [x] Keyboard, visible focus, reduced-motion, console scrolling, and overflow checks are recorded.

**Dependencies:** Phase 4.

## Phase 6: Hardening and release-candidate verification

**Outcome:** A locally runnable release candidate has evidence for every functional and non-functional requirement.

**Tasks:**

- [x] Audit the implementation against every section of `docs/specification.md` and close uncovered gaps without adding scope.
- [x] Strengthen automated coverage for integration boundaries, shutdown, retention/log bounds, production configuration, and regressions found in browser testing.
- [x] Run all four workflows end to end, including refresh/reconnect and deterministic failure.
- [x] Run clean-install, complete tests, typechecks, builds, production starts, health/CORS checks, and built seed-loading checks.
- [x] Create an owner-facing local test guide with verified prerequisites, environment setup, dev and production commands, URLs, process shutdown, troubleshooting, and a manual browser checklist.
- [x] Review code quality/security for an unauthenticated fictional demo and remove placeholders, dead code, required TODOs, and unsupported claims.
- [x] Normalize frontend imports: keep relative paths for same-directory collaborators, use the existing `@/` alias across frontend directories, and preserve an explicit, consistently verified boundary for root `shared/` contracts rather than adding ad hoc aliases.

**Acceptance criteria:**

- [x] Every definition-of-done statement maps to recorded evidence or an explicitly unresolved blocker.
- [x] Production commands work from a clean install with documented environment values.
- [x] The owner can exercise every required scenario locally without Railway, cloud credentials, or Docker.
- [x] No active timer/subscription/resource leak is observed in covered lifecycle cases.
- [x] Known limitations match the intended prototype boundaries.
- [x] Frontend imports follow the recorded path policy and resolve consistently in Astro, Vitest, strict typechecking, and production builds.

**Verification:**

- [x] Root test, typecheck, and build commands pass from clean dependencies.
- [x] Both production services start together on configured ports and complete smoke flows.
- [x] Real-browser matrix in the specification passes.
- [x] `git diff --check` and a scoped final diff review pass when Git is available.

**Dependencies:** Phase 5.

## Phase 6.10: Base UI component normalization

**Outcome:** Repeated status, action, and feedback treatments use a restrained shared component layer without flattening the dashboard's native semantics or specialized interaction behavior.

**Tasks:**

- [x] Add local shadcn/Base UI-style Badge, Button, and Alert primitives using the existing design tokens and Heroicons.
- [x] Add a project-specific StatusBadge composition for icon, label, and reduced-motion-safe activity treatment.
- [x] Migrate the Simulation and scenario indicators, step and connection statuses, request priority, workflow actions, Jump to latest, and actionable error states.
- [x] Retain native details/summary, progress, log scrolling, live-region ownership, and specialized panels where an additional primitive would add indirection without usability value.
- [x] Add focused primitive tests and re-run real-browser desktop, narrow-viewport, keyboard, execution-state, and console checks.

**Acceptance criteria:**

- [x] Shared primitives preserve refs, event handlers, disabled state, accessible names, explicit alert/status semantics, visible focus, and reduced-motion behavior.
- [x] The interface gains consistent recurring components without introducing Radix, `asChild`, Lucide icons, new dependencies, or a broad visual redesign.
- [x] The workflow engine, API contracts, and SSE protocol are unchanged.
- [x] Native semantic elements and the specialized console behavior remain intact.

**Verification:**

- [x] Focused primitive tests and the complete frontend test suite pass.
- [x] Strict frontend typechecking and production builds pass.
- [x] A deterministic workflow runs to its expected terminal state in a real browser with no console errors or warnings.
- [x] Desktop and 390 px layouts are reviewed, keyboard order is intact, and no page-level horizontal overflow is present.
- [x] `git diff --check` and a scoped diff review pass when Git is available.

**Dependencies:** Phase 6.

## Phase 6.20: Type-safe icon contracts

**Outcome:** Icon-bearing components and feature-local presentation maps share one compile-time icon contract without adding a global registry or runtime abstraction.

**Tasks:**

- [x] Add a type-only `AppIcon` contract compatible with the existing Heroicons React components.
- [x] Use the shared type in StatusBadge and execution-state presentation maps instead of duplicating SVG component types.
- [x] Add explicit type coverage to the workflow step-status and known system-icon maps while retaining the generic fallback for unknown authored system IDs.
- [x] Keep direct Heroicons imports and feature-local maps; do not add an SVG sprite, barrel, global context, dynamic icon-name API, or dependency.

**Acceptance criteria:**

- [x] Status and connection maps remain exhaustive for their domain unions at compile time.
- [x] Known workflow system mappings accept only compatible icon components while unknown system IDs still use the existing fallback.
- [x] The type module produces no runtime component, global state, or icon registry.
- [x] Rendering, accessibility semantics, bundle-loading strategy, workflow behavior, API contracts, and SSE protocol are unchanged.

**Verification:**

- [x] The complete frontend test suite and strict frontend typecheck pass.
- [x] The frontend production build passes with no new dependency or runtime icon module.
- [x] The complete repository verification gate passes.
- [x] `git diff --check` and a scoped diff review pass when Git is available.

**Dependencies:** Phase 6.10.

## Phase 7: Railway owner handoff

**Outcome:** The owner can deploy two services from one GitHub monorepo using verified, current instructions; Codex does not perform deployment.

**Tasks:**

- [ ] Re-check current official Railway guidance relevant to monorepos, build/start commands, variables, public domains, health checks, and watch paths.
- [ ] Document creation of backend and frontend services from the same repository with repository-root build access.
- [ ] Document GitHub with `dev` as default, Railway service source branches set to `releases`, and `main` retained as the release backup.
- [ ] Document exact build/start commands, variables, build-time `PUBLIC_API_URL`, frontend/backend public domains, CORS sequencing, and `/health`.
- [ ] Document watch paths so root/shared/lockfile changes rebuild both and seed changes rebuild backend.
- [ ] Provide post-deployment smoke checks, troubleshooting, cost-awareness notes suitable for a Hobby account, and rollback/redeploy guidance without claiming a live deployment.

**Acceptance criteria:**

- [ ] Instructions clearly distinguish actions the owner performs from verified local facts.
- [ ] Neither service uses an isolated Root Directory that loses `/shared`.
- [ ] The two-pass URL/CORS/build-time-variable setup is unambiguous.
- [ ] No credentials are requested, stored, or exposed and no Railway/GitHub mutation is performed.
- [ ] The guide states that promoting/pushing `releases` triggers production deployment and therefore always requires explicit owner approval.

**Verification:**

- [ ] Every documented command matches package scripts and was locally verified where applicable.
- [ ] Railway-specific claims cite current official documentation.
- [ ] A dry-run review traces a new owner from repository connection to post-deploy smoke tests.
- [ ] Final README links all deployment and limitation documentation.

**Dependencies:** Phase 6.

Phase 7 begins only after the local guide and local release-candidate checks are complete. Docker remains optional and must not be introduced without a documented need and prior notice to the user.

## Final checkpoint

- [ ] All phase evidence files exist and all phase acceptance criteria are checked.
- [ ] `tasks/progress.md` marks the project complete rather than naming another phase.
- [ ] The user, not Codex, decides whether and when to deploy.
