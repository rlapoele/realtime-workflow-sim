# Phase 6 evidence: Hardening and release-candidate verification

- Date: 2026-10-13
- Outcome: complete
- Scope completed: specification audit, frontend import-boundary normalization, lifecycle and retention regression coverage, HTTP response hardening, clean-install and release-candidate verification, all-scenario production-browser review, and an owner-facing local test guide.

## Automated verification

| Command | Result | Notes |
|---|---|---|
| `npm ci --cache /private/tmp/agentflow-npm-cache` | pass | Installed 462 packages from the committed root lockfile and audited 465 packages with zero vulnerabilities. npm reported its script-approval state for `esbuild` and optional `fsevents`; the locked platform packages still completed every test and build below. |
| `npm run test --workspace=frontend -- import-boundaries.test.ts` | pass | The test failed first with 19 cross-directory relative imports, then passed after normalization. Same-directory relatives and the explicit root `shared/` boundary remain allowed. |
| `npm run test --workspace=backend -- execution-service.test.ts execution-stream.test.ts` | pass | Added active-run retention safety and stream/heartbeat shutdown coverage. A temporary removal of stream completion made the new shutdown test fail before the source was restored. |
| `npm run test --workspace=frontend -- security-headers.test.ts` | pass | Covers the frontend CSP API origin, frame policy, referrer policy, and content-type protections. |
| `PUBLIC_API_URL=http://localhost:3000 npm run verify` | pass | Final clean-dependency gate: 49 backend tests and 35 frontend tests passed; strict backend TypeScript and Astro diagnostics passed with zero errors/warnings/hints; both production builds passed. |
| `npm audit --audit-level=low` | pass | Zero known vulnerabilities in the locked graph. |
| `npm audit signatures` | pass | 460 packages had verified registry signatures and 135 had verified attestations. |
| `npm start`, then local `curl` checks against ports 3000 and 4321 | pass | Both freshly built services returned HTTP 200. `/health` returned the service contract, exact-origin CORS allowed `http://localhost:4321`, the public catalogue exposed four definitions without simulation scripts, and both services stopped under `Ctrl+C`/SIGTERM. |
| `PORT=3102 FRONTEND_ORIGIN=http://localhost:4321 node '<repository>/backend/dist/backend/src/main.js'` from `/private/tmp` | pass | The built backend started outside the repository working directory and loaded all four seed IDs. It was stopped after the check. |
| Repository scans for credentials/private keys, tracked secret files, required `TODO`/`FIXME`, suppressions, debug logging, unsafe DOM sinks, and executable reset links | pass | No credential/private-key history match or required placeholder/dead-code marker was found. Only safe `.env.example` files are tracked; the password-reset seed explicitly generates no credential, token, or usable link. |
| `git diff --check` | pass | No whitespace errors in the complete Phase 6 diff. |

## Manual verification

- [x] Ran all four workflows in the built application using headed Chromium. Employee onboarding, employee offboarding, and password reset each completed five of five steps; application access succeeded through step 3, failed step 4 for simulated Figma Editor capacity, skipped step 5, and exposed the manual-follow-up reason.
- [x] Refreshed two seconds into an active onboarding run. The `executionId` remained unchanged, the authoritative state returned, live updates resumed, and the run converged successfully.
- [x] Aborted only the active SSE route during a run. The UI exposed **Reconnecting**; after restoring the route it returned to **Connected**, converged to five successful steps, and did not duplicate logs. Browser offline emulation did not surface the state within the initial eight-second assertion, so the deterministic route-abort method was used instead.
- [x] Verified progressive statuses/logs, disabled active controls, terminal **Run again**, paused live following after upward console scroll, visible **Jump to latest**, and bottom-follow restoration.
- [x] Verified first-Tab skip-link focus and activation, keyboard opening/navigation/Escape for the Base UI selector, Enter toggling for request context, visible desktop focus treatment, and no keyboard trap in the exercised path.
- [x] Emulated `prefers-reduced-motion: reduce`; the media query matched and Phase 5's motion-reduction rules remained active.
- [x] Measured no page-level horizontal overflow at 390 by 844 and 320 by 844 CSS pixels. Reviewed the narrow and 1440 by 1000 desktop screenshots under `output/playwright/phase-6/.playwright-cli/`.
- [x] After a clean final navigation, the production-browser console reported zero errors and zero warnings.
- [x] Inspected production response headers. Nest's security headers removed `X-Powered-By` and added CSP, content-type, frame, and related protections; Astro middleware added a CSP constrained to self plus the configured API origin, frame denial, referrer policy, permissions policy, HSTS, and content-type protection.

