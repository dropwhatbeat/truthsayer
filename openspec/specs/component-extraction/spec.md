# component-extraction Specification

## Purpose
TBD - Extracts shared types, deck utility functions, and reusable UI components from the single-device game screen into dedicated library files and sub-components.

## Requirements

### Requirement: Shared types are extracted to lib/types.ts
The system SHALL provide a single `lib/types.ts` file that exports all shared TypeScript types used across components, including `Card`, `Category`, `DeckType`, and `GamePhase`.

#### Scenario: Card and Category types are importable from lib/types
- **WHEN** a component imports `{ Card, Category }` from `@/lib/types`
- **THEN** the types match the current definitions from `data/absurdTruthsDeck.ts` exactly

#### Scenario: DeckType is importable from lib/types
- **WHEN** a component imports `{ DeckType }` from `@/lib/types`
- **THEN** the type matches the union of deck identifiers (`'absurd-truths' | 'chinese-sayings' | 'medical'`)

#### Scenario: GamePhase is importable from lib/types
- **WHEN** a component imports `{ GamePhase }` from `@/lib/types`
- **THEN** the type replaces the former `Phase` type from `GameScreen.tsx` with identical values

#### Scenario: All imports updated to use lib/types
- **WHEN** `npm run build` is executed after the extraction
- **THEN** the build completes without type errors and no file imports `Card`, `Category`, `DeckType`, or `Phase` from their original locations

### Requirement: Deck utility functions are extracted to lib/deck.ts
The system SHALL provide `lib/deck.ts` exporting pure utility functions for deck manipulation: `shuffle`, `getDeckByType`, and `prepareDeck`.

#### Scenario: shuffle returns a new array with same elements
- **WHEN** `shuffle(cards)` is called with an array of cards
- **THEN** the returned array has the same length and contains the same elements as the input, in potentially different order

#### Scenario: shuffle does not mutate the input array
- **WHEN** `shuffle(cards)` is called
- **THEN** the original `cards` array remains unchanged

#### Scenario: getDeckByType returns the correct deck
- **WHEN** `getDeckByType('absurd-truths')` is called
- **THEN** the returned array matches `GAME_DECK` from `data/absurdTruthsDeck.ts`
- **WHEN** `getDeckByType('chinese-sayings')` is called
- **THEN** the returned array matches `CHINESE_SAYINGS_DECK` from `data/chineseSayingsDeck.ts`
- **WHEN** `getDeckByType('medical')` is called
- **THEN** the returned array matches `MEDICAL_DECK` from `data/medicalDeck.ts`

#### Scenario: prepareDeck selects, shuffles, and slices
- **WHEN** `prepareDeck('absurd-truths', 5)` is called
- **THEN** the returned array has length 5 and contains only cards from the absurd-truths deck in random order

#### Scenario: prepareDeck with roundCount exceeding deck size returns full deck
- **WHEN** `prepareDeck('absurd-truths', 999)` is called
- **THEN** the returned array contains all cards from the absurd-truths deck shuffled

### Requirement: Timer component is extracted from GameScreen
The system SHALL provide a `Timer` component in `components/absurd-truths/Timer.tsx` that displays an animated countdown ring with remaining seconds.

#### Scenario: Timer renders with a given number of seconds
- **WHEN** `<Timer seconds={30} total={30} />` is rendered
- **THEN** a circular countdown indicator displays "30" and visually represents 30 of 30 seconds

#### Scenario: Timer shows partial progress
- **WHEN** `<Timer seconds={15} total={30} />` is rendered
- **THEN** the countdown displays "15" and the ring is approximately half-filled

#### Scenario: Timer uses the same animation as the original inline implementation
- **WHEN** the Timer component replaces the inline timer in GameScreen
- **THEN** the visual appearance and animation behavior are identical to the original

### Requirement: WordCard component is extracted from GameScreen
The system SHALL provide a `WordCard` component in `components/absurd-truths/WordCard.tsx` that displays a card's term with styled border and optional category badges.

#### Scenario: WordCard renders the card term
- **WHEN** `<WordCard card={{ phrase: 'Bluetooth', categories: [{ name: 'Technology', color: 'blue' }] }} />` is rendered
- **THEN** the word "Bluetooth" is displayed with the same styling as the original inline card

#### Scenario: WordCard renders category badges when categories are provided
- **WHEN** a WordCard with categories is rendered
- **THEN** category badges are displayed below or beside the term matching the original appearance

### Requirement: CategoryPills component is extracted from GameScreen
The system SHALL provide a `CategoryPills` component in `components/absurd-truths/CategoryPills.tsx` that renders a row of colored category badges.

#### Scenario: CategoryPills renders multiple categories
- **WHEN** `<CategoryPills categories={[{ name: 'Tech', color: 'blue' }, { name: 'Science', color: 'green' }]} />` is rendered
- **THEN** two colored pill badges are displayed with the names "Tech" and "Science"

#### Scenario: CategoryPills with empty array renders nothing visible
- **WHEN** `<CategoryPills categories={[]} />` is rendered
- **THEN** no pill elements are visible in the DOM

### Requirement: Original single-device game remains fully functional
The system SHALL ensure that after all extractions, the single-device game at `/` (`AbsurdTruthsGame`) plays identically with no behavioral or visual regressions.

#### Scenario: Full game flow works after extraction
- **WHEN** a user plays through setup → game → end at `/`
- **THEN** every screen, phase transition, timer countdown, and card display matches the pre-extraction behavior exactly

#### Scenario: Build succeeds after each extraction stage
- **WHEN** `npm run build` is executed after completing each extraction stage
- **THEN** the build completes without TypeScript errors or warnings
