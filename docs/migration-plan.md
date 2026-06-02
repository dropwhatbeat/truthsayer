# Migration Plan: 9upper (瞎掰王) — Single-Device → Multiplayer

**Goal**: Adapt the existing single-device party game into a session-based multiplayer 9upper (Bullshit King) experience with rooms, roles, and shared game state. Ship fast, lay groundwork for a future multi-game platform architecture.

**Scope**: 3-9 players per room. Real-time via polling (upgradeable to Electric SQL later).

---

## Current State

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js 15 (App Router) · React 19 · TypeScript · Tailwind  │
│                                                              │
│  app/                                                        │
│  ├── layout.tsx          fonts, PostHog, metadata            │
│  ├── page.tsx            single route (/)                    │
│  ├── globals.css         Tailwind + animations               │
│  └── providers.tsx       PostHog init                        │
│                                                              │
│  components/absurd-truths/                                    │
│  ├── AbsurdTruthsGame.tsx  ← ALL state (500+ lines)          │
│  ├── SetupScreen.tsx       ← deck/timer config               │
│  ├── GameScreen.tsx        ← card + phase sub-screens        │
│  └── EndScreen.tsx         ← game over                       │
│                                                              │
│  data/                                                       │
│  ├── absurdTruthsDeck.ts   42 English word cards             │
│  ├── chineseSayingsDeck.ts Chinese sayings cards             │
│  └── medicalDeck.ts        Medical term cards                │
│                                                              │
│  ⚠️  No backend. No database. No API.                       │
│  ⚠️  All state in React useState. Single device.            │
│  ⚠️  Card shuffle is Math.random() on client.               │
│  ⚠️  Single component with conditional rendering by phase.  │
└──────────────────────────────────────────────────────────────┘
```

---

## Target Architecture (v1)

```
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌───────────────────────────┐    ┌──────────────────────────────┐   │
│  │   Next.js Route Handlers  │    │   React SPA (client)          │   │
│  │   (app/api/)              │    │                               │   │
│  │                           │    │   Pages (by phase):           │   │
│  │  POST /rooms              │    │   / → lobby (create/join)     │   │
│  │  GET  /rooms/:code        │    │   /game/:code/register        │   │
│  │  POST /rooms/:code/join   │    │   /game/:code/waiting         │   │
│  │  POST /rooms/:code/start  │    │   /game/:code/reading         │   │
│  │  POST /rooms/:code/moves  │    │   /game/:code/voting          │   │
│  │                           │    │   /game/:code/reveal          │   │
│  │  ┌─────────────────────┐  │    │   /game/:code/end             │   │
│  │  │ @bsking/game-engine │  │    │                               │   │
│  │  │ (same XState defs)  │  │    │  ┌─────────────────────────┐  │   │
│  │  └─────────────────────┘  │    │  │ @bsking/game-engine     │  │   │
│  │                           │    │  │ (XState via useMachine) │  │   │
│  │  Card shuffle: server     │    │  └─────────────────────────┘  │   │
│  └──────────┬────────────────┘    │                               │   │
│             │                     │  State sync: TanStack Query   │   │
│             ▼                     │  (polling @ 2s interval)      │   │
│  ┌──────────────────┐                            │                │   │
│  │    Postgres       │◄──── GET /room/:code ─────┘                │   │
│  │    (Drizzle ORM)  │     (polling every 2s)                     │   │
│  └──────────────────┘                                             │   │
│                                                                    │   │
│  Deploy: Vercel (Next.js) + Neon/Railway (Postgres)               │   │
│                                                                    │   │
└────────────────────────────────────────────────────────────────────────┘
```

### Upgrade path to platform architecture

This v1 plan keeps the *Now* column. The *Later* column is noted for future-proofing but not implemented in v1.

| Concern | Now (v1) | Later (v2+) | Trigger |
|---|---|---|---|
| Route Handlers | Next.js Route Handlers (`app/api/`) | Standalone Hono server (`apps/api/`) | 3+ games or need separate scaling |
| Client state sync | TanStack Query polling (2s interval) | Electric SQL sync | Real-time latency matters or >50 concurrent players |
| Frontend framework | Next.js App Router pages | Vite + TanStack Router | Move to SPA-only deploy |
| Game logic | `packages/game-engine/` (shared XState machines) | Same package, extended with actor-based multiplayer | Second game added to platform |

---

> **Design decision — No in-app description submissions (v1).** Players explain/bullshit the term aloud in real life. The app only mediates the voting phase: it shows the judge each player's name and lets them pick who they think is honest. This keeps the reading page dead simple — Honest sees the real description, Liars and Judge see only the term + category. No text inputs, no waiting for submissions, no sub-state management. After everyone has spoken, the host (or any player) taps "Ready to Vote" to advance to the voting phase.
>
> Revisit this if/when async/remote play becomes a priority (players would need to type bluffs instead of speaking).

## Migration Phases

> **Guiding principle**: Every stage is a single commit. Every stage is independently testable. If something breaks, you revert one commit — not half a phase.

---

### Phase 1: DB Schema

Design and create the Drizzle schema. This is the foundation — get it right and everything else follows.

**Tables:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   rooms     │     │  players    │     │ game_rounds │     │ game_moves  │
├─────────────┤     ├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (uuid)   │────→│ id (uuid)   │     │ id (uuid)   │     │ id (uuid)   │
│ code (6-char│     │ room_id →   │────→│ room_id →   │←────│ room_id →   │
│ status      │     │ name        │     │ round_number│     │ player_id → │
│ deck_type   │     │ role        │     │ card_phrase │     │ move_type   │
│ config (json│     │ secret_hash │     │ card_answer │     │ data (json) │
│ created_by →│     │ created_at  │     │ categories  │     │ created_at  │
│ created_at  │     └─────────────┘     │ created_at  │     └─────────────┘
│ updated_at  │                         └─────────────┘
└─────────────┘
```

