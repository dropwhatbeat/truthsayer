## Context

The Absurd Truths app is a Next.js 15 multiplayer party game with 7 UI phases (lobby, register, waiting, reading, voting, reveal, end) and 6 API routes. The app currently has only 2 Vitest unit test files (deck utilities and DB schema). There are zero UI tests, zero E2E tests, and zero API integration tests. The `wire-frontend-to-backend` change has unchecked manual verification tasks (13.2–13.5) that this change automates.

The app's game state is managed server-side in PostgreSQL with client-side TanStack Query polling (2s interval). There are no WebSockets — all state sync is HTTP-based. This makes E2E testing straightforward: each phase page is a static render of the current room state.

## Goals / Non-Goals

**Goals:**
- Add Puppeteer-based E2E tests that validate all multiplayer game flows in a real browser
- Keep tests deterministic by seeding game state through the app's own API endpoints
- Use Vitest as the test runner for consistency with existing unit tests
- Provide clear npm scripts for local and CI test runs
- Cover happy paths and key error paths for all phases

**Non-Goals:**
- Visual regression / screenshot testing (out of scope for this change)
- Component-level unit tests with jsdom or @testing-library/react (separate change)
- Performance or load testing (separate concern)
- Cross-browser testing (Chromium only, matching Puppeteer's scope)
- Testing the local/single-device mode at `/local` (XState-driven, separate concern)

## Decisions

### 1. Puppeteer over Playwright or Cypress

**Choice**: Puppeteer

**Rationale**: Puppeteer provides direct Chrome DevTools Protocol access and is lighter weight than Playwright or Cypress. It integrates well with Vitest (no plugin needed — tests import `puppeteer` directly). For a Next.js app with simple page navigation and form interactions, Puppeteer's API (`page.goto()`, `page.click()`, `page.type()`, `page.waitForSelector()`) is sufficient. No need for Playwright's multi-browser support or Cypress's test runner UI.

**Alternatives considered**:
- **Playwright**: More features (multi-browser, fixtures, trace viewer) but heavier dependency. Overkill for this app's needs.
- **Cypress**: Requires its own test runner (can't use Vitest). Different programming model (chainable commands vs async/await). Adds tooling complexity.

### 2. Vitest as E2E test runner

**Choice**: Vitest with a separate `vitest.e2e.config.ts`

**Rationale**: The project already uses Vitest. Using the same runner means shared configuration, watch mode, and CI integration. A separate config file (`vitest.e2e.config.ts`) keeps E2E tests isolated from unit tests: longer timeout (30s+), sequential execution (`pool: 'forks'`, `poolOptions.forks.singleFork: true`), and excludes `lib/__tests__/` patterns.

**Alternatives considered**:
- **Plain tsx scripts**: Simpler but no test reporting, no `--watch`, no CI integration. Harder to track which tests pass/fail.
- **@vitest/browser**: Adds Puppeteer/Playwright as a Vitest browser provider. But requires webpack/vite config changes and has different API conventions.

### 3. Test structure and organization

```
e2e/
├── setup.ts              # Global setup: launch browser, get base URL
├── teardown.ts           # Global teardown: close browser
├── helpers.ts            # Shared helpers: createRoom, joinRoom, registerPlayer, startGame, submitMove
├── fixtures/
│   └── seed.ts           # API-based seed functions for complex game states
├── lobby-join.test.ts    # Lobby + registration flow tests
├── game-phases.test.ts   # Full game lifecycle tests
├── reconnect.test.ts     # Reconnection + session tests
└── error-paths.test.ts   # Invalid codes, expired sessions, 409 errors
```

Each test file maps to a capability from the proposal. Shared helpers reduce boilerplate. The `setup.ts` / `teardown.ts` files use Vitest's `globalSetup` to launch one browser instance shared across all test files.

### 4. Seeding strategy: API-based with dev-only seed helpers

**Choice**: Use the app's existing API endpoints to set up game state programmatically via Puppeteer's `page.evaluate()` making `fetch()` calls from the browser context.

**Implementation**: Test helpers will:
1. Navigate to the app
2. Use `page.evaluate()` to call `fetch('/api/rooms', { method: 'POST' })` and parse the response
3. Chain additional API calls to join players, register names, start games, and submit moves
4. Return room state (code, player credentials) for subsequent test assertions

For complex multi-player setups (e.g., a room with 4 players already in voting phase), a dev-only `POST /api/test/seed` endpoint may be added that accepts a seed configuration and inserts directly into the database. This endpoint is only registered in development mode (`process.env.NODE_ENV !== 'production'`).

**Alternatives considered**:
- **Direct DB inserts in test setup**: Faster but couples tests to schema. Tests wouldn't validate API behavior.
- **Multiple browser pages**: Simulate multiple players by opening multiple pages. Realistic but slow and flaky due to polling timing.
- **Single page + API chaining**: The chosen approach. Fast, deterministic, and validates real API behavior.

### 5. Managing Next.js dev server lifecycle

**Choice**: The dev server is started separately before tests run. Tests read `BASE_URL` from an env variable (default `http://localhost:3000`). A `pretest:e2e` npm script option is documented but not auto-started (to avoid port conflicts).

**Rationale**: Auto-starting the dev server in `globalSetup` is fragile (port conflicts, orphan processes on crash). Explicit `BASE_URL` env var gives flexibility for CI (where the server is started by the CI pipeline) and local dev (where the server is already running).

## Risks / Trade-offs

- **[Flaky tests from polling timing]**: The app uses 2s TanStack Query polling. Tests that wait for phase transitions may need `page.waitForSelector()` or `page.waitForFunction()` with generous timeouts. Mitigation: test helpers include `waitForPhase(phase)` that polls the DOM until the expected phase content appears.
- **[Test isolation conflicts]**: Multiple test files share one browser and one DB. Room codes are unique per test (auto-generated 6-char codes), so collisions are unlikely. Mitigation: each test file creates its own room and cleans up (no cleanup needed since rooms are ephemeral).
- **[Seed data durability]**: If the database schema changes, seed helpers must be updated. Mitigation: seed helpers use the same API types and Drizzle schemas the app uses, so type-checked at build time.
- **[Puppeteer Chromium download size]**: Puppeteer downloads ~300MB Chromium binary. Mitigation: documented as a one-time setup cost; CI caches the binary.
- **[Cross-platform Chromium differences]**: Headless Chromium may behave slightly differently on macOS vs Linux CI. Mitigation: use `headless: 'new'` (new headless mode) for consistent behavior; document `PUPPETEER_EXECUTABLE_PATH` for CI to use system Chromium.

## Open Questions

- Should test seed endpoints use a shared secret or be completely unprotected? (Decision: unprotected in dev mode only, gated by `NODE_ENV !== 'production'`)
- Should E2E tests run in CI on every PR or only on main branch pushes? (Defer to CI configuration — out of scope for this change)
