import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import bcrypt from 'bcrypt'
import { db } from '@/lib/db'
import { rooms, players, gameRounds, gameMoves } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { prepareDeck } from '@bsking/game-engine'
import type { DeckType } from '@bsking/game-engine'
import { getRoundRoles } from '@/lib/round-roles'

export const runtime = 'nodejs'

const SALT_ROUNDS = 10

function generateCode(): string {
  return randomBytes(4)
    .toString('base64url')
    .toUpperCase()
    .padEnd(6, '0')
    .slice(0, 6)
}

function generatePlayerToken(): { plaintext: string; hash: string } {
  const plaintext = crypto.randomUUID()
  const hash = bcrypt.hashSync(plaintext, SALT_ROUNDS)
  return { plaintext, hash }
}

interface SeedRequest {
  phase: string
  playerCount: number
  deckType?: string
  roundCount?: number
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed endpoint not available in production' },
      { status: 404 }
    )
  }

  try {
    const body: SeedRequest = await request.json()
    const phase = body.phase || 'waiting'
    const playerCount = body.playerCount || 3
    const deckType = (body.deckType || 'absurd-truths') as DeckType
    const roundCount = body.roundCount || 10

    if (playerCount < 3) {
      return NextResponse.json(
        { error: 'Need at least 3 players' },
        { status: 400 }
      )
    }

    const validPhases = ['waiting', 'reading', 'voting', 'reveal', 'end']
    if (!validPhases.includes(phase)) {
      return NextResponse.json(
        { error: `Invalid phase. Must be one of: ${validPhases.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique room code
    let code = generateCode()
    for (let i = 0; i < 5; i++) {
      const existing = await db
        .select({ code: rooms.code })
        .from(rooms)
        .where(eq(rooms.code, code))
        .limit(1)
      if (existing.length === 0) break
      code = generateCode()
    }

    // Create room
    const config = {
      deckType,
      roundCount,
      timerSecs: 30,
    }

    const [room] = await db
      .insert(rooms)
      .values({
        code,
        status: 'lobby',
        config: JSON.stringify(config),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: rooms.id })

    // Create players with tokens
    const playerNames = [
      'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank',
    ]
    const playerData: Array<{
      id: string
      name: string
      playerSecret: string
    }> = []

    for (let i = 0; i < playerCount; i++) {
      const name = playerNames[i] || `Player${i + 1}`
      const token = generatePlayerToken()

      const [p] = await db
        .insert(players)
        .values({
          roomId: room.id,
          name,
          secretHash: token.hash,
        })
        .returning({ id: players.id })

      playerData.push({
        id: p.id,
        name,
        playerSecret: token.plaintext,
      })
    }

    // Set createdBy to first player
    await db
      .update(rooms)
      .set({ createdBy: playerData[0].id })
      .where(eq(rooms.id, room.id))

    if (phase === 'waiting') {
      return NextResponse.json({
        code,
        credentials: playerData.map((p) => ({
          roomCode: code,
          playerId: p.id,
          playerSecret: p.playerSecret,
        })),
      })
    }

    // Start the game: assign round-one roles
    const roundOneRoles = getRoundRoles(playerData, 1)

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

    // Insert rounds
    const cards = prepareDeck(deckType, roundCount)
    const roundIds: string[] = []

    for (let i = 0; i < cards.length; i++) {
      const roundNumber = i + 1
      const roundRoles = getRoundRoles(playerData, roundNumber)
      const [r] = await db
        .insert(gameRounds)
        .values({
          roomId: room.id,
          roundNumber,
          judgePlayerId: roundRoles.judgePlayerId,
          honestPlayerId: roundRoles.honestPlayerId,
          cardPhrase: cards[i].phrase,
          cardAnswer: cards[i].answer,
          categories: cards[i].categories ?? [],
        })
        .returning({ id: gameRounds.id })

      roundIds.push(r.id)
    }

    // Set game state
    await db
      .update(rooms)
      .set({
        status: 'playing',
        currentPhase: 'reading',
        currentRoundNumber: 1,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, room.id))

    if (phase === 'reading') {
      return NextResponse.json({
        code,
        credentials: playerData.map((p) => ({
          roomCode: code,
          playerId: p.id,
          playerSecret: p.playerSecret,
        })),
      })
    }

    // Advance to voting: insert ready_to_vote move
    const round1Id = roundIds[0]
    await db.insert(gameMoves).values({
      roomId: room.id,
      playerId: roundOneRoles.judgePlayerId,
      roundId: round1Id,
      moveType: 'ready_to_vote',
      createdAt: new Date(),
    })

    await db
      .update(rooms)
      .set({ currentPhase: 'voting', updatedAt: new Date() })
      .where(eq(rooms.id, room.id))

    if (phase === 'voting') {
      return NextResponse.json({
        code,
        credentials: playerData.map((p) => ({
          roomCode: code,
          playerId: p.id,
          playerSecret: p.playerSecret,
        })),
      })
    }

    // Advance to reveal: insert cast_vote move
    await db.insert(gameMoves).values({
      roomId: room.id,
      playerId: roundOneRoles.judgePlayerId,
      roundId: round1Id,
      moveType: 'cast_vote',
      data: { targetPlayerId: roundOneRoles.honestPlayerId },
      createdAt: new Date(),
    })

    await db
      .update(rooms)
      .set({ currentPhase: 'reveal', updatedAt: new Date() })
      .where(eq(rooms.id, room.id))

    if (phase === 'reveal') {
      return NextResponse.json({
        code,
        credentials: playerData.map((p) => ({
          roomCode: code,
          playerId: p.id,
          playerSecret: p.playerSecret,
        })),
      })
    }

    // Advance to end: cycle through all rounds
    for (let r = 1; r < roundCount; r++) {
      const roundId = roundIds[r]
      if (!roundId) break
      const priorRoundRoles = getRoundRoles(playerData, r)
      const nextRoundRoles = getRoundRoles(playerData, r + 1)

      // next_round to advance to reading
      await db.insert(gameMoves).values({
        roomId: room.id,
        playerId: priorRoundRoles.judgePlayerId,
        roundId: roundIds[r - 1],
        moveType: 'next_round',
        createdAt: new Date(),
      })

      await db
        .update(rooms)
        .set({
          currentPhase: 'reading',
          currentRoundNumber: r + 1,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))

      await db
        .update(players)
        .set({ role: 'judge' })
        .where(eq(players.id, nextRoundRoles.judgePlayerId))

      await db
        .update(players)
        .set({ role: 'honest' })
        .where(eq(players.id, nextRoundRoles.honestPlayerId))

      for (const liarPlayerId of nextRoundRoles.liarPlayerIds) {
        await db
          .update(players)
          .set({ role: 'liar' })
          .where(eq(players.id, liarPlayerId))
      }

      // ready_to_vote
      await db.insert(gameMoves).values({
        roomId: room.id,
        playerId: nextRoundRoles.judgePlayerId,
        roundId,
        moveType: 'ready_to_vote',
        createdAt: new Date(),
      })

      // cast_vote
      await db.insert(gameMoves).values({
        roomId: room.id,
        playerId: nextRoundRoles.judgePlayerId,
        roundId,
        moveType: 'cast_vote',
        data: { targetPlayerId: nextRoundRoles.honestPlayerId },
        createdAt: new Date(),
      })
    }

    // Last next_round to trigger end
    const lastRoundRoles = getRoundRoles(playerData, roundCount)
    await db.insert(gameMoves).values({
      roomId: room.id,
      playerId: lastRoundRoles.judgePlayerId,
      roundId: roundIds[roundIds.length - 1],
      moveType: 'next_round',
      createdAt: new Date(),
    })

    await db
      .update(rooms)
      .set({
        status: 'finished',
        currentPhase: 'end',
        currentRoundNumber: roundCount,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, room.id))

    return NextResponse.json({
      code,
      credentials: playerData.map((p) => ({
        roomCode: code,
        playerId: p.id,
        playerSecret: p.playerSecret,
      })),
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
