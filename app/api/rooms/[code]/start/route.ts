import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rooms, players, gameRounds } from '@/lib/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { prepareDeck } from '@bsking/game-engine'
import type { DeckType } from '@bsking/game-engine'

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

    const playerList = await db
      .select()
      .from(players)
      .where(and(eq(players.roomId, room.id), isNotNull(players.name)))

    if (playerList.length < 3) {
      return NextResponse.json(
        { error: 'Need at least 3 registered players' },
        { status: 400 }
      )
    }

    // Assign roles: first = judge, second = honest, rest = liars
    const shuffled = [...playerList].sort(() => Math.random() - 0.5)
    await db
      .update(players)
      .set({ role: 'judge' })
      .where(eq(players.id, shuffled[0].id))

    await db
      .update(players)
      .set({ role: 'honest' })
      .where(eq(players.id, shuffled[1].id))

    for (let i = 2; i < shuffled.length; i++) {
      await db
        .update(players)
        .set({ role: 'liar' })
        .where(eq(players.id, shuffled[i].id))
    }

    // Prepare deck
    const config = typeof room.config === 'string'
      ? JSON.parse(room.config)
      : (room.config ?? {})
    const deckType: DeckType = (config.deckType ?? 'absurd-truths') as DeckType
    const roundCount = config.roundCount ?? 10
    const cards = prepareDeck(deckType, roundCount)

    // Insert game_rounds
    for (let i = 0; i < cards.length; i++) {
      await db.insert(gameRounds).values({
        roomId: room.id,
        roundNumber: i + 1,
        cardPhrase: cards[i].phrase,
        cardAnswer: cards[i].answer,
        categories: cards[i].categories ?? [],
      })
    }

    // Update room status
    await db
      .update(rooms)
      .set({
        status: 'playing',
        currentPhase: 'reading',
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, room.id))

    return NextResponse.json({ success: true, totalRounds: cards.length })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
