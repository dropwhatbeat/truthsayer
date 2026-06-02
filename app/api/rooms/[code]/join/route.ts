import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rooms, players } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generatePlayerToken } from '@/lib/auth'

export async function POST(
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

    if (room.status !== 'lobby') {
      return NextResponse.json({ error: 'Game already started' }, { status: 409 })
    }

    const { plaintext, hash } = generatePlayerToken()

    const [player] = await db
      .insert(players)
      .values({
        roomId: room.id,
        secretHash: hash,
      })
      .returning({ id: players.id })

    // Set the first player to join as the room creator (host)
    if (room.createdBy === null) {
      await db
        .update(rooms)
        .set({ createdBy: player.id })
        .where(eq(rooms.id, room.id))
    }

    return NextResponse.json(
      { playerId: player.id, playerSecret: plaintext },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
