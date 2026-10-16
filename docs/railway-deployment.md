# Railway owner deployment guide

Use this guide after the [local release-candidate test guide](local-testing.md) passes and you decide to publish AgentFlow Live. These are owner-operated Railway Web UI and Git commands. Codex has verified the repository and the instructions, but has not deployed the application, changed Railway, promoted a branch, or pushed a release.

The Railway guidance and pricing links in this document were checked on 2026-10-16. Re-check them before a later deployment because the product UI, limits, and prices can change.

## Current handoff state

The existing Railway project already contains two staged services detected from the GitHub repository:

- `@agentflow/backend`
- `@agentflow/frontend`

Both services point to the `releases` branch. Railway has staged their Railpack builder, scoped workspace build/start commands, and one service-specific watch path, but the changes have not been applied or deployed. Do not select **Deploy** yet: the current `releases` branch is still the old backup revision, and domains, variables, health checks, and complete watch paths must be prepared first.

## Deployment invariants

- Keep GitHub's default branch and `origin/HEAD` on `dev`.
- Keep both Railway services on `releases`. A push to `releases` triggers production builds and deployments, so promotion and push always require an explicit owner decision.
- Keep `main` as the backup of the last accepted release. It is neither the development branch nor Railway's source.
- Leave **Root Directory** empty for both services. The workspace build needs the root `package.json`, root lockfile, and `shared/` contracts. Railway documents that commands run inside a configured root directory, and its [monorepo guide](https://docs.railway.com/deployments/monorepo) distinguishes isolated roots from shared JavaScript workspaces.
- Keep exactly one backend replica. Executions and SSE subscriptions are process-local; multiple backend replicas are outside this prototype's contract.
- Keep **Serverless** disabled for the initial deployment. Sleeping or restarting the backend discards in-memory executions, and a cold start would interrupt the intended live demonstration.
- Do not add `PORT`. Railway supplies it to each deployment, and both applications already listen on `0.0.0.0`.

## 1. Complete both staged service settings

Open each service's **Settings** page. Keep **Builder** set to **Railpack** and Root Directory unset.

### Backend

Use these exact commands:

```text
Build Command: npm run build --workspace=@agentflow/backend
Start Command: npm run start --workspace=@agentflow/backend
```

Keep the existing `/backend/**` watch path and add these patterns, one per entry:

```text
/shared/**
/package.json
/package-lock.json
```

`/backend/**` already includes `backend/seeds/workflows/*.json`, so seed edits rebuild the backend.

Set **Healthcheck Path** to:

```text
/health
```

### Frontend

Use these exact commands:

```text
Build Command: npm run build --workspace=@agentflow/frontend
Start Command: npm run start --workspace=@agentflow/frontend
```

Keep the existing `/frontend/**` watch path and add:

```text
/shared/**
/package.json
/package-lock.json
```

Set **Healthcheck Path** to:

```text
/
```

Railway watch paths are repository-root-relative gitignore-style patterns. A deployment is skipped when none matches; see [Build Configuration](https://docs.railway.com/builds/build-configuration). Health checks accept a deployment only after the configured endpoint returns a `2xx`; they are a deployment gate, not continuous uptime monitoring. See [Healthchecks](https://docs.railway.com/deployments/healthchecks).

## 2. Configure deterministic installs

On the **Variables** page for both services, add:

```text
RAILPACK_NODE_NPM_INSTALL=npm ci
```

The repository has one committed npm lockfile, and `npm ci` is the locally verified clean-install command. Railpack supports npm workspaces and documents this install override in its [Node provider](https://railpack.com/languages/node) and [configuration recommendations](https://railpack.com/config/recommendations).

On the frontend service also add:

```text
HOST=0.0.0.0
```

Do not copy local `.env` files into Railway. The remaining public URL variables are configured in the next two passes.

## 3. Configure public addresses, then cross-service values

This is deliberately a two-pass setup: establish both public addresses first, then use those exact addresses for frontend build-time configuration and backend CORS.

### Pass A: generate both public domains

For each service, open **Settings → Networking → Public Networking** and select **Generate Domain**. Railway does not assign a public domain automatically; generated domains receive HTTPS. See [Working with Domains](https://docs.railway.com/networking/domains/working-with-domains) and [Public Networking](https://docs.railway.com/networking/public-networking).

Record the two origins without a trailing slash:

```text
Backend origin:  https://<backend-domain>
Frontend origin: https://<frontend-domain>
```

The backend must be public because browser JavaScript cannot resolve a Railway private-network hostname.

### Pass B: add the cross-service variables

On `@agentflow/frontend`, add:

```text
PUBLIC_API_URL=https://<backend-domain>
```

On `@agentflow/backend`, add:

```text
FRONTEND_ORIGIN=https://<frontend-domain>
```

Use the Railway variable-reference picker for `RAILWAY_PUBLIC_DOMAIN` if desired, selecting the other service and prefixing its hostname with `https://`. With scoped service names, prefer the picker over typing reference syntax manually. Otherwise, paste the generated HTTPS origin directly; these public origins are not credentials.

`PUBLIC_API_URL` is exposed to browser code and is embedded by Astro during the frontend build. Changing it requires a frontend rebuild/redeploy; restarting an already-built frontend is insufficient. `FRONTEND_ORIGIN` is an exact CORS origin and must match the browser address bar, including scheme and hostname, with no path or trailing slash. Railway makes service variables available during builds and runtime; see [Using Variables](https://docs.railway.com/variables) and [Frontend Environment Variables](https://docs.railway.com/guides/frontend-environment-variables).

Before continuing, review Railway's staged-change summary. It should include both service definitions, the settings above, both domains, and all variables. Do not place credentials or personal production data in any variable.

## 4. Promote an approved revision

This action is intentionally separate from Phase 7 documentation. Perform it only after reviewing the complete local guide and explicitly deciding to release the current `dev` revision.

Before promotion, verify that `dev` is clean and synchronized:

```sh
git switch dev
git status --short
git fetch origin
git pull --ff-only origin dev
PUBLIC_API_URL=http://localhost:3000 npm run verify
```

`git status --short` must print nothing, and the verification command must pass. Then fast-forward and push `releases`:

```sh
git switch releases
git pull --ff-only origin releases
git merge --ff-only dev
git push origin releases
git switch dev
```

The `git push origin releases` command is the production trigger. Stop before it if you have not explicitly approved the deployment. Never resolve a non-fast-forward result by forcing the branch; return to `dev`, inspect the graph, and reconcile it deliberately.

Railway automatically deploys pushes to a service's connected branch. Confirm both services still show `releases` under **Settings → Source**; see [GitHub Autodeploys](https://docs.railway.com/deployments/github-autodeploys).

For the first release, Railway may show the already-staged **Deploy Changes** action in addition to the GitHub-triggered source revision. Review its summary and apply the prepared settings only when the promoted `releases` revision is visible. Do not create another service or change either service to `dev` or `main`.

## 5. Observe the deployment

Watch both deployment logs. A successful deployment must show:

- dependencies installed with `npm ci`;
- the scoped workspace build command completing;
- the service starting with the scoped workspace start command;
- the configured health check returning `2xx`;
- the new deployment becoming active only after the health check passes.

Do not infer success from a completed build alone. Confirm both services are active and their public domains resolve over HTTPS.

## 6. Post-deployment smoke checks

Replace the placeholders with the two generated domains.

Verify backend health:

```sh
curl -i https://<backend-domain>/health
```

Expect HTTP `200` and:

```json
{"service":"agentflow-backend","status":"ok"}
```

Verify exact-origin CORS:

```sh
curl -i \
  -H 'Origin: https://<frontend-domain>' \
  https://<backend-domain>/health
```

Expect `access-control-allow-origin: https://<frontend-domain>`.

Verify the public catalogue:

```sh
curl -sS https://<backend-domain>/workflows
```

It must expose four fictional workflow definitions and no private simulation scripts.

Open `https://<frontend-domain>` in a current desktop browser and confirm:

- the page identifies itself as a simulation and lists all four workflows;
- Employee onboarding reaches five successful steps;
- Application access fails deterministically at provisioning, skips the final step, and explains manual follow-up;
- statuses and logs progress live through SSE without a CORS, mixed-content, or console error;
- refreshing during a run restores the same retained execution and resumes updates;
- the narrow layout has no page-level horizontal overflow.

Repeat the relevant accessibility and recovery checks from the [local test guide](local-testing.md). A backend deployment or restart clears active and retained executions by design.

## Troubleshooting

### The frontend build says `PUBLIC_API_URL` is required

Add `PUBLIC_API_URL` to the frontend service before building and redeploy the frontend. A restart does not replace its build-time value.

### Shared contracts cannot be resolved

Remove any service Root Directory. Both services must build with repository-root access, and `/shared/**`, `/package.json`, and `/package-lock.json` must be present in both watch-path lists.

### The browser reports a CORS error

Compare `FRONTEND_ORIGIN` with the frontend address bar. The values must match exactly and use `https`; remove paths and trailing slashes. After correcting it, redeploy the backend.

### A service builds but returns `502`

Do not define a fixed `PORT`. Confirm the service starts with the documented command and listens on Railway's injected port. Keep `HOST=0.0.0.0` on the frontend.

### A seed change does not deploy

Confirm the backend still has `/backend/**`. Seed files live below that path. Root contracts and lockfile changes require the additional shared and root patterns documented above.

### The frontend still calls an old API domain

Redeploy the frontend after changing `PUBLIC_API_URL`. The value is compiled into the browser bundle.

### A refreshed execution disappeared

The backend keeps executions only in memory. A restart, rollback, redeploy, or retention expiry makes an old execution unavailable; start a new run.

## Hobby cost awareness

As checked on 2026-10-16, Railway Hobby costs $5 per month and includes $5 of monthly resource usage; usage above that amount is charged. Builds are not billed as service runtime, while CPU, memory, storage, and network egress are usage-based. Confirm current figures on Railway's [Pricing](https://docs.railway.com/pricing) page.

For this prototype:

- keep one replica per service and one backend replica in particular;
- inspect the Usage dashboard after deployment;
- consider a $5 compute email alert;
- optionally set the minimum $10 compute hard limit only if taking all workloads offline at that threshold is acceptable;
- do not lower replica CPU or memory limits blindly—limits that are too small cause crashes;
- leave Serverless off initially because backend sleep discards in-memory execution state and adds cold-start behavior to the live demo.

Railway separates soft email alerts from hard limits. A compute hard limit takes workloads offline when reached; see [Cost Control](https://docs.railway.com/pricing/cost-control).

## Rollback, redeploy, and backup

If a new Railway deployment is unhealthy, select the previous successful deployment and use **Rollback**. Railway creates a new active deployment from the previous image and its associated variables without rebuilding. See [Roll Back a Bad Deploy](https://docs.railway.com/guides/roll-back-bad-deploy).

Use the terms precisely:

- **Rollback** restores a previous deployment image and variables.
- **Redeploy** rebuilds the selected source revision with its deployment configuration.
- **Restart** reuses the current built image; it does not rebuild `PUBLIC_API_URL`.

After containment, fix forward on `dev`, repeat local verification, and require a new explicit owner decision before promoting and pushing `releases` again. Do not force-push production history.

Only after the deployed release passes the smoke checks should the owner explicitly synchronize the accepted release to the backup branch:

```sh
git switch main
git pull --ff-only origin main
git merge --ff-only releases
git push origin main
git switch dev
```

This backup synchronization is not part of deployment and must not be performed before the release is accepted.

## Intended production boundary

This remains a bounded fictional demonstration: unauthenticated, single-process, and in-memory, with no database, durable jobs, real integrations, rate limiting, multi-replica execution state, or execution history. Treat its public URL as a demo endpoint, monitor usage, and do not enter confidential or production data.
