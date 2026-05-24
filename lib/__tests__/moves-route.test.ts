import 'dotenv/config'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { and, eq } from 'drizzle-orm'
import { POST } from '@/app/api/rooms/[code]/moves/route'
import { generatePlayerToken } from '@/lib/auth'
import { gameMoves, gameRounds, players, rooms } from '@/lib/db/schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

interface FixtureOptions {
  currentPhase?: 'reading' | 'voting' | 'reveal' | 'end'
  roundCount?: number
}

interface Fixture {
  roomCode: string
  roomId: string
  roundId: string
  judge: { id: string; secret: string }
  honest: { id: string; secret: string }
  liar: { id: string; secret: string }
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: './lib/db/migrations' })
})

afterAll(async () => {
  await pool.end()
})

beforeEach(async () => {
  await db.delete(gameMoves)
  await db.delete(gameRounds)
  await db.delete(players)
  await db.delete(rooms)
})

async function createFixture(options: FixtureOptions = {}): Promise<Fixture> {
  const roomCode = `T${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const currentPhase = options.currentPhase ?? 'voting'
  const roundCount = options.roundCount ?? 2

  const [room] = await db
    .insert(rooms)
    .values({
      code: roomCode,
      status: currentPhase === 'end' ? 'finished' : 'playing',
      currentPhase,
      currentRoundNumber: currentPhase === 'end' ? roundCount : 1,
      config: { roundCount, deckType: 'absurd-truths', timerSecs: 30 },
      updatedAt: new Date(),
    })
    .returning({ id: rooms.id })

  const judgeToken = generatePlayerToken()
  const honestToken = generatePlayerToken()
  const liarToken = generatePlayerToken()

  const [judge] = await db
    .insert(players)
    .values({
      roomId: room.id,
      name: 'Judge',
      role: 'judge',
      secretHash: judgeToken.hash,
    })
    .returning({ id: players.id })

  const [honest] = await db
    .insert(players)
    .values({
      roomId: room.id,
      name: 'Honest',
      role: 'honest',
      secretHash: honestToken.hash,
    })
    .returning({ id: players.id })

  const [liar] = await db
    .insert(players)
    .values({
      roomId: room.id,
      name: 'Liar',
      role: 'liar',
      secretHash: liarToken.hash,
    })
    .returning({ id: players.id })

  await db
    .update(rooms)
    .set({ createdBy: judge.id, updatedAt: new Date() })
    .where(eq(rooms.id, room.id))

  const insertedRounds = await db
    .insert(gameRounds)
    .values(
      Array.from({ length: roundCount }, (_, index) => ({
        roomId: room.id,
        roundNumber: index + 1,
        cardPhrase: `Test phrase ${index + 1}`,
        cardAnswer: `Test answer ${index + 1}`,
        categories: [],
      }))
    )
    .returning({ id: gameRounds.id })

  return {
    roomCode,
    roomId: room.id,
    roundId: insertedRounds[0]!.id,
    judge: { id: judge.id, secret: judgeToken.plaintext },
    honest: { id: honest.id, secret: honestToken.plaintext },
    liar: { id: liar.id, secret: liarToken.plaintext },
  }
}

async function postMove(
  roomCode: string,
  body: Record<string, unknown>
): Promise<Response> {
  return POST(
    new Request(`http://localhost/api/rooms/${roomCode}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ code: roomCode }) }
  )
}

