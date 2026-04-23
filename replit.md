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
- `app/index.tsx` — animated splash (auto-redirects to tabs after 2.5s)
- `app/(tabs)/` — Harvest home + Post-Harvest home with bottom tabs
- `app/visit/` — Field visit flow (field-acres → field-walk → field-health → photos → success), plus list view
- `app/silage/` — 12-step silage flow (start → eligibility → collect → photos → ph → sensory → context → grade → checklist → success)
- `hooks/useStore.ts` — AsyncStorage-backed store for farmers, fieldVisits, silageSamples
- `utils/idGenerator.ts` — Field IDs (`STATE-DISTRICT-Fnnn`) and Sample IDs (`{fieldId}-YYYYMMDD-Snn`)

### Conventions
- No backend; all data persists via AsyncStorage
- No emojis — uses `@expo/vector-icons` (Feather + MaterialCommunityIcons)
- Haptics on all selection interactions
- Web safe-area inset minimum 67px top, 34px bottom
- Auto-grade rules: A = pH<4.2 + no mold + pleasant; C = pH>4.8 OR foul OR deep mold OR hot; B otherwise
