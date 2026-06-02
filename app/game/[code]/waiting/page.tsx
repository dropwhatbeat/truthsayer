'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePhaseRedirect } from '@/lib/use-phase-redirect'
import { useGame } from '@/lib/game-context'
import PlayerList from '@/components/absurd-truths/PlayerList'

export default function WaitingPage() {
  usePhaseRedirect('waiting')
  const router = useRouter()
  const { room, currentPlayerId, currentPlayerSecret } = useGame()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  if (!room) return null

  const registeredPlayers = room.players.filter((p) => p.name)
  const isHost = currentPlayerId === room.createdBy
  const canStart = registeredPlayers.length >= 3

  async function handleStart() {
    setError('')
    setStarting(true)
    try {
      const res = await fetch(`/api/rooms/${room!.code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId, playerSecret: currentPlayerSecret }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          // Game already started, redirect to entry point
          router.replace(`/game/${room!.code}`)
          return
        }
        setError(data.error || 'Failed to start game')
        return
      }
      router.replace(`/game/${room!.code}/reading`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <p className="font-caveat font-bold text-3xl" style={{ color: '#a855f7' }}>
            Waiting Room
          </p>
          <p className="font-inter text-sm mt-1" style={{ color: '#94a3b8' }}>
            Room: <span className="tracking-widest font-mono">{room.code}</span>
          </p>
        </div>

        <div className="text-left">
          <p className="font-inter text-sm mb-2" style={{ color: '#64748b' }}>
            Players ({registeredPlayers.length})
          </p>
          {registeredPlayers.length > 0 ? (
            <PlayerList
              players={registeredPlayers.map((p) => ({
                id: p.id,
                name: p.name,
                role: p.role,
              }))}
              highlightId={currentPlayerId ?? undefined}
            />
          ) : (
            <p className="font-inter text-sm text-center py-4" style={{ color: '#94a3b8' }}>
              Waiting for players to join...
            </p>
          )}
        </div>

        {isHost ? (
          <div className="space-y-2">
            <button
              onClick={handleStart}
              disabled={!canStart || starting}
              className="w-full py-4 rounded-xl font-caveat font-bold text-xl shadow-md
                         transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#2dd4bf', color: '#0f4c4c' }}
            >
              {starting
                ? 'Starting...'
                : canStart
                  ? 'Start Game'
                  : `Need at least 3 players (${registeredPlayers.length})`}
            </button>
          </div>
        ) : (
          <p className="font-inter text-sm" style={{ color: '#94a3b8' }}>
            Waiting for host to start...
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
