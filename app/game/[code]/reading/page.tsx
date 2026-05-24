'use client'

import { useState } from 'react'
import { usePhaseRedirect } from '@/lib/use-phase-redirect'
import { useGame } from '@/lib/game-context'
import CategoryPills from '@/components/absurd-truths/CategoryPills'

export default function ReadingPage() {
  usePhaseRedirect('reading')
  const { room, currentPlayer, currentPlayerId, currentPlayerSecret } = useGame()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  if (!room || !currentPlayerId) return null

  const round = room.currentRound
  const role = currentPlayer?.role
  const isHonest = role === 'honest'
  const isJudge = role === 'judge'

  async function handleStartVoting() {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/rooms/${room!.code}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayerId,
          playerSecret: currentPlayerSecret,
          moveType: 'ready_to_vote',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) return
        setError(data.error || 'Failed to submit')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const categories = round?.categories
    ? (Array.isArray(round.categories) ? round.categories : [])
    : []

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <p className="font-caveat font-bold text-3xl" style={{ color: '#a855f7' }}>
            Round {round?.roundNumber ?? '?'}
          </p>
          <p className="font-inter text-sm mt-1 capitalize" style={{ color: '#94a3b8' }}>
            {role ? `You are the ${role}` : 'Reading phase'}
          </p>
        </div>

        {round?.cardPhrase && (
          <div
            className="rounded-3xl px-6 py-6 text-center shadow-sm border"
            style={{ background: '#FFF8EE', borderColor: '#fde68a' }}
          >
            <p
              className="font-caveat font-bold leading-tight"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#1e293b', overflowWrap: 'break-word' }}
            >
              {round.cardPhrase}
            </p>
            {categories.length > 0 && (
              <div className="mt-4">
                <CategoryPills categories={categories} />
              </div>
            )}
          </div>
        )}

        {isHonest && round?.cardAnswer && (
          <div
            className="rounded-xl px-4 py-3 border text-left"
            style={{ background: '#f0fdf4', borderColor: '#86efac' }}
          >
            <p className="font-inter text-xs font-semibold mb-1" style={{ color: '#166534' }}>
              Your real answer (don't show others):
            </p>
            <p className="font-inter text-sm" style={{ color: '#166534' }}>
              {round.cardAnswer}
            </p>
          </div>
        )}

        {!isHonest && (
          <p className="font-inter text-sm" style={{ color: '#94a3b8' }}>
            The honest player is reading their answer. Listen carefully.
          </p>
        )}

        {isJudge ? (
          submitted ? (
            <p className="font-inter text-sm" style={{ color: '#2dd4bf' }}>
              Voting started. Waiting for phase to advance...
            </p>
          ) : (
            <button
              onClick={handleStartVoting}
              disabled={submitting}
              className="w-full py-4 rounded-xl font-caveat font-bold text-xl shadow-md
                         transition-all active:scale-[0.97] disabled:opacity-50"
              style={{ background: '#2dd4bf', color: '#0f4c4c' }}
            >
              {submitting ? 'Starting...' : 'Start Voting'}
            </button>
          )
        ) : (
          <p className="font-inter text-sm" style={{ color: '#94a3b8' }}>
            Waiting for the judge to start voting...
          </p>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-lg py-2 px-4">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
