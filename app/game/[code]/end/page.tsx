'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePhaseRedirect } from '@/lib/use-phase-redirect'
import { useGame } from '@/lib/game-context'
import ScoreBoard from '@/components/absurd-truths/ScoreBoard'

export default function EndPage() {
  usePhaseRedirect('end')
  const router = useRouter()
  const { room, currentPlayerId, currentPlayerSecret } = useGame()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

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

  const maxScore = scoreEntries.length > 0 ? scoreEntries[0].score : 0
  const winners = scoreEntries.filter((s) => s.score === maxScore && maxScore > 0)
  const tieCount = winners.length

  async function handlePlayAgain() {
    setError('')
    setStarting(true)
    try {
      const res = await fetch(`/api/rooms/${room!.code}/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId, playerSecret: currentPlayerSecret }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          router.replace(`/game/${room!.code}`)
          return
        }
        setError(data.error || 'Failed to reset room')
        return
      }
      router.replace(`/game/${room!.code}/waiting`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  function handleBackToLobby() {
    localStorage.removeItem('bsking-player')
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFF9EC' }}>
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-6xl mb-2">🏆</div>

        <div>
          <h2 className="font-caveat font-bold text-4xl" style={{ color: '#d8401e', lineHeight: 1.1 }}>
            Game Over!
          </h2>

          {winners.length > 0 && (
            <div className="mt-3">
              {tieCount === 1 ? (
                <p className="font-caveat text-2xl" style={{ color: '#64748b' }}>
                  Winner: {winners[0].name || 'Unknown'}
                  <span className="ml-2">👑</span>
                </p>
              ) : (
                <p className="font-caveat text-2xl" style={{ color: '#64748b' }}>
                  It's a tie! 👑
                </p>
              )}
              <p className="font-inter text-sm mt-1" style={{ color: '#94a3b8' }}>
                {winners.map((w) => w.name || 'Unknown').join(' & ')}
              </p>
            </div>
          )}
        </div>

        {scoreEntries.length > 0 && (
          <div>
            <p className="font-inter text-sm font-semibold mb-2" style={{ color: '#64748b' }}>
              Final Scores
            </p>
            <ScoreBoard scores={scoreEntries} />
          </div>
        )}

        <svg width="160" height="12" viewBox="0 0 160 12" fill="none" className="mx-auto">
          <path d="M0 6 Q20 0 40 6 Q60 12 80 6 Q100 0 120 6 Q140 12 160 6" stroke="#6a9a26" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>

        {isHost ? (
          <button
            onClick={handlePlayAgain}
            disabled={starting}
            className="w-full py-4 rounded-xl font-caveat font-bold text-xl shadow-md
                       transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: '#6a9a26', color: '#2a3f10' }}
          >
            {starting ? 'Resetting...' : 'Play Again'}
          </button>
        ) : (
          <p className="font-inter text-sm" style={{ color: '#94a3b8' }}>
            Waiting for host to start a new game...
          </p>
        )}

        <button
          onClick={handleBackToLobby}
          className="w-full py-3 rounded-xl font-caveat font-bold text-lg border-2 transition-all active:scale-[0.97]"
          style={{ color: '#d8401e', borderColor: '#d8401e', background: 'transparent' }}
        >
          Back to Lobby
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