## Specification and definition-of-done mapping

| Specification area | Evidence |
|---|---|
| Product/scope and original simulation UI | Phase 5 visual/accessibility evidence plus the Phase 6 four-workflow browser matrix; no external integration or real credential was introduced. |
| Required stack, root contracts, scripts, and environment | Phase 1 evidence and the final clean `npm run verify`; import-boundary enforcement proves Astro, Vitest, TypeScript, and production resolution. |
| JSON-authored definitions and runtime validation | Phase 2 evidence plus seed-loader tests for four files, invalid fields, duplicates, versions, references, durations, logs, and scenario consistency; built loading from `/private/tmp` passed. |
| Generic execution behavior and isolation | Phase 3 evidence plus the parameterized success tests, deterministic failure/skipping test, concurrent fresh-state test, and all-scenario browser review. |
| Sequenced SSE and recovery | Phase 4 evidence plus Phase 6 refresh and route-interruption recovery; duplicate/gap/stale-response/cache-delta/cleanup behavior remains covered by frontend and backend tests. |
| Bounded retention, logs, timers, and subscriptions | Phase 3 limits plus Phase 6 active-run non-eviction and application/stream shutdown tests; production processes also stopped cleanly. |
| Accessible responsive presentation | Phase 5 evidence plus Phase 6 keyboard, focus, status-text, reduced-motion, console, 390 px, 320 px, and desktop checks. |
| Local runtime and evaluation contract | Clean install, full gate, production start, health/CORS, non-repository seed load, and `docs/local-testing.md`; no Docker, cloud credential, or external dependency is required. |
| Exact Railway owner documentation | Intentionally remains the sole documentation deliverable for Phase 7. No deployment, repository connection, branch promotion, push, tag, domain, or Railway mutation occurred in Phase 6. |
| Complete source with no required placeholders | Final source/config/tests/seeds are present; scoped scans and diff review found no required placeholders, pseudocode, dead debug code, or unsupported product claim. |

## Files and decisions

- Key files changed: frontend source/test imports and import policy test; backend execution/stream regression tests; Nest and Astro security headers; `docs/local-testing.md`; README verification link; Phase 6 tracking and evidence.
- Decisions recorded: no ADR was needed. The existing `@/` frontend alias is enforced only across frontend directories; same-directory relatives remain local, and root `shared/` contracts retain their explicit relative boundary. Header middleware is a reversible delivery concern and does not change the workflow/SSE protocol.
- Implementation commits: `fd7e9a3` (`refactor: normalize frontend import boundaries`), `9431caa` (`test: cover retention and shutdown boundaries`), and `3db7cea` (`security: harden production HTTP responses`).
- Specification deviations: none.

## Remaining risks

- The intentionally unauthenticated, in-memory, single-process demo has no rate limit or durable/multi-replica execution state. These are explicit prototype exclusions; a public deployment should be treated as a bounded demonstration and monitored for resource use.
- Astro hydration currently requires inline script/style allowances in the frontend CSP. Other origins remain denied and the API connection is restricted to the configured origin; nonce/hash hardening is deferred because it would add delivery complexity outside this prototype's scope.
- Browser verification used Chromium. There is no automated screen-reader or axe suite; component semantics, accessibility snapshots, keyboard/focus checks, contrast evidence, status text, and reduced-motion checks cover the accepted boundary.
- Exact Railway setup, watch paths, cost notes, and rollback instructions are intentionally deferred to Phase 7 and must be verified against then-current official Railway documentation before owner use.

## Next phase readiness

- [x] All Phase 6 acceptance criteria in `tasks/todo.md` are evidenced.
- [x] Earlier phase checks still pass.
- [x] The owner-facing local test guide is complete, so Phase 7 may begin only after a new user instruction.
- [x] `tasks/progress.md` is accurate.
