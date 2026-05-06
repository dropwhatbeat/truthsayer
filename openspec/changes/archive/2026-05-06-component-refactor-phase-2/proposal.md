## Why

The current single-device game lives entirely inside `AbsurdTruthsGame.tsx` — types, deck logic, phase rendering, and state management are tightly coupled in one file with ad-hoc `useState` calls. Before adding multiplayer (API routes, database, XState), the codebase must be restructured into well-defined modules and page stubs so that Phase 3 (XState + backend) can integrate cleanly into an existing scaffold rather than fighting a monolith.

## What Changes

- Extract shared TypeScript types (`Card`, `Category`, `DeckType`, `GamePhase`) from component files into `lib/types.ts`
- Extract pure deck utility functions (`shuffle`, `getDeckByType`, `prepareDeck`) into `lib/deck.ts`
- Extract three reusable UI components from `GameScreen.tsx`: `Timer`, `WordCard`, and `CategoryPills`
- Create per-phase page stubs under `app/game/[code]/` (register, waiting, reading, voting, reveal, end) — each renders a phase-labeled placeholder, no game logic wired yet
- The lobby page at `/` continues to render the full single-device game unchanged
- All existing imports updated to use the new module locations — no behavior changes, no regressions

## Capabilities

### New Capabilities
- `component-extraction`: Extracts types, deck logic, and shared UI components from the monolithic `AbsurdTruthsGame.tsx` into standalone modules under `lib/` and `components/absurd-truths/`
- `phase-page-scaffold`: Creates placeholder page routes for each multiplayer game phase (`/game/[code]/register`, `/game/[code]/waiting`, `/game/[code]/reading`, `/game/[code]/voting`, `/game/[code]/reveal`, `/game/[code]/end`)

### Modified Capabilities
<!-- No existing specs are modified — this is purely internal restructuring with no behavioral changes -->

## Impact

- Affected files: `components/absurd-truths/AbsurdTruthsGame.tsx`, `GameScreen.tsx`, `SetupScreen.tsx`, `EndScreen.tsx`, `data/absurdTruthsDeck.ts`, `data/chineseSayingsDeck.ts`, `data/medicalDeck.ts`
- New files: `lib/types.ts`, `lib/deck.ts`, `components/absurd-truths/Timer.tsx`, `components/absurd-truths/WordCard.tsx`, `components/absurd-truths/CategoryPills.tsx`, plus 6 page stubs under `app/game/[code]/`
- No new dependencies, no API changes, no database changes
- Verify throughout with `npm run build` — the existing single-device game must play identically at `/`
