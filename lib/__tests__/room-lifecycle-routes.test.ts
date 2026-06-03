import 'dotenv/config'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { and, eq } from 'drizzle-orm'
import { PATCH } from '@/app/api/rooms/[code]/route'
import { POST as replayPOST } from '@/app/api/rooms/[code]/replay/route'
import { generatePlayerToken } from '@/lib/auth'
import { gameMoves, gameRounds, players, rooms } from '@/lib/db/schema'

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

async function createRoomFixture(status: 'lobby' | 'playing' | 'finished' = 'lobby') {
  const [room] = await db
    .insert(rooms)
    .values({
      code: 'ROOM42',
      status,
      currentPhase: status === 'finished' ? 'end' : status === 'playing' ? 'reading' : 'waiting',
      currentRoundNumber: status === 'lobby' ? null : 1,
      deckType: 'absurd-truths',
      config: { roundCount: 2, deckType: 'absurd-truths', timerSecs: 30 },
      updatedAt: new Date(),
    })
    .returning({ id: rooms.id })

  const hostToken = generatePlayerToken()
  const guestToken = generatePlayerToken()

  const [host] = await db
    .insert(players)
    .values({
      roomId: room.id,
      name: 'Host',
      role: status === 'finished' ? 'judge' : null,
      secretHash: hostToken.hash,
    })
    .returning({ id: players.id })

  const [guest] = await db
    .insert(players)
    .values({
      roomId: room.id,
      name: 'Guest',
      role: status === 'finished' ? 'honest' : null,
      secretHash: guestToken.hash,
    })
    .returning({ id: players.id })

  await db
    .update(rooms)
    .set({ createdBy: host.id, updatedAt: new Date() })
    .where(eq(rooms.id, room.id))

  if (status === 'finished') {
    const [round] = await db
      .insert(gameRounds)
      .values({
        roomId: room.id,
        roundNumber: 1,
        judgePlayerId: host.id,
        honestPlayerId: guest.id,
        cardPhrase: 'Prompt',
        cardAnswer: 'Answer',
        categories: [],
      })
      .returning({ id: gameRounds.id })

    await db.insert(gameMoves).values({
      roomId: room.id,
      playerId: host.id,
      roundId: round.id,
      moveType: 'next_round',
      data: {},
    })
  }

  return {
    roomId: room.id,
    roomCode: 'ROOM42',
    host: { id: host.id, secret: hostToken.plaintext },
    guest: { id: guest.id, secret: guestToken.plaintext },
  }
}

async function patchRoom(roomCode: string, body: Record<string, unknown>): Promise<Response> {
  return PATCH(
    new Request(`http://localhost/api/rooms/${roomCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ code: roomCode }) }
  )
}

async function postReplay(roomCode: string, body: Record<string, unknown>): Promise<Response> {
  return replayPOST(
    new Request(`http://localhost/api/rooms/${roomCode}/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ code: roomCode }) }
  )
}

describe('PATCH /api/rooms/[code]', () => {
  it('allows the host to update the deck in the lobby', async () => {
    const fixture = await createRoomFixture('lobby')

    const response = await patchRoom(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: fixture.host.secret,
      deckType: 'medical',
    })

    expect(response.status).toBe(200)

    const [room] = await db
      .select({ deckType: rooms.deckType, config: rooms.config })
      .from(rooms)
      .where(eq(rooms.id, fixture.roomId))

    expect(room.deckType).toBe('medical')
    expect((room.config as { deckType: string }).deckType).toBe('medical')
  })

  it('rejects non-host deck updates', async () => {
    const fixture = await createRoomFixture('lobby')

    const response = await patchRoom(fixture.roomCode, {
      playerId: fixture.guest.id,
      playerSecret: fixture.guest.secret,
      deckType: 'medical',
    })

    expect(response.status).toBe(403)
  })

  it('rejects invalid deck types', async () => {
    const fixture = await createRoomFixture('lobby')

    const response = await patchRoom(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: fixture.host.secret,
      deckType: 'not-a-real-deck',
    })

    expect(response.status).toBe(400)
  })

  it('rejects deck updates outside the lobby', async () => {
    const fixture = await createRoomFixture('playing')

    const response = await patchRoom(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: fixture.host.secret,
      deckType: 'medical',
    })

    expect(response.status).toBe(409)
  })
})

describe('POST /api/rooms/[code]/replay', () => {
  it('replays a finished room back to the waiting room', async () => {
    const fixture = await createRoomFixture('finished')

    const response = await postReplay(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: fixture.host.secret,
    })

    expect(response.status).toBe(200)

    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, fixture.roomId))
      .limit(1)
    const roomPlayers = await db
      .select({ id: players.id, name: players.name, role: players.role })
      .from(players)
      .where(eq(players.roomId, fixture.roomId))
    const remainingRounds = await db
      .select({ id: gameRounds.id })
      .from(gameRounds)
      .where(eq(gameRounds.roomId, fixture.roomId))
    const remainingMoves = await db
      .select({ id: gameMoves.id })
      .from(gameMoves)
      .where(eq(gameMoves.roomId, fixture.roomId))

    expect(room.status).toBe('lobby')
    expect(room.currentPhase).toBe('waiting')
    expect(room.currentRoundNumber).toBeNull()
    expect(room.createdBy).toBe(fixture.host.id)
    expect(room.deckType).toBe('absurd-truths')
    expect((room.config as { deckType: string }).deckType).toBe('absurd-truths')
    expect(roomPlayers.every((player) => player.role === null)).toBe(true)
    expect(roomPlayers.map((player) => player.name)).toEqual(['Host', 'Guest'])
    expect(remainingRounds).toHaveLength(0)
    expect(remainingMoves).toHaveLength(0)
  })

  it('rejects non-host replay attempts', async () => {
    const fixture = await createRoomFixture('finished')

    const response = await postReplay(fixture.roomCode, {
      playerId: fixture.guest.id,
      playerSecret: fixture.guest.secret,
    })

    expect(response.status).toBe(403)
  })

  it('rejects replay before the game is finished', async () => {
    const fixture = await createRoomFixture('lobby')

    const response = await postReplay(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: fixture.host.secret,
    })

    expect(response.status).toBe(409)
  })

  it('rejects invalid credentials', async () => {
    const fixture = await createRoomFixture('finished')

    const response = await postReplay(fixture.roomCode, {
      playerId: fixture.host.id,
      playerSecret: 'bad-secret',
    })

    expect(response.status).toBe(401)
  })
})
