## ADDED Requirements

### Requirement: Waiting room renders player list
The E2E test SHALL verify the waiting room displays all registered players and the room code.

#### Scenario: Player list updates with joined players
- **WHEN** the browser is on `/game/[code]/waiting` with 2 registered players
- **THEN** both player names are visible in the player list
- **AND** the room code is displayed on the page

#### Scenario: Host sees Start Game button
- **WHEN** the current player is the room creator (host)
- **THEN** a "Start Game" button is visible

#### Scenario: Host cannot start with fewer than 3 players
- **WHEN** the host is on the waiting page with fewer than 3 registered players
- **THEN** the "Start Game" button is disabled
- **AND** the button text shows the minimum player requirement

#### Scenario: Host can start with 3+ players
- **WHEN** the host is on the waiting page with at least 3 registered players
- **THEN** the "Start Game" button is enabled
- **AND** clicking it sends `POST /api/rooms/[code]/start`

#### Scenario: Non-host sees waiting message
- **WHEN** the current player is not the host
- **THEN** a "Waiting for host to start..." message is displayed
- **AND** no "Start Game" button is rendered

### Requirement: Reading phase shows role-based content
The E2E test SHALL verify the reading phase displays different content based on the player's role.

#### Scenario: Honest player sees the real answer
- **WHEN** the honest player is on the reading phase page
- **THEN** the card term/phrase is displayed
- **AND** the real answer (`card_answer`) is visible
- **AND** category pills are displayed

#### Scenario: Liar does not see the real answer
- **WHEN** a liar is on the reading phase page
- **THEN** the card term/phrase is displayed
- **BUT** the real answer is NOT visible

#### Scenario: Judge does not see the real answer
- **WHEN** the judge is on the reading phase page
- **THEN** the card term/phrase is displayed
- **BUT** the real answer is NOT visible

#### Scenario: Ready to Vote button submits move
- **WHEN** any player clicks "Ready to Vote"
- **THEN** `POST /api/rooms/[code]/moves` is called with `moveType: 'ready_to_vote'`

### Requirement: Voting phase shows role-based UI
The E2E test SHALL verify the voting phase displays vote buttons for the judge and a waiting state for others.

#### Scenario: Judge sees vote buttons for all other players
- **WHEN** the judge is on the voting phase page
- **THEN** a grid of vote buttons is displayed showing all other players' names
- **AND** the question "Who do you think gave the real answer?" is shown

#### Scenario: Judge can submit a vote
- **WHEN** the judge clicks on a player's vote button
- **THEN** `POST /api/rooms/[code]/moves` is called with `moveType: 'cast_vote'` and the target player ID
- **AND** a confirmation message shows the voted player's name

#### Scenario: Non-judge sees waiting message
- **WHEN** a non-judge player is on the voting phase page
- **THEN** a "Waiting for the judge to vote..." message is displayed
- **AND** no vote buttons are rendered

#### Scenario: Vote submission handles 409 conflict gracefully
- **WHEN** the judge submits a vote but the server returns 409 (already voted)
- **THEN** no error is shown to the user
- **AND** the confirmation state still appears

### Requirement: Reveal phase shows results and scores
The E2E test SHALL verify the reveal phase displays the correct answer, vote results, and scoreboard.

#### Scenario: Real answer is displayed
- **WHEN** any player is on the reveal phase page
- **THEN** the card term and real answer are both visible

#### Scenario: Scoreboard shows all player scores
- **WHEN** the reveal phase page renders
- **THEN** a scoreboard table is displayed with all players and their scores
- **AND** scores are sorted (highest first)

#### Scenario: Next Round button advances the game
- **WHEN** the host clicks "Next Round"
- **THEN** `POST /api/rooms/[code]/moves` is called with `moveType: 'next_round'`
- **AND** the browser eventually navigates to the next reading phase

### Requirement: End screen shows final results
The E2E test SHALL verify the end screen displays final scores and winner(s).

#### Scenario: Final scores are displayed
- **WHEN** the game reaches the end phase
- **THEN** the final scoreboard is displayed sorted by total score
- **AND** the winner(s) are visually highlighted

#### Scenario: Play Again button for host
- **WHEN** the host is on the end screen
- **THEN** a "Play Again" button is visible
- **AND** clicking it calls `POST /api/rooms/[code]/start`

#### Scenario: Back to Lobby clears credentials
- **WHEN** any player clicks "Back to Lobby"
- **THEN** `localStorage` key `bsking-player` is removed
- **AND** the browser navigates to `/`
