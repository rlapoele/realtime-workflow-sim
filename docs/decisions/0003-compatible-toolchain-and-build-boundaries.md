# ADR-003: Pin a compatible toolchain and explicit build boundaries

## Status

Accepted

## Date

2026-10-11

## Context

The two applications must share TypeScript contracts while retaining different runtimes and test environments. The frontend also needs a browser-visible API URL at build time, while each Railway service will eventually start from the same repository without losing access to root files. Current package majors must be mutually compatible rather than merely individually current.

## Decision

Use npm workspaces with one root lockfile and Node.js 22.12 or newer. Pin the Phase 1 toolchain to these verified versions:

| Area | Packages |
|---|---|
| Backend | NestJS `12.1.2`, RxJS `7.8.2`, reflect-metadata `0.2.2` |
| Frontend | Astro `7.3.8`, `@astrojs/node` `11.1.7`, `@astrojs/react` `7.0.1`, React `19.3.0` |
| UI/data | Base UI `1.9.0`, Heroicons `2.2.0`, TanStack Query `5.104.2`, Tailwind CSS `4.3.3` |
| Verification | TypeScript `6.0.3`, Vitest `5.0.3`, Astro Check `0.9.10`, Happy DOM `20.14.6` |

TypeScript 7.0.2 was evaluated and rejected because Astro Check 0.9.10 declares support for TypeScript 5 or 6. The install must resolve normally; peer-dependency bypass flags are not allowed.

Keep `shared/types.ts` outside both workspaces as the only cross-application contract source. Each application must import at least one shared type directly. The backend compiler uses the repository root as its source root, so its build emits both backend code and shared declarations beneath `backend/dist/`. The Astro/Vite build consumes the same source through a type-only import.

Use Astro server output with the official Node standalone adapter. `PUBLIC_API_URL` is a Vite/Astro build-time value: local development may use the documented localhost fallback, but production mode validates that an explicit value exists before building. Both production start scripts read optional workspace `.env` files through Node and respect runtime `PORT`; the backend and frontend bind to `0.0.0.0`.

Astro 7 automatically backgrounds its development server when it detects an AI coding agent. The frontend development script explicitly opts out with `ASTRO_DEV_BACKGROUND=0` so the root process owns both child services and `Ctrl+C` stops them together.

Configure shadcn through `frontend/components.json` with the supported `base-nova` style, Tailwind v4 settings, and Base UI runtime package. The shadcn CLI's supported `iconLibrary` values do not include Heroicons, so the metadata retains its supported default while application code uses `@heroicons/react` exclusively. Future generated components require review and replacement of any generated icon import. The CLI is not a project dependency; this avoids shipping a code generator and its current development-only advisories.

## Alternatives considered

### Use TypeScript 7 with peer-dependency overrides

This would select the newest compiler at the cost of leaving Astro Check's declared compatibility range. Rejected.

### Duplicate contracts inside each workspace

This would simplify isolated build roots but creates drift and violates the specification's single shared boundary. Rejected.

### Publish `shared` as a third runtime workspace

The current contracts are erased type-only imports, so a published runtime package adds ceremony without solving a Phase 1 need. Rejected for now.

### Install the shadcn CLI in the workspace

The official manual setup only requires configuration and runtime dependencies. Keeping the generator installed added no runtime value and introduced development-only audit findings. Rejected.

## Consequences

- A clean root install produces one deterministic lockfile without peer overrides.
- Production builds prove both applications can consume root shared contracts.
- Frontend production configuration fails early when its public API URL is absent.
- Railway services can later use workspace build/start commands while retaining repository-root build context.
- Generated shadcn component changes must be reviewed for the Heroicons-only application policy.

## References

- [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces/)
- [Astro Node adapter](https://docs.astro.build/en/guides/integrations-guide/node/)
- [Astro development with AI tools](https://docs.astro.build/en/guides/build-with-ai/)
- [NestJS first steps](https://docs.nestjs.com/first-steps)
- [shadcn manual installation](https://ui.shadcn.com/docs/installation/manual)
- [shadcn configuration](https://ui.shadcn.com/docs/components-json)
