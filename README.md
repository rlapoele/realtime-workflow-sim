# AgentFlow Live

AgentFlow Live is a fictional service-desk workflow simulation delivered through reviewable phases. Phase 1 provides the strict-TypeScript npm workspace, shared contracts, NestJS health API, and Astro/React application shell. Workflow catalogue and execution behavior are intentionally not implemented yet.

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

Then open [http://localhost:4321](http://localhost:4321). The backend health endpoint is [http://localhost:3000/health](http://localhost:3000/health).

The root process stops both applications when you press `Ctrl+C`.

## Verification

Run the automated Phase 1 checks:

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
