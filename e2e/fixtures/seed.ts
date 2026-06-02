import { Page } from 'puppeteer'
import {
  createRoom,
  joinRoom,
  registerPlayer,
  startGame,
  submitMove,
  PlayerCredentials,
  getBaseUrl,
  ensureAppOrigin,
  newPage,
  setPlayerCredentials,
  waitForPath,
} from '../helpers'

interface RoomState {
  players: Array<{
    id: string
    role: string | null
  }>
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
  page: Page
}

const PLAYER_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank']

async function fetchRoomState(page: Page, roomCode: string): Promise<RoomState> {
  return page.evaluate(async (currentCode) => {
    const res = await fetch(`/api/rooms/${currentCode}`)
    if (!res.ok) {
      throw new Error(`Failed to fetch room ${currentCode}: ${res.status}`)
    }
    return res.json() as Promise<RoomState>
  }, roomCode)
}

async function getJudgePage(pages: Page[], credentials: PlayerCredentials[], roomCode: string): Promise<Page> {
  const room = await fetchRoomState(pages[0], roomCode)
  const judge = room.players.find((player) => player.role === 'judge')

  if (!judge) {
    throw new Error(`Seeded room ${roomCode} has no judge`)
  }

  const judgeIndex = credentials.findIndex((creds) => creds.playerId === judge.id)
  if (judgeIndex === -1 || !pages[judgeIndex]) {
    throw new Error(`Seeded room ${roomCode} has no browser page for judge`)
  }

  return pages[judgeIndex]
}

export async function seedGameState(
  page0: Page,
  config: SeedGameConfig
): Promise<SeedGameResult> {
  const { playerCount, targetPhase } = config
  if (playerCount < 3) {
    throw new Error('Need at least 3 players to seed a game')
  }

  // Step 1: Create room (player 0)
  const roomResult = await createRoom(page0)
  const code = roomResult.code
  const credentials: PlayerCredentials[] = []

  // Step 2: Join + register all players using their own browser pages
  // Player 0 — already joined via createRoom, page0 is already on /register
  credentials.push(roomResult.credentials)
  await registerPlayer(page0, code, PLAYER_NAMES[0])

  // Players 1..N-1
  const pages: Page[] = [page0]

  for (let i = 1; i < playerCount; i++) {
    const p = await newPage()
    pages.push(p)

    const creds = await joinRoom(p, code)
    credentials.push(creds)
    await registerPlayer(p, code, PLAYER_NAMES[i] || `Player${i}`)
  }

  // If target is waiting, stop here
  if (targetPhase === 'waiting') {
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close()
    }
    return { code, credentials, page: page0 }
  }

  // Step 3: Start game
  await startGame(page0, code)

  if (targetPhase === 'reading') {
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close()
    }
    return { code, credentials, page: page0 }
  }

  // Step 4: Advance to voting
  const judgePage = await getJudgePage(pages, credentials, code)
  await submitMove(judgePage, code, 'ready_to_vote')
  await waitForPath(judgePage, `/game/${code}/voting`, 10000)

  if (targetPhase === 'voting') {
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close()
    }
    return { code, credentials, page: page0 }
  }

  // Step 5: Advance to reveal
  await submitMove(page0, code, 'cast_vote', {
    targetPlayerName: PLAYER_NAMES[1] || PLAYER_NAMES[0],
  })
  await waitForPath(page0, `/game/${code}/reveal`, 10000)

  if (targetPhase === 'reveal') {
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close()
    }
    return { code, credentials, page: page0 }
  }

  // Step 6: Cycle through rounds to reach 'end'
  const roundsToPlay = config.roundCount || 10
  for (let r = 1; r < roundsToPlay; r++) {
    const isLastRound = r === roundsToPlay - 1

    await submitMove(page0, code, 'next_round')

    if (isLastRound) {
      await page0.waitForFunction(
        (c: string) => window.location.pathname.includes(`/game/${c}/end`),
        { timeout: 10000 },
        code
      )
    } else {
      await page0.waitForFunction(
        (c: string) => window.location.pathname.includes(`/game/${c}/reading`),
        { timeout: 10000 },
        code
      )
      const activeJudgePage = await getJudgePage(pages, credentials, code)
      await submitMove(activeJudgePage, code, 'ready_to_vote')
      await waitForPath(activeJudgePage, `/game/${code}/voting`, 10000)
      await submitMove(page0, code, 'cast_vote', {
        targetPlayerName: PLAYER_NAMES[1] || PLAYER_NAMES[0],
      })
      await waitForPath(page0, `/game/${code}/reveal`, 10000)
    }
  }

  for (let i = 1; i < pages.length; i++) {
    await pages[i].close()
  }
  return { code, credentials, page: page0 }
}

export async function seedGameViaEndpoint(
  page: Page,
  config: SeedGameConfig
): Promise<SeedGameResult> {
  const baseUrl = getBaseUrl()
  await ensureAppOrigin(page)

  const result = await page.evaluate(
    async (url, cfg) => {
      const res = await fetch(`${url}/api/test/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: cfg.targetPhase,
          playerCount: cfg.playerCount,
          deckType: cfg.deckType,
          roundCount: cfg.roundCount,
        }),
      })
      if (!res.ok) {
        throw new Error(`Seed endpoint failed: ${res.status}`)
      }
      return res.json() as Promise<{
        code: string
        credentials: PlayerCredentials[]
      }>
    },
    baseUrl,
    config
  )

  await setPlayerCredentials(page, result.credentials[0])

  await page.goto(`${baseUrl}/game/${result.code}`, {
    waitUntil: 'networkidle0',
  })

  return {
    code: result.code,
    credentials: result.credentials,
    page,
  }
}
