## Why

Phase 1 (DB schema) and Phase 2 (component refactor + page stubs) are complete. The codebase now has typed database tables, Docker-based local Postgres, extracted utilities, and placeholder pages for each game phase. But there is still no game logic layer, no API, and the single-device game still runs on ad-hoc `useState`. Phase 3 is the heavy lifting — it builds the shared XState game engine, moves types and deck data into a dedicated package, wires the client to XState (local-only still works), and creates the API routes that will power multiplayer.

## What Changes

- Set up npm workspaces with a new `packages/game-engine/` package (`@bsking/game-engine`) containing XState machines, shared types, and deck data
- Move all types (`Card`, `Category`, `DeckType`, `GamePhase`, `Player`, `Role`) from `lib/types.ts` into `packages/game-engine/src/types.ts`
- Move deck data files and deck utility functions (`shuffle`, `getDeckByType`, `prepareDeck`) into `packages/game-engine/`
- Define two XState v5 machines: `gameMachine` (session lifecycle: idle → setup → playing → finished) and `roundMachine` (per-round phases: waiting → reading → discuss → reveal → complete) with an invoked timer actor
- Refactor the single-device game (`AbsurdTruthsGame.tsx`) to use `@xstate/react`'s `useMachine` instead of `useState` — no behavioral change
- Confirm Postgres + Docker Compose + Drizzle migrations are operational
- Create API routes: `POST /api/rooms`, `GET /api/rooms/[code]`, `POST /api/rooms/[code]/join`, `POST /api/rooms/[code]/register`, `POST /api/rooms/[code]/start`, `POST /api/rooms/[code]/moves`
- Server-side move validation: hydrate the same XState machine from DB state and reject invalid transitions with 409 Conflict
- All existing functionality preserved — the local-only game at `/` still works identically

## Capabilities

### New Capabilities
- `game-engine`: Shared XState game machines, TypeScript types, deck data, and utility functions in `packages/game-engine/`. Both client and server import from this single source of truth.
- `game-api`: Next.js API routes for room lifecycle (create, join, register, start) and game moves (submit_description, cast_vote, next_round) backed by Drizzle ORM and Postgres. Server-side XState validates all transitions.
- `game-client-xstate`: React components wired to XState v5 via `@xstate/react`'s `useMachine`. The existing single-device game at `/` is refactored to use `gameMachine` and `roundMachine` instead of `useState`, preserving identical behavior.

### Modified Capabilities
- `component-extraction`: Types (`Card`, `Category`, `DeckType`, `GamePhase`) and deck utilities (`shuffle`, `getDeckByType`, `prepareDeck`) **move** from `lib/types.ts` and `lib/deck.ts` into `packages/game-engine/src/`. **BREAKING**: Import paths change from `@/lib/types` to `@bsking/game-engine`. Re-exports from old paths are removed after migration.

## Impact

- **New package**: `packages/game-engine/` with `package.json` (`@bsking/game-engine`), dependencies on `xstate`
- **New dependencies**: `xstate` (in game-engine), `@xstate/react` (in root), `bcrypt` (for player secret hashing)
- **New directories**: `app/api/rooms/` with nested route handlers for `[code]/join`, `[code]/register`, `[code]/start`, `[code]/moves`
- **Modified files**: `package.json` (workspaces config, new dependencies), `tsconfig.json` (path alias for `@bsking/game-engine`), `AbsurdTruthsGame.tsx` (useMachine refactor), SetupScreen, GameScreen, EndScreen (receive state/send instead of handler props), all files importing from `@/lib/types` or `@/lib/deck`
- **Removed files**: `lib/types.ts`, `lib/deck.ts` (contents migrated to game-engine)
- **No database schema changes** — Phase 1 schema is final for v1
