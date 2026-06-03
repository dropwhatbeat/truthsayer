## MODIFIED Requirements

### Requirement: Register page placeholder exists at /game/[code]/register
The system SHALL provide a fully functional registration page at `app/game/[code]/register/page.tsx` that calls `POST /api/rooms/[code]/join` on mount, stores credentials in `localStorage`, accepts a name input, and calls `POST /api/rooms/[code]/register` on submission.

#### Scenario: Navigating to the register page
- **WHEN** a user navigates to `/game/ABC123/register`
- **THEN** the page calls `POST /api/rooms/ABC123/join`, stores the returned `{ playerId, playerSecret }`, and renders a name input form

#### Scenario: Register page is a client component
- **WHEN** the register page is examined
- **THEN** it is marked with `'use client'` directive

### Requirement: Waiting room page placeholder exists at /game/[code]/waiting
The system SHALL provide a fully functional waiting room page at `app/game/[code]/waiting/page.tsx` that polls the room state every 2 seconds, displays the player list, and provides a start button for the host.

#### Scenario: Navigating to the waiting page
- **WHEN** a user navigates to `/game/XYZ789/waiting`
- **THEN** the page polls `GET /api/rooms/XYZ789`, renders the player list, and conditionally renders a "Start Game" button for the host

### Requirement: Reading phase page placeholder exists at /game/[code]/reading
The system SHALL provide a functional reading phase page at `app/game/[code]/reading/page.tsx` that displays the current card's term and category, with role-based visibility: the Honest player sees the real description, while Liars and the Judge see only the term and categories.

#### Scenario: Navigating to the reading page
- **WHEN** a user navigates to `/game/ABC123/reading`
- **THEN** the page displays the current round's card. The Honest player sees the `card_answer` text. Liars and Judge see only the `card_phrase` and categories.

### Requirement: Voting phase page placeholder exists at /game/[code]/voting
The system SHALL provide a functional voting page at `app/game/[code]/voting/page.tsx` where the judge sees vote buttons for all other players and submits their vote via `POST /api/rooms/[code]/moves`.

#### Scenario: Navigating to the voting page
- **WHEN** a user navigates to `/game/ABC123/voting`
- **THEN** the judge sees a grid of vote buttons for all other players. Non-judge players see a waiting message.

### Requirement: Reveal phase page placeholder exists at /game/[code]/reveal
The system SHALL provide a functional reveal page at `app/game/[code]/reveal/page.tsx` displaying the round results, real description, who was honest, who the judge voted for, and a scoreboard.

#### Scenario: Navigating to the reveal page
- **WHEN** a user navigates to `/game/ABC123/reveal`
- **THEN** the page displays the card's phrase and real answer, identifies the honest player, shows the judge's vote target, and renders a cumulative scoreboard for all players

### Requirement: End screen page placeholder exists at /game/[code]/end
The system SHALL provide a functional end screen at `app/game/[code]/end/page.tsx` displaying final scores, the winner, and options to play again or return to the lobby.

#### Scenario: Navigating to the end page
- **WHEN** a user navigates to `/game/ABC123/end`
- **THEN** the page displays final scores sorted by total, highlights the winner, and shows a "Play Again" button (host only) and a "Back to Lobby" button (all players)

### Requirement: Game entry point page exists at /game/[code]
The system SHALL provide a functional entry point page at `app/game/[code]/page.tsx` that polls `GET /api/rooms/[code]`, handles reconnection via `localStorage`, and redirects to the current game phase.

#### Scenario: Navigating to the game entry point
- **WHEN** a user navigates to `/game/ABC123`
- **THEN** the page checks `localStorage` for reconnect credentials, validates them via the API if found, and redirects to the page matching the room's `current_phase`

### Requirement: Placeholder pages do not interfere with the existing lobby route
The system SHALL ensure that the new `app/game/` directory structure does not conflict with or override the `/` route.

#### Scenario: Lobby route serves the multiplayer lobby
- **WHEN** a user navigates to `/`
- **THEN** the lobby page renders with room creation and join functionality

#### Scenario: Build completes without route conflicts
- **WHEN** `npm run build` is executed
- **THEN** Next.js compiles without route conflict warnings or errors
