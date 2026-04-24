# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Vitainspire (Mobile · Expo)

Smart farming data collection app — tagline "Smart Farming. Better Yield."

### Structure
- `app/index.tsx` — animated splash; routes to `/onboarding` or `/(tabs)` based on store
- `app/onboarding.tsx` — first-run farmer profile (name + optional photo)
- `app/(tabs)/` — three tabs: Field Capture (`index.tsx`), Harvest (`harvest.tsx`), Post Harvest (`post-harvest.tsx`)
- `app/field/new.tsx` — create-new-field flow (location, crop, area, standing + leaf/cob photos → result with Field ID + status checklist)
- `app/field/walker.tsx` — Strava-style GPS Acre Walker (live SVG polygon, Start/Pause/Resume/Finish)
- `hooks/useStore.ts` — AsyncStorage-backed: single farmer + Field[] (each Field carries standing/cut/chopped/silage progress), `onboarded` flag
- `utils/idGenerator.ts` — Field IDs `STATE-DISTRICT-NNN` (numeric continuous counter)
- `utils/geo.ts` — haversine distance, shoelace polygon area on equirectangular projection, sq-meters→acres
- `components/StatusChecklist.tsx`, `components/CapturePhotoCard.tsx` — shared UI

### Field lifecycle
A single Field record progresses through statuses: `standing` → `cut` → `chopped` → `silage`. Each tab operates on the same Field:
1. **Field Capture** creates the field with the standing photo
2. **Harvest** adds cut + chopped photos to a selected field
3. **Post Harvest** runs the silage flow (ready check → 4 photos → pH/smell/mold → auto-grade A/B/C → submit) on a selected chopped field

### Conventions
- No backend; all data persists via AsyncStorage (keys versioned `_v2`)
- No emojis — uses `@expo/vector-icons` (Feather + MaterialCommunityIcons)
- Haptics on all selection interactions
- Web safe-area inset minimum 67px top, 34px bottom
- Auto-grade rules: A = pH<4.2 + no mold + pleasant; C = pH>4.8 OR foul OR deep mold; B otherwise
