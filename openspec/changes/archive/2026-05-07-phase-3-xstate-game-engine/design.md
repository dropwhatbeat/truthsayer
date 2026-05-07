## Context

Phases 1 and 2 are complete. The codebase has:
- **DB schema** (Phase 1): Four Drizzle tables (`rooms`, `players`, `game_rounds`, `game_moves`), Docker Compose with Postgres 16, migration runner, seed script
- **Component refactor** (Phase 2): Shared types in `lib/types.ts`, deck utilities in `lib/deck.ts`, extracted `Timer`/`WordCard`/`CategoryPills` components, placeholder pages for all 6 game phases under `app/game/[code]/`

Phase 3 builds the game engine and API together because the XState machines define the valid state transitions that the API must enforce. Both client and server import the same machine definitions from a shared `packages/game-engine/` package.

The existing single-device game (`AbsurdTruthsGame.tsx`) uses `useState` for all state management. Phase 3 replaces this with XState while preserving identical behavior — the local-only game at `/` must still work after every stage.

## Goals / Non-Goals

**Goals:**
- Set up npm workspaces monorepo with `packages/game-engine/` as `@bsking/game-engine`
- Move shared types, deck data, and deck utilities into the game-engine package
- Implement two XState v5 machines: `gameMachine` (session lifecycle) and `roundMachine` (per-round phases with timer actor)
- Refactor single-device game to use `@xstate/react`'s `useMachine` — no behavioral change
- Confirm Postgres + Docker + migrations are operational
- Create API routes: room CRUD, player join/register, game start, move submission
- Server-side XState hydration for move validation with 409 on invalid transitions
- All existing functionality preserved throughout (verified by `npm run build`)

