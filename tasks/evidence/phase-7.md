# Phase 7 evidence: Railway owner handoff

- Date: 2026-10-16
- Outcome: complete
- Scope completed: current official Railway guidance review; read-only reconciliation with the owner's existing Railway Web UI project; exact two-service settings, domains, variables, health checks, watch paths, branch promotion boundary, smoke checks, troubleshooting, Hobby cost controls, rollback guidance, and final README handoff.

## Automated verification

| Command | Result | Notes |
|---|---|---|
| `npm run build --workspace=@agentflow/backend` | pass | Verified Railway's staged scoped backend build command; TypeScript compiled and production seeds were copied. |
| `PUBLIC_API_URL=http://localhost:3000 npm run build --workspace=@agentflow/frontend` | pass | Verified Railway's staged scoped frontend build command with its required build-time API URL. |
| `PUBLIC_API_URL=http://localhost:3000 npm run verify` | pass | Current `dev` revision passed 49 backend tests, 40 frontend tests, both strict typechecks, Astro diagnostics with zero errors/warnings/hints, and both production builds. |
| `git log -8 --oneline --decorate`, `git remote -v`, `git branch -vv`, and `git symbolic-ref --short refs/remotes/origin/HEAD` | pass | Confirmed clean work began on `dev`; `dev`, `origin/dev`, and `origin/HEAD` were at `9ffb743`, while `main` and `releases` remained at the older accepted backup revision. No branch was switched, promoted, or pushed. |
| `git diff --check` | pass | No whitespace errors in the final Phase 7 documentation and tracking diff. |

## Manual verification

- [x] Checked current official Railway documentation for monorepos, Railpack Node/npm workspaces, build and start overrides, variables, Astro client variables, public domains, GitHub autodeploys, health checks, watch paths, Hobby pricing/cost controls, and rollback semantics on 2026-10-16.
- [x] Inspected the existing Railway project read-only. It showed staged `@agentflow/backend` and `@agentflow/frontend` services from `rlapoele/realtime-workflow-sim`, both targeting `releases`, with Root Directory unset, Railpack, scoped build/start commands, and only the initial service-specific watch path. Public domains, cross-service variables, and health checks were not configured.
- [x] Reviewed Railway's staged-change summary: 14 unapplied changes represented the two new services plus their detected branch, repository, builder, build command, start command, and initial watch pattern. No **Deploy Changes** action was selected.
- [x] Dry-ran the owner guide from the observed Web UI state through complete service settings, deterministic installs, two-pass domain and URL/CORS setup, explicit release promotion gate, deployment observation, HTTP/browser smoke checks, troubleshooting, rollback, and post-acceptance `main` backup synchronization.
- [x] Confirmed the README links both the local evaluation/limitations guide and the Railway owner deployment guide.
- [x] No Railway or GitHub setting, domain, variable, branch, tag, remote, deployment, or credential was created or changed.

## Files and decisions

- Key files changed: `docs/railway-deployment.md`, `README.md`, `tasks/todo.md`, `tasks/progress.md`, and this evidence file.
- Decisions recorded: use the already-detected services and scoped npm workspace commands; retain repository-root build access; configure addresses before cross-service variables; keep one backend replica and Serverless off because execution state is process-local; require an explicit owner decision before the `releases` push that triggers production.
- Official sources: Railway [monorepos](https://docs.railway.com/deployments/monorepo), [build configuration](https://docs.railway.com/builds/build-configuration), [variables](https://docs.railway.com/variables), [frontend variables](https://docs.railway.com/guides/frontend-environment-variables), [domains](https://docs.railway.com/networking/domains/working-with-domains), [health checks](https://docs.railway.com/deployments/healthchecks), [GitHub autodeploys](https://docs.railway.com/deployments/github-autodeploys), [pricing](https://docs.railway.com/pricing), [cost controls](https://docs.railway.com/pricing/cost-control), and [rollback](https://docs.railway.com/guides/roll-back-bad-deploy); Railpack [Node](https://railpack.com/languages/node) and [recommendations](https://railpack.com/config/recommendations).
- Specification deviations: none.

## Remaining risks

- No live deployment was performed, so Railway build logs, assigned domains, live health checks, cross-origin browser traffic, costs, and rollback remain owner-verifiable post-deployment outcomes rather than claimed evidence.
- Railway's UI, plan limits, and prices can change. The guide carries its verification date and links the current official sources for re-checking.
- The public application remains an intentionally unauthenticated, single-process, in-memory demo. The guide keeps one backend replica, documents restart state loss, recommends usage monitoring, and prohibits confidential or production data.

## Next phase readiness

- [x] All Phase 7 acceptance criteria in `tasks/todo.md` are evidenced.
- [x] Earlier phase checks still pass on the final `dev` revision.
- [x] `tasks/progress.md` marks the planned project complete.
- [x] Deployment, release promotion, and backup synchronization remain explicit owner decisions.
