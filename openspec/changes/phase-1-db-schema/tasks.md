## 1. Install Drizzle + Scaffold Config

- [x] 1.1 Install dependencies: `npm install drizzle-orm pg` + `npm install -D drizzle-kit @types/pg`
- [x] 1.2 Create `drizzle.config.ts` pointing `schema` to `lib/db/schema.ts`
- [x] 1.3 Create `lib/db/schema.ts` with empty exports
- [x] 1.4 Create `lib/db/index.ts` with placeholder db client
- [x] 1.5 Verify: `npx drizzle-kit generate` runs without errors (generates empty migration)

## 2. Define `rooms` Table

- [x] 2.1 Define `rooms` table in `lib/db/schema.ts` with columns: `id` (uuid, PK), `code` (text, unique), `status` (text, default `'lobby'`), `current_phase` (text), `deck_type` (text), `config` (json), `created_by` (uuid, nullable), `created_at` (timestamp), `updated_at` (timestamp)
- [x] 2.2 Add unique index on `code`
- [x] 2.3 Generate migration: `npx drizzle-kit generate`
- [x] 2.4 Verify: migration SQL creates the rooms table with correct columns and index

## 3. Define `players` Table

- [x] 3.1 Define `players` table in `lib/db/schema.ts` with columns: `id` (uuid, PK), `room_id` (uuid, FK → rooms.id), `name` (text, nullable), `role` (text, nullable, enum `'judge' | 'honest' | 'liar'`), `secret_hash` (text), `created_at` (timestamp)
- [x] 3.2 Add foreign key constraint on `room_id` referencing `rooms.id`
- [x] 3.3 Generate migration: `npx drizzle-kit generate`
- [x] 3.4 Verify: migration creates players table with FK constraint to rooms

## 4. Define `game_rounds` and `game_moves` Tables

- [x] 4.1 Define `game_rounds` table in `lib/db/schema.ts` with columns: `id` (uuid, PK), `room_id` (uuid, FK → rooms.id), `round_number` (integer), `card_phrase` (text), `card_answer` (text), `categories` (jsonb), `created_at` (timestamp)
- [x] 4.2 Define `game_moves` table in `lib/db/schema.ts` with columns: `id` (uuid, PK), `room_id` (uuid, FK → rooms.id), `player_id` (uuid, FK → players.id), `round_id` (uuid, FK → game_rounds.id), `move_type` (text, enum `'submit_description' | 'cast_vote' | 'next_round'`), `data` (jsonb), `created_at` (timestamp)
- [x] 4.3 Add foreign key constraints: `room_id` → rooms, `player_id` → players, `round_id` → game_rounds
- [x] 4.4 Generate migration: `npx drizzle-kit generate`
- [x] 4.5 Verify: all 4 tables with correct FKs and column types exist in the migration

## 5. Docker Compose + Seed Script

- [x] 5.1 Create `docker-compose.yml` with Postgres 16, exposing standard port, with database/user/password env vars
- [x] 5.2 Update `lib/db/index.ts` to export a real Drizzle client using `drizzle-orm/node-postgres` with `DATABASE_URL` from env
- [x] 5.3 Create `lib/db/migrate.ts` — programmatic migration runner using `drizzle-orm/migrator`
- [x] 5.4 Create `lib/db/seed.ts` — seeds a test room with 3 players (judge, honest, liar) and 2 rounds
- [x] 5.5 Add `db:migrate` and `db:seed` scripts to `package.json`
- [x] 5.6 Verify end-to-end: `docker compose up -d && npm run db:migrate && npm run db:seed` → queried rows match seed data. `docker compose down` tears down cleanly.
