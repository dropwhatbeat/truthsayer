## ADDED Requirements

### Requirement: End screen displays final scores and winner
The system SHALL render `app/game/[code]/end/page.tsx` showing all players' final cumulative scores and identifying the winner.

#### Scenario: End screen shows final scoreboard
- **WHEN** the end page loads
- **THEN** a sorted scoreboard is displayed listing each player's name and final score in descending order

#### Scenario: Winner is identified
- **WHEN** the end page loads and one player has the highest score
- **THEN** that player is visually highlighted as the winner with a distinctive indicator

#### Scenario: Tie is handled
- **WHEN** the end page loads and multiple players share the highest score
- **THEN** all tied players are highlighted as winners

### Requirement: Play Again button creates a new game
The system SHALL display a "Play Again" button that calls `POST /api/rooms/[code]/start` to restart the game with the same room code and players, using the same config but a freshly shuffled deck.

#### Scenario: Play Again starts a new game
- **WHEN** the host clicks "Play Again"
- **THEN** `POST /api/rooms/<code>/start` is called and all players are redirected to the reading phase of the new game

#### Scenario: Non-host sees waiting for host message
- **WHEN** a non-host player views the end screen
- **THEN** the "Play Again" button is not visible and a "Waiting for host to start a new game..." message is displayed

### Requirement: Back to Lobby button
The system SHALL display a "Back to Lobby" button that clears the current room's `localStorage` entry and navigates to `/`.

#### Scenario: Back to lobby clears session
- **WHEN** a player clicks "Back to Lobby"
- **THEN** the `bsking-player` key is removed from `localStorage` and the browser navigates to `/`
