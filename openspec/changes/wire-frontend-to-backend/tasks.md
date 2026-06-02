## 1. TanStack Query Setup

- [x] 1.1 Install `@tanstack/react-query` dependency
- [x] 1.2 Create `lib/query-client.ts` with defaults (`staleTime: 1000`, `retry: 1`)
- [x] 1.3 Add `QueryClientProvider` to `app/providers.tsx` alongside `PostHogProvider`
- [x] 1.4 Verify `npm run build` passes with new provider in tree

## 2. Lobby Page (Create & Join Room)

- [x] 2.1 Replace `app/page.tsx` with lobby UI: "Create Room" button + room code input + "Join" button
- [x] 2.2 Add `POST /api/rooms` call on "Create Room" click, redirect to `/game/[code]/register` on success
- [x] 2.3 Add `GET /api/rooms/[code]` validation on "Join" click, redirect to `/game/[code]/register` on success
- [x] 2.4 Handle error states: invalid code, room not found, game already started, network failure
- [x] 2.5 Move single-device `AbsurdTruthsGame` to `/local` route for dev access

## 3. Registration Flow

- [x] 3.1 Implement `app/game/[code]/register/page.tsx`: call `POST /api/rooms/[code]/join` on mount
- [x] 3.2 Store returned `{ roomCode, playerId, playerSecret }` in `localStorage` under key `bsking-player`
- [x] 3.3 Render name input form with validation (non-empty, non-whitespace)
- [x] 3.4 Call `POST /api/rooms/[code]/register` on form submission, redirect to `/game/[code]/waiting` on success
- [x] 3.5 Handle error states: 401 (clear localStorage, redirect to lobby), 409, network failure

## 4. Shared UI Components

- [x] 4.1 Create `components/absurd-truths/PlayerAvatar.tsx` — player name + role badge display
- [x] 4.2 Create `components/absurd-truths/PlayerList.tsx` — list of players with names and optional roles
- [x] 4.3 Create `components/absurd-truths/VoteButtons.tsx` — grid of player buttons for judge voting
- [x] 4.4 Create `components/absurd-truths/ScoreBoard.tsx` — round scores + running totals table
- [x] 4.5 Verify all new components render correctly in isolation

## 5. Game Layout & Room Context

- [x] 5.1 Create `app/game/[code]/layout.tsx` with `ClientGameProvider` context
- [x] 5.2 Configure TanStack Query room fetch (`GET /api/rooms/[code]`) with `refetchInterval: 2000`
- [x] 5.3 Expose room state and player identity via React Context for child pages
- [x] 5.4 Add loading and error states for the room query in layout

## 6. Phase-Driven Navigation

- [x] 6.1 Implement `app/game/[code]/page.tsx` as entry point redirect: check reconnect, poll room, redirect to current phase
- [x] 6.2 Add self-redirect logic to each phase page: if room phase doesn't match current page, redirect to `[code]/page.tsx`
- [x] 6.3 Handle invalid room code (404) with error message and lobby link
- [x] 6.4 Remove placeholder content from all phase pages
- [ ] 6.5 Verify phase sync: advance phase via API, all clients on different phase pages redirect within 2s

## 7. Waiting Room Page

- [x] 7.1 Implement `app/game/[code]/waiting/page.tsx` with `PlayerList` from room context
- [x] 7.2 Display "Start Game" button for host (player with `playerId === room.createdBy`)
- [x] 7.3 Disable start button when fewer than 3 players registered
- [x] 7.4 Show "Waiting for host to start..." for non-host players
- [x] 7.5 Call `POST /api/rooms/[code]/start` on start click, handle success/error

## 8. Reading Phase Page

- [x] 8.1 Implement `app/game/[code]/reading/page.tsx` with current round card display
- [x] 8.2 Show real description (`card_answer`) for honest player
- [x] 8.3 Show only term and categories for liars and judge
- [x] 8.4 Add "Ready to Vote" button visible to all players, calling `POST /api/rooms/[code]/moves` with `moveType: 'ready_to_vote'`

## 9. Voting Phase Page

- [x] 9.1 Implement `app/game/[code]/voting/page.tsx` with role-based UI
- [x] 9.2 Judge sees `VoteButtons` grid with all other players (excluding self)
- [x] 9.3 Honest and liars see "Waiting for judge to vote..." message
- [x] 9.4 Call `POST /api/rooms/[code]/moves` with `moveType: 'cast_vote'` on judge selection
- [x] 9.5 Show confirmation state after vote submitted, handle 409 errors gracefully

## 10. Reveal Phase Page

- [x] 10.1 Implement `app/game/[code]/reveal/page.tsx` showing card phrase + real answer
- [x] 10.2 Display honest player identity and judge's vote target
- [x] 10.3 Compute and display round scores (+1 judge if correct, +1 honest if judge wrong)
- [x] 10.4 Show cumulative `ScoreBoard` for all players
- [x] 10.5 Add "Next Round" button calling `POST /api/rooms/[code]/moves` with `moveType: 'next_round'`

## 11. End Screen Page

- [x] 11.1 Implement `app/game/[code]/end/page.tsx` with final `ScoreBoard` sorted by total
- [x] 11.2 Highlight winner(s) with visual distinction, handle ties
- [x] 11.3 Show "Play Again" button for host, calling `POST /api/rooms/[code]/start`
- [x] 11.4 Show "Back to Lobby" button for all players, clearing `localStorage` and navigating to `/`
- [x] 11.5 Show "Waiting for host to start a new game..." for non-host players

## 12. Reconnect Support

- [x] 12.1 Create `POST /api/rooms/[code]/reconnect` route handler that validates `playerId` + `playerSecret` via bcrypt
- [x] 12.2 On game entry point and layout load, check `localStorage` for `bsking-player`
- [x] 12.3 If credentials found and `roomCode` matches URL, call reconnect endpoint
- [x] 12.4 On valid reconnect, restore player session and redirect to current phase (skip register)
- [x] 12.5 On invalid reconnect, clear `localStorage` and redirect to register page
- [x] 12.6 On no stored credentials, redirect to register page

## 13. Build & Verification

- [x] 13.1 Run `npm run build` — ensure no TypeScript errors and all pages compile
- [ ] 13.2 Start `docker compose up -d` and `npm run db:migrate` — verify database is accessible
- [ ] 13.3 End-to-end test: create room, join with 3+ browser windows, complete full game
- [ ] 13.4 Test reconnect: close browser, reopen, verify session restores to current phase
- [ ] 13.5 Test error paths: invalid room code, full room, game already started, wrong phase moves
