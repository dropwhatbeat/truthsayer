## ADDED Requirements

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
- **THEN** `Card` has `phrase`, `answer`, and `categories` fields, and `Category` has `name` and `color` fields

#### Scenario: DeckType is importable from game-engine
- **WHEN** a file imports `{ DeckType }` from `@bsking/game-engine`
- **THEN** the type is the union `'absurd-truths' | 'chinese-sayings' | 'medical'`

#### Scenario: GamePhase is importable from game-engine
- **WHEN** a file imports `{ GamePhase }` from `@bsking/game-engine`
- **THEN** the type matches the union of phase identifiers used by the game screen components

#### Scenario: New multiplayer types are exported
- **WHEN** a file imports `{ Player, Role, GameConfig, RoomStatus }` from `@bsking/game-engine`
- **THEN** `Player` has `id`, `name`, `role`, `roomId` fields; `Role` is `'judge' | 'honest' | 'liar'`; `GameConfig` has `rounds`, `timerSecs`, `deckType` fields; `RoomStatus` is `'lobby' | 'playing' | 'finished'`

### Requirement: Deck data files are in game-engine package
The system SHALL provide deck data files (`absurdTruthsDeck.ts`, `chineseSayingsDeck.ts`, `medicalDeck.ts`) in `packages/game-engine/src/decks/` with re-exports from the barrel file.

#### Scenario: absurdTruthsDeck is importable
- **WHEN** a file imports the absurd truths deck from `@bsking/game-engine`
- **THEN** the deck contains at least 40 cards with `phrase`, `answer`, and `categories` fields

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
The system SHALL provide a `gameMachine` (XState v5) in `packages/game-engine/src/machines/gameMachine.ts` with states `idle`, `setup`, `playing`, and `finished`.

#### Scenario: Machine starts in idle state
- **WHEN** a gameMachine is created without initial state
- **THEN** it is in the `idle` state

#### Scenario: START event transitions from idle to setup
- **WHEN** a `START` event is sent to the machine in `idle` state
- **THEN** the machine enters `setup` state and context is populated with `deckType`, `roundCount`, and `timerSecs` from the event

#### Scenario: PLAY event transitions from setup to playing
- **WHEN** a `PLAY` event is sent to the machine in `setup` state
- **THEN** the machine enters `playing` state and the context includes `players` and `currentRoundIndex: 0`

#### Scenario: END event transitions from playing to finished
- **WHEN** an `END` event is sent to the machine in `playing` state
- **THEN** the machine enters `finished` state

#### Scenario: RESET event transitions from finished to setup
- **WHEN** a `RESET` event is sent to the machine in `finished` state
- **THEN** the machine enters `setup` state

#### Scenario: Invalid transitions do not change state
- **WHEN** a `PLAY` event is sent to the machine in `idle` state
- **THEN** the machine remains in `idle` state and `state.changed` is `false`

### Requirement: roundMachine manages per-round phases
The system SHALL provide a `roundMachine` (XState v5) in `packages/game-engine/src/machines/roundMachine.ts` with states `waiting`, `reading`, `discuss`, `reveal`, and `complete`.

#### Scenario: Machine starts in waiting state
- **WHEN** a roundMachine is created
- **THEN** it is in the `waiting` state

#### Scenario: SHOW_SECRET event transitions from waiting to reading
- **WHEN** a `SHOW_SECRET` event is sent to the machine in `waiting` state
- **THEN** the machine enters `reading` state

#### Scenario: TIMER_END event transitions from reading to discuss
- **WHEN** a `TIMER_END` event is sent to the machine in `reading` state
- **THEN** the machine enters `discuss` state

#### Scenario: SKIP_TIMER event transitions from reading to discuss
- **WHEN** a `SKIP_TIMER` event is sent to the machine in `reading` state
- **THEN** the machine enters `discuss` state

#### Scenario: REVEAL_ALL event transitions from discuss to reveal
- **WHEN** a `REVEAL_ALL` event is sent to the machine in `discuss` state
- **THEN** the machine enters `reveal` state

#### Scenario: NEXT_CARD event transitions from reveal to complete
- **WHEN** a `NEXT_CARD` event is sent to the machine in `reveal` state
- **THEN** the machine enters `complete` state

### Requirement: roundMachine has an invoked timer actor
The system SHALL invoke a timer actor when the `roundMachine` enters the `reading` state that fires `TIMER_END` after a configurable duration.

#### Scenario: Timer fires after specified duration
- **WHEN** the machine enters `reading` with `timerSecs: 2` in context
- **THEN** the machine automatically transitions to `discuss` after 2 seconds via `TIMER_END`

#### Scenario: Timer is cancelled when leaving reading state via SKIP_TIMER
- **WHEN** the machine is in `reading` state with a running timer and a `SKIP_TIMER` event is sent
- **THEN** the timer is cancelled and the machine enters `discuss` without a pending `TIMER_END`

### Requirement: Barrel export exposes all public API
The system SHALL export all public types, functions, machines, and constants from `packages/game-engine/src/index.ts`.

#### Scenario: All types are exported
- **WHEN** a file imports from `@bsking/game-engine`
- **THEN** `Card`, `Category`, `DeckType`, `GamePhase`, `Player`, `Role`, `GameConfig`, and `RoomStatus` types are available

#### Scenario: All utility functions are exported
- **WHEN** a file imports from `@bsking/game-engine`
- **THEN** `shuffle`, `getDeckByType`, and `prepareDeck` functions are available

#### Scenario: Both machines are exported
- **WHEN** a file imports from `@bsking/game-engine`
- **THEN** `gameMachine` and `roundMachine` are available
