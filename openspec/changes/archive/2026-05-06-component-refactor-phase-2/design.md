## Context

The codebase currently has all game logic concentrated in `components/absurd-truths/`. `AbsurdTruthsGame.tsx` (130 lines) manages all state via `useState` and imports types directly from sibling components. `GameScreen.tsx` embeds timer, card display, and category badges inline. There is no `app/game/` directory at all — the only route is `/` serving the single-device game. This is Phase 2 of the migration plan: split the monolith before Phase 3 introduces XState and backend.

**Constraint**: No behavior changes. No new dependencies. No database access. No API routes. `npm run build` must pass after every stage.

## Goals / Non-Goals

**Goals:**
- Move all shared TypeScript types into a single `lib/types.ts` barrel
- Move pure deck utility functions (`shuffle`, deck selection, deck preparation) into `lib/deck.ts`
- Extract `Timer`, `WordCard`, and `CategoryPills` into standalone components under `components/absurd-truths/`
- Create placeholder pages for all 6 multiplayer game phases under `app/game/[code]/`
- Update all imports across the codebase to reference the new locations
- The single-device game at `/` must remain fully functional and visually identical

**Non-Goals:**
- Wiring any game logic to the new pages (they are placeholders only)
- Introducing XState, API routes, or database access
- Changing any visual design, animation, or user interaction
- Creating the `packages/game-engine/` package (that's Phase 3)
- Moving deck data out of `data/` (that happens in Phase 3 stage 3.2)

## Decisions

### Decision 1: Types go in `lib/types.ts`, not co-located with components

**Choice**: Single barrel file `lib/types.ts` exporting `Card`, `Category`, `DeckType`, and `GamePhase`.

**Rationale**: Currently `Card` and `Category` are defined in `data/absurdTruthsDeck.ts`, `DeckType` in `SetupScreen.tsx`, and `Phase` in `GameScreen.tsx`. Co-locating types with data or components works for small projects but creates import tangles when Phase 3 moves deck data into `packages/game-engine/`. A single types barrel decouples type consumers from type definers and makes the Phase 3 move trivial (replace `lib/types` import path with `@bsking/game-engine`).

**Alternatives considered**: Keeping types with their data/component files and re-exporting from a barrel. Rejected because it leaves types physically in files that will be moved/deleted in Phase 3, creating unnecessary diff noise.

### Decision 2: `Phase` renamed to `GamePhase`

**Choice**: The `Phase` type from `GameScreen.tsx` is renamed to `GamePhase` in `lib/types.ts`.

**Rationale**: Phase 3 introduces XState phase concepts that will collide with the generic name `Phase`. Renaming now avoids a breaking rename later when XState's `state.value` types and the app's phase type coexist.

### Decision 3: Deck utilities in `lib/deck.ts` as pure functions

**Choice**: `shuffle<T>()`, `getDeckByType(type: DeckType): Card[]`, and `prepareDeck(type: DeckType, roundCount: number): Card[]` live in `lib/deck.ts` as exported pure functions.

**Rationale**: Pure functions are trivially testable and have no React dependency. In Phase 3, these move to `packages/game-engine/src/deck.ts` — having them already isolated in their own file makes that move a file relocation, not an extraction.

**`prepareDeck` signature**: Combines deck selection + Fisher-Yates shuffle + slice to `roundCount`. Currently the component does `shuffle(pickDeck(type)).slice(0, rounds)` — this wrapper reduces duplication.

### Decision 4: Phase page stubs are minimal placeholders

**Choice**: Each page under `app/game/[code]/<phase>/page.tsx` renders a single `<div>` with the phase name (e.g., "Reading Phase") and a link back to `/`. No props, no params parsing, no game logic.

**Rationale**: The `[code]` dynamic segment exists to reserve the URL structure. These pages will be replaced with full implementations in Phase 4. Keeping them minimal avoids creating code that will be thrown away.

**Alternative considered**: Not creating pages until Phase 4. Rejected because having the route structure in place lets Phase 3/4 developers see the complete URL shape and start building against it immediately.

### Decision 5: No barrel export for new components

**Choice**: Each extracted component (`Timer`, `WordCard`, `CategoryPills`) is imported directly from its file path, not from a `components/absurd-truths/index.ts` barrel.

**Rationale**: Barrel files in the `components/` directory cause circular dependency risks when components reference each other. Direct imports are more explicit and tree-shakeable. A barrel can be added later if needed.

## Risks / Trade-offs

- **[Risk] Import path breakage across many files** → Each stage ends with `npm run build` verification. Import changes are mechanical search-and-replace across known files. Revertible per stage.
- **[Risk] `GamePhase` rename causes confusion during transition** → Apply rename in the same commit that creates `lib/types.ts`. No file uses both `Phase` and `GamePhase` simultaneously.
- **[Risk] Placeholder pages might be mistaken for working features** → Each placeholder explicitly states "Placeholder — not yet implemented" in its rendered output.
- **[Trade-off] `data/` still holds deck contents after extraction** → Accepted. Phase 3 moves deck data into `packages/game-engine/`. Extracting types but not deck data keeps this phase scoped to restructuring, not data migration.
