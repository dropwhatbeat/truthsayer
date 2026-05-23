import { ElementHandle, Page } from 'puppeteer'
import { ensureBrowser, getBrowser } from './setup'

export interface PlayerCredentials {
  roomCode: string
  playerId: string
  playerSecret: string
}

export interface CreateRoomResult {
  code: string
  roomId: string
  credentials: PlayerCredentials
}

export interface SeedGameConfig {
  playerCount: number
  targetPhase: 'waiting' | 'reading' | 'voting' | 'reveal' | 'end'
  deckType?: string
  roundCount?: number
}

export interface SeedGameResult {
  code: string
  credentials: PlayerCredentials[]
}

const PLAYER_CREDENTIALS_KEY = 'bsking-player'

export function getBaseUrl(): string {
  return process.env.BASE_URL || 'http://localhost:3000'
}

export async function newPage(): Promise<Page> {
  await ensureBrowser()
  const browser = getBrowser()
  const page = await browser.newPage()
  await page.setViewport({ width: 375, height: 812 })
  return page
}

export async function ensureAppOrigin(page: Page): Promise<void> {
  const currentUrl = page.url()
  if (!currentUrl || currentUrl === 'about:blank') {
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    return
  }

  try {
    const currentOrigin = new URL(currentUrl).origin
    const appOrigin = new URL(getBaseUrl()).origin
    if (currentOrigin !== appOrigin) {
      await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
    }
  } catch {
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
  }
}

async function getPageTextSnippet(page: Page): Promise<string> {
  try {
    const text = await page.evaluate(() => document.body?.innerText ?? '')
    return text.replace(/\s+/g, ' ').trim().slice(0, 240)
  } catch {
    return '<page text unavailable>'
  }
}

async function buildPageError(page: Page, message: string): Promise<Error> {
  const url = page.url() || '<unknown>'
  const snippet = await getPageTextSnippet(page)
  return new Error(`${message}\nURL: ${url}\nVisible text: ${snippet}`)
}

async function findButtonByText(
  page: Page,
  text: string
): Promise<ElementHandle<HTMLButtonElement> | null> {
  const buttons = await page.$$('button')
  for (const button of buttons) {
    const buttonText = await button.evaluate((node) =>
      (node.textContent || '').replace(/\s+/g, ' ').trim()
    )
    if (buttonText.includes(text)) {
      return button as ElementHandle<HTMLButtonElement>
    }
  }

  return null
}

