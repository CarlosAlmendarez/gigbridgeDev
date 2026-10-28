# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pnpm monorepo rewrite of the GigBridge Tour Manager web app (Next.js 16 / App Router, React 19). It is being restructured so the data-access, validation, and permissions logic live in framework-agnostic packages that a future React Native/Expo app can reuse as-is — `apps/web` should stay a thin consumer of `packages/*`.

This repo has no commit history yet and no test suite. A separate, older single-app version of the same product lives at `../../GigBridge/gigbridge` (has its own git history, a `supabase/` folder with `schema_master.sql` and migrations, and vitest/Playwright tests) — both apps point at the **same Supabase project** (project-ref `jrchaxyybvcpgjsnhelp`). When in doubt about what's actually in the database, check `schema_master.sql`/migrations in that sibling repo rather than trusting types here.

## Commands

Run from the repo root unless noted:

- `pnpm install` — install all workspace packages
- `pnpm dev` — run the web app dev server (`pnpm --filter @gigbridge/web dev`)
- `pnpm build` / `pnpm start` — build/start the web app
- `pnpm lint` — lint every workspace package (`pnpm -r lint`)
- `pnpm typecheck` — typecheck every workspace package (`pnpm -r typecheck`)
- Target a single package: `pnpm --filter @gigbridge/data typecheck`, `pnpm --filter @gigbridge/web lint`, etc.
- No test runner is configured in this repo (no vitest/jest/Playwright) — don't assume `pnpm test` exists.

Env setup: copy `apps/web/.env.local.example` to `apps/web/.env.local`. It needs Supabase URL/anon key/service-role key for the shared project above (values can be copied from `GigBridge/gigbridge/.env.local` if already configured there), plus `RESEND_API_KEY`/`FROM_EMAIL` for transactional email.

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

- `db.ts` — expected Supabase row shapes. **Read the file header before trusting it**: most tour-related tables (`tours`, `tour_dates`, `tour_crew`, `visibility_grants`, `hotel_room_assignments`, `reminders`, `tour_notes`, etc.) are *provisional* — derived from a design proposal doc, not yet real migrations (confirmed absent from `schema_master.sql` as of 2026-09-13). Only `ProfileRow` reflects a table that actually exists today.
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

## Working with provisional schema

Because most tour tables aren't migrated yet, several places in the code call this out explicitly and should be kept in sync if you add to them:
- `packages/types/src/db.ts` header comment (which tables are real vs. provisional).
- `packages/data/src/tour/repository.ts` header comment (mock-vs-Supabase contract).
- Route handlers with a `PENDIENTE DE SCHEMA` / `TODO(schema)` comment (e.g. the guest-status PATCH endpoint validates and authenticates for real but doesn't persist yet, since `guest_lists` doesn't exist).

When a real migration lands for a table, update `db.ts` to match it, then rewire the corresponding `packages/data` function(s) — the goal is that `apps/web` call sites don't need to change.

Code comments throughout `packages/data` and `apps/web` are written in Spanish; match that when editing nearby code.
