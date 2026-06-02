## ADDED Requirements

### Requirement: Waiting room displays live player list via polling
The system SHALL render `app/game/[code]/waiting/page.tsx` with a list of all players in the room, refreshed every 2 seconds via `GET /api/rooms/[code]`.

#### Scenario: Player list shows all registered players
- **WHEN** the waiting room page loads
- **THEN** `GET /api/rooms/<code>` is called and the response's `players` array is displayed showing each player's name

#### Scenario: Player list updates when new player joins
- **WHEN** a new player registers in the same room
- **THEN** within 2 seconds, the waiting room page reflects the new player in the list without manual refresh

#### Scenario: Polling stops on unmount
- **WHEN** the user navigates away from the waiting room page
- **THEN** the 2-second polling interval is cleared and no further requests fire

### Requirement: Host sees start game button
The system SHALL identify the room creator as the host and display a "Start Game" button visible only to them.

#### Scenario: Host sees start button
- **WHEN** the player viewing the waiting room is the room's `created_by` player
- **THEN** a "Start Game" button is visible

#### Scenario: Non-host does not see start button
- **WHEN** the player viewing the waiting room is not the room's `created_by` player
- **THEN** the "Start Game" button is not visible, and a "Waiting for host to start..." message is displayed instead

### Requirement: Start button is disabled with fewer than 3 players
The system SHALL disable the "Start Game" button when fewer than 3 players have registered in the room.

#### Scenario: Start button disabled with 2 players
- **WHEN** only 2 players are registered and the host views the waiting room
- **THEN** the "Start Game" button is visually disabled and displays a message like "Need at least 3 players"

#### Scenario: Start button enabled with 3+ players
- **WHEN** 3 or more players are registered and the host views the waiting room
- **THEN** the "Start Game" button is enabled

### Requirement: Host starts game via API
The system SHALL call `POST /api/rooms/[code]/start` when the host clicks "Start Game" and handle the response.

#### Scenario: Successful start redirects all clients
- **WHEN** the host clicks "Start Game" and the API returns 200
- **THEN** the host is redirected to `/game/<code>` (which in turn redirects to the current phase)

#### Scenario: Failed start shows error
- **WHEN** the `POST /api/rooms/<code>/start` call fails (e.g., fewer than 3 players server-side)
- **THEN** an error message is displayed on the waiting page and no redirect occurs