**Non-Goals:**
- TanStack Query polling or client-server state sync (that's Phase 4)
- Frontend pages wired to API routes (component refactor only; API tested via `curl`)
- Real-time via WebSocket/SSE/Electric SQL
- Player reconnection flow (`POST /api/rooms/[code]/reconnect` is deferred to Phase 4)
- Multiple deck types in API (API routes return deck data from game-engine, but full deck-type config is a Phase 4 concern)
- Production deployment (Phase 5)
- Auth system, user accounts, admin features
- **BREAKING**: No breaking changes to the public-facing single-device game at `/`

## Decisions

### Decision 1: XState v5 with parent-child machine spawning

**Choice**: Two machines — `gameMachine` (parent, session lifecycle) and `roundMachine` (child, per-round phases). The `gameMachine` spawns a new `roundMachine` actor via `spawnChild()` when transitioning to `playing`, and the child signals completion back to the parent via `sendParent()`.

**States**:
```
gameMachine:  idle → setup → playing → finished
roundMachine: waiting → reading → discuss → reveal → complete
```

**Rationale**: Parent-child separation keeps the state graph shallow and testable. The `gameMachine` owns deck selection, player assignment, and round iteration. The `roundMachine` owns card display, timer, and per-round transitions. Spawning isolates each round's state — the parent doesn't need to track per-round timer state.

**Alternatives considered**:
- Single flat machine with all states: Rejected. Would create a 10+ state cartesian product with complex guard logic.
- `invoke` (spawn-on-entry): Rejected. `spawnChild()` in transition actions gives the parent explicit control over when rounds start/end, which maps better to server-side "start next round" moves.

### Decision 2: Timer as invoked actor in roundMachine

**Choice**: The `roundMachine` invokes a timer actor on entering `reading` state. The timer fires `TIMER_END` after `timerSecs` milliseconds. A `SKIP_TIMER` event also transitions to `discuss`.

```
reading → (after timerSecs) → discuss  (TIMER_END)
reading → discuss                      (SKIP_TIMER)
```

**Rationale**: XState actors handle `setTimeout`/`clearTimeout` lifecycle cleanly — the actor is automatically stopped when the machine leaves the `reading` state. This eliminates the `useEffect` + `setInterval` pattern currently in `AbsurdTruthsGame.tsx`.

**Alternatives considered**:
- `after` transition: XState v5 supports delayed transitions natively, but `after` has no explicit cancel/restart semantics separate from state entry/exit. An invoked actor gives clearer teardown control.
- Timer counting in React `useEffect`: Rejected — this is what we're moving away from. Mixing imperative timer code with declarative XState undermines the refactor.

### Decision 3: npm workspaces with no build step for game-engine

**Choice**: `packages/game-engine/` is an npm workspace with `"main": "./src/index.ts"`. Next.js and TypeScript resolve the source files directly via `tsconfig.json` paths, so no compilation step is needed. The workspace exists for future publishing and to declare `xstate` as a package dependency.

**Rationale**: No build step = no build tooling, no watch mode, no stale compiled output. Next.js already handles TypeScript transpilation. The workspace declaration gives `@bsking/game-engine` a proper `node_modules` symlink so `import ... from '@bsking/game-engine'` resolves for tooling (ESLint, VS Code).

**tsconfig.json additions**:
```json
{
  "compilerOptions": {
    "paths": {
      "@bsking/game-engine": ["./packages/game-engine/src"]
    }
  }
}
```

**Alternatives considered**:
- No workspace, just path alias: Simpler setup but `xstate` would need to be in root `devDependencies`. The workspace makes dependency ownership explicit — when game-engine grows, its deps stay with it.
- Bun workspaces: Same concept, but npm is already project standard. Bun support is additive later.

### Decision 4: Server-side XState hydration from DB state

**Choice**: API route handlers reconstruct an XState machine from the database row (`rooms.current_phase`, `game_moves` for round state), test the proposed transition with `machine.transition()`, and only persist if the transition is valid. Invalid moves return `409 Conflict` with the expected phase.

**Implementation pattern**:
```typescript
const machine = createGameMachine(dbState) // hydrate from DB
const nextState = machine.transition(currentState, moveEvent)
if (nextState.changed === false) return 409
await db.updateRoom(roomId, { current_phase: nextState.value })
```

**Rationale**: The same `gameMachine`/`roundMachine` definitions that drive the client UI also validate server-side moves. No duplicated validation logic. No phase transition bugs from client-server mismatch. The 409 response tells the polling client to re-fetch the room state (Phase 4 behavior).

**Alternatives considered**:
- REST-level validation only (check `current_phase` string): Rejected. Fragile duplication — any phase transition change requires updating both the machine definition and the route handler logic.
- Stored procedures in Postgres: Rejected. Game logic belongs in application code, not SQL. Drizzle types don't map cleanly to stored procedure results.

### Decision 5: Card shuffle and round generation on server

**Choice**: `POST /api/rooms/[code]/start` shuffles the deck server-side using the same `prepareDeck()` from `@bsking/game-engine`, inserts `game_rounds` rows with the ordered cards, and assigns player roles. Clients never shuffle cards.

**Rationale**: All clients must see identical cards in identical order for a fair game. Server-side shuffle is the single source of truth. Players polling the room state (Phase 4) pull round data from `game_rounds`.

### Decision 6: playerSecret bcrypt hashing

**Choice**: On join, generate `playerSecret = crypto.randomUUID()`, hash with `bcrypt` (10 salt rounds), store hash in `players.secret_hash`, return plaintext to client. On register/reconnect, compare client-provided secret against stored hash.

**Rationale**: Plaintext storage would expose reusable credentials if the DB is compromised. bcrypt is a standard, time-tested hashing algorithm. The 10-round cost is negligible for join operations (cold path — happens once per player per session).

**Alternatives considered**:
- SHA-256: Faster but unsalted. Not suitable for credential storage.
- No hashing (store plaintext): Simpler but violates security best practices. Even for anonymous game sessions, DB leaks shouldn't expose reconnect tokens.

### Decision 7: API route structure — Next.js Route Handlers

**Choice**: Use Next.js `app/api/` Route Handlers with the following structure:
```
POST /api/rooms                    → create room
GET  /api/rooms/[code]             → get room state
POST /api/rooms/[code]/join        → join room (get playerId + secret)
POST /api/rooms/[code]/register    → set player name
POST /api/rooms/[code]/start       → start game (host only)
POST /api/rooms/[code]/moves       → submit a move
```

**Rationale**: Flat route handler files follow Next.js conventions. The `[code]` dynamic segment naturally namespaces operations by room. No middleware layer needed for 6 simple endpoints.

**Alternatives considered**:
- Single catch-all route with a router: Rejected. Next.js route handlers are already the router. Adding a framework-inside-a-framework (like Hono or itty-router) adds complexity for no benefit at this scale.
- `/api/game/` prefix: Rejected. `rooms/` is more specific and allows future `/api/games/` for game-type metadata.

## Risks / Trade-offs

- **[Risk] XState v5 API changes break during upgrade.** XState v5 is stable but has had frequent minor releases. → **Mitigation**: Pin exact version in `packages/game-engine/package.json`. Only upgrade with explicit testing.
- **[Risk] Machine hydration from DB state misses edge cases.** Reconstructing machine state from a `current_phase` string and move history may not perfectly match the runtime machine state (e.g., in-progress timers). → **Mitigation**: Server-side machines are hydrated for transition validation only — they don't run timers or invoke actors. The `current_phase` column is the authoritative state; moves are validated against it.
- **[Risk] Monorepo + path alias breaks IDE tooling.** Some editors need explicit workspace configuration. → **Mitigation**: The npm workspaces symlink makes `@bsking/game-engine` available in `node_modules`, which all TS language servers understand. Tested with VS Code.
- **[Trade-off] Types/deck data move is a large diff across many files.** Import paths change from `@/lib/types` to `@bsking/game-engine` in ~8-10 files. → **Mitigation**: This is a single search-and-replace operation. The `lib/types.ts` and `lib/deck.ts` files provide re-exports during transition to keep things buildable at each commit.
- **[Trade-off] No tests for API routes in Phase 3.** The focus is on building the routes and validating them manually with `curl`. → **Mitigation**: Phase 3 verification is `curl`-based smoke testing. Automated API tests (via vitest) can be added in Phase 4 when frontend wiring provides integration coverage.
