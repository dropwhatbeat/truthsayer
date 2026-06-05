'use client'

import { useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { usePhaseRedirect } from '@/lib/use-phase-redirect'
import { useGame } from '@/lib/game-context'
import VoteButtons from '@/components/absurd-truths/VoteButtons'
import CategoryPills from '@/components/absurd-truths/CategoryPills'

export default function VotingPage() {
  usePhaseRedirect('voting')
  const { room, currentPlayer, currentPlayerId, currentPlayerSecret } = useGame()
  const posthog = usePostHog()
  const [submitting, setSubmitting] = useState(false)
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [error, setError] = useState('')

  if (!room || !currentPlayerId) return null

  const role = currentPlayer?.role
  const isJudge = role === 'judge'
  const isLiar = role === 'liar'
  const round = room.currentRound
  const categories = round?.categories
    ? (Array.isArray(round.categories) ? round.categories : [])
    : []

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
      posthog.capture('vote_cast', { room_code: room!.code, round_number: round?.roundNumber, role })
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
        {(() => {
          const VOTE_BADGE: Record<string, { emoji: string; title: string; subtitle: string; color: string }> = {
            judge:  { emoji: '🔍', title: "You're the Judge",       subtitle: 'Who do you think gave the real answer?', color: '#7c3aed' },
            honest: { emoji: '✅', title: "You're the Truthsayer",  subtitle: 'Share your story',                       color: '#6a9a26' },
            liar:   { emoji: '🃏', title: "You're the Bullshitter", subtitle: 'Try to make it convincing',              color: '#d97706' },
          }
          const badge = role ? VOTE_BADGE[role] : null
          return (
            <div className="space-y-2">
              <p className="font-inter text-xs uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                Voting Time
              </p>
              {badge ? (
                <>
                  <p className="font-caveat font-bold text-4xl" style={{ color: badge.color }}>
                    {badge.emoji} {badge.title}
                  </p>
                  <p className="font-inter text-sm" style={{ color: '#64748b' }}>
                    {badge.subtitle}
                  </p>
                </>
              ) : (
                <p className="font-caveat font-bold text-3xl" style={{ color: '#d8401e' }}>Voting phase</p>
              )}
            </div>
          )
        })()}

        {/* Card phrase — visible to everyone */}
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
            {/* Categories (clues) — only liars see these */}
            {isLiar && categories.length > 0 && (
              <div className="mt-3">
                <CategoryPills categories={categories} />
              </div>
            )}
          </div>
        )}

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
