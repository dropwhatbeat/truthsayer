## Why

The Absurd Truths app currently has zero UI or end-to-end testing coverage. All multiplayer game flows — room creation, joining, role-based phase rendering, voting, scoring, and reconnection — are untested against regressions. With the frontend-to-backend wiring nearly complete, adding browser-level tests now prevents regressions before v1 ships.

## What Changes

- Add Puppeteer as the E2E testing framework for browser-based UI testing
- Create end-to-end test suites covering all multiplayer game phases (lobby, register, waiting, reading, voting, reveal, end)
- Create end-to-end test suites for reconnection flow and error/edge cases
- Add test fixtures for seeding game state (rooms, players, rounds) to enable deterministic E2E tests
- Add npm scripts for running E2E tests (standalone and alongside unit tests)
- Add CI-compatible configuration (headless Chromium, configurable base URL)

## Capabilities

### New Capabilities
- `e2e-test-infra`: Puppeteer setup, configuration, npm scripts, and test fixtures/seeding utilities for headless browser testing
- `e2e-lobby-join`: E2E tests for the lobby page (room creation, join-by-code, validation errors) and registration flow (name entry, localStorage credential persistence)
- `e2e-game-phases`: E2E tests for the full game lifecycle: waiting room (player list, host start), reading phase (role-based visibility), voting phase (vote submission, validation), reveal phase (results display, scoring), and end screen (final scores, winner display)
- `e2e-reconnect-errors`: E2E tests for reconnection (valid/invalid token redirect) and error paths (invalid room code, expired session, mid-game join rejection)

### Modified Capabilities
<!-- None — this change adds new test infrastructure without modifying existing spec requirements -->

## Impact

- **New dependency**: `puppeteer` (devDependency in package.json)
- **New files**: `e2e/` directory with test suites, fixtures, and config
- **New npm scripts**: `test:e2e`, `test:e2e:headed`, `test:e2e:debug`
- **Affected configs**: `package.json` (scripts + devDeps), `tsconfig.json` (if e2e path alias needed)
- **Affected API routes**: Test fixture seed endpoints may be added (dev-only) to set up deterministic game state
- **No changes** to existing application code, components, or business logic
