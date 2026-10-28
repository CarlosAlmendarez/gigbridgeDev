# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pnpm monorepo rewrite of the GigBridge Tour Manager web app (Next.js 16 / App Router, React 19). It is being restructured so the data-access, validation, and permissions logic live in framework-agnostic packages that a future React Native/Expo app can reuse as-is — `apps/web` should stay a thin consumer of `packages/*`.

A separate, older single-app version of the same product (v1, in production) lives at `../../GigBridge/gigbridge` with its own git history, `supabase/schema_master.sql` and vitest/Playwright tests.

The two apps use **different Supabase projects**:
- This repo → `gigbridgedev` (project-ref `irmjtifbhtabxghiikbf`, linked via `supabase link`). Its schema is defined by `supabase/migrations/` in this repo, which is the source of truth for the database here.
- v1 → `gigbridge` (project-ref `jrchaxyybvcpgjsnhelp`), production. Never point tests, seeds or migrations from this repo at it. v1's `schema_master.sql` is only historical reference for what was ported.

The dev project is on the free plan and gets paused after inactivity (status `INACTIVE`, its hostname stops resolving). If Supabase calls fail with DNS errors, check `supabase projects list` and restore it from the dashboard before debugging code.

## Commands

Run from the repo root unless noted:

- `pnpm install` — install all workspace packages
- `pnpm dev` — run the web app dev server (`pnpm --filter @gigbridge/web dev`)
- `pnpm build` / `pnpm start` — build/start the web app
- `pnpm lint` — lint every workspace package (`pnpm -r lint`)
- `pnpm typecheck` — typecheck every workspace package (`pnpm -r typecheck`)
- Target a single package: `pnpm --filter @gigbridge/data typecheck`, `pnpm --filter @gigbridge/web lint`, etc.
- No test runner is configured in this repo (no vitest/jest/Playwright) — don't assume `pnpm test` exists.

Env setup: copy `apps/web/.env.local.example` to `apps/web/.env.local`. It needs the Supabase URL/publishable key/secret key of the **dev** project above (`irmjtifbhtabxghiikbf` — do not copy v1's `.env.local`, that one points at production), plus `RESEND_API_KEY`/`FROM_EMAIL` for transactional email.

## Workspace layout

`pnpm-workspace.yaml` covers `apps/*` and `packages/*`. Dependency direction is one-way:

```
@gigbridge/types  (no deps)
      ^
@gigbridge/config (depends on types only — no DOM/React, pure data/constants)
      ^
@gigbridge/data   (depends on types + config)
      ^
@gigbridge/web    (apps/web — depends on all three)
```

`apps/web/next.config.ts` lists all three packages under `transpilePackages` since they ship TS source directly (`main`/`types` point at `src/index.ts`, no build step).

### packages/types

- `db.ts` — Supabase row shapes, maintained by hand to mirror `supabase/migrations/` 1:1 (sections are labeled by migration number). There is no type generation yet: a migration that adds or changes a column must update `db.ts` in the same commit.
- `view-models.ts` — the flattened/aggregated shapes the UI actually consumes. `@gigbridge/data` is responsible for mapping DB rows to these; the shapes are meant to stay stable once mock data is replaced by real queries.

### packages/config

Pure catalogs/constants shared by web and (eventually) native: status enums, team/party/department definitions, tab/filter definitions for the tour UI. No DOM or React dependency by design.

### packages/data

The shared data-access layer, split into two entry points on purpose:

- `index.ts` (client-safe): browser Supabase client, the tour repository/formatting/permissions helpers, zod validation schemas, mock data/seeds.
- `server.ts` (server-only, guarded by the `server-only` package so it fails the build if pulled into a client bundle): server Supabase client (RLS-respecting, built from a caller-supplied `CookieAdapter` so this package doesn't depend on `next/headers`), the service-role client (bypasses RLS — only for Route Handlers that genuinely need it), and auth/session helpers.

Never import from `@gigbridge/data/server` in a client component; import the plain package entry instead.

Key files:
- `tour/repository.ts` — currently reads from `tour/mockData.ts` (a full mock "Norte 2026" tour) because the real `tour_*` tables don't exist yet. Function signatures are written to match what the eventual Supabase-backed implementation will return, so callers in `apps/web` (and later the native app) shouldn't need to change when it's rewired.
- `tour/permissions.ts` — deliberately duplicates in application code a rule that will *also* exist as a Postgres RLS policy (who can see whose hotel room, via `visibility_grants`/`tour_crew`). It has to live here too because service-role code paths bypass RLS and need to re-check manually, and the UI needs the reason text, not just a hidden field.
- `validation/tour.ts` — zod schemas for every tour mutation, shared so a Route Handler and the future native app validate identically before writing to Supabase.

### apps/web

Next.js App Router, Tailwind v4, Phosphor icons.

- Routes: `/tour/[dateId]/{dia,show,lugar,equipo,equipo/[tab],club,rider}`. `app/tour/layout.tsx` loads dates + roster server-side and wraps children in `TourUIProvider`.
- `src/context/TourUIContext.tsx` holds client-side UI state (active filters, drafts, in-memory edits to seeded mock data) as a single context provider.
- `app/api/v1/**` Route Handlers exist specifically for cases Server Actions can't cover for a future native client, or where a server secret is needed (e.g. `RESEND_API_KEY`). Each `route.ts` has a comment explaining why it's a REST endpoint rather than a Server Action — read it before adding a new one, and follow the same reasoning (native-client compatibility or secret isolation) rather than defaulting to a Server Action.
- `src/lib/supabase-server.ts` adapts Next's async `cookies()` into the generic `CookieAdapter` that `@gigbridge/data/server` expects — this is what keeps that package framework-agnostic.

## Schema and migrations

`supabase/migrations/NNNN_*.sql` are numbered sequentially and each opens with a header comment explaining what it ports from v1/v2 and why it changes shape — keep that convention. Never edit a migration that has already been applied; fix forward with a new numbered file (see `0008`, `0011` for examples).

Apply with `supabase db push` against the linked dev project. Applying is an outward action on a shared database — confirm with the user first.

When a migration adds or changes a table: update `packages/types/src/db.ts` in the same commit, then rewire the corresponding `packages/data` function(s). The goal is that `apps/web` call sites don't need to change.

Tables that exist in the schema but have no UI yet, and UI sections that have no table yet (providers, external contacts, vacancies), are called out in `packages/data/src/tour/repository.ts` — read its header before wiring a tour screen.

Code comments throughout `packages/data` and `apps/web` are written in Spanish; match that when editing nearby code.
