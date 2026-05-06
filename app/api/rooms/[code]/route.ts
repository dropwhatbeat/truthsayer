import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rooms, players } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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

    return NextResponse.json({
      id: room.id,
      code: room.code,
      status: room.status,
      currentPhase: room.currentPhase,
      config,
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
