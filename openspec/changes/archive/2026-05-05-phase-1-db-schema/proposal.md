## Why

The app currently has no backend, no database, and no API — all state lives in React `useState` on a single device. To support session-based multiplayer (3–9 players with rooms, roles, and shared game state), we need a data layer. The DB schema is the foundation: every subsequent phase (API routes, game engine integration, frontend wiring) depends on it. Get this right, and everything else builds cleanly on top.

## What Changes

- Install Drizzle ORM (`drizzle-orm`, `drizzle-kit`) and Postgres client (`pg`) as dependencies
- Create `drizzle.config.ts` pointing to `lib/db/schema.ts`
- Define four tables in `lib/db/schema.ts`:
  - **rooms** — session lifecycle (id, code, status, deck_type, config, current_phase, timestamps)
  - **players** — per-session participants (id, room_id FK, name, role, secret_hash for reconnection)
  - **game_rounds** — pre-generated rounds per game (id, room_id FK, round_number, card_phrase, card_answer, categories JSONB)
  - **game_moves** — player actions per round (id, room_id FK, player_id FK, round_id FK, move_type, data JSONB)
- Create `lib/db/index.ts` with a Drizzle client using `node-postgres`
- Create `lib/db/migrate.ts` as a programmatic migration runner
- Create `lib/db/seed.ts` with dev seed data (test room, 3 players, 2 rounds)
- Add `docker-compose.yml` with Postgres 16 for local development
- Add `db:migrate` and `db:seed` scripts to `package.json`

## Capabilities

### New Capabilities
- `db-schema`: Database layer with Drizzle ORM — schema definitions, migration tooling, seed data, and local Postgres via Docker Compose. Covers the `rooms`, `players`, `game_rounds`, and `game_moves` tables needed for multiplayer game sessions.

### Modified Capabilities
<!-- No existing specs to modify — this is the first backend capability. -->

## Impact

- **New dependencies**: `drizzle-orm`, `pg`, `drizzle-kit` (dev), `@types/pg` (dev)
- **New directories**: `lib/db/` (schema, client, migrate, seed)
- **New config files**: `drizzle.config.ts`, `docker-compose.yml`
- **Modified files**: `package.json` (new scripts + dependencies)
- **No frontend changes** — existing single-device game continues to work as-is
- **Prerequisite for**: Phase 2 (component refactor), Phase 3 (API + game engine), Phase 4 (frontend-backend wiring)
