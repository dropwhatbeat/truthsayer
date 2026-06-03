// ── Card / Deck types ───────────────────────────────────────────────────────
export interface Category {
  emoji: string
  label: string
}

export interface Card {
  phrase: string
  categories?: [Category, Category, Category]
  answer: string
}

export type DeckType = 'absurd-truths' | 'chinese-sayings' | 'medical'

export type GamePhase = 'waiting' | 'reading' | 'discuss' | 'reveal' | 'complete'

// ── Multiplayer types ───────────────────────────────────────────────────────
export type Role = 'judge' | 'honest' | 'liar'

export interface Player {
  id: string
  name: string | null
  role: Role | null
  roomId: string
}

export type RoomStatus = 'lobby' | 'playing' | 'finished'

export interface GameConfig {
  rounds: number
  timerSecs: number
  deckType: DeckType
}

// ── XState machine types ────────────────────────────────────────────────────
export interface GameContext {
  deckType: DeckType
  roundCount: number
  timerSecs: number
  players: Player[]
  currentRoundIndex: number
  deck: Card[]
  timeLeft: number
}

export type GameEvent =
  | { type: 'START'; deckType: DeckType; roundCount: number; timerSecs: number }
  | { type: 'PREPARE_DECK' }
  | { type: 'END' }
  | { type: 'RESET' }
  | { type: 'SHOW_SECRET' }
  | { type: 'TIMER_END' }
  | { type: 'SKIP_TIMER' }
  | { type: 'TICK' }
  | { type: 'REVEAL_ALL' }
  | { type: 'NEXT_CARD' }
  | { type: 'BACK' }

export interface RoundContext {
  card: Card | null
  timeLeft: number
  timerSecs: number
  roundIndex: number
}

export type RoundEvent =
  | { type: 'SHOW_SECRET' }
  | { type: 'TIMER_END' }
  | { type: 'SKIP_TIMER' }
  | { type: 'TICK' }
  | { type: 'REVEAL_ALL' }
  | { type: 'NEXT_CARD' }
  | { type: 'BACK' }