describe('POST /api/rooms/[code]/moves', () => {
  it('returns 409 for a second cast_vote in the same round', async () => {
    const fixture = await createFixture({ currentPhase: 'voting' })

    await db.insert(gameMoves).values({
      roomId: fixture.roomId,
      playerId: fixture.judge.id,
      roundId: fixture.roundId,
      moveType: 'cast_vote',
      data: { targetPlayerId: fixture.honest.id },
    })

    const response = await postMove(fixture.roomCode, {
      playerId: fixture.judge.id,
      playerSecret: fixture.judge.secret,
      moveType: 'cast_vote',
      data: { targetPlayerId: fixture.liar.id },
    })

    expect(response.status).toBe(409)
  })

  it('returns 409 for a second ready_to_vote in the same round', async () => {
    const fixture = await createFixture({ currentPhase: 'reading' })

    await db.insert(gameMoves).values({
      roomId: fixture.roomId,
      playerId: fixture.honest.id,
      roundId: fixture.roundId,
      moveType: 'ready_to_vote',
      data: {},
    })

    const response = await postMove(fixture.roomCode, {
      playerId: fixture.honest.id,
      playerSecret: fixture.honest.secret,
      moveType: 'ready_to_vote',
    })

    expect(response.status).toBe(409)
  })

  it('returns 409 for cast_vote during reading', async () => {
    const fixture = await createFixture({ currentPhase: 'reading' })

    const response = await postMove(fixture.roomCode, {
      playerId: fixture.judge.id,
      playerSecret: fixture.judge.secret,
      moveType: 'cast_vote',
      data: { targetPlayerId: fixture.honest.id },
    })

    expect(response.status).toBe(409)
  })

  it('returns 409 when a non-judge attempts cast_vote', async () => {
    const fixture = await createFixture({ currentPhase: 'voting' })

    const response = await postMove(fixture.roomCode, {
      playerId: fixture.honest.id,
      playerSecret: fixture.honest.secret,
      moveType: 'cast_vote',
      data: { targetPlayerId: fixture.liar.id },
    })

    expect(response.status).toBe(409)
  })

  it('returns 400 when cast_vote is missing targetPlayerId', async () => {
    const fixture = await createFixture({ currentPhase: 'voting' })

    const response = await postMove(fixture.roomCode, {
      playerId: fixture.judge.id,
      playerSecret: fixture.judge.secret,
      moveType: 'cast_vote',
      data: {},
    })

    expect(response.status).toBe(400)
  })

  it('returns 409 when cast_vote targets an invalid player', async () => {
    const fixture = await createFixture({ currentPhase: 'voting' })

    const response = await postMove(fixture.roomCode, {
      playerId: fixture.judge.id,
      playerSecret: fixture.judge.secret,
      moveType: 'cast_vote',
      data: { targetPlayerId: '00000000-0000-0000-0000-000000000000' },
    })

    expect(response.status).toBe(409)
  })

  it('accepts the first ready_to_vote move and advances the room to voting', async () => {
    const fixture = await createFixture({ currentPhase: 'reading' })

    const response = await postMove(fixture.roomCode, {
      playerId: fixture.judge.id,
      playerSecret: fixture.judge.secret,
      moveType: 'ready_to_vote',
    })

    expect(response.status).toBe(200)

    const moves = await db
      .select()
      .from(gameMoves)
      .where(
        and(
          eq(gameMoves.roomId, fixture.roomId),
          eq(gameMoves.playerId, fixture.judge.id),
          eq(gameMoves.roundId, fixture.roundId),
          eq(gameMoves.moveType, 'ready_to_vote')
        )
      )

    expect(moves).toHaveLength(1)

    const [room] = await db
      .select({ currentPhase: rooms.currentPhase })
      .from(rooms)
      .where(eq(rooms.id, fixture.roomId))
      .limit(1)

    expect(room?.currentPhase).toBe('voting')
  })

  it('advances to the next round instead of ending after round one', async () => {
    const fixture = await createFixture({ currentPhase: 'reveal', roundCount: 2 })

    const response = await postMove(fixture.roomCode, {
      playerId: fixture.judge.id,
      playerSecret: fixture.judge.secret,
      moveType: 'next_round',
    })

    expect(response.status).toBe(200)

    const [room] = await db
      .select({ status: rooms.status, currentPhase: rooms.currentPhase })
      .from(rooms)
      .where(eq(rooms.id, fixture.roomId))
      .limit(1)

    expect(room?.status).toBe('playing')
    expect(room?.currentPhase).toBe('reading')
  })
})
