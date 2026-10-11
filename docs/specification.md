# AgentFlow Live product and technical specification

## Status and intent

This document is the durable, normalized specification derived from the user-provided implementation prompt. It is authoritative for the phased build. The product is a deployable demonstration using fictional data and simulated operations; it is not a production service desk.

## Product goal

A service-desk operator can select one of four predefined workflows, inspect its fictional request, trigger an execution, watch steps update live, read progressive per-step logs, and understand completion, failure, skipped work, and connection state without refreshing.

The interface uses an original service-desk visual direction: a light operational workspace, white surfaces, restrained emerald accents, dark teal console and small brand areas, compact connected workflow nodes, subtle borders and shadows, and a faint dotted workflow canvas. It must not reuse third-party branding, screenshots, customer logos, marketing-page compositions, or proprietary assets.

Every screen must clearly indicate that this is a simulation. Never claim external systems are connected or show fabricated performance metrics.

## Scope

Included:

- four backend JSON-authored workflows;
- in-memory definitions and executions;
- deterministic success and failure;
- simulated request context, integrations, actions, and approvals;
- real-time statuses and progressive logs;
- refresh and reconnect recovery while the backend retains the execution;
- Railway-ready builds and owner-run deployment instructions.

Excluded:

- AI or external-provider calls;
- real Slack, Teams, Okta, HRIS, MDM, identity, application, or messaging integrations;
- authentication and accounts;
- database persistence or durable background work;
- multiple backend replicas;
- workflow editing or a graph builder;
- interactive approval, cancellation, retries, or history browsing;
- a broader ticket-management product.

All runs start manually. Request-channel and HRIS metadata are scenario context only. A backend restart discards runs, interrupts simulations, and reloads definitions from JSON.

## Required stack and repository shape

- npm workspaces with one root manifest and lockfile;
- `backend/`: NestJS and RxJS;
- `frontend/`: Astro server output using `@astrojs/node` standalone, with a React dashboard island;
- Tailwind CSS;
- shadcn/ui configured for Base UI primitives, never Radix;
- Heroicons outline icons;
- TanStack Query v5;
- native EventSource and Server-Sent Events;
- strict TypeScript;
- separate Node and DOM Vitest configurations;
- `shared/` as the single home of cross-application contracts.

Expected top-level shape:

```text
/
├── package.json
├── package-lock.json
├── README.md
├── shared/
│   └── types.ts
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── seeds/workflows/*.json
│   ├── src/
│   └── tests/
└── frontend/
    ├── package.json
    ├── .env.example
    ├── src/
    └── tests/
```

Extra files are allowed when they make the specified contracts testable or maintainable. Shared imports must work in development, tests, typechecks, and production builds without duplicating contracts.

## Workflow seeds

`backend/seeds/workflows/*.json` is authored source of truth. Each schema-version-1 seed contains a public definition and a private simulation script. Definitions include ID, name, description, category, trigger/source description, stable system IDs, expected scenario, fictional request template, and ordered steps. Each step has ID, name, description, system ID, and action label. Each matching script entry has step ID, positive bounded duration, nonempty ordered log chunks, outcome, optional result summary, and a required failure reason for failure.

Validate every seed at startup with a runtime schema. Reject unsupported versions, missing or invalid fields, duplicate workflow or step IDs, mismatched script references, non-bijective step/script sets, invalid durations, empty logs, missing failure reasons, and scripts inconsistent with the expected scenario. Fail with the filename and actionable validation details. Never use a TypeScript assertion as runtime validation.

Load validated seeds into an in-memory map and expose only public definitions. Clone fresh request, step, and log state for every execution; never mutate a seed or share mutable runtime objects across runs. JSON contains stable system identifiers, never component names or executable code. The frontend owns the icon mapping.

### Required scenarios

1. `app-access` — IT access, failure. Nora Martin, Product Designer; Slack; normal priority; Camille Roux; Figma Editor access. Qualify context, check policy, simulate approval, provision via an Okta group, then notify/resolve. Steps 1–3 succeed, provisioning fails because no Editor licenses remain, the final step is skipped, and the execution fails with manual follow-up explained in logs.
2. `employee-onboarding` — employee lifecycle, success. Alex Chen, Frontend Engineer; simulated HRIS start-date event; Engineering; Morgan Lee; normal priority. Load requirements, create simulated identity/groups, reserve a fictional laptop, assign standard apps, and prepare welcome/resolve. All steps succeed.
3. `password-reset` — account support, success. Jules Bernard, Sales Specialist; Microsoft Teams; high priority. Identify context, simulate identity and policy checks, simulate issuing instructions, and prepare notification/resolve. All steps succeed. No credential, token, or usable reset link may be generated.
4. `employee-offboarding` — employee lifecycle, success. Maya Patel, Operations Coordinator; simulated HRIS end-date event; Operations; Sam Rivera; high priority. Load checklist/assets, simulate suspension and session revocation, remove app access, prepare device return, notify manager/complete. All steps succeed.

