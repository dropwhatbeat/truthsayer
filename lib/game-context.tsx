'use client'

import { createContext, useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'

export interface RoomPlayer {
  id: string
  name: string | null
  role: string | null
}

export interface RoomState {
  id: string
  code: string
  status: string
  currentPhase: string | null
  currentRoundNumber: number | null
  createdBy: string | null
  config: {
    deckType: string
    roundCount: number
    timerSecs: number
  }
  currentRound: {
    roundNumber: number
    judgePlayerId: string | null
    honestPlayerId: string | null
    cardPhrase: string | null
    cardAnswer: string | null
    categories: { emoji: string; label: string }[] | null
  } | null
  lastVote: {
    voterId: string
    targetPlayerId: string
  } | null
  scores: Record<string, number>
  players: RoomPlayer[]
}

export interface PlayerCredentials {
  roomCode: string
  playerId: string
  playerSecret: string
}

export interface GameContextValue {
  room: RoomState | null
  currentPlayerId: string | null
  currentPlayerSecret: string | null
  currentPlayer: RoomPlayer | null
  currentPhase: string | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function getCredentials(code: string): PlayerCredentials | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('bsking-player')
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlayerCredentials
    if (parsed.roomCode !== code) return null
    return parsed
  } catch {
    return null
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ code: string }>()
  const code = String(params.code).toUpperCase()

  const storedCredsRaw =
    typeof window !== 'undefined' ? localStorage.getItem('bsking-player') : null
  const creds = useMemo(() => getCredentials(code), [code, storedCredsRaw])

  const {
    data: room,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<RoomState>({
    queryKey: ['room', code],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${code}`)
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Room not found' : 'Failed to fetch room')
      }
      return res.json()
    },
    refetchInterval: 2000,
    staleTime: 1000,
    retry: 1,
  })

  const currentPlayer = useMemo(() => {
    if (!room || !creds) return null
    return room.players.find((p) => p.id === creds.playerId) ?? null
  }, [room, creds])

  const value = useMemo<GameContextValue>(
    () => ({
      room: room ?? null,
      currentPlayerId: creds?.playerId ?? null,
      currentPlayerSecret: creds?.playerSecret ?? null,
      currentPlayer,
      currentPhase: room?.currentPhase ?? null,
      isLoading,
      isError,
      error: error as Error | null,
      refetch,
    }),
    [room, creds, currentPlayer, isLoading, isError, error, refetch]
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
        <p className="font-inter" style={{ color: '#94a3b8' }}>Loading game...</p>
      </div>
    )
  }

  if (isError) {
    const errMsg = (error as Error)?.message || 'Failed to load game'
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
        <div className="text-center space-y-4">
          <p className="font-caveat" style={{ fontSize: '1.5rem', color: '#a855f7' }}>
            {errMsg}
          </p>
          <button
            onClick={() => { window.location.href = '/' }}
            className="px-6 py-3 rounded-xl font-caveat font-bold transition-all"
            style={{ background: '#f1f5f9', color: '#334155' }}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return ctx
}
