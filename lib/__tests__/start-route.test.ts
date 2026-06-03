import 'dotenv/config'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { eq } from 'drizzle-orm'
import { POST } from '@/app/api/rooms/[code]/start/route'
import { generatePlayerToken } from '@/lib/auth'
import { gameMoves, gameRounds, players, rooms } from '@/lib/db/schema'
import { getDeckByType } from '@bsking/game-engine'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

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

async function createLobbyFixture() {
  return createLobbyFixtureWithConfig({
    roundCount: 2,
    deckType: 'absurd-truths',
    timerSecs: 30,
  })
}

async function createLobbyFixtureWithConfig(config: {
  roundCount: number
  deckType?: string
  timerSecs: number
}) {
  const [room] = await db
    .insert(rooms)
    .values({
      code: 'START1',
      status: 'lobby',
      config,
      deckType: config.deckType ?? null,
      updatedAt: new Date(),
    })
    .returning({ id: rooms.id })

  const hostToken = generatePlayerToken()
  const guestToken = generatePlayerToken()
  const thirdToken = generatePlayerToken()

  const [host] = await db
    .insert(players)
    .values({
      roomId: room.id,
      name: 'Host',
      secretHash: hostToken.hash,
    })
    .returning({ id: players.id })

  const [guest] = await db
    .insert(players)
    .values({
      roomId: room.id,
      name: 'Guest',
      secretHash: guestToken.hash,
    })
    .returning({ id: players.id })

  await db
    .insert(players)
    .values({
      roomId: room.id,
      name: 'Third',
      secretHash: thirdToken.hash,
    })
    .returning({ id: players.id })

  await db
    .update(rooms)
    .set({ createdBy: host.id, updatedAt: new Date() })
    .where(eq(rooms.id, room.id))

  return {
    roomCode: 'START1',
    host: { id: host.id, secret: hostToken.plaintext },
    guest: { id: guest.id, secret: guestToken.plaintext },
  }
}

async function postStart(roomCode: string, body: Record<string, unknown>): Promise<Response> {
  return POST(
    new Request(`http://localhost/api/rooms/${roomCode}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ code: roomCode }) }
  )
}

describe('POST /api/rooms/[code]/start', () => {
  it('rejects non-host players', async () => {
    const fixture = await createLobbyFixture()

    const response = await postStart(fixture.roomCode, {
      playerId: fixture.guest.id,
      playerSecret: fixture.guest.secret,
    })

    expect(response.status).toBe(403)
  })

  it('rejects invalid credentials', async () => {
    const fixture = await createLobbyFixture()

    const response = await postStart(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: 'invalid-secret',
    })

    expect(response.status).toBe(401)
  })

  it('allows the host to start the game', async () => {
    const fixture = await createLobbyFixture()

    const response = await postStart(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: fixture.host.secret,
    })

    expect(response.status).toBe(200)
  })

  it('uses the selected deck from room config', async () => {
    const fixture = await createLobbyFixtureWithConfig({
      roundCount: 2,
      deckType: 'medical',
      timerSecs: 30,
    })

    const response = await postStart(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: fixture.host.secret,
    })

    expect(response.status).toBe(200)

    const insertedRounds = await db
      .select({ cardPhrase: gameRounds.cardPhrase })
      .from(gameRounds)

    const medicalPhrases = new Set(getDeckByType('medical').map((card) => card.phrase))
    expect(insertedRounds).toHaveLength(2)
    expect(insertedRounds.every((round) => medicalPhrases.has(round.cardPhrase ?? ''))).toBe(true)
  })

  it('defaults to absurd-truths when no deck type was stored', async () => {
    const fixture = await createLobbyFixtureWithConfig({
      roundCount: 2,
      timerSecs: 30,
    })

    const response = await postStart(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: fixture.host.secret,
    })

    expect(response.status).toBe(200)

    const insertedRounds = await db
      .select({ cardPhrase: gameRounds.cardPhrase })
      .from(gameRounds)

    const defaultPhrases = new Set(getDeckByType('absurd-truths').map((card) => card.phrase))
    expect(insertedRounds).toHaveLength(2)
    expect(insertedRounds.every((round) => defaultPhrases.has(round.cardPhrase ?? ''))).toBe(true)
  })

  it('rejects starting a finished room without replaying first', async () => {
    const fixture = await createLobbyFixture()

    await db
      .update(rooms)
      .set({ status: 'finished', currentPhase: 'end', updatedAt: new Date() })
      .where(eq(rooms.code, fixture.roomCode))

    const response = await postStart(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: fixture.host.secret,
    })

    expect(response.status).toBe(409)
  })
})
