## ADDED Requirements

### Requirement: Reconnect restores player session from localStorage
The system SHALL check `localStorage` for a stored `bsking-player` entry on application load and, if found, call `POST /api/rooms/[code]/reconnect` to validate and restore the player session.

#### Scenario: Successful reconnect skips registration
- **WHEN** a user navigates to `/game/<code>` and `localStorage` contains a valid `playerId` and `playerSecret` for that room
- **THEN** `POST /api/rooms/<code>/reconnect` is called, and on success the player is redirected to the current game phase without needing to re-register

#### Scenario: Failed reconnect clears storage and redirects to lobby
- **WHEN** the reconnect API call returns 401 (invalid or expired token)
- **THEN** the `bsking-player` entry is cleared from `localStorage`, and the user is redirected to `/`

#### Scenario: No stored credentials shows register page
- **WHEN** a user navigates to `/game/<code>` and `localStorage` has no `bsking-player` entry for that room
- **THEN** the user is redirected to `/game/<code>/register`

### Requirement: localStorage stores room-specific credentials
The system SHALL store player credentials in `localStorage` under the key `bsking-player` as a JSON object containing `{ roomCode, playerId, playerSecret }`.

#### Scenario: Credentials stored on join
- **WHEN** a player successfully joins a room via `POST /api/rooms/<code>/join`
- **THEN** `localStorage.setItem('bsking-player', JSON.stringify({ roomCode, playerId, playerSecret }))` is called

#### Scenario: Credentials cleared on disconnect
- **WHEN** a player clicks "Leave Room" or is redirected to lobby with error
- **THEN** `localStorage.removeItem('bsking-player')` is called

### Requirement: Reconnect validates player ownership
The system SHALL only restore a session if the stored `roomCode` matches the current URL's `[code]` parameter.

#### Scenario: Different room code ignores stored credentials
- **WHEN** `localStorage` has `roomCode: 'ABC123'` but the user navigates to `/game/XYZ789`
- **THEN** the stored credentials are ignored and the user is routed to `/game/XYZ789/register`
