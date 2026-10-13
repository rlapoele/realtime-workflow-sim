# AgentFlow Live

AgentFlow Live is a fictional service-desk workflow simulation delivered through reviewable phases. The current build provides a validated four-workflow catalogue and deterministic in-memory executions with sequenced live updates through a NestJS API and Astro/React interface. It does not contact real systems.

## Prerequisites

- Node.js 22.12 or newer
- npm 11 or newer

Docker is not required. The prototype has no database or external runtime dependency.

## Install

From the repository root:

```sh
npm ci
```

The root lockfile installs both `backend` and `frontend` workspaces.

## Environment

The checked-in examples contain safe local values:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend variables:

- `PORT` — API port, default `3000`
- `FRONTEND_ORIGIN` — exact browser origin allowed by CORS, default `http://localhost:4321`

Frontend variables:

- `PUBLIC_API_URL` — browser-visible API base URL; required during production builds
- `HOST` — production server host, locally `0.0.0.0`
- `PORT` — frontend port, locally `4321`

The local development fallback for `PUBLIC_API_URL` is `http://localhost:3000`. Production builds fail clearly when it is missing rather than silently targeting localhost.

## Development

Start both applications from the repository root:

```sh
npm run dev
```

Then open [http://localhost:4321](http://localhost:4321). Choose a fictional workflow and select **Run workflow**. Active runs disable workflow switching; status changes and logs arrive progressively through Server-Sent Events; terminal runs expose **Run again**. The execution ID is stored in the page URL, so refreshing restores retained state from an authoritative snapshot and resumes live updates without replaying historical log chunks.

The backend health endpoint is [http://localhost:3000/health](http://localhost:3000/health), and the public catalogue is [http://localhost:3000/workflows](http://localhost:3000/workflows). `POST /workflows/:workflowId/trigger` creates a new execution on every request and is therefore not safe to retry as an idempotent operation. `GET /executions/:executionId` returns its current authoritative snapshot. `GET /workflows/stream?executionId=...` opens the execution-scoped event stream.

The interface reports `connecting`, `connected`, `reconnecting`, `disconnected`, or `completed`. Sequence gaps recover through the authoritative GET endpoint, while duplicate and stale events are ignored. Heartbeats keep the stream observable without causing execution refetches.

The execution log follows new output while you remain near the bottom. Scrolling upward pauses that behavior and reveals **Jump to latest** so reading is never interrupted. The dashboard is keyboard-operable, reduced-motion aware, and responsive down to a 320 px viewport without page-level horizontal scrolling.

Execution data is process-local: restarting the backend clears it. The interface detects an expired or missing execution and offers a new-run recovery action. Completed history is capped at 50 runs and accumulated logs at 64,000 characters per execution; active runs are never removed by retention.

The root process stops both applications when you press `Ctrl+C`.

## Verification

For the complete owner-facing setup, production smoke procedure, troubleshooting, and manual browser matrix, use the [local release-candidate test guide](docs/local-testing.md).

Run the automated checks:

```sh
npm run test
npm run typecheck
npm run build
```

`npm run build` reads `PUBLIC_API_URL` from `frontend/.env`. Without an environment file, supply it explicitly:

```sh
PUBLIC_API_URL=http://localhost:3000 npm run build
```

After a successful build, start both production artifacts:

```sh
npm start
```

The individual production services are also available as `npm run start:backend` and `npm run start:frontend`. When starting one service with a non-default port, supply its `PORT` in that command's environment.

## Project map

```text
backend/   NestJS application and Node Vitest tests
frontend/  Astro server application, React island, and DOM Vitest tests
shared/    Cross-application TypeScript contracts
docs/      Product specification and accepted architecture decisions
tasks/     Phase plan, checklist, progress, and verification evidence
```

## Continue the phased build

Read `AGENTS.md`, `docs/specification.md`, `tasks/plan.md`, `tasks/todo.md`, and `tasks/progress.md`. The phrase **Proceed with the next step** authorizes only the current phase named in `tasks/progress.md`.

## Branch and deployment boundary

- `dev` is the GitHub default and routine implementation branch.
- `releases` is reserved for explicitly approved production-quality revisions and will eventually be Railway's source branch.
- `main` is the backup branch for accepted release state.

Codex does not deploy the application or mutate Railway configuration. Owner-run deployment instructions are deferred until the locally verified release candidate reaches Phase 7.
