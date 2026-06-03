import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Page } from 'puppeteer'
import {
  newPage,
  clearPlayerCredentials,
  getBaseUrl,
  setupPlayer,
  setPlayerCredentials,
  waitForPath,
  PlayerCredentials,
} from './helpers'
import { closeBrowser } from './setup'

describe('Reconnection', () => {
  let page: Page
  let code: string
  let credentials: PlayerCredentials

  beforeAll(async () => {
    page = await newPage()
    const result = await setupPlayer(page, 'ReconnectTest')
    code = result.code
    credentials = result.credentials
  })

  afterAll(async () => {
    if (page) await page.close().catch(() => {})
    await closeBrowser()
  })

  it('reconnects with valid credentials and redirects to current phase', async () => {
    // We're on waiting room with valid creds
    await page.goto(`${getBaseUrl()}/game/${code}`, {
      waitUntil: 'networkidle0',
    })

    await page.waitForFunction(
      (c: string) => {
        const path = window.location.pathname
        return path.includes(`/game/${c}`)
      },
      { timeout: 10000 },
      code
    )

    const pathname = await page.evaluate(() => window.location.pathname)
    expect(pathname).toContain(code)
  })

  it('clears localStorage and redirects to register with invalid credentials', async () => {
    await setPlayerCredentials(page, {
      roomCode: code,
      playerId: 'bad-player-id',
      playerSecret: 'bad-secret',
    })

    await page.goto(`${getBaseUrl()}/game/${code}`, {
      waitUntil: 'networkidle0',
    })

    await waitForPath(page, '/register')
  })

  it('redirects to register with no credentials', async () => {
    await clearPlayerCredentials(page)
    await page.goto(`${getBaseUrl()}/game/${code}`, {
      waitUntil: 'networkidle0',
    })

    await waitForPath(page, '/register')
  })

  it('redirects to register with wrong room code in credentials', async () => {
    await setPlayerCredentials(page, {
      roomCode: 'XXXXXX',
      playerId: 'some-id',
      playerSecret: 'some-secret',
    })

    await page.goto(`${getBaseUrl()}/game/${code}`, {
      waitUntil: 'networkidle0',
    })

    await waitForPath(page, '/register')
  })

  it('redirects to correct phase on mismatch', async () => {
    await setPlayerCredentials(page, credentials)

    await page.goto(`${getBaseUrl()}/game/${code}`, {
      waitUntil: 'networkidle0',
    })

    await new Promise((r) => setTimeout(r, 2000))
    const pathname = await page.evaluate(() => window.location.pathname)
    expect(pathname).toContain(code)
    expect(pathname).not.toContain('/register')
  })
})
