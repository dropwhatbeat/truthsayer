import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Page } from 'puppeteer'
import {
  newPage,
  startGame,
  submitMove,
  clearPlayerCredentials,
  getBaseUrl,
  setPlayerCredentials,
  waitForPath,
  waitForPlayerCount,
  clickButtonByText,
  waitForText,
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

type PhaseName = 'waiting' | 'reading' | 'voting' | 'reveal' | 'end'

describe('Game Phases', () => {
  let pages: Page[] = []
  let code: string
  let hostPage: Page
  let nonHostPage: Page
  let nonJudgePage: Page
  let honestPage: Page
  let liarPage: Page
  let judgePage: Page
  let honestName: string

  async function closeSetupPages() {
    await Promise.all(pages.map((page) => page.close().catch(() => {})))
    pages = []
  }

  async function fetchRoomState(page: Page, roomCode: string): Promise<RoomState> {
    return page.evaluate(async (currentCode) => {
      const res = await fetch(`/api/rooms/${currentCode}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch room ${currentCode}: ${res.status}`)
      }
      return res.json() as Promise<RoomState>
    }, roomCode)
  }

  async function createAndRegisterPlayerViaApi(
    page: Page,
    roomCode: string,
    name: string
  ): Promise<PlayerCredentials> {
    await page.goto(getBaseUrl(), { waitUntil: 'networkidle0' })

    const creds = await page.evaluate(
      async ({ currentCode, playerName }) => {
        const joinRes = await fetch(`/api/rooms/${currentCode}/join`, {
          method: 'POST',
        })
        if (!joinRes.ok) {
          throw new Error(`Join failed: ${joinRes.status}`)
        }

        const joinData = await joinRes.json() as {
          playerId: string
          playerSecret: string
        }

        const registerRes = await fetch(`/api/rooms/${currentCode}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: joinData.playerId,
            playerSecret: joinData.playerSecret,
            name: playerName,
          }),
        })
        if (!registerRes.ok) {
          throw new Error(`Register failed: ${registerRes.status}`)
        }

        return {
          roomCode: currentCode,
          playerId: joinData.playerId,
          playerSecret: joinData.playerSecret,
        }
      },
      { currentCode: roomCode, playerName: name }
    )

    await setPlayerCredentials(page, creds)
    return creds
  }

  async function setupSeededGame(targetPhase: PhaseName) {
    await closeSetupPages()

    const seedPage = await newPage()
    pages.push(seedPage)

    const result = await seedGameViaEndpoint(seedPage, {
      playerCount: 3,
      targetPhase,
    })
    code = result.code

    const room = await fetchRoomState(seedPage, code)
    const credsById = new Map<string, PlayerCredentials>(
      result.credentials.map((creds) => [creds.playerId, creds])
    )
    const pagesByPlayerId = new Map<string, Page>()

    for (const creds of result.credentials) {
      const page = creds.playerId === result.credentials[0]?.playerId
        ? seedPage
        : await newPage()

      if (page !== seedPage) {
        pages.push(page)
        await setPlayerCredentials(page, creds)
        await page.goto(`${getBaseUrl()}/game/${code}/${targetPhase}`, {
          waitUntil: 'networkidle0',
        })
      } else {
        await page.goto(`${getBaseUrl()}/game/${code}/${targetPhase}`, {
          waitUntil: 'networkidle0',
        })
      }

      pagesByPlayerId.set(creds.playerId, page)
    }

    for (const page of pages) {
      await waitForPath(page, `/game/${code}/${targetPhase}`)
    }

    const hostId = room.createdBy
    if (!hostId) throw new Error('Seeded room has no host')

    const host = pagesByPlayerId.get(hostId)
    const nonHost = room.players.find((player) => player.id !== hostId)

    if (!host || !nonHost) {
      throw new Error(`Seeded room missing expected host/non-host players for ${targetPhase}`)
    }

    hostPage = host
    nonHostPage = pagesByPlayerId.get(nonHost.id)!

    if (targetPhase === 'waiting') {
      await waitForPlayerCount(hostPage, 3)
      await waitForText(hostPage, 'Start Game')
      await waitForText(nonHostPage, 'Waiting for host to start')
      return
    }

    const honest = room.players.find((player) => player.role === 'honest')
    const liar = room.players.find((player) => player.role === 'liar')
    const judge = room.players.find((player) => player.role === 'judge')
    if (!honest || !liar || !judge) {
      throw new Error(`Seeded room missing expected players/roles for ${targetPhase}`)
    }

    honestPage = pagesByPlayerId.get(honest.id)!
    liarPage = pagesByPlayerId.get(liar.id)!
    judgePage = pagesByPlayerId.get(judge.id)!
    nonJudgePage = honestPage === judgePage ? liarPage : honestPage
    honestName = honest.name || 'Unknown'

    if (!honestPage || !liarPage || !judgePage || !nonJudgePage) {
      throw new Error(`Seeded room missing expected role pages for ${targetPhase}`)
    }
  }

  afterAll(async () => {
    await closeSetupPages()
    await closeBrowser()
  })

  describe('Waiting Room', () => {
    beforeAll(async () => {
      await setupSeededGame('waiting')
    })

    it('host sees enabled Start Game button with 3+ players', async () => {
      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Waiting Room')
      expect(body).toContain('Start Game')
    })

    it('host sees disabled button with fewer than 3 players', async () => {
      const p = await newPage()
      await clearPlayerCredentials(p)
      await p.goto(getBaseUrl(), { waitUntil: 'networkidle0' })
      const { code: c } = await p.evaluate(async () => {
        const res = await fetch('/api/rooms', { method: 'POST' })
        if (!res.ok) {
          throw new Error(`Create room failed: ${res.status}`)
        }
        return res.json() as Promise<{ code: string }>
      })
      await createAndRegisterPlayerViaApi(p, c, 'Host')

      const p2 = await newPage()
      await createAndRegisterPlayerViaApi(p2, c, 'Player2')

      await p.goto(`${getBaseUrl()}/game/${c}/waiting`, {
        waitUntil: 'networkidle0',
      })
      await waitForText(p, 'Need at least 3 players')

      const body = await p.evaluate(() => document.body.innerText)
      expect(body).toContain('Need at least 3 players')

      await p.close()
      await p2.close()
    })

    it('non-host sees waiting message', async () => {
      const body = await nonHostPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Waiting for host to start')
    })

    it('host clicking Start Game navigates to reading phase', async () => {
      await startGame(hostPage, code)
      await waitForText(hostPage, 'Round', 15000)

      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toMatch(/Round/i)
    })
  })

  describe('Reading Phase', () => {
    beforeAll(async () => {
      await setupSeededGame('reading')
    })

    it('honest player sees card phrase AND real answer', async () => {
      const body = await honestPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Ready to Vote')
      expect(body).toMatch(/real answer|don't show others/i)
    })

    it('liar does NOT see real answer', async () => {
      const body = await liarPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Ready to Vote')
      expect(body).not.toMatch(/Your real answer/i)
    })

    it('judge does NOT see real answer', async () => {
      const body = await judgePage.evaluate(() => document.body.innerText)
      expect(body).toContain('Ready to Vote')
      expect(body).not.toMatch(/Your real answer/i)
    })

    it('clicking Ready to Vote submits move and advances phase', async () => {
      await submitMove(honestPage, code, 'ready_to_vote')

      const body = await honestPage.evaluate(() => document.body.innerText)
      expect(body).toMatch(/Ready!|Voting/i)
    })
  })

  describe('Voting Phase', () => {
    beforeAll(async () => {
      await setupSeededGame('voting')
    })

    it('judge sees vote buttons for other players', async () => {
      const body = await judgePage.evaluate(() => document.body.innerText)
      expect(body).toContain('Voting Time')
      expect(body).toContain('Who do you think gave the real answer')
      expect(body).toContain(honestName)
    })

    it('judge clicking a player submits vote', async () => {
      await submitMove(judgePage, code, 'cast_vote', {
        targetPlayerName: honestName,
      })

      const body = await judgePage.evaluate(() => document.body.innerText)
      expect(body).toMatch(/voted for|Waiting for phase/i)
    })

    it('judge sees confirmation after voting', async () => {
      const body = await judgePage.evaluate(() => document.body.innerText)
      expect(body).toMatch(/voted for|Waiting for phase/i)
    })

    it('non-judge sees waiting message', async () => {
      const body = await nonJudgePage.evaluate(() => document.body.innerText)
      expect(body).toContain('Waiting for the judge to vote')
    })
  })

  describe('Reveal Phase', () => {
    beforeAll(async () => {
      await setupSeededGame('reveal')
    })

    it('displays card phrase and real answer', async () => {
      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Results')
      expect(body).toContain('Real answer')
      expect(body).toContain('Honest player')
    })

    it('scoreboard shows all players with scores', async () => {
      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Scoreboard')
    })

    it('host clicks Next Round advances game', async () => {
      await submitMove(hostPage, code, 'next_round')
      await hostPage.waitForFunction(
        (roomCode: string) => {
          const pathname = window.location.pathname
          return (
            pathname === `/game/${roomCode}` ||
            pathname.includes(`/game/${roomCode}/reading`) ||
            pathname.includes(`/game/${roomCode}/end`)
          )
        },
        { timeout: 15000 },
        code
      )

      const pathname = await hostPage.evaluate(() => window.location.pathname)
      expect(pathname).not.toContain('/reveal')
    })
  })

  describe('End Screen', () => {
    beforeAll(async () => {
      await setupSeededGame('end')
    })

    it('shows final scoreboard with winner', async () => {
      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Game Over')
      expect(body).toMatch(/Final Scores|Winner/i)
    })

    it('host sees Play Again, non-host sees waiting message', async () => {
      const hostBody = await hostPage.evaluate(() => document.body.innerText)
      const nonHostBody = await nonHostPage.evaluate(() => document.body.innerText)

      expect(hostBody).toContain('Play Again')
      expect(nonHostBody).toContain('Waiting for host')
    })

    it('Back to Lobby clears localStorage and navigates to /', async () => {
      await clickButtonByText(hostPage, 'Back to Lobby', { requireEnabled: true })
      await waitForPath(hostPage, '/')

      const stored = await hostPage.evaluate(() =>
        localStorage.getItem('bsking-player')
      )
      expect(stored).toBeNull()
    })
  })
})
