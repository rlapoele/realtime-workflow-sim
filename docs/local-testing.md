# Local release-candidate test guide

Use this guide to evaluate AgentFlow Live locally before deciding whether to deploy it. The prototype needs only Node.js and npm: it has no database, cloud credential, external integration, or Docker dependency.

## Prerequisites

From the repository root, confirm the supported toolchain:

```sh
node --version
npm --version
```

Node.js must be 22.12 or newer and npm must be 11 or newer.

## Install and configure

Install the exact dependency graph from the committed lockfile:

```sh
npm ci
```

For explicit local configuration, copy the safe examples once:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Do not overwrite existing `.env` files without reviewing them. The examples configure the backend at `http://localhost:3000`, the frontend at `http://localhost:4321`, and CORS for that exact frontend origin.

## Development run

Start both attached development services:

```sh
npm run dev
```

Open <http://localhost:4321>. The API health endpoint is <http://localhost:3000/health>. Press `Ctrl+C` in the starting terminal to stop both services.

If the host reaches a file-watcher limit, use the production run below; it does not require source watching.

## Automated release-candidate checks

Run the complete automated gate:

```sh
PUBLIC_API_URL=http://localhost:3000 npm run verify
```

This runs both test suites, both strict typechecks, and both production builds. The frontend URL is a build-time value; a production build without `PUBLIC_API_URL` must fail rather than silently target localhost.

The individual commands are:

```sh
npm run test
npm run typecheck
PUBLIC_API_URL=http://localhost:3000 npm run build
```

## Production run

After the production build succeeds, start both built services:

```sh
npm start
```

With the example environment files, the backend uses port `3000` and the frontend uses port `4321`. Press `Ctrl+C` to stop both processes.

To run the services in separate terminals instead:

```sh
PORT=3000 FRONTEND_ORIGIN=http://localhost:4321 npm run start:backend
```

```sh
HOST=0.0.0.0 PORT=4321 npm run start:frontend
```

Verify health and exact-origin CORS while both services are running:

```sh
curl -i -H 'Origin: http://localhost:4321' http://localhost:3000/health
```

Expect HTTP `200`, `access-control-allow-origin: http://localhost:4321`, and:

```json
{"service":"agentflow-backend","status":"ok"}
```

Confirm that the public catalogue contains exactly four workflows and no private simulation scripts:

```sh
curl -sS http://localhost:3000/workflows
```

## Manual browser checklist

Use a current desktop browser against the built application at <http://localhost:4321>.

### Catalogue and workflows

- [ ] The page says **Simulation**, exposes one **Workflow executions** heading, and never claims that external systems are connected.
- [ ] The selector contains exactly Application access, Employee onboarding, Password reset assistance, and Employee offboarding.
- [ ] Employee onboarding completes all five steps successfully.
- [ ] Password reset assistance completes successfully and never shows a credential, token, or usable reset link.
- [ ] Employee offboarding completes all five steps successfully.
- [ ] Application access succeeds through step 3, fails provisioning at step 4 because no simulated Editor licenses remain, skips step 5, and explains manual follow-up.

### Live execution and recovery

- [ ] During a run, workflow selection and the run action are disabled.
- [ ] Statuses and log lines appear progressively; logs are associated with the correct step and do not duplicate.
- [ ] Refresh the page during a run. The execution ID remains in the URL, accumulated state returns from the authoritative snapshot, and live updates resume.
- [ ] During another run, use browser developer tools to set the network offline briefly. The UI reports **Reconnecting**. Restore the network and confirm the execution converges without duplicated logs.
- [ ] Scroll the log console upward while output is arriving. Live following pauses and **Jump to latest** appears; activating it resumes following.
- [ ] After a terminal run, **Run again** is enabled and starts a fresh execution.
- [ ] Restarting the backend expires prior execution URLs; the page explains that state is unavailable and offers **Start a new run**.

### Keyboard and accessibility

- [ ] Press `Tab` from the top of the page. A visible **Skip to main content** link appears and moves focus to the main content.
- [ ] Reach the workflow selector using `Tab`; open and move through it with arrow keys, select with `Enter`, and close it with `Escape`.
- [ ] Toggle **Request context** from the keyboard and activate **Run workflow** without a pointer.
- [ ] Focus remains visible on every interactive control, and no keyboard trap occurs.
- [ ] Loading, errors, execution status, connection status, failures, and skipped steps are conveyed with text rather than color alone.
- [ ] Enable reduced motion in the browser or operating system and confirm that status icons do not spin and transitions are effectively removed.

### Responsive behavior

- [ ] At 390 by 844 CSS pixels, controls, execution summary, request context, workflow steps, and logs follow a logical reading order.
- [ ] At both 390 px and 320 px widths, the page has no horizontal scrollbar; long execution IDs and logs remain contained.
- [ ] At a desktop viewport, workflow steps and request context are adjacent and the log console remains below them.

## Troubleshooting

### Frontend production build rejects its API URL

Supply a browser-visible HTTP(S) URL during the build:

```sh
PUBLIC_API_URL=http://localhost:3000 npm run build --workspace=frontend
```

Changing `PUBLIC_API_URL` only when starting the already-built frontend does not rewrite the browser bundle; rebuild it.

### Browser reports a CORS error

`FRONTEND_ORIGIN` must exactly match the origin in the address bar, including scheme and port. For this guide it is `http://localhost:4321`.

### A port is already in use

Stop the existing process or select unused ports. When changing the backend port, rebuild the frontend with the matching `PUBLIC_API_URL`; when changing the frontend port, start the backend with the matching `FRONTEND_ORIGIN`.

### A refreshed execution is missing

Executions are intentionally in memory. A backend restart or completed-run retention can expire an execution; use **Start a new run**.

## Intended limitations

This is a fictional, single-process demonstration. It intentionally has no authentication, database, durable jobs, multiple backend replicas, real integrations, workflow editing, cancellation, retries, approval decisions, or execution-history browser. Deployment and Railway configuration are outside this local guide.
