## ADDED Requirements

### Requirement: Valid reconnection restores session
The E2E test SHALL verify that a player with valid stored credentials can reconnect to their game session.

#### Scenario: Reconnect with valid credentials
- **WHEN** the browser has `bsking-player` in `localStorage` with valid `playerId` and `playerSecret`
- **AND** the browser navigates to `/game/[code]` (the game entry point)
- **THEN** `POST /api/rooms/[code]/reconnect` is called with the stored credentials
- **AND** the browser redirects to the current game phase page (not registration)

#### Scenario: Reconnect from registration page skips to game
- **WHEN** a player with valid credentials navigates to `/game/[code]/register`
- **THEN** the browser redirects to the game entry point and then to the current phase

### Requirement: Invalid reconnection redirects to registration
The E2E test SHALL verify that invalid or expired credentials trigger re-registration.

#### Scenario: Reconnect with invalid credentials
- **WHEN** the browser has `bsking-player` in `localStorage` with invalid/expired credentials
- **AND** the browser navigates to `/game/[code]`
- **THEN** `POST /api/rooms/[code]/reconnect` returns an error
- **AND** `localStorage` key `bsking-player` is cleared
- **AND** the browser redirects to `/game/[code]/register`

#### Scenario: Reconnect with missing credentials
- **WHEN** the browser has no `bsking-player` in `localStorage`
- **AND** the browser navigates to `/game/[code]`
- **THEN** the browser redirects to `/game/[code]/register`

### Requirement: Phase redirect on mismatch
The E2E test SHALL verify that a player on the wrong phase page is redirected to the correct phase.

#### Scenario: Player on waiting page while game is in voting phase
- **WHEN** the browser is on `/game/[code]/waiting` but the room's `currentPhase` is `'voting'`
- **THEN** the browser redirects to `/game/[code]/voting` (or to the entry point which then redirects)

#### Scenario: Player on voting page while game is in reading phase
- **WHEN** the browser is on `/game/[code]/voting` but the room's `currentPhase` is `'reading'`
- **THEN** the browser redirects to the reading phase

### Requirement: Invalid room code handling
The E2E test SHALL verify graceful handling of non-existent or malformed room codes.

#### Scenario: Navigate to non-existent room
- **WHEN** the browser navigates to `/game/NONEXIST`
- **THEN** an error message is displayed (e.g., "Room not found")
- **AND** a "Back to Lobby" button or link is shown

#### Scenario: Navigate to malformed room code
- **WHEN** the browser navigates to `/game/a` (code too short)
- **THEN** an appropriate error is shown and the user can return to lobby

### Requirement: Error recovery on API failures
The E2E test SHALL verify the app gracefully recovers from transient API failures.

#### Scenario: Network error during phase polling
- **WHEN** the TanStack Query poll interval fires but the API is temporarily unreachable
- **THEN** the existing room state is preserved (no blank screen)
- **AND** the next successful poll restores normal operation

#### Scenario: Refresh on error state
- **WHEN** the room query enters an error state (e.g., after a 404)
- **THEN** an error message is displayed
- **AND** a "Back to Lobby" button is available

### Requirement: Mid-game join rejection
The E2E test SHALL verify that new players cannot join after the game has started.

#### Scenario: Attempt to join a started game
- **WHEN** a player without credentials navigates to a room that has already started
- **AND** the browser redirects to `/game/[code]/register`
- **THEN** the `POST /api/rooms/[code]/join` call returns an error
- **AND** an appropriate error message is displayed
