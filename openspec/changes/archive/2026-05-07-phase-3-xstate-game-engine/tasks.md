## 1. Monorepo Setup with npm Workspaces

- [x] 1.1 Add `"workspaces": ["packages/*"]` to root `package.json`
- [x] 1.2 Create `packages/game-engine/package.json` with name `"@bsking/game-engine"`, main `"./src/index.ts"`, and dependency `xstate` (pinned version)
- [x] 1.3 Create `packages/game-engine/tsconfig.json` extending root tsconfig with `"composite": true`
- [x] 1.4 Create `packages/game-engine/src/index.ts` (empty barrel export placeholder)
- [x] 1.5 Add `@bsking/game-engine` as a workspace dependency in root `package.json`
- [x] 1.6 Update root `tsconfig.json` with path alias: `"@bsking/game-engine": ["./packages/game-engine/src"]`
- [x] 1.7 Run `npm install` and verify `import ... from '@bsking/game-engine'` resolves in VS Code

## 2. Move Types and Deck Data into game-engine

- [x] 2.1 Move `Card`, `Category`, `DeckType`, `GamePhase` from `lib/types.ts` into `packages/game-engine/src/types.ts`
- [x] 2.2 Add new multiplayer types to `packages/game-engine/src/types.ts`: `Player`, `Role`, `GameConfig`, `RoomStatus`, `GameContext`, `GameEvent`, `RoundContext`, `RoundEvent`
- [x] 2.3 Create `packages/game-engine/src/decks/` directory and move `data/absurdTruthsDeck.ts`, `data/chineseSayingsDeck.ts`, `data/medicalDeck.ts` into it
- [x] 2.4 Move `shuffle`, `getDeckByType`, `prepareDeck` from `lib/deck.ts` into `packages/game-engine/src/deck.ts`, updating internal import paths
- [x] 2.5 Update all app imports to use `@bsking/game-engine` instead of `@/lib/types`, `@/lib/deck`, and `@/data/*`
- [x] 2.6 Add re-exports in `lib/types.ts` and `lib/deck.ts` pointing to `@bsking/game-engine` during transition
- [x] 2.7 Remove `lib/types.ts`, `lib/deck.ts`, and `data/` directory after all imports are migrated
- [x] 2.8 Update barrel export in `packages/game-engine/src/index.ts` to export all types, deck data, and utility functions
- [x] 2.9 Verify `npm run build` passes with zero type errors and the single-device game at `/` works identically

## 3. Create XState gameMachine

- [x] 3.1 Install `xstate` in `packages/game-engine/` (already declared as dependency, run `npm install`)
- [x] 3.2 Define `GameContext` and `GameEvent` types in `packages/game-engine/src/types.ts`
- [x] 3.3 Create `packages/game-engine/src/machines/gameMachine.ts` with states: `idle → setup → playing → finished`
- [x] 3.4 Implement transitions: `START` (idle→setup), `PLAY` (setup→playing), `END` (playing→finished), `RESET` (finished→setup)
- [x] 3.5 Context: `deckType`, `roundCount`, `timerSecs`, `players`, `currentRoundIndex`
- [x] 3.6 Export `gameMachine` and related types from the barrel file
- [x] 3.7 Verify by importing in a test file: `gameMachine.transition('idle', { type: 'START' })` → state value is `'setup'`

## 4. Create XState roundMachine

- [x] 4.1 Define `RoundContext` and `RoundEvent` types in `packages/game-engine/src/types.ts`
- [x] 4.2 Create `packages/game-engine/src/machines/roundMachine.ts` with states: `waiting → reading → discuss → reveal → complete`
- [x] 4.3 Implement transitions: `SHOW_SECRET` (waiting→reading), `TIMER_END` (reading→discuss), `SKIP_TIMER` (reading→discuss), `REVEAL_ALL` (discuss→reveal), `NEXT_CARD` (reveal→complete)
- [x] 4.4 Implement timer as an invoked actor in `reading` state that fires `TIMER_END` after `timerSecs`
- [x] 4.5 Add `BACK` transition from `reveal` to `discuss` for re-showing results
- [x] 4.6 Export `roundMachine` and related types from the barrel file
- [x] 4.7 Verify by spawning a round machine: send `SHOW_SECRET` enters `reading`; wait for timer auto-advances to `discuss`

## 5. Wire React Components to XState (Local-Only)

