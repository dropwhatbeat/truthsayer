type PlayerLike = {
  id: string
}

export interface RoundRoles {
  judgePlayerId: string
  honestPlayerId: string
  liarPlayerIds: string[]
}

export function getRoundRoles<T extends PlayerLike>(
  players: T[]
): RoundRoles {
  if (players.length < 3) {
    throw new Error('Need at least 3 players to assign round roles')
  }

  const shuffled = [...players]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }

  const judgePlayerId = shuffled[0]!.id
  const honestPlayerId = shuffled[1]!.id
  const liarPlayerIds = shuffled.slice(2).map((p) => p.id)

  return {
    judgePlayerId,
    honestPlayerId,
    liarPlayerIds,
  }
}
