'use client'

import { useState, useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import { usePhaseRedirect } from '@/lib/use-phase-redirect'
import { useGame } from '@/lib/game-context'
import ScoreBoard from '@/components/absurd-truths/ScoreBoard'

export default function RevealPage() {
  usePhaseRedirect('reveal')
  const { room, currentPlayerId, currentPlayerSecret } = useGame()
  const posthog = usePostHog()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const round = room?.currentRound
  const vote = room?.lastVote
  const honestPlayer = room?.players.find((p) => p.id === round?.honestPlayerId)
  const judgePlayer = room?.players.find((p) => p.id === round?.judgePlayerId)
  const votedFor = vote?.targetPlayerId
    ? room?.players.find((p) => p.id === vote.targetPlayerId)
    : null
  const judgeCorrect = votedFor?.id === honestPlayer?.id

  useEffect(() => {
    if (!room || !round) return
    posthog.capture('round_revealed', {
      room_code: room!.code,
      round_number: round.roundNumber,
      judge_correct: judgeCorrect,
      deck_type: room.config?.deckType,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.code, round?.roundNumber])

  if (!room || !currentPlayerId) return null

  const isHost = currentPlayerId === room.createdBy

  const scoreEntries = Object.entries(room.scores ?? {})
    .filter(([id]) => room.players.some((p) => p.id === id))
    .map(([id, score]) => ({
      id,
      name: room.players.find((p) => p.id === id)?.name ?? null,
      score,
    }))
    .sort((a, b) => b.score - a.score)

  async function handleNextRound() {
    posthog.capture('next_round_clicked', { room_code: room!.code, round_number: round?.roundNumber })
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
    <div className="min-h-screen flex flex-col items-center px-5 py-10" style={{ background: '#FFF9EC' }}>
      <div className="w-full max-w-xl space-y-5">

        {/* Header */}
        <p className="font-caveat font-bold text-3xl text-center" style={{ color: '#d8401e' }}>
          Round {round?.roundNumber ?? '?'} Results
        </p>

        {/* Card phrase */}
        {round?.cardPhrase && (
          <div
            className="rounded-3xl px-6 py-5 text-center shadow-sm border"
            style={{ background: '#FFF8EE', borderColor: '#fde68a' }}
          >
            <p
              className="font-caveat font-bold leading-tight"
              style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)', color: '#1e293b', overflowWrap: 'break-word', whiteSpace: 'pre-line' }}
            >
              {round.cardPhrase}
            </p>
          </div>
        )}

        {/* Real answer */}
        {round?.cardAnswer && (
          <div className="rounded-xl px-5 py-3 border" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
            <p className="font-inter text-xs font-semibold mb-1" style={{ color: '#166534' }}>Real answer</p>
            <p className="font-inter text-sm" style={{ color: '#166534' }}>{round.cardAnswer}</p>
          </div>
        )}

        {/* Truthsayer + Judge voted — side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl px-4 py-4 text-center border" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
            <p className="font-inter text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>
              Truthsayer
            </p>
            <p className="font-caveat font-bold text-xl" style={{ color: '#6a9a26' }}>
              {honestPlayer?.name || '—'}
            </p>
          </div>
          <div className="rounded-xl px-4 py-4 text-center border" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
            <p className="font-inter text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>
              Judge voted for
            </p>
            <p className="font-caveat font-bold text-xl" style={{ color: '#d8401e' }}>
              {votedFor?.name || '—'}
            </p>
          </div>
        </div>

        {/* Verdict */}
        <div
          className="rounded-xl px-5 py-4 flex items-center gap-4"
          style={{
            background: judgeCorrect ? '#fefce8' : '#fdf4ff',
            border: `1.5px solid ${judgeCorrect ? '#fde68a' : '#e9d5ff'}`,
          }}
        >
          <span style={{ fontSize: '2rem', lineHeight: 1 }}>{judgeCorrect ? '🎯' : '🙈'}</span>
          <div>
            <p className="font-caveat font-bold text-lg" style={{ color: judgeCorrect ? '#b45309' : '#a82d12' }}>
              {judgeCorrect ? 'Judge got it!' : 'Bluff successful!'}
            </p>
            {judgeCorrect ? (
              <p className="font-inter text-xs mt-0.5" style={{ color: '#64748b' }}>
                +1 point each for {judgePlayer?.name || 'the judge'} &amp; {honestPlayer?.name || 'the truthsayer'}
              </p>
            ) : (
              <p className="font-inter text-xs mt-0.5" style={{ color: '#64748b' }}>
                +2 points for {votedFor?.name || 'the bullshitter'}
              </p>
            )}
          </div>
        </div>

        {/* Scoreboard */}
        {scoreEntries.length > 0 && (
          <div>
            <p className="font-caveat font-bold text-lg mb-2" style={{ color: '#334155' }}>
              Scoreboard
            </p>
            <ScoreBoard scores={scoreEntries} />
          </div>
        )}

        {/* Next round — host only */}
        {isHost ? (
          <button
            onClick={handleNextRound}
            disabled={submitting}
            className="w-full py-4 rounded-xl font-caveat font-bold text-xl shadow-md
                       transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: '#6a9a26', color: '#2a3f10' }}
          >
            {submitting ? 'Advancing...' : 'Next Round →'}
          </button>
        ) : (
          <p className="text-center font-inter text-sm" style={{ color: '#94a3b8' }}>
            Waiting for the host to start the next round...
          </p>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-lg py-2 px-4 text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
