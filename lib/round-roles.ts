type PlayerLike = {
  id: string
}

export interface RoundRoles {
  judgePlayerId: string
  honestPlayerId: string
  liarPlayerIds: string[]
}

export function getRoundRoles<T extends PlayerLike>(
  players: T[],
  roundNumber: number
): RoundRoles {
  if (players.length < 3) {
    throw new Error('Need at least 3 players to assign round roles')
  }

  const judgeIndex = (roundNumber - 1) % players.length
  const honestIndex = (judgeIndex + 1) % players.length
  const judgePlayerId = players[judgeIndex]!.id
  const honestPlayerId = players[honestIndex]!.id
  const liarPlayerIds = players
    .filter((player) => player.id !== judgePlayerId && player.id !== honestPlayerId)
    .map((player) => player.id)

  return {
    judgePlayerId,
    honestPlayerId,
    liarPlayerIds,
  }
}