async function findEnabledButtonByText(
  page: Page,
  text: string
): Promise<ElementHandle<HTMLButtonElement> | null> {
  const buttons = await page.$$('button')
  for (const button of buttons) {
    const match = await button.evaluate((node, expectedText) => {
      const buttonNode = node as HTMLButtonElement
      const buttonText = (buttonNode.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
      return buttonText.includes(expectedText) && !buttonNode.disabled
    }, text)

    if (match) {
      return button as ElementHandle<HTMLButtonElement>
    }
  }

  return null
}

export async function clickButtonByText(
  page: Page,
  text: string,
  options?: { requireEnabled?: boolean }
): Promise<void> {
  const finder = options?.requireEnabled
    ? findEnabledButtonByText
    : findButtonByText
  const button = await finder(page, text)
  if (!button) {
    throw await buildPageError(page, `Could not find button containing "${text}"`)
  }

  await button.click()
}

export async function waitForPath(
  page: Page,
  pathFragment: string,
  timeoutMs = 15000
): Promise<void> {
  await page.waitForFunction(
    (fragment: string) => {
      const pathname = window.location.pathname
      return fragment === '/' ? pathname === '/' : pathname.includes(fragment)
    },
    { timeout: timeoutMs },
    pathFragment
  )
}

export async function waitForText(
  page: Page,
  text: string,
  timeoutMs = 15000
): Promise<void> {
  await page.waitForFunction(
    (expectedText: string) => {
      const bodyText = document.body?.innerText ?? ''
      return bodyText.includes(expectedText)
    },
    { timeout: timeoutMs },
    text
  )
}

async function waitForButtonEnabled(
  page: Page,
  text: string,
  timeoutMs = 15000
): Promise<void> {
  await page.waitForFunction(
    (expectedText: string) => {
      const buttons = Array.from(document.querySelectorAll('button'))
      return buttons.some((button) => {
        const buttonText = (button.textContent || '').replace(/\s+/g, ' ').trim()
        return buttonText.includes(expectedText) && !(button as HTMLButtonElement).disabled
      })
    },
    { timeout: timeoutMs },
    text
  )
}

export async function waitForPlayerCount(
  page: Page,
  count: number,
  timeoutMs = 15000
): Promise<void> {
  await waitForText(page, `Players (${count})`, timeoutMs)
}

export async function setPlayerCredentials(
  page: Page,
  creds: PlayerCredentials
): Promise<void> {
  await ensureAppOrigin(page)
  await page.evaluate(
    ([key, credentials]) => {
      localStorage.setItem(key, JSON.stringify(credentials))
    },
    [PLAYER_CREDENTIALS_KEY, creds] as const
  )
}

export async function clearPlayerCredentials(page: Page): Promise<void> {
  await ensureAppOrigin(page)
  await page.evaluate((key) => localStorage.removeItem(key), PLAYER_CREDENTIALS_KEY)
}

export async function getLocalStorage(
  page: Page,
  key: string
): Promise<string | null> {
  await ensureAppOrigin(page)
  return page.evaluate((storageKey) => localStorage.getItem(storageKey), key)
}

export async function getPlayerCredentials(
  page: Page
): Promise<PlayerCredentials | null> {
  await ensureAppOrigin(page)
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as {
        roomCode: string
        playerId: string
        playerSecret: string
      }
    } catch {
      return null
    }
  }, PLAYER_CREDENTIALS_KEY)
}

export async function getRoomCodeFromPath(page: Page): Promise<string> {
  const pathname = await page.evaluate(() => window.location.pathname)
  const match = pathname.match(/\/game\/([A-Z0-9]+)/)
  if (!match) throw await buildPageError(page, 'Could not extract room code from URL')
  return match[1]
}

async function waitForRegistrationForm(page: Page): Promise<void> {
  await page.waitForSelector('input[placeholder="Your name"]', {
    timeout: 10000,
  })
  await page.waitForSelector('button[type="submit"]', {
    timeout: 10000,
  })
}

/**
 * Navigate to the lobby page and click "Create Room".
 * Waits for the client-side router redirect to /game/[code]/register.
 */
export async function createRoom(page: Page): Promise<CreateRoomResult> {
  await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
  await clickButtonByText(page, 'Create Room', { requireEnabled: true })
  await waitForPath(page, '/register')
  await waitForRegistrationForm(page)

  const creds = await getPlayerCredentials(page)
  if (!creds) {
    throw await buildPageError(
      page,
      'No credentials after createRoom; auto-join may have failed'
    )
  }

  return { code: creds.roomCode, roomId: '', credentials: creds }
}

/**
 * Navigate to lobby, enter room code, click Join.
 * Waits for redirect to /game/[code]/register.
 */
export async function joinRoom(
  page: Page,
  code: string
): Promise<PlayerCredentials> {
  await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
  await page.waitForSelector('input[placeholder="Enter Room Code"]')
  await page.click('input[placeholder="Enter Room Code"]', { clickCount: 3 })
  await page.type('input[placeholder="Enter Room Code"]', code)
  await clickButtonByText(page, 'Join', { requireEnabled: true })
  await waitForPath(page, `/game/${code}/register`)
  await waitForRegistrationForm(page)

  await page.waitForFunction(
    (key: string) => {
      const raw = localStorage.getItem(key)
      if (!raw) return false
      try {
        const creds = JSON.parse(raw)
        return Boolean(creds.playerId && creds.playerSecret)
      } catch {
        return false
      }
    },
    { timeout: 10000 },
    PLAYER_CREDENTIALS_KEY
  )

  const creds = await getPlayerCredentials(page)
  if (!creds) {
    throw await buildPageError(page, 'Failed to get player credentials after join')
  }

  return creds
}

