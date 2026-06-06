# ADR 0001 — game_rounds as the single role authority

**Status:** Accepted

## Context

Originally the `players` table had a `role` column (`judge | honest | liar`). When a game was started, `getRoundRoles` was called once to populate `players.role`, and again (independently) to set `game_rounds.judge_player_id / honest_player_id` for every round. Because these were two separate calls to the same shuffle function, they could — and did — produce different assignments. Scoring reads from `game_rounds`; the UI read from `players.role`; neither could trust the other.

## Decision

1. **Remove `players.role` from the schema entirely.** `game_rounds.judge_player_id` and `game_rounds.honest_player_id` become the only persisted source of truth for role assignment.

2. **Just-in-time role assignment.** A single `getRoundRoles` call is made per round:
   - Round 1: at game start (`POST /api/rooms/[code]/start`)
   - Round N+1: when the judge fires `next_round` (`POST /api/rooms/[code]/moves`)
   
   Future rounds are inserted with null role fields and filled in just before they begin.

3. **Clients derive roles from `currentRound`.** The GET `/api/rooms/[code]` response no longer includes a `role` field on each player. Clients compare `currentPlayerId` against `currentRound.judgePlayerId` / `currentRound.honestPlayerId` to determine their role.

4. **Ordering guarantee.** The `next_round` handler updates `game_rounds[N+1]` role fields **before** incrementing `rooms.current_round_number`, so polling clients never observe a round number pointing to a row with null roles.

## Consequences

- Scoring is always correct because there is exactly one assignment per round.
- The UI always shows the correct role badge because it reads the same source as scoring.
- Test fixtures no longer insert `role` on players; they set `judgePlayerId`/`honestPlayerId` directly on the round row.
