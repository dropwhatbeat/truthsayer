import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Page } from 'puppeteer'
import {
  newPage,
  createRoom,
  registerPlayer,
  getLocalStorage,
  clearPlayerCredentials,
  getBaseUrl,
  clickButtonByText,
  setPlayerCredentials,
  waitForPath,
  waitForText,
} from './helpers'
import { closeBrowser } from './setup'

describe('Lobby & Registration', () => {
  let page: Page

  beforeAll(async () => {
    page = await newPage()
  })

  afterAll(async () => {
    if (page) await page.close().catch(() => {})
    await closeBrowser()
  })

  it('loads the lobby page with Create Room button and code input', async () => {
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })

    const body = await page.evaluate(() => document.body.innerText)
    expect(body).toContain('Create Room')
    expect(body).toMatch(/join with code|Enter Room Code/i)
  })

  it('creates a room and navigates to registration', async () => {
    const result = await createRoom(page)

    // Should be on registration page
    const pathname = await page.evaluate(() => window.location.pathname)
    expect(pathname).toContain('/register')
    expect(pathname).toContain(result.code)

    const body = await page.evaluate(() => document.body.innerText)
    expect(body).toContain('Enter Your Name')
  })

  it('joins an existing room by entering the code', async () => {
    // First create a room to get a valid code (use API directly, not UI)
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    await clearPlayerCredentials(page)

    await createRoom(page)
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/rooms', { method: 'POST' })
      const data = await res.json()
      return data as { code: string }
    })

    // Now go back to lobby and join using the code
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })

    // Type the room code and click Join
    await page.type('input[placeholder="Enter Room Code"]', result.code)
    await clickButtonByText(page, 'Join', { requireEnabled: true })

    // Should navigate to registration
    await waitForPath(page, `/game/${result.code}/register`)
  })

  it('shows error for invalid room code', async () => {
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })

    await page.type('input[placeholder="Enter Room Code"]', 'XXXXXX')
    await clickButtonByText(page, 'Join', { requireEnabled: true })

    // Wait for error message
    await waitForText(page, 'not found', 5000).catch(async () => {
      await waitForText(page, 'error', 5000)
    })

    const body = await page.evaluate(() => document.body.innerText)
    expect(body.toLowerCase()).toMatch(/not found|error/i)
  })

  it('auto-joins room and stores credentials in localStorage on registration page', async () => {
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    await clearPlayerCredentials(page)

    const { code } = await createRoom(page)

    // createRoom now waits for auto-join, so localStorage should have credentials
    const stored = await getLocalStorage(page, 'bsking-player')
    expect(stored).toBeTruthy()

    const parsed = JSON.parse(stored!)
    expect(parsed.roomCode).toBe(code)
    expect(parsed.playerId).toBeTruthy()
  })

  it('registers name and navigates to waiting room', async () => {
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    await clearPlayerCredentials(page)

    const { code } = await createRoom(page)
    // createRoom waits for auto-join, now register the name
    await registerPlayer(page, code, 'TestPlayer')

    const body = await page.evaluate(() => document.body.innerText)
    expect(body).toContain('Waiting Room')
    expect(body).toContain('TestPlayer')
    expect(body).toContain('Need at least 3 players')
    expect(body).not.toContain('Waiting for host to start')
  })

  it('shows validation error for empty name', async () => {
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    await clearPlayerCredentials(page)

    const { code } = await createRoom(page)

    // Registration page loaded, try submitting without name
    await page.waitForSelector('input[placeholder="Your name"]')
    await clickButtonByText(page, 'Join Game')

    // Should stay on registration page
    await new Promise((r) => setTimeout(r, 500))
    const pathname = await page.evaluate(() => window.location.pathname)
    expect(pathname).toContain('/register')
  })

  it('clears localStorage and redirects to register on 401 reconnect', async () => {
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    await clearPlayerCredentials(page)

    const { code } = await createRoom(page)
    await registerPlayer(page, code, 'BadCreds')
    await setPlayerCredentials(page, {
      roomCode: code,
      playerId: 'invalid-id',
      playerSecret: 'invalid-secret',
    })

    await page.goto(`${getBaseUrl()}/game/${code}`, {
      waitUntil: 'networkidle0',
    })

    await waitForPath(page, '/register')

    const stored = await getLocalStorage(page, 'bsking-player')
    expect(stored).toBeNull()
  })
})
