## ADDED Requirements

### Requirement: Voting page shows role-based UI
The system SHALL render `app/game/[code]/voting/page.tsx` with different views depending on the current player's role: judge sees vote buttons for all other players, non-judge players see a waiting message.

#### Scenario: Judge sees voting grid
- **WHEN** the current player's role is `judge` and the page loads
- **THEN** the page displays a list of all other players as tappable vote buttons, each showing the player's name

#### Scenario: Honest player sees waiting message
- **WHEN** the current player's role is `honest` and the page loads
- **THEN** the page displays "Waiting for the judge to vote..." and no vote buttons are visible

#### Scenario: Liar player sees waiting message
- **WHEN** the current player's role is `liar` and the page loads
- **THEN** the page displays "Waiting for the judge to vote..." and no vote buttons are visible

### Requirement: Judge submits vote via API
The system SHALL call `POST /api/rooms/[code]/moves` with `moveType: 'cast_vote'` and `data: { targetPlayerId }` when the judge selects a player.

#### Scenario: Successful vote submission
- **WHEN** the judge taps a player button
- **THEN** `POST /api/rooms/<code>/moves` is called with `{ playerId, playerSecret, moveType: 'cast_vote', data: { targetPlayerId } }`, and on success a confirmation state is shown

#### Scenario: Vote submission failure shows error
- **WHEN** the vote API call returns 409 (wrong phase) or fails
- **THEN** an error message is displayed and the vote buttons remain interactive

#### Scenario: Judge cannot vote for themselves
- **WHEN** the judge views the voting page
- **THEN** the judge's own name does not appear in the voting grid

### Requirement: Voting page redirects when phase advances
The system SHALL redirect all players to `/game/[code]` when the room's `current_phase` changes from `voting`, which in turn redirects to the reveal phase.

#### Scenario: Judge is redirected after vote is counted
- **WHEN** the room's phase advances past `voting`
- **THEN** all players on the voting page are redirected within 2 seconds via the polling self-redirect
