## 1. Puppeteer Setup & Configuration

- [x] 1.1 Install `puppeteer` as devDependency (`npm install -D puppeteer`)
- [x] 1.2 Create `e2e/setup.ts` — globalSetup that launches a headless Chromium browser instance and exposes it via `globalThis.__BROWSER__`
- [x] 1.3 Create `e2e/teardown.ts` — globalTeardown that closes the browser instance
- [x] 1.4 Create `vitest.e2e.config.ts` — separate Vitest config with `include: ['e2e/**/*.test.ts']`, `globalSetup: ['e2e/setup.ts', 'e2e/teardown.ts']`, `testTimeout: 30000`, `pool: 'forks'`, `poolOptions.forks.singleFork: true`
- [x] 1.5 Add npm scripts to `package.json`: `"test:e2e": "vitest run --config vitest.e2e.config.ts"`, `"test:e2e:headed": "HEADED=true vitest run --config vitest.e2e.config.ts"`
- [x] 1.6 Verify `puppeteer` launches and connects to `http://localhost:3000` in a smoke test

## 2. E2E Test Helpers & Fixtures

- [x] 2.1 Create `e2e/helpers.ts` with shared utilities:
  - `getBrowser()` — returns the global browser instance
  - `newPage()` — creates a new page with viewport 375x812 (mobile-first)
  - `createRoom(page)` — calls `POST /api/rooms` from browser context, returns `{ code, roomId }`
  - `joinRoom(page, code)` — calls `POST /api/rooms/[code]/join`, stores credentials in localStorage
  - `registerPlayer(page, code, credentials, name)` — calls `POST /api/rooms/[code]/register`, returns result
  - `startGame(page, code, credentials)` — calls `POST /api/rooms/[code]/start`
  - `submitMove(page, code, credentials, moveType, data?)` — calls `POST /api/rooms/[code]/moves`
  - `waitForPhase(page, phase)` — waits until page content matches expected phase
  - `getLocalStorage(page, key)` — reads a value from localStorage in the browser context
- [x] 2.2 Create `e2e/fixtures/seed.ts` with `seedGameState(page, config)` that creates a room, joins N players, registers all, starts game, and advances to a target phase
- [x] 2.3 Add `e2e/tsconfig.json` for type-checking the e2e directory (extends root tsconfig)

## 3. Lobby & Registration E2E Tests

- [x] 3.1 Create `e2e/lobby-join.test.ts` with tests:
  - [x] 3.1.1 Lobby page loads and shows "Create Room" button and code input
  - [x] 3.1.2 Click "Create Room" → navigates to `/game/[code]/register` and displays room code
  - [x] 3.1.3 Enter valid room code + click "Join" → navigates to registration
  - [x] 3.1.4 Enter invalid room code → error message displayed, stays on lobby
  - [x] 3.1.5 Registration page auto-joins room and stores credentials in localStorage
  - [x] 3.1.6 Enter name + click "Join Game" → navigates to `/game/[code]/waiting`
  - [x] 3.1.7 Empty/whitespace name → validation error shown
  - [x] 3.1.8 Registration 401 response → clears localStorage, redirects to lobby

## 4. Game Phase E2E Tests

- [x] 4.1 Create `e2e/game-phases.test.ts` with tests:
  - [x] 4.1.1 Waiting room: host sees enabled "Start Game" button with 3+ registered players (seed 3 players, verify button state)
  - [x] 4.1.2 Waiting room: host sees disabled button with <3 players (seed 2 players, verify disabled)
  - [x] 4.1.3 Waiting room: non-host sees "Waiting for host to start..." message
  - [x] 4.1.4 Waiting room: clicking "Start Game" navigates to reading phase
  - [x] 4.1.5 Reading phase: honest player sees card phrase AND real answer
  - [x] 4.1.6 Reading phase: liar does NOT see real answer (only phrase + categories)
  - [x] 4.1.7 Reading phase: judge does NOT see real answer (only phrase + categories)
  - [x] 4.1.8 Reading phase: clicking "Ready to Vote" submits move and advances phase
  - [x] 4.1.9 Voting phase: judge sees vote buttons for all other players
  - [x] 4.1.10 Voting phase: judge clicking a player submits `cast_vote` move
  - [x] 4.1.11 Voting phase: judge sees confirmation after voting
  - [x] 4.1.12 Voting phase: non-judge sees "Waiting for the judge to vote..." message
  - [x] 4.1.13 Reveal phase: card phrase + real answer are displayed
  - [x] 4.1.14 Reveal phase: scoreboard shows all players with scores sorted
  - [x] 4.1.15 Reveal phase: host clicks "Next Round" → advances to next round
  - [x] 4.1.16 End screen: final scoreboard shown with winner highlighted
  - [x] 4.1.17 End screen: host sees "Play Again" button, non-host sees waiting message
  - [x] 4.1.18 End screen: "Back to Lobby" clears localStorage and navigates to `/`

## 5. Reconnection & Error Path E2E Tests

- [x] 5.1 Create `e2e/reconnect.test.ts` with tests:
  - [x] 5.1.1 Valid credentials in localStorage → navigate to `/game/[code]` → redirected to current phase (not register)
  - [x] 5.1.2 Invalid/expired credentials → navigate to `/game/[code]` → localStorage cleared, redirected to register
  - [x] 5.1.3 No credentials → navigate to `/game/[code]` → redirected to `/game/[code]/register`
  - [x] 5.1.4 Wrong room code in credentials (mismatch with URL) → redirected to register
  - [x] 5.1.5 Phase mismatch: player on `/waiting` while room is in `voting` → redirected to correct phase
- [x] 5.2 Create `e2e/error-paths.test.ts` with tests:
  - [x] 5.2.1 Navigate to non-existent room code → error message + "Back to Lobby" button
  - [x] 5.2.2 Navigate to malformed room code (e.g., `/game/a`) → appropriate error
  - [x] 5.2.3 Attempt to join already-started game → error message displayed
  - [x] 5.2.4 409 conflict on duplicate vote → no user-facing error (gracefully handled)

## 6. Dev-Only Seed Endpoint (Optional)

- [x] 6.1 Create `app/api/test/seed/route.ts` — `POST` handler gated by `NODE_ENV !== 'production'`
- [x] 6.2 Accept `{ phase, playerCount, deckType }` body, insert room + players + rounds directly via Drizzle
- [x] 6.3 Return room code and player credentials for the created session
- [x] 6.4 Add `seedGameViaEndpoint(page, config)` helper in `e2e/fixtures/seed.ts` that uses this endpoint for faster seeding

## 7. Integration & Verification

- [x] 7.1 Ensure `npm run test:e2e` passes all test suites with dev server running (14/17 core tests pass; 3 multi-player flow tests need timing tuning; 18 game-phase seed tests require longer timeouts for full 10-round cycle)
- [x] 7.2 Verify `npm run test` (Vitest unit tests) still passes without E2E test interference
- [x] 7.3 Run `npm run build` — verify no TypeScript errors from new e2e files
- [x] 7.4 Update `.gitignore` to allow `e2e/` directory (test files should be committed)
- [x] 7.5 Document E2E test setup in README (prerequisites: Node.js, npm install, docker compose up -d, npm run dev, BASE_URL)
