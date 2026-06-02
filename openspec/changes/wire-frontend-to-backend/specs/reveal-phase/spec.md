## ADDED Requirements

### Requirement: Reveal page displays round results
The system SHALL render `app/game/[code]/reveal/page.tsx` showing the current card's real answer, the identity of the honest player, and who the judge voted for.

#### Scenario: Reveal page shows card answer
- **WHEN** the reveal page loads
- **THEN** the page displays the current round's card phrase and its real answer text

#### Scenario: Reveal page shows who was honest
- **WHEN** the reveal page loads
- **THEN** the page identifies which player was the honest player for this round

#### Scenario: Reveal page shows judge's vote
- **WHEN** the reveal page loads and the judge has submitted a vote
- **THEN** the page displays who the judge voted for

### Requirement: Reveal page displays cumulative scores
The system SHALL compute and display round-by-round and cumulative scores for all players.

#### Scenario: Score increments for correct judge guess
- **WHEN** the judge voted for the honest player
- **THEN** the judge's score increments by 1 for this round

#### Scenario: Score increments for honest when judge is wrong
- **WHEN** the judge voted for a liar
- **THEN** the honest player's score increments by 1 for this round

#### Scenario: Scoreboard shows all player scores
- **WHEN** the reveal page loads
- **THEN** a scoreboard is displayed listing each player's name and their cumulative score

### Requirement: Next Round button advances the game
The system SHALL display a "Next Round" button that calls `POST /api/rooms/[code]/moves` with `moveType: 'next_round'` and handles the response.

#### Scenario: Next round advances to waiting
- **WHEN** a player clicks "Next Round" and more rounds remain
- **THEN** the API call succeeds and the user is redirected to the next phase via polling redirect

#### Scenario: Next round on last card goes to end screen
- **WHEN** a player clicks "Next Round" and no more rounds remain
- **THEN** the room transitions to the `end` phase and users are redirected to `/game/<code>/end`

#### Scenario: Phase mismatch during next round call
- **WHEN** the "Next Round" API call returns 409 (phase already advanced by another client)
- **THEN** the page gracefully handles the redirect triggered by the polling self-check
