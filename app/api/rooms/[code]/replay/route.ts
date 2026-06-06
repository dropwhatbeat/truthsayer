import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { gameMoves, gameRounds, players, rooms } from '@/lib/db/schema'
import { verifyPlayerToken } from '@/lib/auth'

export const runtime = 'nodejs'

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

    let body: { playerId?: string; playerSecret?: string }
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
        { error: 'Only the host can reset the room' },
        { status: 403 }
      )
    }

    if (room.status !== 'finished') {
      return NextResponse.json(
        { error: 'Room can only be reset after the game has finished' },
        { status: 409 }
      )
    }

    await db.delete(gameMoves).where(eq(gameMoves.roomId, room.id))
    await db.delete(gameRounds).where(eq(gameRounds.roomId, room.id))
    await db
      .update(rooms)
      .set({
        status: 'lobby',
        currentPhase: 'waiting',
        currentRoundNumber: null,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, room.id))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
