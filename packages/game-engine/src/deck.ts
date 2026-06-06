import type { Card, DeckType } from './types'
import { GAME_DECK } from './decks/absurdTruthsDeck'
import { CHINESE_SAYINGS_DECK } from './decks/chineseSayingsDeck'
import { MEDICAL_DECK } from './decks/medicalDeck'

export interface DeckMetadata {
  label: string
  description: string
}

export const DECK_METADATA: Record<DeckType, DeckMetadata> = {
  'absurd-truths': {
    label: 'Bullshit Factory',
    description: 'Real words that sound completely fake — manufacture the most convincing BS.',
  },
  'chinese-sayings': {
    label: 'Chinese 成语',
    description: 'Four characters hiding a thousand years of chaos.',
  },
  medical: {
    label: 'Medical',
    description: 'Body facts, clinical jargon, and suspiciously confident health nonsense.',
  },
}

export const DECK_TYPES = Object.keys(DECK_METADATA) as DeckType[]

export function isDeckType(value: unknown): value is DeckType {
  return typeof value === 'string' && value in DECK_METADATA
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getDeckByType(type: DeckType): Card[] {
  if (type === 'chinese-sayings') return CHINESE_SAYINGS_DECK
  if (type === 'medical') return MEDICAL_DECK
  return GAME_DECK
}

export function prepareDeck(type: DeckType, roundCount: number): Card[] {
  return shuffle(getDeckByType(type)).slice(0, roundCount)
}
