## 1. Extract shared types to lib/types.ts

- [x] 1.1 Create `lib/types.ts` with `Card`, `Category`, `DeckType`, and `GamePhase` type definitions
- [x] 1.2 Move `Card` and `Category` interfaces from `data/absurdTruthsDeck.ts` into `lib/types.ts`, re-export from original file for backward compatibility
- [x] 1.3 Move `DeckType` union from `components/absurd-truths/SetupScreen.tsx` into `lib/types.ts`, update SetupScreen to import from `@/lib/types`
- [x] 1.4 Move `Phase` type from `components/absurd-truths/GameScreen.tsx` into `lib/types.ts` as `GamePhase`, update GameScreen, EndScreen, and AbsurdTruthsGame imports
- [x] 1.5 Verify `npm run build` passes with zero type errors

## 2. Extract deck utility functions to lib/deck.ts

- [x] 2.1 Create `lib/deck.ts` with `shuffle<T>(arr: T[]): T[]` — Fisher-Yates shuffle returning a new array
- [x] 2.2 Add `getDeckByType(type: DeckType): Card[]` to `lib/deck.ts` — maps deck type to the correct deck data from `data/`
- [x] 2.3 Add `prepareDeck(type: DeckType, roundCount: number): Card[]` to `lib/deck.ts` — combines `getDeckByType` + `shuffle` + slice to `roundCount`
- [x] 2.4 Update `AbsurdTruthsGame.tsx` to use `prepareDeck` from `lib/deck.ts` instead of inline shuffle + pick logic; remove local `shuffle` function
- [x] 2.5 Verify `npm run build` passes and the game at `/` shuffles and displays cards identically

## 3. Extract shared UI components

- [x] 3.1 Create `components/absurd-truths/Timer.tsx` — extracts timer circle + countdown display from `GameScreen.tsx`; accepts `seconds` and `total` props
- [x] 3.2 Update `GameScreen.tsx` to import and use `<Timer>` component in place of inline timer code
- [x] 3.3 Create `components/absurd-truths/WordCard.tsx` — extracts word card display (term + styled border) from `GameScreen.tsx`; accepts `card: Card` prop
- [x] 3.4 Update `GameScreen.tsx` to import and use `<WordCard>` component in place of inline card rendering
- [x] 3.5 Create `components/absurd-truths/CategoryPills.tsx` — extracts category badge row from `GameScreen.tsx`; accepts `categories: Category[]` prop
- [x] 3.6 Update `GameScreen.tsx` to import and use `<CategoryPills>` component in place of inline category rendering
- [x] 3.7 Verify `npm run build` passes and the game screens (setup, reading, voting, reveal, end) render identically to pre-extraction

## 4. Create phase page stubs under app/game/[code]/

- [x] 4.1 Create `app/game/[code]/page.tsx` — entry point placeholder indicating it will redirect to the current game phase; includes link back to `/`
- [x] 4.2 Create `app/game/[code]/register/page.tsx` — placeholder with `'use client'` directive, renders "Register Phase" text and link back to `/`
- [x] 4.3 Create `app/game/[code]/waiting/page.tsx` — placeholder with `'use client'` directive, renders "Waiting Phase" text
- [x] 4.4 Create `app/game/[code]/reading/page.tsx` — placeholder with `'use client'` directive, renders "Reading Phase" text
- [x] 4.5 Create `app/game/[code]/voting/page.tsx` — placeholder with `'use client'` directive, renders "Voting Phase" text
- [x] 4.6 Create `app/game/[code]/reveal/page.tsx` — placeholder with `'use client'` directive, renders "Reveal Phase" text
- [x] 4.7 Create `app/game/[code]/end/page.tsx` — placeholder with `'use client'` directive, renders "End Phase" text
- [x] 4.8 Verify `npm run build` passes without route conflicts, navigating to `/game/ANYCODE/reading` shows the placeholder, and the lobby at `/` still renders the full single-device game unchanged
