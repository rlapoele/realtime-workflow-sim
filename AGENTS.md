# Agent instructions for AgentFlow Live

## Mission

Build the AgentFlow Live prototype described in `docs/specification.md` through reviewable, independently verifiable phases. Never implement more than one phase in response to **Proceed with the next step**.

## Authoritative context

Read these files before changing the repository:

1. `AGENTS.md`
2. `docs/specification.md`
3. `tasks/plan.md`
4. `tasks/todo.md`
5. `tasks/progress.md`
6. Evidence for completed phases under `tasks/evidence/`, when present

Requirement priority is: the user's latest explicit instruction, then `docs/specification.md`, then accepted decisions under `docs/decisions/`, then `tasks/plan.md`. `tasks/progress.md` controls only execution state; it cannot weaken the specification.

If the documents conflict in a way that affects behavior, architecture, scope, or acceptance, stop and ask the user. Do not silently choose one.

## Meaning of “Proceed with the next step”

1. Inspect `git status --short` when Git is available and preserve unrelated user changes.
2. Read the current phase in `tasks/progress.md` and the matching section in `tasks/todo.md`.
3. State assumptions and the phase boundary before implementation.
4. Execute exactly that phase. Do not begin work assigned to the following phase.
5. Run every verification item for the phase. Report any check that cannot be run; never infer a pass.
6. Review the scoped diff and run `git diff --check` when Git is available.
7. Create or update `tasks/evidence/phase-N.md` from the evidence template. Include commands, outcomes, manual checks, deviations, and remaining risks.
8. Mark checklist items complete only when evidence exists. Update `tasks/progress.md` so the next phase is ready, or leave the current phase blocked with a concrete reason.
9. Stop and return a concise review handoff. Advancing to another phase always requires a new user message.

If the current phase is already complete, repair stale tracking and stop; do not consume the next phase automatically.

## Hard scope boundaries

- Do not deploy to Railway, create cloud services, connect a GitHub repository, generate domains, or change Railway settings.
- Do not make Docker a prerequisite unless a concrete implementation constraint cannot be solved reasonably with the specified Node/npm stack. If containers become justified, stop and tell the user exactly why Docker Desktop is needed before relying on it.
- Do not add authentication, a database, durable jobs, real integrations, workflow editing, cancellation, retries, approval decisions, or execution-history browsing.
- Do not copy third-party assets, logos, screenshots, branding, or proprietary UI. The visual direction must remain an original service-desk interface.
- Do not insert real credentials, usable reset links, tokens, or personal production data.
- Do not replace requested libraries or architectural contracts merely for convenience. Record a proposed deviation and ask before making a material change.
- Do not leave placeholders, pseudocode, required-feature TODOs, or knowingly skipped required checks at a completed phase boundary.

## Engineering rules

- Use strict TypeScript and keep shared API/event contracts under `shared/`; do not duplicate them between applications.
- Treat `backend/seeds/workflows/*.json` as authored workflow truth. Validate seeds at startup and keep the runner scenario-agnostic.
- Keep immutable workflow definitions separate from fresh mutable execution state.
- Use authoritative GET snapshots plus sequenced SSE events. A reconnect starts with a current snapshot; gaps trigger recovery; duplicate or stale events never duplicate logs.
- Apply `log.delta` directly to the execution cache. Do not refetch for every chunk.
- Preserve accessibility semantics supplied by Base UI. Do not use Radix primitives or `asChild`.
- Browser-visible `PUBLIC_API_URL` is a frontend build-time value and must be explicit in production.
- Production builds for both services must retain access to root shared contracts. Built backend startup must load JSON seeds independently of the process working directory.
- Keep simulation timing injectable for fake-timer tests. Bound completed execution retention and accumulated logs without removing active runs.

## Source and dependency discipline

- Before selecting versions or using framework-specific APIs, verify current official documentation for npm workspaces, NestJS, Astro, the Astro Node adapter, React, Base UI-backed shadcn/ui, TanStack Query v5, Vitest, and Railway as relevant to the phase.
- Record resolved versions in the root lockfile. Do not use floating examples as evidence of compatibility.
- Prefer the simplest implementation satisfying the specification; no graph editor is needed.

## Quality gates

Each phase must leave its completed scope runnable and must not break earlier accepted behavior. Use focused tests during work and the phase commands in `tasks/todo.md` before handoff.

The final readiness gate includes:

- backend and frontend tests;
- strict typechecks;
- production builds;
- production-start smoke checks;
- built-backend seed loading;
- real-browser desktop and narrow-viewport checks;
- keyboard, focus, status-text, reduced-motion, reconnect, refresh, and deterministic-failure checks;
- exact Railway owner instructions without performing deployment.

Phase 7 may not begin until Phase 6 has produced an owner-facing local test guide with verified commands and a complete manual browser checklist. The user must be able to evaluate the application locally before deciding whether to deploy it.

## Git and review discipline

- `dev` is the default and active development branch. Routine implementation and phase commits belong only on `dev`.
- `releases` is the production-quality branch and will trigger Railway after the owner connects it. Never merge, commit, or push to `releases` without the user's explicit release approval in the current conversation.
- `main` is the backup branch for accepted release state. Never treat it as the default or as a work branch. Synchronizing it is an explicit backup operation after release verification.
- Before branch promotion, require a clean `dev`, complete relevant local verification, a scoped diff review, and explicit user approval. After a remote exists, verify remote refs; do not report a promotion from local comparisons alone.
- Keep GitHub's default branch and local `origin/HEAD` on `dev`. Railway must watch `releases`, never `dev` or `main`.
- If the active `dev` checkout has unrelated uncommitted work during future branch maintenance, preserve it and use an isolated worktree rather than stashing or switching it.
- Never reset, discard, overwrite, or reformat unrelated user work.
- Atomic commits on `dev` are allowed as phase save points after that phase's required checks pass. Do not push, create/change a remote, promote branches, create tags, or open a pull request unless the user explicitly asks.
- Keep phase diffs reviewable. Separate broad mechanical formatting from behavior changes.

## Documentation maintenance

- Update `README.md` as runnable commands become real; do not document commands that have not been verified.
- Record expensive-to-reverse decisions under `docs/decisions/`.
- Keep `docs/specification.md` stable unless the user changes scope. A phase may clarify mechanics in an ADR but may not silently change product requirements.
- Use ISO dates and label estimates as estimates.
