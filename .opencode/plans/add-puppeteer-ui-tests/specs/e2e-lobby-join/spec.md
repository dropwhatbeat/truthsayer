## ADDED Requirements

### Requirement: Room creation from lobby
The E2E test SHALL verify that clicking "Create Room" on the lobby page creates a room and navigates to the registration page.

#### Scenario: Successful room creation
- **WHEN** the user clicks "Create Room" on the lobby page (`/`)
- **THEN** a `POST /api/rooms` request is made
- **AND** the browser navigates to `/game/[code]/register` on success
- **AND** the registration page displays the room code

#### Scenario: Room creation handles network failure
- **WHEN** the "Create Room" button is clicked but the API is unreachable
- **THEN** an error message is displayed to the user
- **AND** the browser stays on the lobby page

### Requirement: Join room by code from lobby
The E2E test SHALL verify that entering a valid room code and clicking "Join" navigates to registration.

#### Scenario: Join with valid room code
- **WHEN** the user enters a valid 6-character room code and clicks "Join"
- **THEN** a `GET /api/rooms/[code]` request validates the room exists
- **AND** the browser navigates to `/game/[code]/register` on success

#### Scenario: Join with invalid room code
- **WHEN** the user enters a non-existent or invalid room code and clicks "Join"
- **THEN** an error message is displayed (e.g., "Room not found")
- **AND** the browser stays on the lobby page

### Requirement: Player registration flow
The E2E test SHALL verify that the registration page joins the room, collects a name, and stores credentials in localStorage.

#### Scenario: Auto-join on registration page load
- **WHEN** the browser navigates to `/game/[code]/register`
- **THEN** a `POST /api/rooms/[code]/join` request is made automatically
- **AND** the returned `{ playerId, playerSecret }` is stored in `localStorage` under key `bsking-player`
- **AND** a name input form is displayed

#### Scenario: Successful name registration
- **WHEN** the user enters a name and clicks "Join Game"
- **THEN** `POST /api/rooms/[code]/register` is called with the player credentials and name
- **AND** the browser navigates to `/game/[code]/waiting` on success

#### Scenario: Empty name validation
- **WHEN** the user clicks "Join Game" with an empty or whitespace-only name
- **THEN** an error message "Please enter a name" is displayed
- **AND** no API request is made

#### Scenario: Name registration with max length
- **WHEN** the user enters a name longer than 30 characters
- **THEN** the input field SHALL not accept more than 30 characters

### Requirement: Credential persistence in localStorage
The E2E test SHALL verify that player credentials are correctly stored and retrievable from localStorage.

#### Scenario: Credentials stored after join
- **WHEN** `POST /api/rooms/[code]/join` returns successfully
- **THEN** `localStorage.getItem('bsking-player')` returns a JSON string containing `{ roomCode, playerId, playerSecret }`

#### Scenario: Credentials cleared on 401 error
- **WHEN** `POST /api/rooms/[code]/register` returns 401
- **THEN** `localStorage` key `bsking-player` is removed
- **AND** the browser eventually navigates back to the lobby (`/`)
