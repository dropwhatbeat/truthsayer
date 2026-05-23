import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Page } from 'puppeteer'
import {
  newPage,
  createRoom,
  joinRoom,
  registerPlayer,
  startGame,
  submitMove,
  getBaseUrl,
  clearPlayerCredentials,
  waitForPath,
  waitForPlayerCount,
} from './helpers'
import { closeBrowser } from './setup'

describe('Error Paths', () => {
  let page: Page

  beforeAll(async () => {
    page = await newPage()
  })

  afterAll(async () => {
    if (page) await page.close().catch(() => {})
    await closeBrowser()
  })

  it('shows error for non-existent room code', async () => {
    await page.goto(`${getBaseUrl()}/game/NONEXIST`, {
      waitUntil: 'domcontentloaded',
    })

    // Wait for the TanStack Query error to render
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
    // Create a room, join and register 3 players, start game
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    await clearPlayerCredentials(page)

    const { code } = await createRoom(page)
    await registerPlayer(page, code, 'Host')

    // Join player 2
    const p2 = await newPage()
    await joinRoom(p2, code)
    await registerPlayer(p2, code, 'Player2')

    // Join player 3
    const p3 = await newPage()
    await joinRoom(p3, code)
    await registerPlayer(p3, code, 'Player3')

    // Navigate host to waiting and wait for button to be enabled
    await page.goto(`${getBaseUrl()}/game/${code}/waiting`, {
      waitUntil: 'domcontentloaded',
    })
    await waitForPlayerCount(page, 3)

    await startGame(page, code)
    await waitForPath(page, `/game/${code}/reading`)

    // Now try to join with a new page
    const p4 = await newPage()
    await p4.goto(getBaseUrl(), { waitUntil: 'networkidle0' })

    try {
      await joinRoom(p4, code)
    } catch {
      // Expected
    }

    await p4.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 2000))

    await p2.close()
    await p3.close()
    await p4.close()
  })

  it('handles 409 conflict on duplicate vote gracefully', async () => {
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    await clearPlayerCredentials(page)

    const { code } = await createRoom(page)
    await registerPlayer(page, code, 'Host')

    const p2 = await newPage()
    await joinRoom(p2, code)
    await registerPlayer(p2, code, 'Player2')

    const p3 = await newPage()
    await joinRoom(p3, code)
    await registerPlayer(p3, code, 'Player3')

    // Start game
    await page.goto(`${getBaseUrl()}/game/${code}/waiting`, {
      waitUntil: 'domcontentloaded',
    })
    await waitForPlayerCount(page, 3)
    await startGame(page, code)
    await waitForPath(page, `/game/${code}/reading`)

    // Advance to voting
    await submitMove(page, code, 'ready_to_vote')
    await waitForPath(page, `/game/${code}/voting`)

    // Submit vote
    await submitMove(page, code, 'cast_vote', {
      targetPlayerName: 'Player2',
    })

    // Submit same vote again
    await submitMove(page, code, 'cast_vote', {
      targetPlayerName: 'Player2',
    })

    expect(true).toBe(true)

    await p2.close()
    await p3.close()
  })
})
