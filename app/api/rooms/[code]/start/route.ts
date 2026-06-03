import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rooms, players, gameRounds, gameMoves } from '@/lib/db/schema'
import { eq, and, isNotNull, asc } from 'drizzle-orm'
import { prepareDeck } from '@bsking/game-engine'
import type { DeckType } from '@bsking/game-engine'
import { getRoundRoles } from '@/lib/round-roles'
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

    if (room.createdBy !== player.id) {
      return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 })
    }

    if (room.status !== 'lobby') {
      return NextResponse.json(
        { error: 'Game can only be started from the lobby' },
        { status: 409 }
      )
    }

    const playerList = await db
      .select()
      .from(players)
      .where(and(eq(players.roomId, room.id), isNotNull(players.name)))
      .orderBy(asc(players.createdAt), asc(players.id))

    if (playerList.length < 3) {
      return NextResponse.json(
        { error: 'Need at least 3 registered players' },
        { status: 400 }
      )
    }

    const roundOneRoles = getRoundRoles(playerList, 1)
    await db
      .update(players)
      .set({ role: 'judge' })
      .where(eq(players.id, roundOneRoles.judgePlayerId))

    await db
      .update(players)
      .set({ role: 'honest' })
      .where(eq(players.id, roundOneRoles.honestPlayerId))

    for (const liarPlayerId of roundOneRoles.liarPlayerIds) {
      await db
        .update(players)
        .set({ role: 'liar' })
        .where(eq(players.id, liarPlayerId))
    }

    // Prepare deck
    const config = typeof room.config === 'string'
      ? JSON.parse(room.config)
      : (room.config ?? {})
    const deckType: DeckType = (config.deckType ?? 'absurd-truths') as DeckType
    const roundCount = config.roundCount ?? 10
    const cards = prepareDeck(deckType, roundCount)

    // Reset persisted game state before starting a fresh game.
    await db.delete(gameMoves).where(eq(gameMoves.roomId, room.id))
    await db.delete(gameRounds).where(eq(gameRounds.roomId, room.id))

    // Insert game_rounds
    for (let i = 0; i < cards.length; i++) {
      const roundNumber = i + 1
      const roundRoles = getRoundRoles(playerList, roundNumber)
      await db.insert(gameRounds).values({
        roomId: room.id,
        roundNumber,
        judgePlayerId: roundRoles.judgePlayerId,
        honestPlayerId: roundRoles.honestPlayerId,
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
        currentRoundNumber: 1,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, room.id))

    return NextResponse.json({ success: true, totalRounds: cards.length })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