- [x] 5.1 Install `@xstate/react` in root `package.json`
- [x] 5.2 Refactor `AbsurdTruthsGame.tsx`: replace `useState(screen)`, `useState(phase)`, `useState(deck)`, `useState(index)`, `useState(timeLeft)`, `useState(timerTotal)` with `useMachine(gameMachine, { ... })`
- [x] 5.3 Replace imperative handlers (`handleStart`, `handleShowSecret`, `handleNext`, `handleSkipTimer`, etc.) with `send({ type: ... })` calls
- [x] 5.4 Wire phase management: nested `playing` states (waiting→reading→discuss→reveal) driven by gameMachine; track via `useSelector`
- [x] 5.5 Update `SetupScreen` — unchanged; receives `onStart` callback that sends `START` event
- [x] 5.6 Update `GameScreen` to receive `actor` and use `useSelector` for phase/timeLeft; dispatch events via `actor.send()`
- [x] 5.7 Update `EndScreen` — unchanged; receives callbacks that send `START`/`RESET` events
- [x] 5.8 Remove timer `useEffect` + `setInterval` from components — timer is now the invoked actor in gameMachine
- [x] 5.9 Verify `npm run build` passes and the local-only game plays identically: same shuffle, timer, phase transitions, and visual appearance

## 6. Confirm Docker + Postgres + Migrations

- [x] 6.1 Verify `docker compose up -d` starts Postgres 16 on standard port
- [x] 6.2 Verify `npm run db:migrate` creates all 4 tables (`rooms`, `players`, `game_rounds`, `game_moves`) with correct FKs
- [x] 6.3 Verify `npm run db:seed` populates test data (1 room, 3 players, 2 rounds)
- [x] 6.4 Install `bcrypt` and `@types/bcrypt` as root dependencies (needed for player secret hashing in API routes)
- [x] 6.5 Create `lib/auth.ts` with `generatePlayerToken() → { plaintext, hash }` and `verifyPlayerToken(plaintext, hash) → boolean` using bcrypt
- [x] 6.6 Add `db:migrate` and `db:studio` scripts to `package.json` if not already present

## 7. API Route: Room Creation + Status

- [x] 7.1 Create `app/api/rooms/route.ts` with `POST` handler that generates a unique 6-char alphanumeric code, inserts a room row via Drizzle, returns `{ roomId, code, status }` with status 201
- [x] 7.2 Create `app/api/rooms/[code]/route.ts` with `GET` handler that queries room by code, joins players, returns `{ id, code, status, currentPhase, config, players }`; return 404 if not found
- [x] 7.3 Handle code collision: if generated code already exists for an active room, retry with a new code
- [x] 7.4 Add input validation: config body must be valid JSON with optional `deckType`, `roundCount`, `timerSecs`
- [x] 7.5 Verify: `curl -X POST localhost:3000/api/rooms -d '{"roundCount":5}'` returns room JSON; `curl localhost:3000/api/rooms/ABC123` returns room state

## 8. API Routes: Join + Register

- [x] 8.1 Create `app/api/rooms/[code]/join/route.ts` with `POST` handler: validate room exists and status is `lobby`, create player row with bcrypt-hashed secret, return `{ playerId, playerSecret }` with status 201
- [x] 8.2 Handle errors: room not found (404), room not in lobby (409, cannot join mid-game)
- [x] 8.3 Create `app/api/rooms/[code]/register/route.ts` with `POST` handler: accept `{ playerId, playerSecret, name }`, verify secret against hash, update player name, return status 200
- [x] 8.4 Handle errors: invalid/missing playerId (404), incorrect secret (401), name already set (409)
- [x] 8.5 Verify: join a room → player row appears with null name; register with name → row updated; invalid secret returns 401

## 9. API Routes: Start Game + Submit Moves

- [x] 9.1 Create `app/api/rooms/[code]/start/route.ts` with `POST` handler: validate min 3 registered players, assign roles (1 judge, 1 honest, rest liars), shuffle deck via `prepareDeck` from game-engine, insert `game_rounds` rows, set `current_phase = 'reading'` and `status = 'playing'`
- [x] 9.2 Handle errors: fewer than 3 players (400), room not in lobby (409), room not found (404)
- [x] 9.3 Create `app/api/rooms/[code]/moves/route.ts` with `POST` handler: accept `{ playerId, playerSecret, moveType, data }`, verify credentials, validate move type matches current phase, insert `game_moves` row, advance phase when conditions met
- [x] 9.4 Implement phase advancement logic: `cast_vote` from all non-judge players advances to `reveal`; `next_round` advances to next round or `finished`
- [x] 9.5 Verify: create room, join 3 players, start game → `game_rounds` populated, roles assigned; submit move → `game_moves` row created, phase updated

## 10. Server-Side XState Move Validation

- [x] 10.1 Create `lib/move-validator.ts` with `validateMove(roomState, moveEvent) → { valid: boolean, error?: string }`
- [x] 10.2 Implement phase-to-move mapping mirroring gameMachine transitions for deterministic server-side validation
- [x] 10.3 Validate move types against current phase: `state.can(moveEvent)` equivalent via lookup table
- [x] 10.4 Move validator ready for integration into route handlers (further integration in Phase 4)
- [x] 10.5 Verify: send `cast_vote` when phase is `reading` → 409 Conflict; send valid moves → phase advances correctly; same machine validates both client UI and server API
