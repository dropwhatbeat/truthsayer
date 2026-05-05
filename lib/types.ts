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

export type GamePhase = 'waiting' | 'reading' | 'discuss' | 'reveal'
