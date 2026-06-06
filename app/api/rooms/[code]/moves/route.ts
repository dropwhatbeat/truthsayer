import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rooms, players, gameRounds, gameMoves } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { verifyPlayerToken } from '@/lib/auth'
import { validateMove } from '@/lib/move-validator'
import { getRoundRoles } from '@/lib/round-roles'

export const runtime = 'nodejs'

type MoveType = 'submit_description' | 'cast_vote' | 'next_round' | 'ready_to_vote'

function parseMoveData(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {}
  }

  return data as Record<string, unknown>
}

export async function POST(
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

    if (room.status !== 'playing') {
      return NextResponse.json({ error: 'Game not in progress' }, { status: 409 })
    }

    let body: { playerId?: string; playerSecret?: string; moveType?: string; data?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.playerId || !body.playerSecret || !body.moveType) {
      return NextResponse.json(
        { error: 'Missing playerId, playerSecret, or moveType' },
        { status: 400 }
      )
    }

    const [player] = await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.id, body.playerId),
          eq(players.roomId, room.id)
        )
      )
      .limit(1)

    if (!player) {
      return NextResponse.json({ error: 'Player not found in this room' }, { status: 404 })
    }

    if (!player.secretHash || !verifyPlayerToken(body.playerSecret, player.secretHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!room.currentRoundNumber) {
      return NextResponse.json({ error: 'Game has no active round' }, { status: 409 })
    }

    const [currentRound] = await db
      .select()
      .from(gameRounds)
      .where(
        and(
          eq(gameRounds.roomId, room.id),
          eq(gameRounds.roundNumber, room.currentRoundNumber)
        )
      )
      .limit(1)

    if (!currentRound) {
      return NextResponse.json({ error: 'No active round' }, { status: 409 })
    }

    const moveType = body.moveType as MoveType
    const moveValidation = validateMove(room.currentPhase, moveType)
    if (!moveValidation.valid) {
      return NextResponse.json({ error: moveValidation.error }, { status: 409 })
    }

    const moveData = parseMoveData(body.data)

    if (moveType === 'ready_to_vote') {
      if (currentRound.judgePlayerId !== player.id) {
        return NextResponse.json(
          { error: 'Only the judge can start voting' },
          { status: 409 }
        )
      }

      const [existingReady] = await db
        .select({ id: gameMoves.id })
        .from(gameMoves)
        .where(
          and(
            eq(gameMoves.roomId, room.id),
            eq(gameMoves.roundId, currentRound.id),
            eq(gameMoves.playerId, player.id),
            eq(gameMoves.moveType, 'ready_to_vote')
          )
        )
        .limit(1)

      if (existingReady) {
        return NextResponse.json(
          { error: 'Player already marked ready for this round' },
          { status: 409 }
        )
      }
    }

    if (moveType === 'cast_vote') {
      if (currentRound.judgePlayerId !== player.id) {
        return NextResponse.json({ error: 'Only the judge can vote' }, { status: 409 })
      }

      const targetPlayerId = moveData.targetPlayerId
      if (typeof targetPlayerId !== 'string' || targetPlayerId.length === 0) {
        return NextResponse.json({ error: 'targetPlayerId is required' }, { status: 400 })
      }

      if (targetPlayerId === player.id) {
        return NextResponse.json({ error: 'Judge cannot vote for self' }, { status: 409 })
      }

      const [existingVote] = await db
        .select({ id: gameMoves.id })
        .from(gameMoves)
        .where(
          and(
            eq(gameMoves.roomId, room.id),
            eq(gameMoves.roundId, currentRound.id),
            eq(gameMoves.moveType, 'cast_vote')
          )
        )
        .limit(1)

      if (existingVote) {
        return NextResponse.json(
          { error: 'Vote already recorded for this round' },
          { status: 409 }
        )
      }

      const [targetPlayer] = await db
        .select({ id: players.id })
        .from(players)
        .where(
          and(
            eq(players.id, targetPlayerId),
            eq(players.roomId, room.id)
          )
        )
        .limit(1)

      if (!targetPlayer) {
        return NextResponse.json(
          { error: 'Vote target must be a player in this room' },
          { status: 409 }
        )
      }
    }

    if (moveType === 'next_round') {
      // Allow exactly one round-advance move, initiated by either the host or
      // the judge. This keeps reveal/end progression consistent across clients.
      const isHost = room.createdBy === player.id
      const isJudge = currentRound.judgePlayerId === player.id
      if (!isHost && !isJudge) {
        return NextResponse.json(
          { error: 'Only the host or judge can advance the round' },
          { status: 409 }
        )
      }

      const [existingAdvance] = await db
        .select({ id: gameMoves.id })
        .from(gameMoves)
        .where(
          and(
            eq(gameMoves.roomId, room.id),
            eq(gameMoves.roundId, currentRound.id),
            eq(gameMoves.moveType, 'next_round')
          )
        )
        .limit(1)

      if (existingAdvance) {
        return NextResponse.json(
          { error: 'Round already advanced' },
          { status: 409 }
        )
      }
    }

    await db.insert(gameMoves).values({
      roomId: room.id,
      playerId: player.id,
      roundId: currentRound.id,
      moveType,
      data: moveData,
    })

    // Phase advancement based on move type
    if (moveType === 'next_round') {
      // Check if round count reached
      const config = typeof room.config === 'string'
        ? JSON.parse(room.config)
        : (room.config ?? {})

      const roundList = await db
        .select({ id: gameRounds.id })
        .from(gameRounds)
        .where(eq(gameRounds.roomId, room.id))

      if (currentRound.roundNumber >= (config.roundCount ?? roundList.length)) {
        await db
          .update(rooms)
          .set({
            status: 'finished',
            currentPhase: 'end',
            currentRoundNumber: currentRound.roundNumber,
            updatedAt: new Date(),
          })
          .where(eq(rooms.id, room.id))
      } else {
        const playerList = await db
          .select({ id: players.id })
          .from(players)
          .where(eq(players.roomId, room.id))
          .orderBy(asc(players.createdAt), asc(players.id))

        const nextRoundRoles = getRoundRoles(playerList)

        // Update next round's role fields BEFORE advancing currentRoundNumber so
        // polling clients never see a round number pointing to a row with null roles.
        await db
          .update(gameRounds)
          .set({
            judgePlayerId: nextRoundRoles.judgePlayerId,
            honestPlayerId: nextRoundRoles.honestPlayerId,
          })
          .where(
            and(
              eq(gameRounds.roomId, room.id),
              eq(gameRounds.roundNumber, currentRound.roundNumber + 1)
            )
          )

        await db
          .update(rooms)
          .set({
            currentPhase: 'reading',
            currentRoundNumber: currentRound.roundNumber + 1,
            updatedAt: new Date(),
          })
          .where(eq(rooms.id, room.id))
      }
    } else if (moveType === 'cast_vote') {
      await db
        .update(rooms)
        .set({ currentPhase: 'reveal', updatedAt: new Date() })
        .where(eq(rooms.id, room.id))
    } else if (moveType === 'ready_to_vote') {
      await db
        .update(rooms)
        .set({ currentPhase: 'voting', updatedAt: new Date() })
        .where(eq(rooms.id, room.id))
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
