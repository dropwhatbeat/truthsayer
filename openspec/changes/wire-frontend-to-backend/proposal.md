## Why

With the database, API routes, XState game engine, and placeholder phase pages all in place, the game still runs as a single-device experience. This change wires the frontend to the backend, turning the single-device game into a true multiplayer experience where players in different browser windows share a game session via the API.

## What Changes

- Install TanStack Query and set up `QueryClientProvider` for client-server state sync
- Build a lobby page (app root) with room creation and join-by-code flows
- Implement name registration page wired to `POST /api/rooms/[code]/register`
- Build a waiting room with live player list (polling every 2s), host-only start button
- Add phase-driven navigation: `/game/[code]` polls room state and redirects all clients to the current phase
- Implement the voting page: judge picks who they think is honest, others wait
- Implement the reveal page: shows real answer, who voted for whom, round scores
- Implement the end screen: final scores, winner, play-again button
- Add reconnect support: `localStorage`-stored `playerId` + `playerSecret` restores player session on reload/close

## Capabilities

### New Capabilities
- `lobby-join-flow`: Room creation, join-by-code validation, and name registration via API
- `waiting-room`: Live player list with polling, host-only game start, 3-player minimum enforcement
- `phase-navigation`: Polling-driven client redirect that keeps all players synced to the room's current phase
- `voting-phase`: Judge voting UI that submits moves to API; liars/honest see waiting state
- `reveal-phase`: Round results display with real answer, vote targets, and cumulative scores
- `end-screen`: Final scoreboard with winner announcement and play-again option
- `reconnect-support`: Session restoration from localStorage token without re-registering

### Modified Capabilities
- `phase-page-scaffold`: Each placeholder page replaced with a fully wired implementation that fetches from the API, manages role-based visibility, and submits game moves

## Impact

- **New dependency**: `@tanstack/react-query` for polling-based state sync
- **Affected files**:
  - `app/page.tsx` — replaced with lobby (room creation/join)
  - `app/providers.tsx` — wraps in `QueryClientProvider`
  - `app/game/[code]/*/page.tsx` — all phase pages wired to API
  - `lib/query-client.ts` — new file, TanStack Query config
  - `components/absurd-truths/` — new components: `PlayerList`, `PlayerAvatar`, `VoteButtons`, `ScoreBoard`
- **API endpoints consumed**: All routes from `app/api/rooms/` (no changes to API)
- **No database schema changes**
