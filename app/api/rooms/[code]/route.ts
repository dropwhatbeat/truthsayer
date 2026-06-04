import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rooms, players, gameRounds, gameMoves } from '@/lib/db/schema'
import { eq, desc, and, inArray } from 'drizzle-orm'
import type { DeckType } from '@bsking/game-engine'
import { isDeckType } from '@bsking/game-engine'
import { verifyPlayerToken } from '@/lib/auth'

export const runtime = 'nodejs'

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

    if (room.currentRoundNumber) {
      const [round] = await db
        .select({
          id: gameRounds.id,
          roundNumber: gameRounds.roundNumber,
          judgePlayerId: gameRounds.judgePlayerId,
          honestPlayerId: gameRounds.honestPlayerId,
          cardPhrase: gameRounds.cardPhrase,
          cardAnswer: gameRounds.cardAnswer,
          categories: gameRounds.categories,
        })
        .from(gameRounds)
        .where(
          and(
            eq(gameRounds.roomId, room.id),
            eq(gameRounds.roundNumber, room.currentRoundNumber)
          )
        )
        .limit(1)

      if (round) {
        currentRound = {
          roundNumber: round.roundNumber,
          judgePlayerId: round.judgePlayerId,
          honestPlayerId: round.honestPlayerId,
          cardPhrase: round.cardPhrase,
          cardAnswer: round.cardAnswer,
          categories: round.categories,
        }
        // Get the latest cast_vote move for the active round.
        const [vote] = await db
          .select()
          .from(gameMoves)
          .where(
            and(
              eq(gameMoves.roomId, room.id),
              eq(gameMoves.moveType, 'cast_vote'),
              eq(gameMoves.roundId, round.id)
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

    const roundIds = Array.from(new Set(votes.map((vote) => vote.roundId)))
    const roundAssignments = roundIds.length === 0
      ? []
      : await db
        .select({
          id: gameRounds.id,
          judgePlayerId: gameRounds.judgePlayerId,
          honestPlayerId: gameRounds.honestPlayerId,
        })
        .from(gameRounds)
        .where(inArray(gameRounds.id, roundIds))

    const roundAssignmentById = new Map(
      roundAssignments.map((round) => [round.id, round])
    )

    for (const vote of votes) {
      const voteData = typeof vote.data === 'string'
        ? JSON.parse(vote.data)
        : (vote.data ?? {})
      const targetId = voteData.targetPlayerId ?? ''
      const roundAssignment = roundAssignmentById.get(vote.roundId)
      const judgePlayerId = roundAssignment?.judgePlayerId ?? vote.playerId
      const honestPlayerId = roundAssignment?.honestPlayerId

      if (!honestPlayerId) {
        continue
      }

      if (targetId === honestPlayerId) {
        scores[judgePlayerId] = (scores[judgePlayerId] || 0) + 1
      } else {
        scores[honestPlayerId] = (scores[honestPlayerId] || 0) + 1
      }
    }

    return NextResponse.json({
      id: room.id,
      code: room.code,
      status: room.status,
      currentPhase: room.currentPhase,
      currentRoundNumber: room.currentRoundNumber,
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

export async function PATCH(
  request: Request,
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

    let body: { playerId?: string; playerSecret?: string; deckType?: unknown; timerSecs?: unknown; roundCount?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.playerId || !body.playerSecret) {
      return NextResponse.json(
        { error: 'Missing playerId or playerSecret' },
        { status: 400 }
      )
    }

    if (body.deckType !== undefined && !isDeckType(body.deckType)) {
      return NextResponse.json({ error: 'Invalid deck type' }, { status: 400 })
    }

    if (body.deckType === undefined && body.timerSecs === undefined && body.roundCount === undefined) {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 })
    }

    const [player] = await db
      .select()
      .from(players)
      .where(and(eq(players.id, body.playerId), eq(players.roomId, room.id)))
      .limit(1)

    if (!player) {
      return NextResponse.json({ error: 'Player not found in this room' }, { status: 404 })
    }

    if (!player.secretHash || !verifyPlayerToken(body.playerSecret, player.secretHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (room.createdBy !== player.id) {
      return NextResponse.json(
        { error: 'Only the host can update room settings' },
        { status: 403 }
      )
    }

    if (room.status !== 'lobby') {
      return NextResponse.json(
        { error: 'Settings can only be updated while the room is in the lobby' },
        { status: 409 }
      )
    }

    const config = typeof room.config === 'string'
      ? JSON.parse(room.config)
      : (room.config ?? {})
    const nextConfig = {
      ...config,
      ...(isDeckType(body.deckType) ? { deckType: body.deckType as DeckType } : {}),
      ...(typeof body.timerSecs === 'number' ? { timerSecs: body.timerSecs } : {}),
      ...(typeof body.roundCount === 'number' ? { roundCount: body.roundCount } : {}),
    }

    await db
      .update(rooms)
      .set({
        ...(isDeckType(body.deckType) ? { deckType: body.deckType as DeckType } : {}),
        config: JSON.stringify(nextConfig),
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, room.id))

    return NextResponse.json({
      success: true,
      config: nextConfig,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
