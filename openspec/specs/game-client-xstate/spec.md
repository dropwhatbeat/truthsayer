# game-client-xstate Specification

## Purpose

Refactors the existing single-device game to use XState v5 state machines via `@xstate/react`'s `useMachine` hook, replacing ad-hoc `useState` calls while preserving identical behavior. The game at `/` SHALL remain fully playable without any database connection or API routes.

## Requirements

### Requirement: Single-device game uses XState via useMachine
The system SHALL refactor the existing single-device game (`AbsurdTruthsGame.tsx`) to use `@xstate/react`'s `useMachine(gameMachine)` instead of `useState` for all state management.

#### Scenario: Game starts in setup screen
- **WHEN** a user navigates to `/`
- **THEN** the setup screen renders with deck type options, round count selector, and timer duration selector driven by `gameMachine` state

#### Scenario: Starting the game transitions from setup to playing
- **WHEN** a user configures settings and starts the game
- **THEN** `send({ type: 'START', deckType, roundCount, timerSecs })` transitions to `playing.waiting`, rendering the first game round

#### Scenario: Timer countdown works via invoked actor
- **WHEN** the game enters the reading phase
- **THEN** the timer counts down from the configured `timerSecs` using the invoked timer actor in the `playing.reading` state, and `useSelector` reads `timeLeft` from context

#### Scenario: Skip timer button works
- **WHEN** a user clicks "Skip" during the reading phase
- **THEN** `send({ type: 'SKIP_TIMER' })` is called and the game immediately transitions to the discuss phase

#### Scenario: Full game flow completes
- **WHEN** all rounds are played
- **THEN** the machine transitions to `finished` state, the end screen renders, and the user can reset to play again

#### Scenario: All existing behavior is preserved
- **WHEN** the refactored game is played through setup → game → end
- **THEN** every screen transition, timer animation, card display, deck shuffle, and deck type selection behaves identically to the pre-refactor game

### Requirement: Components receive actor for state access
The system SHALL update `GameScreen` to receive an XState `ActorRef` and use `useSelector` for phase and timeLeft, dispatching events via `actor.send()`.

#### Scenario: GameScreen dispatches phase events
- **WHEN** a user clicks "Show Secret" during the waiting phase
- **THEN** `actor.send({ type: 'SHOW_SECRET' })` is called via the GameScreen component

#### Scenario: GameScreen reads phase via useSelector
- **WHEN** GameScreen renders
- **THEN** it calls `useSelector(actor, state => ...)` to determine the current playing sub-state (waiting/reading/discuss/reveal)

### Requirement: Game still builds and runs without API or database
The system SHALL ensure that `npm run build` passes and the local-only game at `/` is fully playable without any database connection or API routes running.

#### Scenario: Build succeeds with XState integration
- **WHEN** `npm run build` is executed after the XState refactor
- **THEN** the build completes without TypeScript errors or warnings

#### Scenario: Single-device game works offline
- **WHEN** the app is accessed at `/` without a running Postgres instance
- **THEN** the game starts, plays through all phases, and displays the end screen without errors
