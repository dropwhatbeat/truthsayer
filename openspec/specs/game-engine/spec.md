# game-engine Specification

## Purpose

Provides the shared `@bsking/game-engine` npm workspace package containing XState v5 game machines (gameMachine, roundMachine), shared TypeScript types, deck data files, and deck utility functions imported by both client and server code in the Truthsayer multiplayer party game.

## Requirements

### Requirement: npm workspaces with game-engine package
The system SHALL configure npm workspaces with a `packages/game-engine/` package published as `@bsking/game-engine` that exports shared XState machines, TypeScript types, and deck data.

#### Scenario: Workspaces are configured in root package.json
- **WHEN** `package.json` is examined
- **THEN** it contains `"workspaces": ["packages/*"]`

#### Scenario: game-engine package is importable
- **WHEN** a file imports from `@bsking/game-engine`
- **THEN** TypeScript resolves the import without errors and the barrel export provides all declared exports

#### Scenario: xstate is a dependency of game-engine
- **WHEN** `packages/game-engine/package.json` is examined
- **THEN** it lists `xstate` as a dependency

### Requirement: Types are defined in game-engine package
The system SHALL provide all shared TypeScript types (`Card`, `Category`, `DeckType`, `GamePhase`, `Player`, `Role`, `GameConfig`, `RoomStatus`) exported from `packages/game-engine/src/types.ts`.

#### Scenario: Card and Category types are importable from game-engine
- **WHEN** a file imports `{ Card, Category }` from `@bsking/game-engine`
- **THEN** `Card` has `phrase`, `answer`, and `categories` fields, and `Category` has `emoji` and `label` fields

#### Scenario: DeckType is importable from game-engine
- **WHEN** a file imports `{ DeckType }` from `@bsking/game-engine`
- **THEN** the type is the union `'absurd-truths' | 'chinese-sayings' | 'medical'`

#### Scenario: New multiplayer types are exported
- **WHEN** a file imports `{ Player, Role, GameConfig, RoomStatus }` from `@bsking/game-engine`
- **THEN** `Player` has `id`, `name`, `role`, `roomId` fields; `Role` is `'judge' | 'honest' | 'liar'`; `GameConfig` has `rounds`, `timerSecs`, `deckType` fields; `RoomStatus` is `'lobby' | 'playing' | 'finished'`

### Requirement: Deck data files are in game-engine package
The system SHALL provide deck data files (`absurdTruthsDeck.ts`, `chineseSayingsDeck.ts`, `medicalDeck.ts`) in `packages/game-engine/src/decks/` with re-exports from the barrel file.

#### Scenario: All deck types are importable
- **WHEN** a file imports `{ GAME_DECK, CHINESE_SAYINGS_DECK, MEDICAL_DECK }` from `@bsking/game-engine`
- **THEN** each import resolves to a non-empty array of `Card` objects

### Requirement: Deck utility functions are in game-engine package
The system SHALL provide deck utility functions (`shuffle`, `getDeckByType`, `prepareDeck`) exported from `packages/game-engine/src/deck.ts`.

#### Scenario: shuffle returns a new array with same elements
- **WHEN** `shuffle(cards)` is called with an array of cards
- **THEN** the returned array has the same length and contains the same elements in potentially different order, and the original array is unchanged

#### Scenario: getDeckByType returns the correct deck
- **WHEN** `getDeckByType('absurd-truths')` is called
- **THEN** the returned array matches the absurd truths deck
- **WHEN** `getDeckByType('chinese-sayings')` is called
- **THEN** the returned array matches the Chinese sayings deck

#### Scenario: prepareDeck selects, shuffles, and slices
- **WHEN** `prepareDeck('absurd-truths', 5)` is called
- **THEN** the returned array has length 5 and contains only cards from the absurd-truths deck in random order

### Requirement: gameMachine manages session lifecycle
The system SHALL provide a `gameMachine` (XState v5) in `packages/game-engine/src/machines/gameMachine.ts` with states `setup`, `playing` (with nested phases), and `finished`.

