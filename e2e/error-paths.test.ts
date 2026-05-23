import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Page } from 'puppeteer'
import {
  newPage,
  submitMove,
  getBaseUrl,
  setPlayerCredentials,
  waitForPath,
  waitForText,
  clickButtonByText,
  PlayerCredentials,
} from './helpers'
import { seedGameViaEndpoint } from './fixtures/seed'
import { closeBrowser } from './setup'

interface RoomState {
  createdBy: string | null
  players: Array<{
    id: string
    name: string | null
    role: string | null
  }>
}

describe('Error Paths', () => {
  let page: Page

  beforeAll(async () => {
    page = await newPage()
  })

  afterAll(async () => {
    if (page) await page.close().catch(() => {})
    await closeBrowser()
  })

  async function fetchRoomState(roomCode: string): Promise<RoomState> {
    return page.evaluate(async (currentCode) => {
      const res = await fetch(`/api/rooms/${currentCode}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch room ${currentCode}: ${res.status}`)
      }
      return res.json() as Promise<RoomState>
    }, roomCode)
  }

  it('shows error for non-existent room code', async () => {
    await page.goto(`${getBaseUrl()}/game/NONEXIST`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForFunction(
      () => {
        const text = document.body.innerText.toLowerCase()
        return (
          text.includes('not found') ||
          text.includes('back to lobby') ||
          text.includes('failed')
        )
      },
      { timeout: 15000 }
    )

    const body = await page.evaluate(() => document.body.innerText)
    expect(body.length).toBeGreaterThan(0)
  })

  it('handles malformed room code gracefully', async () => {
    await page.goto(`${getBaseUrl()}/game/a`, {
      waitUntil: 'domcontentloaded',
    })

    await new Promise((r) => setTimeout(r, 3000))
    const body = await page.evaluate(() => document.body.innerText)
    expect(body.length).toBeGreaterThan(0)
  })

  it('shows error when joining already-started game', async () => {
    const seeded = await seedGameViaEndpoint(page, {
      playerCount: 3,
      targetPhase: 'reading',
    })

    const p4 = await newPage()
    await p4.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    await p4.type('input[placeholder="Enter Room Code"]', seeded.code)
    await clickButtonByText(p4, 'Join', { requireEnabled: true })
    await waitForText(p4, 'Game has already started.')

    const pathname = await p4.evaluate(() => window.location.pathname)
    expect(pathname).toBe('/')
    await p4.close()
  })

  it('handles 409 conflict on duplicate vote gracefully', async () => {
    const seeded = await seedGameViaEndpoint(page, {
      playerCount: 3,
      targetPhase: 'voting',
    })
    const room = await fetchRoomState(seeded.code)
    const judge = room.players.find((player) => player.role === 'judge')
    const target = room.players.find((player) => player.role === 'honest')

    if (!judge || !target) {
      throw new Error('Seeded voting room missing judge/honest players')
    }

    const judgeCreds = seeded.credentials.find(
      (creds) => creds.playerId === judge.id
    )
    if (!judgeCreds) {
      throw new Error('Missing credentials for seeded judge')
    }

    await setPlayerCredentials(page, judgeCreds)
    await page.goto(`${getBaseUrl()}/game/${seeded.code}/voting`, {
      waitUntil: 'networkidle0',
    })

    await submitMove(page, seeded.code, 'cast_vote', {
      targetPlayerName: target.name || 'Unknown',
    })

    const duplicateStatus = await page.evaluate(
      async ({
        roomCode,
        creds,
        targetPlayerId,
      }: {
        roomCode: string
        creds: PlayerCredentials
        targetPlayerId: string
      }) => {
        const res = await fetch(`/api/rooms/${roomCode}/moves`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: creds.playerId,
            playerSecret: creds.playerSecret,
            moveType: 'cast_vote',
            data: { targetPlayerId },
          }),
        })
        return res.status
      },
      {
        roomCode: seeded.code,
        creds: judgeCreds,
        targetPlayerId: target.id,
      }
    )

    expect(duplicateStatus).toBe(409)
    await waitForText(page, 'You voted for')
  })
})
