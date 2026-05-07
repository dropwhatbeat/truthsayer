## Context

Phase 3 (game-engine, game-api, phase-page-scaffold) left us with a fully working API, XState machines in `@bsking/game-engine`, and placeholder route pages under `app/game/[code]/`. The single-device game at `/` renders `AbsurdTruthsGame.tsx` unchanged. This phase connects everything: the placeholder pages become real UI that fetches from the API and submits game moves, turning the app into a multiplayer experience.

**Current state:**
- `app/page.tsx` — renders `AbsurdTruthsGame` (single-device XState game, no multiplayer)
- `app/providers.tsx` — PostHog provider only, no TanStack Query
- `app/game/[code]/page.tsx` — redirect stub
- `app/game/[code]/{register,waiting,reading,voting,reveal,end}/page.tsx` — placeholder text only
- API routes exist and work (`POST/GET /api/rooms/[code]`, `/join`, `/register`, `/start`, `/moves`)
- `@bsking/game-engine` exports types, machines, deck utilities
- No TanStack Query yet, no reconnection logic, no lobby for creating/joining rooms

**Constraints:**
- Polling at 2s interval (not WebSockets)
- Players authenticate via `playerId` + `playerSecret` stored in `localStorage`
- No in-app text submissions — players speak aloud, app only mediates voting
- 3-player minimum enforced by API

## Goals / Non-Goals

**Goals:**
- Wire all phase pages to the API with live polling and role-based UI
- Build lobby page with room creation and join-by-code flow
- Implement waiting room with player list and host-controlled start
- Build voting UI where judge picks honest player, others wait
- Build reveal screen with scores and round progression
- Build end screen with winners and play-again flow
- Support reconnect via `localStorage` token

**Non-Goals:**
- No changes to API routes or database schema
- No changes to `@bsking/game-engine` machines or types
- No real-time push (WebSockets, SSE) — polling only
- No text input for descriptions/bluffs (out of scope per design decision)
- No role rotation between rounds (fixed roles for v1)
- No host transfer UI (handled in Phase 5)

## Decisions

### Decision 1: TanStack Query for polling

**Choice:** `@tanstack/react-query` with `refetchInterval: 2000` on the room state query.

**Alternatives considered:**
- SWR — similar API but TanStack Query has broader adoption and matches the migration plan
- Manual `fetch` + `setInterval` — more code, no caching, no dedup, harder to debug
- Electric SQL — planned for v2, overkill for 3-9 player rooms

**Rationale:** TanStack Query gives us caching, deduplication, loading/error states, and background refetch out of the box. The 2s interval is configurable per query. `staleTime: 1000` avoids flicker while `refetchInterval: 2000` ensures timely sync.

### Decision 2: Lobby replaces single-device game at `/`

**Choice:** Replace `app/page.tsx` with the lobby (create room button + join code input). The single-device game moves to a separate route or is accessible via a dev-only path.

**Alternatives considered:**
- Keep `/` as single-device game and put lobby at `/play` — splits the user flow, confusing entry point
- Put lobby at `/` but keep single-device link — cleaner, but the single-device game is a development tool now

**Rationale:** The lobby is the natural entry point for multiplayer. The single-device game served as a prototype. We'll move it to `/local` as a development convenience (not a production feature).

### Decision 3: `ClientGameProvider` wraps the game tree

**Choice:** A `ClientGameProvider` component wraps `app/game/[code]/layout.tsx` (or each page individually) to hold shared game state context: the room query, current player identity from `localStorage`, and shared polling logic.

**Alternatives considered:**
- Each page independently fetches room state — duplicates query key config, harder to manage redirects
- React Context at the `[code]` layout level — natural parent for all phase pages, single query instance

**Rationale:** A layout-level context at `app/game/[code]/layout.tsx` holds the room query and player session. All child pages consume the same query instance via React Context, avoiding duplicate network requests. This also centralizes reconnection logic.

### Decision 4: Phase-driven navigation via the `[code]/page.tsx` redirect

**Choice:** `app/game/[code]/page.tsx` polls `GET /api/rooms/[code]` and redirects (`next/navigation` `redirect()`) to the current phase page. Each phase page also polls and self-redirects if the room phase no longer matches.

**Alternatives considered:**
- Single page with conditional rendering by phase — violates the scaffold we already built, harder to share links
- No self-redirect in phase pages — stale UI would show after phase advances until manual navigation

**Rationale:** Both the entry point redirect and the per-page self-redirect provide defense-in-depth. The entry point handles initial navigation; per-page redirects handle phase advancement while a player is on a sub-page.

### Decision 5: Role-based UI per phase

**Choice:** Each phase page reads the player's role from the room state and conditionally renders the appropriate UI (e.g., judge sees voting buttons, liars see "Waiting for judge").

**Rationale:** No separate routes per role — the same phase page serves all players with role-conditional rendering. This keeps the URL scheme simple and avoids route fragmentation.

### Decision 6: Reconnection via `localStorage`

**Choice:** On join/register, store `{ roomCode, playerId, playerSecret }` in `localStorage`. On page load, check for these values and call `POST /api/rooms/[code]/reconnect` to validate and restore the session.

**Rationale:** No auth system needed. The random `playerSecret` token is already generated during join and bcrypt-hashed in the database. The reconnect endpoint validates the token against the hash and returns the current player state. If validation fails, clear `localStorage` and show the register page.

### Decision 7: New shared UI components

**Choice:** Extract four new components for multiplayer UI:
- `PlayerList.tsx` — renders a list of players with names and optional roles
- `PlayerAvatar.tsx` — single player display (name, avatar placeholder, role badge)
- `VoteButtons.tsx` — grid of player buttons for judge voting
- `ScoreBoard.tsx` — table/dashboard showing round scores and running totals

**Rationale:** These components are used across multiple phase pages (waiting room shows `PlayerList`, voting shows `VoteButtons`, reveal shows `ScoreBoard` + `PlayerAvatar`). Extracting them avoids duplication and follows the pattern established in Phase 2's component extraction.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| 2s polling delay causes visible lag between phase transitions | Acceptable for v1. The "Ready to Vote" manual advancement pattern means players control pacing. Polling 2s after a move submission is imperceptible. |
| Browser refresh loses player state if `localStorage` is cleared | Registration flow is quick (just enter name). No data is lost because game state lives on the server. |
| Multiple players hitting "Start Game" simultaneously | API enforces single start (room transitions to `playing`). Subsequent start calls return 409. Client handles gracefully. |
| Player leaks `playerSecret` from `localStorage` | `playerSecret` only authenticates as a specific player in a specific room. No personal data exposed. Token is bcrypt-hashed server-side. |
| Build fails if TanStack Query provider is missing from some pages | Wrap provider in root `app/providers.tsx` alongside PostHog. All routes are covered. |
| Next.js App Router conflicts between `[code]/page.tsx` and `[code]/register/page.tsx` | Verified in Phase 2.4 scaffold — Next.js resolves these correctly with the dynamic segment. |
