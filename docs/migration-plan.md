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
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──────────────────────────┐    ┌────────────────────────────┐ │
│  │   Next.js Route Handlers │    │   React SPA (client)        │ │
│  │   (app/api/)             │    │                             │ │
│  │                          │    │   Pages (by phase):         │ │
│  │  POST /rooms             │    │   / → lobby (create/join)   │ │
│  │  GET  /rooms/:code       │    │   /game/:code/register      │ │
│  │  POST /rooms/:code/join  │    │   /game/:code/waiting       │ │
│  │  POST /rooms/:code/start │    │   /game/:code/reading       │ │
│  │  POST /rooms/:code/move  │    │   /game/:code/voting        │ │
│  │                          │    │   /game/:code/reveal        │ │
│  │                          │    │   /game/:code/end           │ │
│  │  State machine: XState   │    │                             │ │
│  │  Card shuffle: server    │    │  State machine: XState      │ │
│  └──────────┬───────────────┘    │  Reconnect: TanStack Query  │ │
│             │                    │  (polling @ 2s interval)    │ │
│             ▼                    └──────────────┬──────────────┘ │
│  ┌──────────────────┐                           │                │
│  │    Postgres       │◄──── GET /room/:code ────┘                │
│  │    (Drizzle ORM)  │     (polling every 2s)                    │
│  └──────────────────┘                                            │
│                                                                  │
│  Deploy: Vercel (Next.js) + Neon/Railway (Postgres)              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Upgrade path to platform architecture

| Now | Later | Trigger |
|---|---|---|
| Next.js Route Handlers | Standalone Hono server (`apps/api/`) | 3+ games or need separate scaling |
| TanStack Query polling | Electric SQL sync | Real-time latency matters or >50 concurrent players |
| Next.js pages | Vite + TanStack Router | Move to SPA-only deploy |
| Inline game logic | `packages/game-engine/` (shared XState) | Second game added |

---