Logs describe fictional actions only. Approximately three seconds per step is suitable for production demo seeds, while tests use injected timing and fake timers.

## Shared contracts

Define and use shared contracts for `WorkflowDefinition`, `StepDefinition`, `RequestContext`, `StepExecution`, `WorkflowExecution`, `ExecutionEvent`, and consistent API errors. Definitions are immutable; execution state is mutable only inside the backend runtime. Use ISO timestamp strings and JSON-safe values.

Execution statuses: `pending`, `running`, `success`, `failed`.

Step statuses: `pending`, `running`, `success`, `failed`, `skipped`.

`ExecutionEvent` is a discriminated union containing:

- `execution.snapshot`;
- `execution.status`;
- `step.status`;
- `log.delta`;
- `heartbeat`.

State-changing events contain execution ID and a monotonically increasing sequence within that execution. Step events also contain step ID. Snapshots contain the full current execution and latest sequence. Heartbeats do not mutate state. Validate external inputs and event payloads at runtime.

## Backend behavior and API

- `GET /health` returns service health.
- `GET /workflows` returns the four validated public definitions and request examples.
- `POST /workflows/:workflowId/trigger` creates an isolated execution, starts simulation independently of the request, and returns HTTP 202 with initial state and ID.
- `GET /executions/:executionId` returns an authoritative execution snapshot, including accumulated logs and latest sequence.
- `GET /workflows/stream?executionId=...` is a NestJS `@Sse()` endpoint for one execution.
- Unknown workflow and execution IDs return HTTP 404 using the consistent error contract.

Execute steps sequentially. Move each pending step to running, emit its log chunks progressively, then finish according to the script. On failure, preserve failure and logs, stop subsequent work, mark remaining steps skipped, and fail the execution. On success, succeed only after the last step. Independent executions may run concurrently.

The event stream uses an RxJS multicast source filtered by execution ID. Validate the execution before opening. Send an authoritative snapshot before live events with ordering that cannot lose an intervening update. Name SSE events consistently, include SSE IDs for sequenced events, heartbeat periodically, deliver remaining text and terminal state before completing, and release subscriptions on disconnect. Client disconnect never cancels a run. Clean up timers on shutdown.

Bound completed-execution retention and per-execution log size, document the limits, and never evict active executions.

## Frontend behavior

The main dashboard is a React island loaded with `client:load` and wrapped in one stable `QueryClientProvider`. Browser APIs run only in client effects.

Workflow catalogue:

- fetch definitions with `useQuery`;
- select with a shadcn Base UI Select;
- show description, category, success/failure indicator, request context, and ordered steps;
- handle loading, empty, and error states.

Execution:

- trigger with `useMutation` and show progress/actionable errors;
- disable running and workflow switching while an execution is active;
- store execution ID in the URL and restore it through the authoritative GET endpoint;
- after terminal state, allow a new run or workflow selection;
- after backend restart/expired state, explain recovery and offer a fresh start.

Tracking and synchronization:

- use stable execution-specific query keys and a `useWorkflowStream` hook;
- show execution ID, overall status, completed-step count, elapsed duration, each step/result/failure, skipped steps, and connection state (`connecting`, `connected`, `reconnecting`, `disconnected`, `completed`);
- status events invalidate only the affected execution query;
- `log.delta` updates cached log text with `setQueryData`, optionally batched, without per-chunk refetching;
- accept snapshots only when at least as current as cached state;
- ignore duplicate or older events;
- recover a sequence gap with an authoritative snapshot before further deltas;
- prevent an older HTTP response from replacing newer streamed state;
- heartbeats never invalidate queries;
- flush pending text before terminal completion;
- close EventSource and cancel pending batching on unmount, execution change, and completion;
- behave correctly under React Strict Mode without duplicate connections or listeners.

Logs stay associated with the right execution and step and survive status refetches. Autoscroll only while the reader is near the bottom; stop forcing it after upward scrolling and provide **Jump to latest**. Do not announce every text chunk to assistive technology.

## Interface and accessibility

Desktop layout has a compact branded top bar with Simulation badge, “Workflow executions” heading, workflow controls and Run Workflow action, vertical execution area, adjacent request context, and dark log console below. The context includes subject, initials/name, department/manager, channel/source, priority, and relevant app/device/access details. Use initials and generic icons only.

Mobile stacks controls, context, steps, and logs in reading order. Context may use an accessible Accordion. Prevent page-level horizontal overflow; wrap or internally scroll long IDs and logs.

Starting semantic colors:

