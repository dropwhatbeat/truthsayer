import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rooms, players } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
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

    return NextResponse.json({
      playerId: player.id,
      name: player.name,
      role: player.role,
      valid: true,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
