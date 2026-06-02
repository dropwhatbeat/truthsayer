import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rooms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'

function generateCode(): string {
  return randomBytes(4)
    .toString('base64url')
    .replace(/[-_]/g, '')
    .slice(0, 6)
    .toUpperCase()
    .padEnd(6, '0')
}

export async function POST(request: Request) {
  try {
    let config = { deckType: 'absurd-truths', roundCount: 10, timerSecs: 30 }
    try {
      const body = await request.json()
      if (body.deckType) config.deckType = body.deckType
      if (body.roundCount) config.roundCount = body.roundCount
      if (body.timerSecs) config.timerSecs = body.timerSecs
    } catch {
      // use defaults
    }

    let code = generateCode()

    // Retry on collision
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const [room] = await db
          .insert(rooms)
          .values({
            code,
            status: 'lobby',
            deckType: config.deckType,
            config: JSON.stringify(config),
          })
          .returning({ id: rooms.id, code: rooms.code, status: rooms.status })

        return NextResponse.json(
          { roomId: room.id, code: room.code, status: room.status },
          { status: 201 }
        )
      } catch {
        code = generateCode()
      }
    }

    return NextResponse.json({ error: 'Could not create room' }, { status: 500 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
