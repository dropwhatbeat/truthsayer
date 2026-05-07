## ADDED Requirements

### Requirement: Puppeteer dependency and configuration
The project SHALL include `puppeteer` as a devDependency with a separate Vitest configuration for E2E tests.

#### Scenario: Puppeteer is installable
- **WHEN** `npm install` is run
- **THEN** `puppeteer` is available in `node_modules` with a usable Chromium binary

#### Scenario: E2E tests have isolated config
- **WHEN** `vitest run --config vitest.e2e.config.ts` is executed
- **THEN** only E2E test files are executed (not unit tests in `lib/__tests__/`)
- **AND** the default timeout is at least 30 seconds
- **AND** tests run sequentially (not in parallel)

#### Scenario: Headed mode is available
- **WHEN** `HEADED=true vitest run --config vitest.e2e.config.ts` is executed
- **THEN** Chromium launches in non-headless mode for debugging

### Requirement: npm scripts for E2E testing
The project SHALL provide npm scripts for running E2E tests in various modes.

#### Scenario: Headless test run
- **WHEN** `npm run test:e2e` is executed with the dev server running on `BASE_URL`
- **THEN** all E2E test suites execute headlessly and report results

#### Scenario: Headed test run
- **WHEN** `npm run test:e2e:headed` is executed
- **THEN** Chromium launches with a visible window for debugging

### Requirement: E2E directory structure
The project SHALL have an `e2e/` directory containing test suites, shared helpers, and global setup/teardown.

#### Scenario: Test files are organized by capability
- **WHEN** a developer opens the `e2e/` directory
- **THEN** the directory contains `lobby-join.test.ts`, `game-phases.test.ts`, `reconnect.test.ts`, `error-paths.test.ts`
- **AND** shared utilities are in `helpers.ts` and `fixtures/seed.ts`

#### Scenario: Global setup launches one browser instance
- **WHEN** E2E tests start
- **THEN** a single Puppeteer browser instance is launched in `globalSetup`
- **AND** the browser is closed in `globalTeardown`

### Requirement: API-based seed helpers
The project SHALL provide helper functions that use the app's API endpoints to seed game state for tests.

#### Scenario: Create a room via API
- **WHEN** `createRoom(page)` is called from a test
- **THEN** a new room is created via `POST /api/rooms` and the returned `{ code, roomId }` is available for subsequent calls

#### Scenario: Join and register players via API
- **WHEN** `joinRoom(page, code)` followed by `registerPlayer(page, code, credentials, name)` are called
- **THEN** the player is joined, registered with the given name, and credentials are stored in `localStorage`

#### Scenario: Seed a game in voting phase
- **WHEN** `seedGameInPhase(page, 'voting', { playerCount: 4 })` is called
- **THEN** the API creates a room with 4 registered players, starts the game, and advances through moves to the voting phase

### Requirement: Dev-only seed endpoint
The project MAY include a dev-only `POST /api/test/seed` endpoint for rapid game state setup in tests.

#### Scenario: Seed endpoint is only available in development
- **WHEN** `NODE_ENV=production` and `POST /api/test/seed` is called
- **THEN** the endpoint returns 404

#### Scenario: Seed endpoint creates room with specified state
- **WHEN** `POST /api/test/seed` is called with `{ phase: 'voting', playerCount: 4, deckType: 'absurd-truths' }` in development
- **THEN** a room is created in the specified phase with the specified number of players and deck
