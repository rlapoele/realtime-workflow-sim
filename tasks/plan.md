# Implementation plan: AgentFlow Live

## Overview

Build the specification in seven gated phases. Each phase produces a coherent review surface, preserves earlier behavior, records evidence, and stops. The plan begins with the integration-sensitive toolchain, then adds end-to-end capabilities in dependency order, and finishes with verification and owner-operated deployment instructions.

## Assumptions

- The pasted prompt is accepted as the product specification and has been normalized into `docs/specification.md` without intentionally changing scope.
- The workspace is a new project; `.idea/` is local IDE state and is ignored.
- No cloud resources or real third-party integrations are needed.
- The local repository starts on `dev`; `releases` is reserved for explicitly approved production promotion and `main` for explicitly approved release backup. GitHub's default branch must remain `dev`.
- Exact dependency versions and framework mechanics are verified from current official sources during the phase that introduces them.

## Dependency graph

```text
Phase 1: workspace, shared contracts, runnable shells
  └─ Phase 2: validated catalogue API + catalogue UI
       └─ Phase 3: execution engine/API + run UI
            └─ Phase 4: SSE sequencing/recovery + live cache
                 └─ Phase 5: final responsive/accessibility behavior
                      └─ Phase 6: cross-system hardening and release candidate
                           └─ Phase 7: Railway owner handoff
```

## Phase summary

| Phase | Reviewable outcome | Main risk retired |
|---|---|---|
| 1 | Both app shells and shared contracts install, test, typecheck, build, and start | workspace/shared-import and version compatibility |
| 2 | User can browse four backend-authored, validated workflows in the UI | seed schema/assets and catalogue contract |
| 3 | User can trigger and inspect deterministic isolated executions | state machine, failure/skipping, concurrency |
| 4 | A running execution updates through resilient SSE without duplicate logs | ordering, reconnect, stale HTTP/cache races |
| 5 | The complete dashboard meets visual, responsive, and accessibility requirements | UI composition, mobile overflow, console behavior |
| 6 | A release candidate passes automated, production-smoke, and browser checks | cleanup, retention, lifecycle and integration regressions |
| 7 | After local evaluation is ready, owner has verified instructions to deploy two Railway services | deployment configuration and environment handoff |

## Execution rules

- Detailed acceptance and verification live in `tasks/todo.md`.
- One user message advances at most one phase.
- If a phase fails verification, keep it current and set status to `blocked`; do not reduce the acceptance bar to advance.
- A phase may update later-phase detail as new facts emerge, but must not silently change accepted scope.
- Store evidence under `tasks/evidence/phase-N.md` and update `tasks/progress.md` last.

## Architecture decisions already fixed by the specification

- npm-workspaces monorepo; root-visible shared contracts for both Railway builds.
- NestJS/RxJS in-memory backend with JSON-authored definitions and a generic simulation runner.
- Astro server shell, one React dashboard island, Base UI-backed shadcn components, Heroicons, and TanStack Query v5.
- Authoritative GET snapshots plus sequenced named SSE events; direct cached log deltas and gap recovery.
- Two independently built/started Railway services, deployed manually by the owner.

Mechanics that remain open until implementation include the exact compatible package versions, internal NestJS module boundaries, runtime-schema placement, retention limits, event buffering strategy, and browser-test harness. Record material choices in ADRs.

## Risks and mitigations

| Risk | Impact | Mitigation/gate |
|---|---|---|
| Root `shared/` imports fail in one build/runtime | High | Prove dev, test, typecheck, production build, and start in Phase 1; recheck after Phase 6 |
| JSON seeds disappear from built backend | High | Choose and test explicit asset copying/loading in Phase 2 and production-start verification in Phase 6 |
| Snapshot subscription race loses an event | High | Design atomic ordering and adversarial tests in Phase 4 |
| Duplicate/reordered SSE or stale GET duplicates logs | High | Per-execution sequence reducer, gap recovery, stale-response tests in Phase 4 |
| Strict Mode creates duplicate EventSource listeners | Medium | Lifecycle tests plus browser observation in Phases 4 and 6 |
| Base UI/shadcn guidance has changed | Medium | Verify official current setup before scaffolding and preserve primitive semantics |
| `PUBLIC_API_URL` is supplied only at runtime | High | Document and validate frontend build-time configuration in Phases 1 and 7 |
| In-memory execution limits are unclear | Medium | Select bounded retention/log limits, test active-run safety, document prototype constraint |
| Visual polish hides operational state | Medium | Status-first design, contrast/accessibility checks, restrained decoration in Phase 5 |
| Railway instructions drift | Medium | Re-check current official Railway documentation in Phase 7; do not deploy |
| Local testing depends on unnecessary infrastructure | Medium | Keep Node/npm as the default; require a concrete reason and user notice before introducing Docker |
| Routine work accidentally triggers Railway | High | Work only on `dev`; require explicit approval before updating or pushing `releases` |
| Backup and production roles are conflated | Medium | Keep `main` non-default and synchronize it only as an explicit verified backup operation |

## Human checkpoints

The user reviews after every phase. Particularly important decisions are:

- after Phase 1: repository/toolchain shape and resolved versions;
- after Phase 2: seed schema and displayed fictional content;
- after Phase 4: event and recovery contract;
- after Phase 5: desktop/mobile visual result;
- after Phase 6: release-candidate evidence;
- after Phase 6: owner-facing local commands and browser checklist, usable before any deployment decision;
- after Phase 7: deployment instructions before the owner acts.

## Open questions

No question blocks Phase 1. The plan intentionally defers exact retention values and package versions to evidence-backed implementation decisions. If official current constraints conflict with the specified stack, stop and present the smallest viable options.
