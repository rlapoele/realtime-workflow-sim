# AgentFlow Live

AgentFlow Live is a responsive, accessible service-desk simulation that runs predefined IT workflows step by step with real-time statuses, progressive logs, deterministic outcomes, and reconnect-safe execution recovery.

**Live demo:** [agentflowfrontend-production.up.railway.app](https://agentflowfrontend-production.up.railway.app)

The hosted application tracks `releases` and can lag behind the current `dev` branch.

The application uses fictional data and simulated operations only. It does not contact identity providers, HR systems, messaging platforms, device-management tools, or other external services. The public demo is unauthenticated, so do not enter confidential or production data.

## What it demonstrates

- Four JSON-authored service-desk scenarios: application access, employee onboarding, password reset assistance, and employee offboarding.
- A generic NestJS execution engine with isolated in-memory runs, deterministic success/failure, bounded logs, and active-run admission control.
- Sequenced Server-Sent Events with authoritative snapshots, progressive log deltas, refresh restoration, reconnect recovery, and stale/duplicate-event protection.
- An Astro and React interface built with TanStack Query, Tailwind CSS, Base UI-backed shadcn components, and Heroicons.
- Responsive behavior down to 320 px, keyboard operation, visible focus, reduced-motion support, text-based statuses, and usable log autoscroll controls.
- The current development revision adds public-demo safeguards on workflow starts: 3 requests per 10 seconds and 10 per minute per client, plus a maximum of 25 simultaneous active executions.

## Architecture

- `backend/` contains the NestJS/RxJS API, validated workflow seeds, execution runtime, SSE stream, and Node-based tests.
- `frontend/` contains the Astro server application and React dashboard island, with TanStack Query managing catalogue and execution state.
- `shared/` is the single source for cross-application TypeScript contracts and runtime schemas.
- Workflow definitions are immutable JSON-authored inputs; execution state is fresh, mutable, process-local, and intentionally non-durable.
- The browser restores state through authoritative HTTP snapshots and receives ordered incremental updates through execution-scoped SSE connections.

## Prerequisites

- Node.js 22.12 or newer
- npm 11 or newer

Docker is not required. The prototype has no database or external runtime dependency.

## Quick start

From the repository root:

```sh
npm ci
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev
```

Then open [http://localhost:4321](http://localhost:4321). The root lockfile installs both workspaces, and the checked-in environment examples contain safe local values.

Press `Ctrl+C` in the starting terminal to stop both services.

## Environment

Backend variables:

- `PORT` — API port, default `3000`
- `FRONTEND_ORIGIN` — exact browser origin allowed by CORS, default `http://localhost:4321`

Frontend variables:

- `PUBLIC_API_URL` — browser-visible API base URL; required during production builds
- `HOST` — production server host, locally `0.0.0.0`
- `PORT` — frontend port, locally `4321`

The local development fallback for `PUBLIC_API_URL` is `http://localhost:3000`. Production builds fail clearly when it is missing rather than silently targeting localhost.

## Runtime behavior

Choose a fictional workflow and select **Run workflow**. Active runs disable workflow switching; status changes and logs arrive progressively through Server-Sent Events; terminal runs expose **Run again**. The execution ID is stored in the page URL, so refreshing restores retained state from an authoritative snapshot and resumes live updates without replaying historical log chunks.

The backend health endpoint is [http://localhost:3000/health](http://localhost:3000/health), and the public catalogue is [http://localhost:3000/workflows](http://localhost:3000/workflows). `POST /workflows/:workflowId/trigger` creates a new execution on every accepted request and is therefore not safe to retry as an idempotent operation. That route alone is limited per client to 3 requests per 10 seconds and 10 per minute; the service also admits at most 25 simultaneous non-terminal executions. Either limit returns HTTP `429` through the shared error envelope. Accepted trigger responses expose rate-limit headers, while time-window rejections include the applicable retry header. `GET /executions/:executionId` returns its current authoritative snapshot. `GET /workflows/stream?executionId=...` opens the execution-scoped event stream.

The interface reports `connecting`, `connected`, `reconnecting`, `disconnected`, or `completed`. Sequence gaps recover through the authoritative GET endpoint, while duplicate and stale events are ignored. Heartbeats keep the stream observable without causing execution refetches.

The execution log follows new output while you remain near the bottom. Scrolling upward pauses that behavior and reveals **Jump to latest** so reading is never interrupted. The dashboard is keyboard-operable, reduced-motion aware, and responsive down to a 320 px viewport without page-level horizontal scrolling.

Execution data and admission controls are process-local: restarting the backend clears them. The interface detects an expired or missing execution and offers a new-run recovery action. Completed history is capped at 50 runs and accumulated logs at 64,000 characters per execution; active runs are never removed by retention, while new runs are rejected after the active-run cap is reached.

## Commands

For the complete owner-facing setup, production smoke procedure, troubleshooting, manual browser matrix, and intended prototype limitations, use the [local release-candidate test guide](docs/local-testing.md).

| Command | Purpose |
|---|---|
| `npm run dev` | Start the backend and frontend development servers. |
| `npm run test` | Run the backend and frontend test suites. |
| `npm run typecheck` | Run strict backend TypeScript and Astro frontend checks. |
| `PUBLIC_API_URL=http://localhost:3000 npm run build` | Build both production applications with an explicit browser API URL. |
| `PUBLIC_API_URL=http://localhost:3000 npm run verify` | Run tests, typechecks, and both production builds. |
| `npm start` | Start both previously built production artifacts. |

The individual production services are also available as `npm run start:backend` and `npm run start:frontend`. When starting one service with a non-default port, supply its `PORT` in that command's environment.

## Verification

Run the complete automated gate:

```sh
PUBLIC_API_URL=http://localhost:3000 npm run verify
```

`npm run build` reads `PUBLIC_API_URL` from `frontend/.env`. Without an environment file, supply it explicitly:

```sh
PUBLIC_API_URL=http://localhost:3000 npm run build
```

After a successful build, start both production artifacts with:

```sh
npm start
```

## Project map

```text
backend/   NestJS application and Node Vitest tests
frontend/  Astro server application, React island, and DOM Vitest tests
shared/    Cross-application TypeScript contracts
docs/      Product specification and accepted architecture decisions
tasks/     Phase plan, checklist, progress, and verification evidence
```

## Documentation

- [Product and technical specification](docs/specification.md)
- [Local release-candidate test guide](docs/local-testing.md)
- [Railway owner deployment guide](docs/railway-deployment.md)
- [Architecture decisions](docs/decisions/)
- [Implementation progress and verification evidence](tasks/progress.md)

## Branch and deployment boundary

- `dev` is the GitHub default and routine implementation branch.
- `releases` is reserved for explicitly approved production-quality revisions and is Railway's source branch.
- `main` is the backup branch for accepted release state.

The live Railway services follow `releases`; development changes on `dev` may therefore not yet be deployed. Railway configuration, release promotion, and backup synchronization remain explicit owner-operated actions. Follow the [Railway owner deployment guide](docs/railway-deployment.md) for repository-root builds, domains, variables, health checks, watch paths, smoke tests, cost controls, rollback, and the prototype's public-deployment boundary.
