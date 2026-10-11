# ADR-001: Deliver the prototype through gated phases

## Status

Accepted

## Date

2026-10-11

## Context

The implementation specification spans a monorepo, two runtime applications, shared contracts, JSON validation, an asynchronous execution engine, SSE recovery, server-state synchronization, accessible responsive UI, production builds, and deployment documentation. A single implementation turn would be difficult to review, would couple unrelated failure modes, and would make token use harder to control. Work must also survive closing and reopening Codex without relying on chat history.

## Decision

Use seven sequential implementation phases recorded in `tasks/plan.md`. `tasks/progress.md` names exactly one current phase. The phrase **Proceed with the next step** authorizes only that phase. Each phase has acceptance criteria, verification commands, a durable evidence file, and a mandatory user review stop.

The phases are ordered around runnable capabilities and high-risk boundaries: compatible foundation, catalogue, execution, real-time recovery, interface quality, hardening, then Railway handoff. Railway deployment remains owner-operated and outside agent authority.

## Alternatives considered

### One-shot implementation

It minimizes coordination pauses but produces a large coupled diff, weak review checkpoints, and uncertain token exposure. Rejected.

### One phase per technical layer

Building the entire backend before any frontend or building all UI before integration creates late integration risk. Rejected in favor of capability-oriented slices after the foundation.

### A separate chat-defined checklist

Chat state is not a reliable cross-session source of truth. Rejected in favor of repository-native plan, progress, and evidence files.

## Consequences

- The user gets a review gate after every phase and can stop indefinitely between phases.
- Future sessions can resume from repository state with a short instruction.
- Some phases may reveal a need to revise later tasks; material scope or architecture changes still require user approval.
- Documentation overhead is intentional and small relative to the project integration risk.
