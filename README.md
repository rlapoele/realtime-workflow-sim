# AgentFlow Live

AgentFlow Live is a planned service-desk workflow simulation built as a strict-TypeScript npm-workspaces monorepo with NestJS, Astro, React, TanStack Query, and Server-Sent Events.

The repository is currently in the planning checkpoint. Product implementation has deliberately not started.

Local use is a release gate, not an afterthought. Before any Railway handoff, the finished application must install and run locally with ordinary Node/npm commands, and the README must include a browser checklist for all four workflows, refresh/reconnect behavior, mobile layout, and keyboard use. Docker is not expected because the prototype has no database or external runtime dependency.

## Continue the project

Review these files in order:

1. `AGENTS.md` — rules for phased work and session handoff.
2. `docs/specification.md` — authoritative product and technical requirements.
3. `tasks/plan.md` — seven-phase implementation sequence and risks.
4. `tasks/todo.md` — acceptance criteria and verification checklist.
5. `tasks/progress.md` — the only source of truth for the next phase.

After reviewing the plan, tell Codex: **Proceed with the next step.** Codex must complete only the phase named in `tasks/progress.md`, record verification evidence, update progress, and stop for review.

## Branch model

- `dev` is the default branch and the only branch for routine implementation work.
- `releases` contains production-quality revisions. Railway will be configured to deploy from this branch after the owner explicitly approves a promotion and push.
- `main` is the backup branch for the last accepted release state; it is not the default and does not trigger deployment.

See `docs/decisions/0002-three-branch-release-workflow.md` for promotion safeguards. No remote repository is configured yet.

## Deployment boundary

The project is intended to become Railway-ready, but Codex must not deploy it or create Railway resources. Phase 7 produces and verifies exact instructions for the owner to deploy the two services manually.
