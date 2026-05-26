'use client'

import { useState } from 'react'
import { usePhaseRedirect } from '@/lib/use-phase-redirect'
import { useGame } from '@/lib/game-context'
import ScoreBoard from '@/components/absurd-truths/ScoreBoard'

export default function RevealPage() {
  usePhaseRedirect('reveal')
  const { room, currentPlayerId, currentPlayerSecret } = useGame()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!room || !currentPlayerId) return null

  const round = room.currentRound
  const vote = room.lastVote
  const honestPlayer = room.players.find((p) => p.id === round?.honestPlayerId)
  const judgePlayer = room.players.find((p) => p.id === round?.judgePlayerId)
  const votedFor = vote?.targetPlayerId
    ? room.players.find((p) => p.id === vote.targetPlayerId)
    : null
  const judgeCorrect = votedFor?.id === honestPlayer?.id

  const scoreEntries = Object.entries(room.scores ?? {})
    .filter(([id]) => room.players.some((p) => p.id === id))
    .map(([id, score]) => ({
      id,
      name: room.players.find((p) => p.id === id)?.name ?? null,
      score,
    }))
    .sort((a, b) => b.score - a.score)

  async function handleNextRound() {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/rooms/${room!.code}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayerId,
          playerSecret: currentPlayerSecret,
          moveType: 'next_round',
        }),
      })
      if (!res.ok) {
        if (res.status === 409) return
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to advance')
        return
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <p className="font-caveat font-bold text-3xl" style={{ color: '#a855f7' }}>
            Round {round?.roundNumber ?? '?'} Results
          </p>
        </div>

        {round?.cardPhrase && (
          <div
            className="rounded-3xl px-6 py-5 text-center shadow-sm border"
            style={{ background: '#FFF8EE', borderColor: '#fde68a' }}
          >
            <p
              className="font-caveat font-bold leading-tight"
              style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#1e293b', overflowWrap: 'break-word' }}
            >
              {round.cardPhrase}
            </p>
          </div>
        )}

        {round?.cardAnswer && (
          <div
            className="rounded-xl px-4 py-3 border text-left"
            style={{ background: '#f0fdf4', borderColor: '#86efac' }}
          >
            <p className="font-inter text-xs font-semibold mb-1" style={{ color: '#166534' }}>
              Real answer:
            </p>
            <p className="font-inter text-sm" style={{ color: '#166534' }}>
              {round.cardAnswer}
            </p>
          </div>
        )}

        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between px-4 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
            <span className="font-inter text-sm" style={{ color: '#334155' }}>
              Honest player
            </span>
            <span className="font-inter text-sm font-semibold capitalize" style={{ color: '#2dd4bf' }}>
              {honestPlayer?.name || 'Unknown'}
            </span>
          </div>

          <div className="flex items-center justify-between px-4 py-2 rounded-lg" style={{ background: '#f8fafc' }}>
            <span className="font-inter text-sm" style={{ color: '#334155' }}>
              Judge voted for
            </span>
            <span className="font-inter text-sm font-semibold" style={{ color: '#a855f7' }}>
              {votedFor?.name || 'Unknown'}
            </span>
          </div>

          <div className="flex items-center justify-between px-4 py-2 rounded-lg" style={{ background: judgeCorrect ? '#fefce8' : '#fef2f2' }}>
            <span className="font-inter text-sm" style={{ color: '#334155' }}>
              Result
            </span>
            <span className="font-inter text-sm font-semibold capitalize" style={{ color: judgeCorrect ? '#f59e0b' : '#ef4444' }}>
              {judgeCorrect ? `+1 point for ${judgePlayer?.name || 'judge'}` : `+1 point for ${honestPlayer?.name || 'honest'}`}
            </span>
          </div>
        </div>

        {scoreEntries.length > 0 && (
          <div>
            <p className="font-inter text-sm font-semibold mb-2" style={{ color: '#64748b' }}>
              Scoreboard
            </p>
            <ScoreBoard scores={scoreEntries} />
          </div>
        )}

        <button
          onClick={handleNextRound}
          disabled={submitting}
          className="w-full py-4 rounded-xl font-caveat font-bold text-xl shadow-md
                     transition-all active:scale-[0.97] disabled:opacity-50"
          style={{ background: '#2dd4bf', color: '#0f4c4c' }}
        >
          {submitting ? 'Advancing...' : 'Next Round'}
        </button>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-lg py-2 px-4">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
