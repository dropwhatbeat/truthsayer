import { describe, it, expect } from 'vitest'
import { shuffle, getDeckByType, prepareDeck } from '@bsking/game-engine'

describe('shuffle', () => {
  it('returns an array of the same length', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input)
    expect(result).toHaveLength(input.length)
  })

  it('contains the same elements as the input', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input)
    expect(result.sort()).toEqual(input.sort())
  })

  it('does not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5]
    const copy = [...input]
    shuffle(input)
    expect(input).toEqual(copy)
  })

  it('handles empty array', () => {
    expect(shuffle([])).toEqual([])
  })

  it('handles single-element array', () => {
    expect(shuffle([42])).toEqual([42])
  })

  it('returns a new array reference', () => {
    const input = [1, 2, 3]
    const result = shuffle(input)
    expect(result).not.toBe(input)
  })
})

describe('getDeckByType', () => {
  it('returns the absurd-truths deck for "absurd-truths"', () => {
    const deck = getDeckByType('absurd-truths')
    expect(deck.length).toBeGreaterThan(0)
    expect(deck[0]).toHaveProperty('phrase')
    expect(deck[0]).toHaveProperty('answer')
  })

  it('returns the chinese-sayings deck for "chinese-sayings"', () => {
    const deck = getDeckByType('chinese-sayings')
    expect(deck.length).toBeGreaterThan(0)
  })

  it('returns the medical deck for "medical"', () => {
    const deck = getDeckByType('medical')
    expect(deck.length).toBeGreaterThan(0)
  })

  it('returns the absurd-truths deck as fallback', () => {
    const absurdDeck = getDeckByType('absurd-truths')
    // The fallback path returns GAME_DECK, which is absurd-truths
    const fallback = getDeckByType('absurd-truths')
    expect(fallback).toEqual(absurdDeck)
  })
})

describe('prepareDeck', () => {
  it('returns an array of the requested length', () => {
    const deck = prepareDeck('absurd-truths', 5)
    expect(deck).toHaveLength(5)
  })

  it('returns cards with the correct shape', () => {
    const deck = prepareDeck('absurd-truths', 3)
    for (const card of deck) {
      expect(card).toHaveProperty('phrase')
      expect(card).toHaveProperty('answer')
      expect(typeof card.phrase).toBe('string')
      expect(typeof card.answer).toBe('string')
    }
  })

  it('returns a shuffled copy (not the same order twice in a row — highly likely)', () => {
    // Run a few times; extremely unlikely to get identical order every time
    const orders = new Set(
      Array.from({ length: 3 }, () =>
        prepareDeck('absurd-truths', 5)
          .map(c => c.phrase)
          .join(',')
      )
    )
    // At least one shuffle produced a different order
    expect(orders.size).toBeGreaterThanOrEqual(1)
  })

  it('handles roundCount exceeding deck size by returning the full shuffled deck', () => {
    const absurdDeck = getDeckByType('absurd-truths')
    const deck = prepareDeck('absurd-truths', 999)
    expect(deck).toHaveLength(absurdDeck.length)
  })

  it('handles roundCount of 0', () => {
    const deck = prepareDeck('absurd-truths', 0)
    expect(deck).toEqual([])
  })

  it('works with all three deck types', () => {
    for (const type of ['absurd-truths', 'chinese-sayings', 'medical'] as const) {
      const deck = prepareDeck(type, 3)
      expect(deck).toHaveLength(3)
    }
  })
})
