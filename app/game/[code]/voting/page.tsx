'use client'

import { useState } from 'react'
import { usePhaseRedirect } from '@/lib/use-phase-redirect'
import { useGame } from '@/lib/game-context'
import VoteButtons from '@/components/absurd-truths/VoteButtons'

export default function VotingPage() {
  usePhaseRedirect('voting')
  const { room, currentPlayer, currentPlayerId, currentPlayerSecret } = useGame()
  const [submitting, setSubmitting] = useState(false)
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [error, setError] = useState('')

  if (!room || !currentPlayerId) return null

  const role = currentPlayer?.role
  const isJudge = role === 'judge'

  const otherPlayers = room.players.filter(
    (p) => p.id !== currentPlayerId && p.name
  )

  async function handleVote(targetPlayerId: string) {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/rooms/${room!.code}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayerId,
          playerSecret: currentPlayerSecret,
          moveType: 'cast_vote',
          data: { targetPlayerId },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) return
        setError(data.error || 'Failed to submit vote')
        return
      }
      setVotedFor(targetPlayerId)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const targetName = votedFor
    ? otherPlayers.find((p) => p.id === votedFor)?.name || 'a player'
    : ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFF9EC' }}>
      <div className="w-full max-w-xl space-y-6 text-center">
        <div>
          <p className="font-caveat font-bold text-3xl" style={{ color: '#d8401e' }}>
            Voting Time
          </p>
          <p className="font-inter text-sm mt-1" style={{ color: '#94a3b8' }}>
            {role ? ({ honest: 'you are the truthsayer', liar: 'try to BS!', judge: 'you are the judge' }[role] ?? `you are the ${role}`) : 'Voting phase'}
          </p>
        </div>

        {isJudge ? (
          <>
            <p className="font-inter text-base" style={{ color: '#334155' }}>
              Who do you think gave the real answer?
            </p>
            {votedFor ? (
              <p className="font-inter text-sm" style={{ color: '#6a9a26' }}>
                You voted for {targetName}. Waiting for phase to advance...
              </p>
            ) : (
              <VoteButtons
                players={otherPlayers.map((p) => ({ id: p.id, name: p.name }))}
                onVote={handleVote}
                disabled={submitting}
              />
            )}
          </>
        ) : (
          <p className="font-inter text-sm" style={{ color: '#94a3b8' }}>
            Waiting for the judge to vote...
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
