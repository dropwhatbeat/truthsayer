# Absurd Truths

A party bluffing game for 6–8 players. One person guesses. Everyone else lies — except the Truthsayer.

## How to play

1. **Pick a guesser** — one player closes their eyes for the whole round.
2. **See the prompt** — a weird word or phrase is shown to everyone, along with a few category hints to spark ideas.
3. **The Truthsayer peeks** — everyone closes their eyes. One designated Truthsayer opens their eyes and reads the real answer silently.
4. **Bluff time** — each player (including the Truthsayer) takes turns giving the guesser an explanation of the word. The Truthsayer tells the truth; everyone else makes something up.
5. **The guess** — the guesser picks who they believe. Points, chaos, laughter.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [Caveat](https://fonts.google.com/specimen/Caveat) + [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts

## Testing

### Unit Tests

```bash
# Start PostgreSQL, then run Vitest
npm test
```

### E2E Tests (Puppeteer)

Prerequisites:
- Node.js 18+
- PostgreSQL running (`docker compose up -d`)
- Database migrated (`npm run db:migrate`)
- Dev server running (`npm run dev`)

```bash
# Run headless (default)
BASE_URL=http://localhost:3000 npm run test:e2e

# Run with visible browser for debugging
HEADED=true npm run test:e2e:headed
```

Environment variables:
- `BASE_URL` — App URL (default: `http://localhost:3000`)
- `HEADED` — Set to `true` to show the browser window
- `DATABASE_URL` — PostgreSQL connection string (from `.env`)

Test files are in `e2e/` and organized by feature:
- `e2e/helpers.ts` — Shared browser utilities and API wrappers
- `e2e/fixtures/seed.ts` — Game state seeding for deterministic tests
- `e2e/lobby-join.test.ts` — Lobby, room creation, and registration
- `e2e/game-phases.test.ts` — Full game lifecycle (waiting through end screen)
- `e2e/reconnect.test.ts` — Session reconnection and phase redirects
- `e2e/error-paths.test.ts` — Error handling and edge cases
