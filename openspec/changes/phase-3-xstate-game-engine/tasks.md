## 1. Monorepo Setup with npm Workspaces

- [ ] 1.1 Add `"workspaces": ["packages/*"]` to root `package.json`
- [ ] 1.2 Create `packages/game-engine/package.json` with name `"@bsking/game-engine"`, main `"./src/index.ts"`, and dependency `xstate` (pinned version)
- [ ] 1.3 Create `packages/game-engine/tsconfig.json` extending root tsconfig with `"composite": true`
- [ ] 1.4 Create `packages/game-engine/src/index.ts` (empty barrel export placeholder)
- [ ] 1.5 Add `@bsking/game-engine` as a workspace dependency in root `package.json`
- [ ] 1.6 Update root `tsconfig.json` with path alias: `"@bsking/game-engine": ["./packages/game-engine/src"]`
- [ ] 1.7 Run `npm install` and verify `import ... from '@bsking/game-engine'` resolves in VS Code

## 2. Move Types and Deck Data into game-engine

- [ ] 2.1 Move `Card`, `Category`, `DeckType`, `GamePhase` from `lib/types.ts` into `packages/game-engine/src/types.ts`
- [ ] 2.2 Add new multiplayer types to `packages/game-engine/src/types.ts`: `Player`, `Role`, `GameConfig`, `RoomStatus`, `GameContext`, `GameEvent`, `RoundContext`, `RoundEvent`
- [ ] 2.3 Create `packages/game-engine/src/decks/` directory and move `data/absurdTruthsDeck.ts`, `data/chineseSayingsDeck.ts`, `data/medicalDeck.ts` into it
- [ ] 2.4 Move `shuffle`, `getDeckByType`, `prepareDeck` from `lib/deck.ts` into `packages/game-engine/src/deck.ts`, updating internal import paths
- [ ] 2.5 Update all app imports to use `@bsking/game-engine` instead of `@/lib/types`, `@/lib/deck`, and `@/data/*`
- [ ] 2.6 Add re-exports in `lib/types.ts` and `lib/deck.ts` pointing to `@bsking/game-engine` during transition
- [ ] 2.7 Remove `lib/types.ts`, `lib/deck.ts`, and `data/` directory after all imports are migrated
- [ ] 2.8 Update barrel export in `packages/game-engine/src/index.ts` to export all types, deck data, and utility functions
- [ ] 2.9 Verify `npm run build` passes with zero type errors and the single-device game at `/` works identically

## 3. Create XState gameMachine

- [ ] 3.1 Install `xstate` in `packages/game-engine/` (already declared as dependency, run `npm install`)
- [ ] 3.2 Define `GameContext` and `GameEvent` types in `packages/game-engine/src/types.ts`
- [ ] 3.3 Create `packages/game-engine/src/machines/gameMachine.ts` with states: `idle → setup → playing → finished`
- [ ] 3.4 Implement transitions: `START` (idle→setup), `PLAY` (setup→playing), `END` (playing→finished), `RESET` (finished→setup)
- [ ] 3.5 Context: `deckType`, `roundCount`, `timerSecs`, `players`, `currentRoundIndex`
- [ ] 3.6 Export `gameMachine` and related types from the barrel file
- [ ] 3.7 Verify by importing in a test file: `gameMachine.transition('idle', { type: 'START' })` → state value is `'setup'`

## 4. Create XState roundMachine

- [ ] 4.1 Define `RoundContext` and `RoundEvent` types in `packages/game-engine/src/types.ts`
- [ ] 4.2 Create `packages/game-engine/src/machines/roundMachine.ts` with states: `waiting → reading → discuss → reveal → complete`
- [ ] 4.3 Implement transitions: `SHOW_SECRET` (waiting→reading), `TIMER_END` (reading→discuss), `SKIP_TIMER` (reading→discuss), `REVEAL_ALL` (discuss→reveal), `NEXT_CARD` (reveal→complete)
- [ ] 4.4 Implement timer as an invoked actor in `reading` state that fires `TIMER_END` after `timerSecs`
- [ ] 4.5 Add `BACK` transition from `reveal` to `discuss` for re-showing results
- [ ] 4.6 Export `roundMachine` and related types from the barrel file
- [ ] 4.7 Verify by spawning a round machine: send `SHOW_SECRET` enters `reading`; wait for timer auto-advances to `discuss`

## 5. Wire React Components to XState (Local-Only)

