import type { Card, DeckType } from '@/lib/types'
import { GAME_DECK } from '@/data/absurdTruthsDeck'
import { CHINESE_SAYINGS_DECK } from '@/data/chineseSayingsDeck'
import { MEDICAL_DECK } from '@/data/medicalDeck'

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