## Migration Phases

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
- `rooms.config` — JSON blob: `{ rounds, timerSecs, deckType }`
- `players.role` — `'judge' | 'honest' | 'liar'` (null in lobby, assigned on game start)
- `players.secret_hash` — bcrypt hash of a random token, used for reconnection auth
- `game_rounds.round_number` — 1-indexed, pre-generated on game start
- `game_moves.move_type` — `'submit_description' | 'cast_vote' | 'next_round'` (maps to 9upper phase transitions)
- `game_moves.data` — JSON blob for extensibility (player's submitted description text, vote target, etc.)

**Current phase tracked in DB:**

The game's current phase is derived, not stored in a single column. It's computed from:
```
current_round = MAX(game_rounds.round_number) WHERE room_id = X
moves_in_round = COUNT(game_moves) WHERE round_number = current_round

Phase:
  lobby    → rooms.status = 'lobby'
  register → rooms.status = 'lobby' (player joined but not yet named)
  waiting  → rooms.status = 'playing' AND moves_in_round = 0
  reading  → rooms.status = 'playing' (players prepare/submit descriptions)
  voting   → rooms.status = 'playing' AND all descriptions submitted
  reveal   → rooms.status = 'playing' AND judge has voted
  end      → rooms.status = 'finished' OR no more rounds
```

Alternatively, add a `current_phase` column to `rooms` for simplicity. **Decision: add the column.** A party game with 3-9 players doesn't need derived state elegance — it needs debuggability. When Bob says "I'm stuck on the waiting screen", you want to `SELECT current_phase FROM rooms WHERE code = 'ABC123'` and see the answer.

---

### Phase 2: Refactor Existing Code (No Backend)

Split the monolith before adding complexity. All existing functionality must still work after this step.

**Goals:**
1. Extract XState machine from implicit phase state
2. Split single page into phase-based routes matching 9upper game flow
3. Keep all state local (no API calls yet)
4. Existing game plays identically

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
                                       machine.ts (XState definition)
                                       deck.ts    (shuffle, card types)
```

**No database, no API routes, no Electric.** Just restructuring.

---

### Phase 3: API + Database

Add the backend layer. The game is still playable locally, but now has a server path.

**Deliverables:**
- `drizzle.config.ts` + schema in `lib/db/schema.ts`
- `docker-compose.yml` (Postgres for local dev, or use `pg-local` / Neon branch)
- API routes:
  - `app/api/rooms/route.ts` — POST (create room)
  - `app/api/rooms/[code]/route.ts` — GET (room status), PATCH (update config)
  - `app/api/rooms/[code]/join/route.ts` — POST (validate room code, create player row)
  - `app/api/rooms/[code]/register/route.ts` — POST (set player name, return player secret)
  - `app/api/rooms/[code]/start/route.ts` — POST (start game, assign roles, shuffle cards)
  - `app/api/rooms/[code]/moves/route.ts` — POST (submit move: description, vote, next round)
- Server-side XState machine that validates move legality
- Card shuffle happens server-side on game start, rounds persisted to `game_rounds`

---

### Phase 4: Wire Frontend to Backend

Connect the refactored UI to the API. This is where the game becomes multiplayer.

**Deliverables:**
- Room creation flow: host creates room → gets join code → enters name (register) → shares code with friends
- Join flow: player enters room code → enters name (register) → lands in waiting room
- Register page: simple name input, player identity created, secret token stored in localStorage
- Waiting room: shows player list (with names), host can start game (min 3 players)
- Game phases driven by API state (TanStack Query refetch every 2s)
- Phase changes sync across all clients (polling → route navigation)
- Reconnect: `playerId` + `playerSecret` in `localStorage` → re-join on page refresh
- PostHog events tagged with `roomId` for session-level analytics

**TanStack Query setup:**
```typescript
// Conceptual — polls room state every 2s
const { data: room } = useQuery({
  queryKey: ['room', code],
  queryFn: () => fetch(`/api/rooms/${code}`).then(r => r.json()),
  refetchInterval: 2000,
})

// React to phase changes
useEffect(() => {
  if (room?.currentPhase) {
    router.push(`/game/${code}/${room.currentPhase}`)
  }
}, [room?.currentPhase])
```

---

### Phase 5: Polish & Ship

**Deliverables:**
- Error handling: what happens when host disconnects? (room stays alive, game pauses)
- Edge cases: player leaves mid-game, player reconnects, duplicate joins
- Dev experience: `docker compose up` or `npm run dev` Just Works
- Deploy: Vercel (Next.js) + Neon (Postgres) — free tier covers this easily
- README update with multiplayer instructions

---

## Decision Log

| Decision | Rationale | Revisit when |
|---|---|---|
| Next.js Route Handlers instead of Hono | 4-5 endpoints, no middleware needed. Same web standard API surface. | Extracting to standalone `apps/api/` as a separate process |
| Polling instead of Electric SQL | 5 players × 2s poll = 2.5 QPS. Postgres is overkill for this load. Simpler to debug. | >50 concurrent players or latency-sensitive games |
| XState for state machine | Formalizes existing implicit state machine. Server and client share the same machine definition. | — |
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
- Voice/video chat (players bluff by typing descriptions, not speaking)
- AI-generated bluff suggestions for Liars

---

## File Structure (Target)

```
bsking/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── providers.tsx
│   ├── page.tsx                      ← Lobby (create room / enter code)
│   └── game/
│       └── [code]/
│           ├── page.tsx              ← Redirect to current phase
│           ├── register/
│           │   └── page.tsx          ← Enter player name
│           ├── waiting/
│           │   └── page.tsx          ← Player list, host starts game (min 3)
│           ├── reading/
│           │   └── page.tsx          ← Role-based: Honest sees real desc, Liars see term+category
│           ├── voting/
│           │   └── page.tsx          ← Judge picks who they think is honest
│           ├── reveal/
│           │   └── page.tsx          ← Shows who was honest, real desc, round scores
│           └── end/
│               └── page.tsx          ← Final scores, winner announcement
├── components/
│   └── absurd-truths/
│       ├── WordCard.tsx              ← Shared card UI (term + categories)
│       ├── CategoryPills.tsx         ← Shared category badges
│       ├── PlayerList.tsx            ← Lobby/waiting player list with roles
│       ├── PlayerAvatar.tsx          ← Player name + avatar display
│       ├── DescriptionInput.tsx      ← Text input for Liars to write bluffs
│       ├── VoteButtons.tsx           ← Judge voting grid (pick one player)
│       ├── ScoreBoard.tsx            ← Round scores + running totals
│       └── Timer.tsx                 ← Extracted from GameScreen
├── lib/
│   ├── db/
│   │   ├── schema.ts                ← Drizzle schema
│   │   ├── index.ts                 ← Drizzle client
│   │   └── migrate.ts               ← Migration runner
│   ├── machine.ts                   ← XState game machine
│   ├── deck.ts                      ← Card types, shuffle
│   └── auth.ts                      ← Player token generation, verification
├── data/
│   ├── absurdTruthsDeck.ts
│   ├── chineseSayingsDeck.ts
│   └── medicalDeck.ts
├── docker-compose.yml               ← Postgres for local dev
├── drizzle.config.ts
├── package.json
└── docs/
    └── migration-plan.md             ← This file
```

---

## Success Criteria

- [ ] Two different browser windows can join the same room
- [ ] Host creates room, gets a 6-character code to share
- [ ] Players join by entering code, then enter name on register page
- [ ] Game phases advance in sync across all clients (max 2s delay)
- [ ] Card order is identical on all clients
- [ ] Honest Player sees real description; Liars see only term + category on reading page
- [ ] Judge sees all submitted descriptions on voting page and can pick one player
- [ ] Reveal page shows: who was honest, who judge voted for, real description, round scores
- [ ] Running scores accumulate across rounds; end screen declares winner
- [ ] Player who closes browser can reconnect to same room and player identity
- [ ] Local-only game still works (no regression)
- [ ] Postgres + dev setup is one command (`docker compose up` or `npm run dev`)
- [ ] All existing decks work in multiplayer mode