/**
 * Fill in name and submit registration form.
 * Waits for redirect to waiting room.
 */
export async function registerPlayer(
  page: Page,
  code: string,
  name: string
): Promise<void> {
  await waitForRegistrationForm(page)
  await page.click('input[placeholder="Your name"]', { clickCount: 3 })
  await page.type('input[placeholder="Your name"]', name)
  await clickButtonByText(page, 'Join Game', { requireEnabled: true })
  await waitForPath(page, `/game/${code}/waiting`)
  await waitForText(page, 'Waiting Room')
  await waitForText(page, name)
}

/**
 * Click "Start Game" button on waiting room.
 */
export async function startGame(page: Page, code: string): Promise<void> {
  await waitForPath(page, `/game/${code}/waiting`)
  await waitForPlayerCount(page, 3)
  await waitForButtonEnabled(page, 'Start Game')
  await clickButtonByText(page, 'Start Game', { requireEnabled: true })
  await waitForPath(page, `/game/${code}/reading`)
}

export async function submitVote(
  page: Page,
  playerName: string
): Promise<void> {
  const voteButtons = await page.$$('button')

  for (const button of voteButtons) {
    const shouldClick = await button.evaluate((node, expectedName) => {
      const buttonText = (node.textContent || '').replace(/\s+/g, ' ').trim()
      return buttonText.includes(expectedName)
    }, playerName)

    if (shouldClick) {
      await button.click()
      return
    }
  }

  throw await buildPageError(page, `Could not find vote button for player "${playerName}"`)
}

/**
 * Click the "Ready to Vote" or "Next Round" or vote button,
 * depending on the current phase.
 */
export async function submitMove(
  page: Page,
  code: string,
  moveType: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (moveType === 'ready_to_vote') {
    await clickButtonByText(page, 'Ready to Vote', { requireEnabled: true })
    await page.waitForFunction(
      (roomCode: string) => {
        const path = window.location.pathname
        return (
          path.includes(`/game/${roomCode}/voting`) ||
          document.body?.innerText.includes('Ready! Waiting for phase to advance...') ||
          document.body?.innerText.includes('Voting Time')
        )
      },
      { timeout: 15000 },
      code
    )
    return
  }

  if (moveType === 'cast_vote') {
    const targetPlayerName = data?.targetPlayerName
    if (typeof targetPlayerName !== 'string' || targetPlayerName.length === 0) {
      throw new Error('submitMove cast_vote requires data.targetPlayerName')
    }

    await submitVote(page, targetPlayerName)
    await page.waitForFunction(
      () => {
        const bodyText = document.body?.innerText ?? ''
        return (
          bodyText.includes('You voted for') ||
          bodyText.includes('Waiting for phase to advance...')
        )
      },
      { timeout: 15000 }
    )
    return
  }

  if (moveType === 'next_round') {
    const previousPath = await page.evaluate(() => window.location.pathname)
    await clickButtonByText(page, 'Next Round', { requireEnabled: true })
    await page.waitForFunction(
      (pathBeforeClick: string) => window.location.pathname !== pathBeforeClick,
      { timeout: 15000 },
      previousPath
    )
    return
  }

  throw new Error(`Unsupported moveType: ${moveType}`)
}

export async function waitForPhase(
  page: Page,
  phase: string,
  timeoutMs = 15000
): Promise<void> {
  await waitForPath(page, phase, timeoutMs)
}

/**
 * Convenience: full player setup flow — create room, wait for auto-join,
 * register name, and return room code + credentials.
 */
export async function setupPlayer(
  page: Page,
  playerName: string
): Promise<{ code: string; credentials: PlayerCredentials }> {
  await clearPlayerCredentials(page)
  const result = await createRoom(page)
  await registerPlayer(page, result.code, playerName)
  return { code: result.code, credentials: result.credentials }
}
