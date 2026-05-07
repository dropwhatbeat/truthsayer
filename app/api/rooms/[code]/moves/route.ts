import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rooms, players, gameRounds, gameMoves } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { verifyPlayerToken } from '@/lib/auth'

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

    // Get current round
    const [currentRound] = await db
      .select()
      .from(gameRounds)
      .where(eq(gameRounds.roomId, room.id))
      .orderBy(desc(gameRounds.roundNumber))
      .limit(1)

    if (!currentRound) {
      return NextResponse.json({ error: 'No active round' }, { status: 409 })
    }

    // Insert move
    await db.insert(gameMoves).values({
      roomId: room.id,
      playerId: player.id,
      roundId: currentRound.id,
      moveType: body.moveType as 'submit_description' | 'cast_vote' | 'next_round' | 'ready_to_vote',
      data: body.data ?? {},
    })

    // Phase advancement based on move type
    if (body.moveType === 'next_round') {
      // Check if round count reached
      const config = typeof room.config === 'string'
        ? JSON.parse(room.config)
        : (room.config ?? {})

      const roundList = await db
        .select()
        .from(gameRounds)
        .where(eq(gameRounds.roomId, room.id))

      if (currentRound.roundNumber >= (config.roundCount ?? roundList.length)) {
        await db
          .update(rooms)
          .set({ status: 'finished', currentPhase: 'end', updatedAt: new Date() })
          .where(eq(rooms.id, room.id))
      } else {
        await db
          .update(rooms)
          .set({ currentPhase: 'reading', updatedAt: new Date() })
          .where(eq(rooms.id, room.id))
      }
    } else if (body.moveType === 'cast_vote') {
      await db
        .update(rooms)
        .set({ currentPhase: 'reveal', updatedAt: new Date() })
        .where(eq(rooms.id, room.id))
    } else if (body.moveType === 'ready_to_vote') {
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