- [ ] 5.1 Install `@xstate/react` in root `package.json`
- [ ] 5.2 Refactor `AbsurdTruthsGame.tsx`: replace `useState(screen)`, `useState(phase)`, `useState(deck)`, `useState(index)`, `useState(timeLeft)`, `useState(timerTotal)` with `useMachine(gameMachine, { ... })`
- [ ] 5.3 Replace imperative handlers (`handleStart`, `handleShowSecret`, `handleNext`, `handleSkipTimer`, etc.) with `send({ type: ... })` calls
- [ ] 5.4 Wire `roundMachine` spawning: when `gameMachine` enters `playing`, spawn a `roundMachine` actor; track its state via `useSelector` or child snapshot
- [ ] 5.5 Update `SetupScreen` to receive `state` + `send` instead of raw handler props; read config from machine context
- [ ] 5.6 Update `GameScreen` to receive `state` + `send`; dispatch phase events (`SHOW_SECRET`, `SKIP_TIMER`, `REVEAL_ALL`, `NEXT_CARD`)
- [ ] 5.7 Update `EndScreen` to receive `state` + `send`; read scores from machine context and allow `RESET`
- [ ] 5.8 Remove timer `useEffect` + `setInterval` from components — timer is now the invoked actor in `roundMachine`
- [ ] 5.9 Verify `npm run build` passes and the local-only game plays identically: same shuffle, timer, phase transitions, and visual appearance

## 6. Confirm Docker + Postgres + Migrations

- [ ] 6.1 Verify `docker compose up -d` starts Postgres 16 on standard port
- [ ] 6.2 Verify `npm run db:migrate` creates all 4 tables (`rooms`, `players`, `game_rounds`, `game_moves`) with correct FKs
- [ ] 6.3 Verify `npm run db:seed` populates test data (1 room, 3 players, 2 rounds)
- [ ] 6.4 Install `bcrypt` and `@types/bcrypt` as root dependencies (needed for player secret hashing in API routes)
- [ ] 6.5 Create `lib/auth.ts` with `generatePlayerToken() → { plaintext, hash }` and `verifyPlayerToken(plaintext, hash) → boolean` using bcrypt
- [ ] 6.6 Add `db:migrate` and `db:studio` scripts to `package.json` if not already present

## 7. API Route: Room Creation + Status

- [ ] 7.1 Create `app/api/rooms/route.ts` with `POST` handler that generates a unique 6-char alphanumeric code, inserts a room row via Drizzle, returns `{ roomId, code, status }` with status 201
- [ ] 7.2 Create `app/api/rooms/[code]/route.ts` with `GET` handler that queries room by code, joins players, returns `{ id, code, status, currentPhase, config, players }`; return 404 if not found
- [ ] 7.3 Handle code collision: if generated code already exists for an active room, retry with a new code
- [ ] 7.4 Add input validation: config body must be valid JSON with optional `deckType`, `roundCount`, `timerSecs`
- [ ] 7.5 Verify: `curl -X POST localhost:3000/api/rooms -d '{"roundCount":5}'` returns room JSON; `curl localhost:3000/api/rooms/ABC123` returns room state

## 8. API Routes: Join + Register

- [ ] 8.1 Create `app/api/rooms/[code]/join/route.ts` with `POST` handler: validate room exists and status is `lobby`, create player row with bcrypt-hashed secret, return `{ playerId, playerSecret }` with status 201
- [ ] 8.2 Handle errors: room not found (404), room not in lobby (409, cannot join mid-game)
- [ ] 8.3 Create `app/api/rooms/[code]/register/route.ts` with `POST` handler: accept `{ playerId, playerSecret, name }`, verify secret against hash, update player name, return status 200
- [ ] 8.4 Handle errors: invalid/missing playerId (404), incorrect secret (401), name already set (409)
- [ ] 8.5 Verify: join a room → player row appears with null name; register with name → row updated; invalid secret returns 401

## 9. API Routes: Start Game + Submit Moves

- [ ] 9.1 Create `app/api/rooms/[code]/start/route.ts` with `POST` handler: validate min 3 registered players, assign roles (1 judge, 1 honest, rest liars), shuffle deck via `prepareDeck` from game-engine, insert `game_rounds` rows, set `current_phase = 'reading'` and `status = 'playing'`
- [ ] 9.2 Handle errors: fewer than 3 players (400), room not in lobby (409), room not found (404)
- [ ] 9.3 Create `app/api/rooms/[code]/moves/route.ts` with `POST` handler: accept `{ playerId, playerSecret, moveType, data }`, verify credentials, validate move type matches current phase, insert `game_moves` row, advance phase when conditions met
- [ ] 9.4 Implement phase advancement logic: `cast_vote` from all non-judge players advances to `reveal`; `next_round` advances to next round or `finished`
- [ ] 9.5 Verify: create room, join 3 players, start game → `game_rounds` populated, roles assigned; submit move → `game_moves` row created, phase updated

## 10. Server-Side XState Move Validation

- [ ] 10.1 Create `lib/move-validator.ts` with `validateMove(roomState, moveEvent) → { valid: boolean, error?: string }`
- [ ] 10.2 Implement function to hydrate an XState machine snapshot from DB state (`rooms.current_phase`, `game_moves` history)
- [ ] 10.3 Test the proposed transition: if `state.can(moveEvent)`, the move is valid; otherwise return 409 with expected phase
- [ ] 10.4 Integrate validator into all move-submitting route handlers (start, moves)
- [ ] 10.5 Verify: send `cast_vote` when phase is `reading` → 409 Conflict; send valid moves → phase advances correctly; same machine validates both client UI and server API
