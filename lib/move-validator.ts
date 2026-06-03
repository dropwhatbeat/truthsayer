type RoomPhase = 'waiting' | 'reading' | 'voting' | 'reveal' | 'end'
type MoveType = 'submit_description' | 'ready_to_vote' | 'cast_vote' | 'next_round'

/**
 * The app only persists these room phases today. Keep this table aligned with
 * the values returned by GET /api/rooms/[code].
 */
const VALID_MOVES: Record<RoomPhase, MoveType[]> = {
  waiting: [],
  reading: ['ready_to_vote'],
  voting: ['cast_vote'],
  reveal: ['next_round'],
  end: [],
}

const NEXT_PHASES: Record<'reading' | 'voting' | 'reveal', Record<MoveType, RoomPhase>> = {
  reading: { ready_to_vote: 'voting', submit_description: 'reading', cast_vote: 'reading', next_round: 'reading' },
  voting: { cast_vote: 'reveal', submit_description: 'voting', ready_to_vote: 'voting', next_round: 'voting' },
  reveal: { next_round: 'reading', submit_description: 'reveal', ready_to_vote: 'reveal', cast_vote: 'reveal' },
}

export function validateMove(
  currentPhase: string | null,
  moveType: string
): { valid: boolean; error?: string } {
  if (!currentPhase) {
    return { valid: false, error: 'Game has no active phase' }
  }

  if (!(currentPhase in VALID_MOVES)) {
    return { valid: false, error: `Unknown phase: ${currentPhase}` }
  }

  const allowed = VALID_MOVES[currentPhase as RoomPhase]
  if (!allowed.includes(moveType as MoveType)) {
    return {
      valid: false,
      error: `Cannot ${moveType} in phase ${currentPhase}`,
    }
  }

  return { valid: true }
}

export function getNextPhase(
  currentPhase: string | null,
  moveType: string
): RoomPhase | null {
  if (!currentPhase || !(currentPhase in NEXT_PHASES)) {
    return null
  }

  const next = NEXT_PHASES[currentPhase as keyof typeof NEXT_PHASES]?.[moveType as MoveType]
  return next ?? null
}
