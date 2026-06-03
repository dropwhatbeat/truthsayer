## ADDED Requirements

### Requirement: POST /api/rooms creates a new room
The system SHALL accept `POST /api/rooms` with an optional JSON body containing `{ deckType, roundCount, timerSecs }` and return a newly created room with a unique 6-character alphanumeric code.

#### Scenario: Creating a room with default config
- **WHEN** `POST /api/rooms` is called with an empty body
- **THEN** the response status is 201 with JSON `{ roomId, code, status: "lobby" }` and the code is 6 alphanumeric characters

#### Scenario: Creating a room with custom config
- **WHEN** `POST /api/rooms` is called with `{ "deckType": "absurd-truths", "roundCount": 5, "timerSecs": 30 }`
- **THEN** the room is created with the specified config stored in the `config` column

#### Scenario: Room code is unique
- **WHEN** a room code collides with an existing active room
- **THEN** a new unique code is generated and the room is created successfully

### Requirement: GET /api/rooms/[code] returns room state
The system SHALL return the full room state including status, current_phase, config, and player list for a given room code.

#### Scenario: Fetching an existing room
- **WHEN** `GET /api/rooms/ABC123` is called for an existing room
- **THEN** the response status is 200 with JSON containing `{ id, code, status, currentPhase, config, players }`

#### Scenario: Fetching a non-existent room
- **WHEN** `GET /api/rooms/ZZZZZZ` is called for a room that does not exist
- **THEN** the response status is 404

#### Scenario: Player list includes names and roles
- **WHEN** a room with registered players is fetched
- **THEN** the `players` array contains objects with `{ id, name, role }` for each player

### Requirement: POST /api/rooms/[code]/join adds a player
The system SHALL accept `POST /api/rooms/[code]/join` and create a new player row in the room, returning a player ID and secret token for authentication.

#### Scenario: Joining a lobby room
- **WHEN** `POST /api/rooms/ABC123/join` is called on a room in `lobby` status
- **THEN** the response status is 201 with JSON `{ playerId, playerSecret }` and a player row is created with null name and role

#### Scenario: Cannot join a playing room
- **WHEN** `POST /api/rooms/ABC123/join` is called on a room in `playing` status
- **THEN** the response status is 409

#### Scenario: Cannot join a non-existent room
- **WHEN** `POST /api/rooms/ZZZZZZ/join` is called
- **THEN** the response status is 404

#### Scenario: playerSecret is hashed with bcrypt
- **WHEN** a player joins a room
- **THEN** the `players.secret_hash` column stores a bcrypt hash of the `playerSecret`, not the plaintext value

### Requirement: POST /api/rooms/[code]/register sets player name
The system SHALL accept `POST /api/rooms/[code]/register` with `{ playerId, playerSecret, name }` and update the player's name.

#### Scenario: Registering with valid credentials
- **WHEN** `POST /api/rooms/ABC123/register` is called with valid `playerId`, `playerSecret`, and `name`
- **THEN** the response status is 200 and the player's name is updated in the database

#### Scenario: Registering with invalid playerSecret
- **WHEN** `POST /api/rooms/ABC123/register` is called with an incorrect `playerSecret`
- **THEN** the response status is 401

#### Scenario: Registering with non-existent playerId
- **WHEN** `POST /api/rooms/ABC123/register` is called with a `playerId` that does not exist in this room
- **THEN** the response status is 404

### Requirement: POST /api/rooms/[code]/start begins the game
The system SHALL accept `POST /api/rooms/[code]/start` (called by the host), validate at least 3 players are registered, assign roles (1 judge, 1 honest, rest liars), shuffle the deck server-side, insert `game_rounds` rows, and set `current_phase = 'reading'` and `status = 'playing'`.

#### Scenario: Starting a game with sufficient players
- **WHEN** `POST /api/rooms/ABC123/start` is called with 3+ registered players
- **THEN** the response status is 200, `game_rounds` rows are populated with shuffled cards, each player has a role assigned, and `current_phase` is `'reading'`

#### Scenario: Starting with fewer than 3 players
- **WHEN** `POST /api/rooms/ABC123/start` is called with fewer than 3 players
- **THEN** the response status is 400 with an error message indicating minimum player count

#### Scenario: Starting a game not in lobby status
- **WHEN** `POST /api/rooms/ABC123/start` is called on a room already `playing`
- **THEN** the response status is 409

#### Scenario: Card order is deterministic per room
- **WHEN** a game is started
- **THEN** all `game_rounds` rows have non-null `card_phrase`, `card_answer`, and `categories` fields in the same order for all polling clients

#### Scenario: Exactly one player is assigned judge and one is assigned honest
- **WHEN** a game is started with N players
- **THEN** exactly 1 player has `role = 'judge'`, exactly 1 player has `role = 'honest'`, and N-2 players have `role = 'liar'`

### Requirement: POST /api/rooms/[code]/moves submits a game move
The system SHALL accept `POST /api/rooms/[code]/moves` with `{ playerId, playerSecret, moveType, data }`, validate the move against the current game phase using the XState machine, insert a `game_moves` row, and advance the phase when conditions are met.

#### Scenario: Submitting a valid move
- **WHEN** `POST /api/rooms/ABC123/moves` is called with `{ moveType: "cast_vote", data: { targetPlayerId: "uuid" } }` during the voting phase
- **THEN** the response status is 200, a `game_moves` row is created, and the phase may advance if all required moves are submitted

#### Scenario: Submitting a move for the wrong phase
- **WHEN** `POST /api/rooms/ABC123/moves` is called with `{ moveType: "cast_vote" }` during the `reading` phase
- **THEN** the response status is 409 with an error indicating the expected phase

#### Scenario: Submitting a move with invalid credentials
- **WHEN** `POST /api/rooms/ABC123/moves` is called with an incorrect `playerSecret`
- **THEN** the response status is 401

#### Scenario: Move data is stored in JSONB
- **WHEN** a move with `data: { targetPlayerId: "uuid" }` is submitted
- **THEN** the `game_moves.data` column stores and returns the exact JSON payload

### Requirement: API uses Drizzle ORM for database operations
The system SHALL use the Drizzle ORM client (`lib/db/index.ts`) for all database read and write operations in API route handlers.

#### Scenario: Room creation persists via Drizzle
- **WHEN** a room is created via `POST /api/rooms`
- **THEN** a row exists in the `rooms` table that can be queried directly via Drizzle or raw SQL

#### Scenario: All API responses are JSON
- **WHEN** any API route handler responds
- **THEN** the `Content-Type` header is `application/json`
