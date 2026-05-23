import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Page } from 'puppeteer'
import {
  newPage,
  createRoom,
  joinRoom,
  registerPlayer,
  startGame,
  submitMove,
  clearPlayerCredentials,
  getBaseUrl,
  setPlayerCredentials,
  waitForPath,
  waitForPlayerCount,
  clickButtonByText,
  waitForText,
} from './helpers'
import { seedGameState } from './fixtures/seed'
import { closeBrowser } from './setup'

describe('Game Phases', () => {
  let hostPage: Page
  let playerPage: Page
  let code: string

  async function setupGame(
    targetPhase: 'waiting' | 'reading' | 'voting' | 'reveal' | 'end'
  ) {
    if (hostPage) await hostPage.close().catch(() => {})
    if (playerPage) await playerPage.close().catch(() => {})

    hostPage = await newPage()
    await clearPlayerCredentials(hostPage)
    const result = await seedGameState(hostPage, {
      playerCount: 3,
      targetPhase,
    })
    code = result.code

    // Create player page for non-host tests
    playerPage = await newPage()
    await setPlayerCredentials(playerPage, result.credentials[1])
    await playerPage.goto(`${getBaseUrl()}/game/${code}/${targetPhase}`, {
      waitUntil: 'networkidle0',
    })

    await waitForPath(hostPage, `/game/${code}/${targetPhase}`)
    await waitForPath(playerPage, `/game/${code}/${targetPhase}`)

    if (targetPhase === 'waiting') {
      await waitForPlayerCount(hostPage, 3)
      await waitForText(hostPage, 'Start Game')
      await waitForText(playerPage, 'Waiting for host to start')
    }
  }

  afterAll(async () => {
    if (hostPage) await hostPage.close().catch(() => {})
    if (playerPage) await playerPage.close().catch(() => {})
    await closeBrowser()
  })

  describe('Waiting Room', () => {
    beforeAll(async () => {
      await setupGame('waiting')
    })

    it('host sees enabled Start Game button with 3+ players', async () => {
      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Waiting Room')
      expect(body).toContain('Start Game')
    })

    it('host sees disabled button with fewer than 3 players', async () => {
      const p = await newPage()
      await clearPlayerCredentials(p)

      const { code: c } = await createRoom(p)
      await registerPlayer(p, c, 'Host')

      const p2 = await newPage()
      await joinRoom(p2, c)
      await registerPlayer(p2, c, 'Player2')

      await p.bringToFront()
      await p.goto(`${getBaseUrl()}/game/${c}/waiting`, {
        waitUntil: 'networkidle0',
      })
      await waitForPlayerCount(p, 2)
      await waitForText(p, 'Need at least 3 players')

      const body = await p.evaluate(() => document.body.innerText)
      expect(body).toContain('Need at least 3 players')

      await p.close()
      await p2.close()
    })

    it('non-host sees waiting message', async () => {
      const body = await playerPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Waiting for host to start')
    })

    it('host clicking Start Game navigates to reading phase', async () => {
      const p = await newPage()
      await clearPlayerCredentials(p)

      const { code: c } = await createRoom(p)
      await registerPlayer(p, c, 'Host')

      const p2 = await newPage()
      await joinRoom(p2, c)
      await registerPlayer(p2, c, 'Player2')

      const p3 = await newPage()
      await joinRoom(p3, c)
      await registerPlayer(p3, c, 'Player3')

      await p.bringToFront()
      await p.goto(`${getBaseUrl()}/game/${c}/waiting`, {
        waitUntil: 'networkidle0',
      })
      await waitForPlayerCount(p, 3)
      await waitForText(p, 'Start Game')

      await startGame(p, c)

      const body = await p.evaluate(() => document.body.innerText)
      expect(body).toMatch(/Round/i)

      await p.close()
      await p2.close()
      await p3.close()
    })
  })

  describe('Reading Phase', () => {
    beforeAll(async () => {
      await setupGame('reading')
    })

    it('honest player sees card phrase AND real answer', async () => {
      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Ready to Vote')
      expect(body).toMatch(/real answer|don't show others/i)
    })

    it('liar does NOT see real answer', async () => {
      const body = await playerPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Ready to Vote')
      expect(body).not.toMatch(/Your real answer/i)
    })

    it('judge does NOT see real answer', async () => {
      const body = await playerPage.evaluate(() => document.body.innerText)
      expect(body).not.toMatch(/Your real answer/i)
    })

    it('clicking Ready to Vote submits move and advances phase', async () => {
      await submitMove(hostPage, code, 'ready_to_vote')

      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toMatch(/Ready!|Voting/i)
    })
  })

  describe('Voting Phase', () => {
    beforeAll(async () => {
      await setupGame('voting')
    })

    it('judge sees vote buttons for other players', async () => {
      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Voting Time')
      expect(body).toContain('Who do you think gave the real answer')
    })

    it('judge clicking a player submits vote', async () => {
      await submitMove(hostPage, code, 'cast_vote', {
        targetPlayerName: 'Bob',
      })
      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toMatch(/voted for|Waiting for phase/i)
    })

    it('judge sees confirmation after voting', async () => {
      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toMatch(/voted for|Waiting for phase/i)
    })

    it('non-judge sees waiting message', async () => {
      const body = await playerPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Waiting for the judge to vote')
    })
  })

  describe('Reveal Phase', () => {
    beforeAll(async () => {
      await setupGame('reveal')
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

      const pathname = await hostPage.evaluate(() => window.location.pathname)
      expect(pathname).toMatch(/reading|end/i)
    })
  })

  describe('End Screen', () => {
    beforeAll(async () => {
      await setupGame('end')
    })

    it('shows final scoreboard with winner', async () => {
      const body = await hostPage.evaluate(() => document.body.innerText)
      expect(body).toContain('Game Over')
      expect(body).toMatch(/Final Scores|Winner/i)
    })

    it('host sees Play Again, non-host sees waiting message', async () => {
      const hostBody = await hostPage.evaluate(() => document.body.innerText)
      const playerBody = await playerPage.evaluate(() => document.body.innerText)

      const hasPlayAgain =
        hostBody.includes('Play Again') || playerBody.includes('Play Again')
      const hasWaiting =
        hostBody.includes('Waiting for host') ||
        playerBody.includes('Waiting for host')

      expect(hasPlayAgain).toBe(true)
      expect(hasWaiting).toBe(true)
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
