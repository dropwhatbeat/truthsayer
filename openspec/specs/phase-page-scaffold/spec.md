# phase-page-scaffold Specification

## Purpose
TBD - Provides placeholder route pages for each game phase under `/game/[code]/`, establishing the Next.js route structure for multiplayer game phases.

## Requirements

### Requirement: Register page placeholder exists at /game/[code]/register
The system SHALL provide a placeholder page at `app/game/[code]/register/page.tsx` that identifies itself as the registration phase.

#### Scenario: Navigating to the register placeholder
- **WHEN** a user navigates to `/game/ABC123/register`
- **THEN** the page renders text identifying it as the register phase placeholder with a link back to the lobby at `/`

#### Scenario: Register page is a client component
- **WHEN** the register page is examined
- **THEN** it is marked with `'use client'` directive (anticipating future interactive use)

### Requirement: Waiting room page placeholder exists at /game/[code]/waiting
The system SHALL provide a placeholder page at `app/game/[code]/waiting/page.tsx` that identifies itself as the waiting room phase.

#### Scenario: Navigating to the waiting placeholder
- **WHEN** a user navigates to `/game/XYZ789/waiting`
- **THEN** the page renders text identifying it as the waiting phase placeholder

### Requirement: Reading phase page placeholder exists at /game/[code]/reading
The system SHALL provide a placeholder page at `app/game/[code]/reading/page.tsx` that identifies itself as the reading phase.

#### Scenario: Navigating to the reading placeholder
- **WHEN** a user navigates to `/game/ABC123/reading`
- **THEN** the page renders text identifying it as the reading phase placeholder

### Requirement: Voting phase page placeholder exists at /game/[code]/voting
The system SHALL provide a placeholder page at `app/game/[code]/voting/page.tsx` that identifies itself as the voting phase.

#### Scenario: Navigating to the voting placeholder
- **WHEN** a user navigates to `/game/ABC123/voting`
- **THEN** the page renders text identifying it as the voting phase placeholder

### Requirement: Reveal phase page placeholder exists at /game/[code]/reveal
The system SHALL provide a placeholder page at `app/game/[code]/reveal/page.tsx` that identifies itself as the reveal phase.

#### Scenario: Navigating to the reveal placeholder
- **WHEN** a user navigates to `/game/ABC123/reveal`
- **THEN** the page renders text identifying it as the reveal phase placeholder

### Requirement: End screen page placeholder exists at /game/[code]/end
The system SHALL provide a placeholder page at `app/game/[code]/end/page.tsx` that identifies itself as the end phase.

#### Scenario: Navigating to the end placeholder
- **WHEN** a user navigates to `/game/ABC123/end`
- **THEN** the page renders text identifying it as the end phase placeholder

### Requirement: Game entry point page exists at /game/[code]
The system SHALL provide an entry point page at `app/game/[code]/page.tsx` that will eventually redirect to the current phase.

#### Scenario: Navigating to the game entry point
- **WHEN** a user navigates to `/game/ABC123`
- **THEN** the page renders a placeholder indicating it will redirect to the current game phase

### Requirement: Placeholder pages do not interfere with the existing lobby route
The system SHALL ensure that the new `app/game/` directory structure does not conflict with or override the existing `/` route.

#### Scenario: Lobby route still serves the single-device game
- **WHEN** a user navigates to `/`
- **THEN** the single-device AbsurdTruthsGame renders exactly as before the scaffold was added

#### Scenario: Build completes without route conflicts
- **WHEN** `npm run build` is executed
- **THEN** Next.js compiles without route conflict warnings or errors
