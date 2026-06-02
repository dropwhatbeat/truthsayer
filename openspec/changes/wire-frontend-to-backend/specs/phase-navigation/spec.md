## ADDED Requirements

### Requirement: Game entry point redirects to current phase
The system SHALL render `app/game/[code]/page.tsx` as an entry point that polls `GET /api/rooms/[code]` and redirects the user to the page matching the room's `current_phase`.

#### Scenario: Redirect to waiting phase
- **WHEN** the room's `current_phase` is `waiting`
- **THEN** the user is redirected to `/game/<code>/waiting`

#### Scenario: Redirect to reading phase
- **WHEN** the room's `current_phase` is `reading`
- **THEN** the user is redirected to `/game/<code>/reading`

#### Scenario: Redirect to voting phase
- **WHEN** the room's `current_phase` is `voting`
- **THEN** the user is redirected to `/game/<code>/voting`

#### Scenario: Redirect to reveal phase
- **WHEN** the room's `current_phase` is `reveal`
- **THEN** the user is redirected to `/game/<code>/reveal`

#### Scenario: Redirect to end phase
- **WHEN** the room's `current_phase` is `end` or room status is `finished`
- **THEN** the user is redirected to `/game/<code>/end`

#### Scenario: Invalid room code shows error
- **WHEN** `GET /api/rooms/<code>` returns 404
- **THEN** an error message "Room not found" is displayed with a link back to the lobby

### Requirement: Phase pages self-redirect when room phase advances
The system SHALL make each phase page (`/game/[code]/{waiting,reading,voting,reveal,end}`) poll the room state and redirect to `/game/[code]` if the room's `current_phase` no longer matches the current page's phase.

#### Scenario: Waiting page redirects when game starts
- **WHEN** a user is on `/game/<code>/waiting` and the room's `current_phase` changes to `reading`
- **THEN** within 2 seconds, the user is redirected to `/game/<code>` (which in turn redirects to `/game/<code>/reading`)

#### Scenario: Phase page stays when phase matches
- **WHEN** a user is on `/game/<code>/reading` and the room's `current_phase` is `reading`
- **THEN** no redirect occurs

### Requirement: All phase pages use TanStack Query for room state
The system SHALL configure a TanStack Query-based room fetch with `refetchInterval: 2000` ms and `staleTime: 1000` ms for all phase pages.

#### Scenario: Room query is shared across phase pages
- **WHEN** the game layout at `/game/[code]` defines a TanStack Query hook for the room
- **THEN** all child phase pages consume the same query instance without duplicating network requests

#### Scenario: Loading state shown during initial fetch
- **WHEN** any phase page loads and the room query is fetching for the first time
- **THEN** a loading indicator is displayed until the query resolves

#### Scenario: Error state shown on fetch failure
- **WHEN** the room query fails (network error or server error) after all retries
- **THEN** an error message is displayed with a "Retry" button
