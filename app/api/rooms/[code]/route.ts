import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rooms, players, gameRounds, gameMoves } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.code, code.toUpperCase()))
      .limit(1)

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const playerList = await db
      .select({
        id: players.id,
        name: players.name,
        role: players.role,
      })
      .from(players)
      .where(eq(players.roomId, room.id))

    const config = typeof room.config === 'string'
      ? JSON.parse(room.config)
      : room.config

    let currentRound = null
    let lastVote: { voterId: string; targetPlayerId: string } | null = null
    let scores: Record<string, number> = {}
    playerList.forEach((p) => { scores[p.id] = 0 })

    if (room.status === 'playing') {
      const [round] = await db
        .select({
          roundNumber: gameRounds.roundNumber,
          cardPhrase: gameRounds.cardPhrase,
          cardAnswer: gameRounds.cardAnswer,
          categories: gameRounds.categories,
        })
        .from(gameRounds)
        .where(eq(gameRounds.roomId, room.id))
        .orderBy(desc(gameRounds.roundNumber))
        .limit(1)
      if (round) {
        currentRound = {
          roundNumber: round.roundNumber,
          cardPhrase: round.cardPhrase,
          cardAnswer: round.cardAnswer,
          categories: round.categories,
        }
      }

      // Get the latest cast_vote move
      const [vote] = await db
        .select()
        .from(gameMoves)
        .where(
          and(
            eq(gameMoves.roomId, room.id),
            eq(gameMoves.moveType, 'cast_vote')
          )
        )
        .orderBy(desc(gameMoves.createdAt))
        .limit(1)

      if (vote) {
        const voteData = typeof vote.data === 'string'
          ? JSON.parse(vote.data)
          : (vote.data ?? {})
        lastVote = {
          voterId: vote.playerId,
          targetPlayerId: voteData.targetPlayerId ?? '',
        }
      }
    }

    // Compute cumulative scores from all cast_vote moves
    const votes = await db
      .select()
      .from(gameMoves)
      .where(
        and(
          eq(gameMoves.roomId, room.id),
          eq(gameMoves.moveType, 'cast_vote')
        )
      )
      .orderBy(desc(gameMoves.createdAt))

    const honestPlayer = playerList.find((p) => p.role === 'honest')
    const judgePlayer = playerList.find((p) => p.role === 'judge')

    if (honestPlayer && judgePlayer) {
      for (const vote of votes) {
        const voteData = typeof vote.data === 'string'
          ? JSON.parse(vote.data)
          : (vote.data ?? {})
        const targetId = voteData.targetPlayerId ?? ''
        if (targetId === honestPlayer.id) {
          scores[judgePlayer.id] = (scores[judgePlayer.id] || 0) + 1
        } else {
          scores[honestPlayer.id] = (scores[honestPlayer.id] || 0) + 1
        }
      }
    }

    return NextResponse.json({
      id: room.id,
      code: room.code,
      status: room.status,
      currentPhase: room.currentPhase,
      createdBy: room.createdBy,
      config,
      currentRound,
      lastVote,
      scores,
      players: playerList.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
