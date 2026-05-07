'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/lib/game-context'

const PHASE_ROUTES: Record<string, string> = {
  waiting: 'waiting',
  reading: 'reading',
  voting: 'voting',
  reveal: 'reveal',
  end: 'end',
  complete: 'end',
  finished: 'end',
}

export default function GameEntryPage() {
  const router = useRouter()
  const { room, currentPhase, currentPlayerId, currentPlayerSecret, isLoading, isError } = useGame()
  const [reconnecting, setReconnecting] = useState(true)
  const [reconnectError, setReconnectError] = useState(false)

  useEffect(() => {
    if (isLoading) return

    // No credentials stored — must register
    if (!currentPlayerId) {
      router.replace('./register')
      return
    }

    // Try to reconnect using stored credentials
    async function reconnect() {
      try {
        const res = await fetch(`/api/rooms/${(window.location.pathname.match(/\/game\/([^/]+)/) || [])[1] || ''}/reconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: currentPlayerId, playerSecret: currentPlayerSecret }),
        })
        if (!res.ok) {
          localStorage.removeItem('bsking-player')
          router.replace('./register')
          return
        }
        setReconnecting(false)
      } catch {
        setReconnectError(true)
      }
    }

    reconnect()
  }, [isLoading, currentPlayerId, currentPlayerSecret, router])

  useEffect(() => {
    if (reconnecting) return
    if (isError) return

    if (!currentPhase) return
    const target = PHASE_ROUTES[currentPhase]
    if (target) {
      router.replace('./' + target)
    }
  }, [currentPhase, reconnecting, isError, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
        <p className="font-inter" style={{ color: '#94a3b8' }}>Loading game...</p>
      </div>
    )
  }

  if (reconnectError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
        <div className="text-center space-y-4">
          <p className="font-caveat text-2xl" style={{ color: '#a855f7' }}>Reconnection failed</p>
          <button
            onClick={() => { localStorage.removeItem('bsking-player'); router.push('/') }}
            className="px-6 py-3 rounded-xl font-semibold transition-all"
            style={{ background: '#f1f5f9', color: '#334155' }}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
      <p className="font-inter" style={{ color: '#94a3b8' }}>Reconnecting...</p>
    </div>
  )
}