**Key decisions captured in schema:**
- `rooms.code` — 6-character alphanumeric join code, unique
- `rooms.status` — `'lobby' | 'playing' | 'finished'` (the session lifecycle)
- `rooms.current_phase` — explicit column (derived was considered, see decision log)
- `rooms.config` — JSON blob: `{ rounds, timerSecs, deckType }`
- `players.role` — `'judge' | 'honest' | 'liar'` (null in lobby, assigned on game start)
- `players.secret_hash` — bcrypt hash of a random token, used for reconnection auth
- `game_rounds.round_number` — 1-indexed, pre-generated on game start
- `game_moves.move_type` — `'submit_description' | 'cast_vote' | 'next_round'` (maps to 9upper phase transitions)
- `game_moves.data` — JSON blob for extensibility (player's submitted description text, vote target, etc.)

**Phase derivation (not stored, computed at query time):**

The game's current phase can be derived from moves, but a `current_phase` column is preferred (see Decision Log).

---

#### Stage 1.1 — Install Drizzle + scaffold config

- [ ] `npm install drizzle-orm pg` + `npm install -D drizzle-kit @types/pg`
- [ ] Create `drizzle.config.ts` pointing to `lib/db/schema.ts`
- [ ] Create `lib/db/schema.ts` with empty exports
- [ ] Create `lib/db/index.ts` with placeholder db client

**Verify**: `npx drizzle-kit generate` runs without errors (generates empty migration).

---

#### Stage 1.2 — Define `rooms` table

- [ ] Define `rooms` table in `lib/db/schema.ts`: `id`, `code`, `status`, `current_phase`, `deck_type`, `config`, `created_by`, `created_at`, `updated_at`
- [ ] Add unique index on `code`
- [ ] Generate migration: `npx drizzle-kit generate`

**Verify**: migration SQL creates the rooms table. Run `npx drizzle-kit migrate` against a local Postgres and `SELECT * FROM rooms` returns empty set.

---

#### Stage 1.3 — Define `players` table

- [ ] Define `players` table: `id`, `room_id` (FK → rooms), `name`, `role`, `secret_hash`, `created_at`
- [ ] Generate migration

**Verify**: migration creates both tables with FK constraint.

---

#### Stage 1.4 — Define `game_rounds` + `game_moves` tables

- [ ] Define `game_rounds` table: `id`, `room_id` (FK), `round_number`, `card_phrase`, `card_answer`, `categories` (JSONB), `created_at`
- [ ] Define `game_moves` table: `id`, `room_id` (FK), `player_id` (FK), `round_id` (FK), `move_type`, `data` (JSONB), `created_at`
- [ ] Generate migration

**Verify**: all 4 tables with correct FKs and column types. Migration is the complete schema.

---

#### Stage 1.5 — Docker Compose + seed script

- [ ] Create `docker-compose.yml` with Postgres 16
- [ ] Create `lib/db/migrate.ts` — one-command migration runner
- [ ] Create `lib/db/seed.ts` — seeds a test room with 3 players, 2 rounds
- [ ] Wire `db:migrate` and `db:seed` scripts to `package.json`

**Verify**: `docker compose up -d && npm run db:migrate && npm run db:seed` → queried rows match seed data. `docker compose down` tears it down.

---

### Phase 2: Component Refactor (No XState, No Backend)

Split the monolith before adding complexity. **All existing functionality must still work after each stage.** No new behavior — just restructuring.

**Before → After:**

```
Before:                                After:
────────────────────                   ──────────────────────
AbsurdTruthsGame.tsx                   app/
  useState(screen)                       page.tsx (lobby: create/join)
  useState(phase)                        game/
  useState(deck)                           [code]/
  useState(index)                            page.tsx (redirect to current phase)
  shuffle()                                  register/page.tsx
  handleStart()                              waiting/page.tsx
  handleShowSecret()                         reading/page.tsx
  handleNext()                               voting/page.tsx
  ...                                        reveal/page.tsx
  (500+ lines, all in one file)              end/page.tsx
                                     lib/
                                       types.ts    (Card, DeckType, Phase enum)
                                       deck.ts     (shuffle, deck selection)
```

**No database, no API routes, no XState.** Just restructuring.

---

#### Stage 2.1 — Extract types to `lib/types.ts`

- [ ] Move `Card`, `Category` interfaces from `data/absurdTruthsDeck.ts` → `lib/types.ts`
- [ ] Move `DeckType` from `SetupScreen.tsx` → `lib/types.ts`
- [ ] Move `Phase` type from `GameScreen.tsx` → `lib/types.ts` (rename to `GamePhase` to avoid collision with future XState phases)
- [ ] Re-export from `lib/types.ts`, update all imports

**Verify**: `npm run build` passes. Game plays identically — same shuffle, same phases, same UI.

---

#### Stage 2.2 — Extract deck logic to `lib/deck.ts`

- [ ] Move `shuffle<T>()` from `AbsurdTruthsGame.tsx` → `lib/deck.ts`
- [ ] Move `pickDeck()` logic (deck selection by DeckType) → `lib/deck.ts` as `getDeckByType(type: DeckType): Card[]`
- [ ] Add `prepareDeck(type: DeckType, roundCount: number): Card[]` — combines selection + shuffle + slice

**Verify**: `npm run build` passes. Unit-testable pure functions. Game plays identically.

---

#### Stage 2.3 — Extract shared UI components

- [ ] Extract timer circle + countdown display from `GameScreen.tsx` → `components/absurd-truths/Timer.tsx`
- [ ] Extract word card display (term + styled border) → `components/absurd-truths/WordCard.tsx`
- [ ] Extract category pills → `components/absurd-truths/CategoryPills.tsx`

**Verify**: `npm run build` passes. All screens render identically. Timer animation unchanged.

---

#### Stage 2.4 — Split pages by phase (local-only, no API)

- [ ] Create `app/page.tsx` — lobby stub (placeholder, still renders the full single-device game)
- [ ] Create `app/game/[code]/` directory with placeholder pages for each phase:
  - `register/page.tsx`
  - `waiting/page.tsx`
  - `reading/page.tsx`
  - `voting/page.tsx`
  - `reveal/page.tsx`
  - `end/page.tsx`
- [ ] Each page renders a placeholder identifying its phase; no game logic wired yet
- [ ] Original single-device game remains accessible at `/` → `AbsurdTruthsGame`

**Verify**: Navigate to `/game/ABC123/reading` → shows placeholder. Original game at `/` still fully functional and unchanged.

---

### Phase 3: XState Game Engine + API + Database

**This is where the heavy lifting happens.** The state machine and backend are built together because the machine defines the valid state transitions that the API enforces. This phase creates `packages/game-engine/` — the shared package that both client and server import.

By the end of Phase 3:
- Game logic lives in `packages/game-engine/` as XState machines
- Components import from the package, not from inline state
- API routes exist and validate moves against the same machine
- The local-only game still works (XState runs client-side, no server needed)

---

#### Stage 3.1 — Monorepo setup: npm workspaces + `packages/game-engine/`

- [ ] Add `"workspaces": ["packages/*"]` to root `package.json`
- [ ] Create `packages/game-engine/package.json`:
  - `"name": "@bsking/game-engine"`
  - `"main": "./src/index.ts"`
  - Dependencies: `xstate`
- [ ] Create `packages/game-engine/tsconfig.json` (extends root, `composite: true`)
- [ ] Create `packages/game-engine/src/index.ts` (empty barrel export)
- [ ] Add `@bsking/game-engine` as a dependency in root `package.json`
- [ ] Update root `tsconfig.json` with `paths: { "@bsking/game-engine": ["./packages/game-engine/src"] }`

**Verify**: `npm install` succeeds. `import { something } from '@bsking/game-engine'` resolves in VS Code.

---

#### Stage 3.2 — Move types + deck data into `packages/game-engine/`

- [ ] Move `Card`, `Category`, `DeckType`, `GamePhase` from `lib/types.ts` → `packages/game-engine/src/types.ts`
- [ ] Move deck data (`absurdTruthsDeck.ts`, `chineseSayingsDeck.ts`, `medicalDeck.ts`) → `packages/game-engine/src/decks/`
- [ ] Move `shuffle`, `getDeckByType`, `prepareDeck` from `lib/deck.ts` → `packages/game-engine/src/deck.ts`
- [ ] Update all imports in the app to use `@bsking/game-engine`
- [ ] Export everything from `packages/game-engine/src/index.ts`

**Verify**: `npm run build` passes. Game plays identically — types and decks now come from the package.

---

#### Stage 3.3 — Create XState `gameMachine`

Define the top-level game machine in `packages/game-engine/src/machines/gameMachine.ts`:

```
States: idle → setup → playing → finished

Transitions:
  idle    → START → setup
  setup   → PLAY  → playing
  playing → END   → finished  (when all rounds complete)
  finished→ RESET → setup

Context:
  deckType: DeckType
  roundCount: number
  timerSecs: number
  players: Player[]
  currentRoundIndex: number
```

- [ ] Define `GameContext`, `GameEvent` types
- [ ] Implement the machine with XState v5
- [ ] Export from `packages/game-engine/src/index.ts`

**Verify**: Import machine in a test file, transition through states. `machine.transition('idle', { type: 'START' })` → state value is `'setup'`.

---

#### Stage 3.4 — Create XState `roundMachine`

Define the per-round phase machine in `packages/game-engine/src/machines/roundMachine.ts`:

```
States (spawned by gameMachine per round):
  waiting → reading → discuss → reveal → complete

waiting  → SHOW_SECRET → reading
reading  → TIMER_END   → discuss (auto after timerSecs)
reading  → SKIP_TIMER  → discuss (manual skip)
discuss  → REVEAL_ALL  → reveal
reveal   → NEXT_CARD   → complete
reveal   → BACK        → discuss
```

- [ ] Define `RoundContext` (card, timeLeft, timerSecs), `RoundEvent` types
- [ ] Implement timer as an invoked actor that fires `TIMER_END` after `timerSecs`
- [ ] The `roundMachine` is **spawned** by the `gameMachine` per round

**Verify**: Spawn a round machine, send `SHOW_SECRET` → enters `reading`. Wait for timer → auto-transitions to `discuss`.

---

#### Stage 3.5 — Wire React components to XState (local-only)

Replace `useState`-based state management in the existing single-device game with `@xstate/react`'s `useMachine`:

- [ ] Install `@xstate/react` in root
- [ ] Refactor `AbsurdTruthsGame.tsx`:
  - Replace `useState(screen)`, `useState(phase)`, `useState(deck)`, `useState(index)`, `useState(timeLeft)` with `useMachine(gameMachine)`
  - Replace `handleStart`, `handleShowSecret`, `handleNext`, etc. with `send({ type: 'START' })`, `send({ type: 'SHOW_SECRET' })`, etc.
  - Timer counting moves from `useEffect` + `setInterval` in the component → invoked actor inside the roundMachine
- [ ] `SetupScreen`, `GameScreen`, `EndScreen` receive `state` + `send` instead of raw handler props

**Verify**: Game plays identically — same shuffle, same timer countdown, same phase transitions. No visual regression. `npm run build` passes. The game is now driven by XState but still fully client-side.

---

#### Stage 3.6 — Docker + Postgres running, migrations applied

- [ ] Confirm `docker-compose.yml` from Phase 1 works
- [ ] Install `drizzle-orm` + `pg` (already done in 1.1)
- [ ] Create `lib/db/index.ts` — exports `db` client using `drizzle-orm/node-postgres`
- [ ] Create `lib/db/migrate.ts` — runs migrations programmatically
- [ ] Add `db:migrate` and `db:studio` scripts to `package.json`

**Verify**: `docker compose up -d && npm run db:migrate` → all 4 tables exist. `npx drizzle-kit studio` → opens visual DB browser.

---

#### Stage 3.7 — API routes: room creation + status

- [ ] `POST /api/rooms` — creates room row, generates 6-char code, returns `{ roomId, code }`
- [ ] `GET /api/rooms/[code]` — returns room status, current_phase, config, player list
- [ ] Use Drizzle to read/write from the `rooms` table
- [ ] Validate: code must be unique, config must be valid JSON

**Verify**: `curl -X POST localhost:3000/api/rooms` → returns room JSON. `curl localhost:3000/api/rooms/ABC123` → returns room state. Query Postgres directly to confirm rows.

---

#### Stage 3.8 — API routes: join + register

- [ ] `POST /api/rooms/[code]/join` — validates room exists, status is `lobby`, creates player row (no name yet), returns `{ playerId, playerSecret }`
- [ ] `POST /api/rooms/[code]/register` — sets player name, updates row, requires valid `playerId` + `playerSecret`
- [ ] Generate `playerSecret` as a random token (crypto.randomUUID), hash with bcrypt for storage

**Verify**: Join a room → player row appears in DB with null name. Register with name → row updated. Invalid code/secret returns 401.

---

#### Stage 3.9 — API routes: start game + submit moves

- [ ] `POST /api/rooms/[code]/start` — validates min 3 players, assigns roles (1 judge, 1 honest, rest liars), shuffles deck server-side, inserts `game_rounds` rows, sets `current_phase = 'waiting'`
- [ ] `POST /api/rooms/[code]/moves` — accepts `{ moveType, data }`, validates against current phase, inserts `game_moves` row, advances phase when conditions met

**Verify**: Create room, join 3 players, start game → `game_rounds` rows populated, roles assigned. Submit a move → `game_moves` row created, phase updated.

---

#### Stage 3.10 — Server-side XState machine for move validation

- [ ] Import the same `gameMachine` + `roundMachine` from `@bsking/game-engine`
- [ ] In each API route handler, hydrate a machine from DB state, test the transition, and only write to DB if valid
- [ ] Invalid moves return 409 Conflict with the expected phase

**Verify**: Send a `cast_vote` move when phase is `reading` → 409 Conflict. Send valid moves → phase advances correctly. The same machine definition validates both client-side transitions and server-side moves.

---

### Phase 4: Wire Frontend to Backend

Connect the refactored UI to the API. This is where the game becomes multiplayer.

---

#### Stage 4.1 — Install TanStack Query + set up provider

- [ ] `npm install @tanstack/react-query`
- [ ] Create `lib/query-client.ts` — exports `queryClient` with defaults (staleTime: 1s, retry: 1)
- [ ] Wrap app in `QueryClientProvider` in `app/providers.tsx`

**Verify**: `npm run build` passes. `useQuery` calls resolve in dev tools.

---

#### Stage 4.2 — Room creation flow

- [ ] Build `app/page.tsx` (lobby): "Create Room" button + join code input
- [ ] On create: `POST /api/rooms` → redirect to `/game/[code]/register`
- [ ] Store `playerId` + `playerSecret` in `localStorage` after registration

**Verify**: Click "Create Room" → redirected to register page. DB shows room row.

---

#### Stage 4.3 — Join room flow

- [ ] Enter 6-char code → `GET /api/rooms/[code]` to validate → redirect to register
- [ ] Register page: name input → `POST /api/rooms/[code]/register` → redirect to `/game/[code]/waiting`
- [ ] Handle invalid codes, full rooms, game already started

**Verify**: Two browser windows join same room → both appear in player list on waiting page.

---

#### Stage 4.4 — Waiting room

- [ ] `app/game/[code]/waiting/page.tsx` — polls `GET /api/rooms/[code]` every 2s
- [ ] Shows player list with names
- [ ] Host sees "Start Game" button (enabled when ≥3 players)
- [ ] Non-host players see "Waiting for host…"
- [ ] On start: `POST /api/rooms/[code]/start` → all clients redirected to reading phase

**Verify**: 3 browser windows join, host clicks start → all 3 navigate to reading page simultaneously (within 2s poll window).

---

#### Stage 4.5 — Phase-driven navigation + polling

- [ ] `app/game/[code]/page.tsx` — entry point that polls room state and redirects to current phase
- [ ] Every phase page polls `GET /api/rooms/[code]` and redirects if the room phase has advanced past them
- [ ] TanStack Query `refetchInterval: 2000` on the room query

**Verify**: Phase changes propagate to all clients within 2 seconds. No manual refresh needed.

---

#### Stage 4.6 — Voting phase

- [ ] `app/game/[code]/voting/page.tsx` — judge sees all players (except themselves), picks one
- [ ] Liars and Honest see "Waiting for judge to vote…"
- [ ] Judge submits vote → `POST /api/rooms/[code]/moves { moveType: 'cast_vote', data: { targetPlayerId } }`
- [ ] On all votes submitted → phase advances to reveal

**Verify**: Judge picks a player → vote recorded in DB. All clients transition to reveal phase.

---

#### Stage 4.7 — Reveal phase

- [ ] `app/game/[code]/reveal/page.tsx` — shows real description, who was honest, who judge voted for
- [ ] Score tracking: +1 if judge guessed correctly, +1 for honest if judge was wrong
- [ ] "Next Round" button → advances to next round or end screen

**Verify**: Reveal screen shows correct results. Scores accumulate across rounds.

---

#### Stage 4.8 — End screen

- [ ] `app/game/[code]/end/page.tsx` — final scores, winner announcement
- [ ] "Play Again" → `POST /api/rooms/[code]/start` with new deck shuffle

**Verify**: All players see the same final scores. Winner is correct.

---

#### Stage 4.9 — Reconnect support

- [ ] On page load, check `localStorage` for `playerId` + `playerSecret`
- [ ] If found, call `POST /api/rooms/[code]/reconnect` → validates token, returns current player state
- [ ] Skip register page on reconnect, land directly on current phase

**Verify**: Join a room, close browser, reopen → lands on current game phase (not back at lobby).

---

### Phase 5: Polish & Ship

---

#### Stage 5.1 — Host disconnect handling

- [ ] If host disconnects during lobby, room stays alive (any player can become host via API)
- [ ] During active game, host disconnect pauses nothing — game continues
- [ ] Host icon shown in player list in waiting room

**Verify**: Host closes browser mid-game → game continues for remaining players.

---

#### Stage 5.2 — Player disconnect + rejoin edge cases

- [ ] Player leaves during reading → they're skipped in voting
- [ ] Player reconnects mid-round → sees current phase with their role intact
- [ ] Duplicate join prevention (same playerSecret can't join twice)
- [ ] "Player left" notification for others (just stale indicator, no real-time push)

**Verify**: Disconnect and reconnect in each game phase. State is consistent.

---

#### Stage 5.3 — Dev experience polish

- [ ] `npm run dev` starts Next.js + checks for Postgres connection string
- [ ] `docker compose up` starts Postgres on standard port
- [ ] `.env.example` documents required vars: `DATABASE_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- [ ] `npm run db:setup` runs migrate + seed in one command

**Verify**: Clone repo, `cp .env.example .env`, `docker compose up -d`, `npm run dev` → game works.

---

#### Stage 5.4 — Deploy

- [ ] Vercel: connect repo, set env vars, deploy
- [ ] Neon: create Postgres project, run migrations, set `DATABASE_URL` in Vercel
- [ ] Test production deployment with two real browser windows

**Verify**: Game works at production URL. Room codes shareable. Postgres in production.

---

#### Stage 5.5 — README + docs update

- [ ] Update `README.md` with multiplayer instructions
- [ ] Add architecture diagram (ASCII art from this doc)
- [ ] Document `docker compose` setup for local dev
- [ ] Document deploy steps (Vercel + Neon)

---

## Decision Log

| Decision | Rationale | Revisit when |
|---|---|---|
| Next.js Route Handlers instead of Hono | 4-5 endpoints, no middleware needed. Same web standard API surface. | Extracting to standalone `apps/api/` as a separate process |
| npm workspaces for monorepo | `packages/game-engine/` is an internal package imported via `@bsking/game-engine`. No build step needed (Next.js/TSC resolve it directly). | Package is consumed outside this repo → publish to npm or private registry |
| Polling instead of Electric SQL | 5 players × 2s poll = 2.5 QPS. Postgres is overkill for this load. Simpler to debug. | >50 concurrent players or latency-sensitive games |
| XState in `packages/game-engine/` | Shared package holds machine defs + types + deck data. Both server and client import from same source of truth. Built in Phase 3 alongside API so state transitions and route handlers are designed together. | Second game added to platform — just add machines + decks to the package |
| Postgres + Drizzle (not SQLite) | Postgres is required for Electric later. Drizzle gives type-safe queries without an ORM tax. | — |
| `current_phase` as a column, not derived | Debuggability > elegance. Directly queryable when players report issues. | — |
| Server-side card shuffle stored in DB | All clients must see same cards in same order. Seeded shuffle would work but stored rounds are auditable. | — |
| Role assignment: `judge`, `honest`, `liar` | 1 judge (known to all), 1 honest (sees real answer), rest are liars. Roles may rotate per round or stay fixed — TBD. | — |
| Judge sees only term (not descriptions) during reading | Judge waits while players prepare descriptions. Judge reviews all submissions in voting phase. | — |
| `playerSecret` for reconnection | No auth system needed. Random token in localStorage authenticates reconnecting players to their existing player row. | — |
| Keep Next.js (not migrate to Vite) | Already on Next.js. Route Handlers keep API and frontend in one process. Less change = faster ship. | Moving to platform architecture with Vite SPA |

---

## Out of Scope (v1)

- Auth / user accounts (players are anonymous within a session)
- Persistence beyond a single game session (game history, player stats)
- Multiple concurrent rooms per server (but schema supports it)
- Real-time via WebSocket / SSE / Electric (polling is sufficient)
- Multiple game types (only 9upper, but schema is extensible via `deck_type` and `move.data`)
- Admin dashboard, moderation, kicking players
- Offline support (requires network for multiplayer)
- Voice/video chat (players talk in real life; app only mediates voting)
- AI-generated bluff suggestions for Liars

---

## File Structure (Target)

```
bsking/
├── packages/
│   └── game-engine/                       ← Shared XState + types + deck data
│       ├── package.json                   ← "@bsking/game-engine"
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts                   ← Barrel export
│           ├── types.ts                   ← Card, Category, DeckType, GamePhase, Player, Role
│           ├── deck.ts                    ← shuffle, getDeckByType, prepareDeck
│           ├── decks/
│           │   ├── absurdTruthsDeck.ts    ← GAME_DECK
│           │   ├── chineseSayingsDeck.ts
│           │   └── medicalDeck.ts
│           └── machines/
│               ├── gameMachine.ts         ← idle → setup → playing → finished
│               └── roundMachine.ts        ← waiting → reading → discuss → reveal → complete
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── providers.tsx                      ← PostHog + TanStack Query providers
│   ├── page.tsx                           ← Lobby (create room / enter code)
│   ├── api/
│   │   └── rooms/
│   │       ├── route.ts                   ← POST (create)
│   │       └── [code]/
│   │           ├── route.ts               ← GET (status)
│   │           ├── join/route.ts          ← POST
│   │           ├── register/route.ts      ← POST
│   │           ├── start/route.ts         ← POST
│   │           ├── reconnect/route.ts     ← POST
│   │           └── moves/route.ts         ← POST
│   └── game/
│       └── [code]/
│           ├── page.tsx                   ← Redirect to current phase
│           ├── register/
│           │   └── page.tsx               ← Enter player name
│           ├── waiting/
│           │   └── page.tsx               ← Player list, host starts game (min 3)
│           ├── reading/
│           │   └── page.tsx               ← Role-based: Honest sees real desc
│           ├── voting/
│           │   └── page.tsx               ← Judge picks who they think is honest
│           ├── reveal/
│           │   └── page.tsx               ← Real desc, round scores
│           └── end/
│               └── page.tsx               ← Final scores, winner announcement
├── components/
│   └── absurd-truths/
│       ├── Timer.tsx                      ← Extracted countdown ring
│       ├── WordCard.tsx                   ← Shared card UI (term + categories)
│       ├── CategoryPills.tsx              ← Shared category badges
│       ├── PlayerList.tsx                 ← Lobby/waiting player list with roles
│       ├── PlayerAvatar.tsx               ← Player name + avatar display
│       ├── VoteButtons.tsx                ← Judge voting grid
│       └── ScoreBoard.tsx                 ← Round scores + running totals
├── lib/
│   ├── db/
│   │   ├── schema.ts                      ← Drizzle schema (rooms, players, game_rounds, game_moves)
│   │   ├── index.ts                       ← Drizzle client
│   │   ├── migrate.ts                     ← Migration runner
│   │   └── seed.ts                        ← Dev seed data
│   ├── auth.ts                            ← Player token generation, verification
│   └── query-client.ts                    ← TanStack Query client config
├── docker-compose.yml                     ← Postgres for local dev
├── drizzle.config.ts
├── package.json                           ← Root with workspaces: ["packages/*"]
└── docs/
    └── migration-plan.md                  ← This file
```

---

## Success Criteria

- [ ] Two different browser windows can join the same room
- [ ] Host creates room, gets a 6-character code to share
- [ ] Players join by entering code, then enter name on register page
- [ ] Game phases advance in sync across all clients (max 2s delay)
- [ ] Card order is identical on all clients
- [ ] Honest Player sees real description on reading page; Liars and Judge see only term + category
- [ ] Judge sees player list on voting page and can pick who they think is honest
- [ ] Reveal page shows: who was honest, who judge voted for, real description, round scores
- [ ] Running scores accumulate across rounds; end screen declares winner
- [ ] Player who closes browser can reconnect to same room and player identity
- [ ] Local-only game still works (no regression)
- [ ] Postgres + dev setup is one command (`docker compose up` or `npm run dev`)
- [ ] All existing decks work in multiplayer mode
