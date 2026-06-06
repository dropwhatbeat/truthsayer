# Truthsayer — Domain Context

## Core Terms

### Role
`judge | honest | liar`. Assigned fresh each round. The liar role is derived (any player who is neither judge nor honest player).

### Role Authority
`game_rounds.judge_player_id` and `game_rounds.honest_player_id` are the single persisted source of truth for who holds a role in a given round. The `players` table carries no role information.

### Just-in-time Role Assignment
Roles are written to `game_rounds` exactly once per round, at the moment the round begins:
- Round 1: assigned when the host starts the game (`POST /api/rooms/[code]/start`)
- Round N+1: assigned when the judge fires `next_round` (`POST /api/rooms/[code]/moves`)

Future rounds have null `judge_player_id` / `honest_player_id` until they start. Clients must never be exposed to a round number whose `game_rounds` row still has null roles; the `next_round` handler writes roles to the next round row **before** advancing `rooms.current_round_number`.

### Judge
The player who must identify the Honest Player. The Judge's identity is visible to all players during reading and voting.

### Honest Player (Truthsayer)
The player who knows and states the real answer. Their identity is secret during reading and voting; revealed at the reveal phase.

### Liar (Bullshitter)
Any player who is neither Judge nor Honest Player for the current round.

## Scoring
Scoring is computed by the GET `/api/rooms/[code]` endpoint from `game_moves` and `game_rounds`:
- Judge votes for Honest Player → Judge +1, Honest Player +1
- Judge votes for a Liar → that Liar +2