#### Scenario: Machine starts in setup state
- **WHEN** a gameMachine is created
- **THEN** it is in the `setup` state

#### Scenario: START event transitions from setup to playing
- **WHEN** a `START` event is sent to the machine in `setup` state
- **THEN** the machine enters `playing.waiting` state and context is populated with `deckType`, `roundCount`, `timerSecs`, and a shuffled deck

#### Scenario: END event transitions from playing to finished
- **WHEN** an `END` event is sent to the machine in `playing` state
- **THEN** the machine enters `finished` state

#### Scenario: RESET event transitions from finished to setup
- **WHEN** a `RESET` event is sent to the machine in `finished` state
- **THEN** the machine enters `setup` state with a newly shuffled deck

### Requirement: gameMachine has nested playing phase states
The system SHALL provide nested states under `playing` in the gameMachine: `waiting`, `reading`, `discuss`, and `reveal`.

#### Scenario: SHOW_SECRET transitions from waiting to reading
- **WHEN** a `SHOW_SECRET` event is sent in `playing.waiting` state
- **THEN** the machine enters `playing.reading` state

#### Scenario: Reading state auto-transitions via timer
- **WHEN** the machine enters `playing.reading` state
- **THEN** a timer actor is invoked that fires `TIMER_END` after `timerSecs` seconds, transitioning to `playing.discuss`

#### Scenario: SKIP_TIMER transitions from reading to discuss
- **WHEN** a `SKIP_TIMER` event is sent in `playing.reading` state
- **THEN** the machine enters `playing.discuss` state and the timer is cancelled

#### Scenario: REVEAL_ALL transitions from discuss to reveal
- **WHEN** a `REVEAL_ALL` event is sent in `playing.discuss` state
- **THEN** the machine enters `playing.reveal` state

#### Scenario: NEXT_CARD increments round index
- **WHEN** a `NEXT_CARD` event is sent in `playing.reveal` state and more cards remain
- **THEN** `currentRoundIndex` is incremented and the machine enters `playing.waiting`

#### Scenario: NEXT_CARD on last card transitions to finished
- **WHEN** a `NEXT_CARD` event is sent in `playing.reveal` state and no more cards remain
- **THEN** the machine enters `finished` state

### Requirement: roundMachine manages per-round phases
The system SHALL provide a `roundMachine` (XState v5) in `packages/game-engine/src/machines/roundMachine.ts` with states `waiting`, `reading`, `discuss`, `reveal`, and `complete` for use in server-side state validation.

#### Scenario: SHOW_SECRET event transitions from waiting to reading
- **WHEN** a `SHOW_SECRET` event is sent to the machine in `waiting` state
- **THEN** the machine enters `reading` state

#### Scenario: Timer auto-transitions from reading to discuss
- **WHEN** the machine enters `reading` with `timerSecs: 2` in context
- **THEN** the machine automatically transitions to `discuss` after 2 seconds via `TIMER_END`

#### Scenario: NEXT_CARD transitions from reveal to complete
- **WHEN** a `NEXT_CARD` event is sent to the machine in `reveal` state
- **THEN** the machine enters `complete` state

### Requirement: Barrel export exposes all public API
The system SHALL export all public types, functions, machines, and constants from `packages/game-engine/src/index.ts`.

#### Scenario: All types are exported
- **WHEN** a file imports from `@bsking/game-engine`
- **THEN** `Card`, `Category`, `DeckType`, `GamePhase`, `Player`, `Role`, `GameConfig`, and `RoomStatus` types are available

#### Scenario: Both machines are exported
- **WHEN** a file imports from `@bsking/game-engine`
- **THEN** `gameMachine` and `roundMachine` are available

#### Scenario: All deck data and utilities are exported
- **WHEN** a file imports from `@bsking/game-engine`
- **THEN** `shuffle`, `getDeckByType`, `prepareDeck`, `GAME_DECK`, `CHINESE_SAYINGS_DECK`, and `MEDICAL_DECK` are available
