## ADDED Requirements

### Requirement: Lobby page displays room creation and join options
The system SHALL render `app/page.tsx` as a lobby page with a "Create Room" button and a text input for entering a 6-character room code to join an existing room.

#### Scenario: Lobby page renders create and join options
- **WHEN** a user navigates to `/`
- **THEN** the page displays a "Create Room" button and a text input labeled "Enter Room Code" with a "Join" button

#### Scenario: Single-device local game is no longer at root
- **WHEN** a user navigates to `/`
- **THEN** the AbsurdTruthsGame single-device component is not rendered; the lobby page is shown instead

### Requirement: Creating a room triggers API call and redirects
The system SHALL call `POST /api/rooms` when the "Create Room" button is clicked and redirect the user to `/game/[code]/register` on success.

#### Scenario: Successful room creation redirects to register
- **WHEN** a user clicks "Create Room"
- **THEN** a POST request is sent to `/api/rooms` with default config, and upon receiving `{ roomId, code }`, the browser navigates to `/game/<code>/register`

#### Scenario: Room creation failure shows error
- **WHEN** the `POST /api/rooms` call fails (network error or server error)
- **THEN** an error message is displayed on the lobby page and no redirect occurs

### Requirement: Joining a room validates the code via API
The system SHALL call `GET /api/rooms/[code]` when a user enters a code and clicks "Join", validating the room exists and is joinable before redirecting.

#### Scenario: Valid room code redirects to register
- **WHEN** a user enters a valid 6-character room code and clicks "Join"
- **THEN** the system calls `GET /api/rooms/<code>`, and on receiving a valid response, navigates to `/game/<code>/register`

#### Scenario: Invalid room code shows error
- **WHEN** a user enters a non-existent room code and clicks "Join"
- **THEN** an error message is displayed indicating the room was not found

#### Scenario: Game already started shows error
- **WHEN** a user enters a code for a room that is already in `playing` status and clicks "Join"
- **THEN** an error message is displayed indicating the game has already started

### Requirement: Join room creates a player row via API
The system SHALL call `POST /api/rooms/[code]/join` upon entering the register flow and store the returned `playerId` and `playerSecret` in `localStorage`.

#### Scenario: Successful join stores credentials
- **WHEN** the register page loads (either from room creation or code join)
- **THEN** `POST /api/rooms/<code>/join` is called, and the response `{ playerId, playerSecret }` is stored in `localStorage` under key `bsking-player`

#### Scenario: Join failure redirects to lobby
- **WHEN** the `POST /api/rooms/<code>/join` call fails (e.g., room is full or already playing)
- **THEN** the user is redirected to `/` with an error message

### Requirement: Register page submits player name to API
The system SHALL render a name input form at `/game/[code]/register` that submits the player's name via `POST /api/rooms/[code]/register` with the stored `playerId` and `playerSecret`.

#### Scenario: Successful name registration redirects to waiting room
- **WHEN** a user enters a name and submits the register form
- **THEN** `POST /api/rooms/<code>/register` is called with `{ playerId, playerSecret, name }`, and on success the browser navigates to `/game/<code>/waiting`

#### Scenario: Empty name submission is rejected
- **WHEN** a user submits the register form with an empty or whitespace-only name
- **THEN** a client-side validation error is shown and no API call is made

#### Scenario: Invalid credentials show error
- **WHEN** the register API call returns 401 (invalid playerSecret)
- **THEN** an error message is displayed, `localStorage` is cleared, and the user is redirected to the lobby
