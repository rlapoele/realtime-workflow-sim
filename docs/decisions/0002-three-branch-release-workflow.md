# ADR-002: Use dev, releases, and main for distinct lifecycle roles

## Status

Accepted

## Date

2026-10-11

## Context

The owner uses a safety-oriented three-branch model on other personal projects. Railway will eventually watch a GitHub branch and automatically build/deploy every pushed revision on that branch. Routine implementation therefore must not happen on the deployment source, and the GitHub default branch must not be mistaken for production.

## Decision

Maintain three long-lived branches:

- `dev` is the GitHub default and routine working branch. Phased implementation and local review happen here.
- `releases` contains only explicitly approved, locally verified production-quality revisions. Railway will watch this branch.
- `main` is a backup of the last accepted release state. It is neither the default nor a deployment source.

The bootstrap planning revision initially exists on all three branches. Afterwards, phase work advances only `dev`. Promotion to `releases`, pushing it, tagging a release, or synchronizing `main` each requires explicit user authorization. Before a release promotion, verify the clean working tree, tests, typechecks, builds, local production smoke checks, browser acceptance, commit graph, and exact branch tips. After a remote exists, verify remote refs as well.

If branch maintenance is needed while the active `dev` checkout contains unrelated uncommitted work, use an isolated worktree so the work is neither stashed nor disturbed.

## Alternatives considered

### Use `main` as the production/default branch

This is conventional but conflicts with the owner's established safety model and makes default-branch operations production-sensitive. Rejected.

### Deploy directly from `dev`

This would turn ordinary pushes into production deployments and remove the production-quality promotion gate. Rejected.

### Use tags without a `releases` branch

Tags provide immutable versions but do not match the desired Railway branch-triggered workflow. Tags may complement releases later but do not replace the branch role. Rejected.

## Consequences

- Ordinary work and review remain isolated from automatic production deployment.
- `releases` updates are high-impact external changes and require an explicit owner gate.
- `main` provides a recognizable backup point without becoming the default.
- GitHub must use `dev` as its default branch, while both Railway services must use `releases` as their source branch.
- Branch roles must be documented because they intentionally differ from common conventions.
