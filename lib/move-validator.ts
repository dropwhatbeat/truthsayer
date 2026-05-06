import { gameMachine } from '@bsking/game-engine'
import type { GameContext } from '@bsking/game-engine'

type RoomPhase = 'lobby' | 'waiting' | 'reading' | 'discuss' | 'reveal' | 'finished'

/**
 * Valid move types per game phase.
 * This mirrors the gameMachine state transitions and serves as
 * server-side validation without needing to hydrate the full machine.
 */
const VALID_MOVES: Record<string, string[]> = {
  lobby: [],
  waiting: ['submit_description'],
  reading: ['submit_description'],
  discuss: ['cast_vote'],
  reveal: ['next_round'],
  finished: [],
}

/**
 * Validates whether a move type is allowed given the current game phase.
 * Returns { valid: true } if allowed, { valid: false, error } otherwise.
 */
export function validateMove(
  currentPhase: string | null,
  moveType: string
): { valid: boolean; error?: string } {
  if (!currentPhase) {
    return { valid: false, error: 'Game has no active phase' }
  }

  const allowed = VALID_MOVES[currentPhase]
  if (!allowed) {
    return { valid: false, error: `Unknown phase: ${currentPhase}` }
  }

  if (!allowed.includes(moveType)) {
    return {
      valid: false,
      error: `Cannot ${moveType} in phase ${currentPhase}. Expected one of: ${allowed.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Hydrates the expected next phase based on a move type.
 * Used for deterministic phase advancement consistent with the gameMachine.
 */
export function getNextPhase(
  currentPhase: string | null,
  moveType: string
): string | null {
  const transitions: Record<string, Record<string, string>> = {
    waiting: { submit_description: 'reading' },
    reading: { submit_description: 'discuss' },
    discuss: { cast_vote: 'reveal' },
    reveal: { next_round: 'reading' },
    finished: { next_round: 'finished' },
  }

  if (!currentPhase) return null
  return transitions[currentPhase]?.[moveType] ?? null
}