- background `#F5F7F6`, surface `#FFFFFF`, foreground `#142B26`;
- muted foreground `#5F706B`, border `#DCE5E1`;
- primary/success `#047857`, primary hover `#065F46`, accent surface `#E8F8F0`;
- decorative emerald `#00E89A` only with a verified dark foreground;
- console background `#082B29`, foreground `#D8F3E8`, muted `#9DBEB2`;
- running `#0E7490`, failure `#B42318`, reconnecting/warning `#92400E`.

Express base colors as shadcn-compatible semantic variables plus explicit running, success, skipped, and console tokens. Verify actual contrast rather than assuming it. Use readable sans-serif and monospace stacks, restrained 4px-based spacing, about 12px panel radii, 8px control/node radii, 1px borders, subtle shadows, and touch-usable controls.

Keyboard operation, visible focus, meaningful labels, text/icon status redundancy, contrast, reduced motion, loading/failure/reconnect/completion states, and desktop/mobile responsiveness are required. Base UI `render` handles element substitution; do not use `asChild`. Custom rendered components forward ref and all primitive props/handlers/ARIA attributes.

## Local and Railway runtime contract

Both services build from repository-root access so `/shared` remains available. Required workspace commands:

```text
npm run build --workspace backend
npm run start --workspace backend
npm run build --workspace frontend
npm run start --workspace frontend
```

Backend listens on `Number(process.env.PORT ?? 3000)` and binds to `0.0.0.0`. Frontend production startup runs the built Astro Node adapter, respects runtime `PORT`, and binds to `0.0.0.0`.

Backend environment: `PORT`, `FRONTEND_ORIGIN`.

Frontend environment: `PUBLIC_API_URL`, `HOST`, `PORT` as needed. Browser requests use `import.meta.env.PUBLIC_API_URL`; local development may fall back to `http://localhost:3000`, but production must fail clearly rather than silently target localhost. `PUBLIC_API_URL` must be present during the frontend build. CORS allows the public frontend origin.

JSON seeds must be available in the built backend regardless of process working directory. The final documentation covers installation, service commands, environment, health checks, public URLs, and Railway watch paths. Root/shared/lockfile changes rebuild both services; backend seed changes rebuild the backend.

Codex prepares and verifies this deployment contract but never performs the Railway deployment.

### Source-control deployment contract

The Git repository uses three long-lived branches with intentionally different roles:

- `dev`: default branch and routine implementation branch;
- `releases`: production-quality branch watched by Railway for automatic builds/deployments;
- `main`: backup branch for the last accepted release state.

Changes reach `releases` only through an explicitly approved promotion after local release-candidate verification. Changes reach `main` only through an explicitly approved backup synchronization of an accepted release. `main` must not silently become the default, and neither **Proceed with the next step** nor completion of a phase authorizes a release, push, tag, or backup synchronization.

## Local evaluation contract

Local Node/npm execution is the default and must not require Docker Desktop. The project has no database or external runtime dependency, so containers would add cost without solving a specified need. If implementation uncovers a concrete portability problem that makes containers valuable, it must be explained to the user before Docker becomes part of the workflow.

Before Railway instructions are considered ready, the owner must have a concise local test guide containing verified prerequisites, environment setup, install and development commands, production-build/start commands, expected local URLs, a health check, how to stop the processes, and troubleshooting. The guide must include manual browser checks for all four workflows, progressive logs, deterministic failure/skipping, mid-run refresh, connection recovery, keyboard operation, and narrow viewport behavior.

## Required verification

Automated coverage includes all four seed loads; invalid seeds and duplicates; generic scripts; success; app-access failure and skipping; isolation of runs and seeds; progressive logs and ordering; snapshot recovery; duplicate/gap handling; stale HTTP protection; EventSource cleanup; and terminal completion. Use Node Vitest for backend, DOM Vitest for frontend, and fake timers for simulations.

Real-browser verification covers all four catalogue entries; three successful runs; deterministic app-access failure; progressive logs/statuses; refresh mid-run; interrupted/restored connectivity; keyboard use; focus visibility; reduced motion; and a narrow viewport without page overflow.

Before completion run both test suites, both typechecks, both production builds, production-start smoke tests, and built-backend seed loading. Record exact commands and outcomes. Never claim an unperformed check passed.

## Definition of done

The repository contains complete source, contracts, four JSON seeds, validation, a generic runner, scripts/configuration, environment examples, tests, and exact local/Railway owner documentation. Valid seed edits affect behavior without runner edits. Logs stream progressively; refresh/reconnect recover without duplicate text; state is isolated; cleanup/retention work; ports and CORS work; built seed loading works; both services build with shared contracts; and the accessible responsive UI follows the visual direction. No required placeholders, pseudocode, or TODOs remain.
