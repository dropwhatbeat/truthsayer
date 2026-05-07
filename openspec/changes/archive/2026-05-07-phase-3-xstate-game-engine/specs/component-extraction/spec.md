## MODIFIED Requirements

### Requirement: Shared types are extracted to lib/types.ts
The system SHALL provide shared TypeScript types (`Card`, `Category`, `DeckType`, `GamePhase`, `Player`, `Role`, `GameConfig`, `RoomStatus`) exported from `packages/game-engine/src/types.ts` (moved from `lib/types.ts`) and importable via `@bsking/game-engine`. The old `lib/types.ts` file SHALL be removed after migration.

#### Scenario: Card and Category types are importable from game-engine
- **WHEN** a component imports `{ Card, Category }` from `@bsking/game-engine`
- **THEN** the types match the definitions formerly in `data/absurdTruthsDeck.ts` exactly

#### Scenario: DeckType is importable from game-engine
- **WHEN** a component imports `{ DeckType }` from `@bsking/game-engine`
- **THEN** the type matches the union `'absurd-truths' | 'chinese-sayings' | 'medical'`

#### Scenario: GamePhase is importable from game-engine
- **WHEN** a component imports `{ GamePhase }` from `@bsking/game-engine`
- **THEN** the type replaces the former `Phase` type from `GameScreen.tsx` with identical values

#### Scenario: All imports use game-engine package
- **WHEN** `npm run build` is executed after extraction
- **THEN** the build completes without type errors and no file imports `Card`, `Category`, `DeckType`, or `GamePhase` from `lib/types.ts`

### Requirement: Deck utility functions are extracted to lib/deck.ts
The system SHALL provide deck utility functions (`shuffle`, `getDeckByType`, `prepareDeck`) exported from `packages/game-engine/src/deck.ts` (moved from `lib/deck.ts`) and importable via `@bsking/game-engine`. The old `lib/deck.ts` file SHALL be removed after migration.

#### Scenario: shuffle returns a new array with same elements
- **WHEN** `shuffle(cards)` is called with an array of cards
- **THEN** the returned array has the same length and contains the same elements as the input, in potentially different order

#### Scenario: shuffle does not mutate the input array
- **WHEN** `shuffle(cards)` is called
- **THEN** the original `cards` array remains unchanged

#### Scenario: getDeckByType returns the correct deck
- **WHEN** `getDeckByType('absurd-truths')` is called
- **THEN** the returned array matches `GAME_DECK` from `packages/game-engine/src/decks/absurdTruthsDeck.ts`
- **WHEN** `getDeckByType('chinese-sayings')` is called
- **THEN** the returned array matches `CHINESE_SAYINGS_DECK` from `packages/game-engine/src/decks/chineseSayingsDeck.ts`
- **WHEN** `getDeckByType('medical')` is called
- **THEN** the returned array matches `MEDICAL_DECK` from `packages/game-engine/src/decks/medicalDeck.ts`

#### Scenario: prepareDeck selects, shuffles, and slices
- **WHEN** `prepareDeck('absurd-truths', 5)` is called
- **THEN** the returned array has length 5 and contains only cards from the absurd-truths deck in random order

#### Scenario: prepareDeck with roundCount exceeding deck size returns full deck
- **WHEN** `prepareDeck('absurd-truths', 999)` is called
- **THEN** the returned array contains all cards from the absurd-truths deck shuffled

#### Scenario: All deck utility imports use game-engine package
- **WHEN** `npm run build` is executed after migration
- **THEN** no file imports `shuffle`, `getDeckByType`, or `prepareDeck` from `lib/deck.ts`
