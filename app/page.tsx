'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    const code = roomCode.trim().toUpperCase()
    if (!code) {
      setError('Please enter a room code')
      return
    }
    setError('')
    setJoining(true)
    try {
      const res = await fetch(`/api/rooms/${code}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Room not found. Check your code and try again.')
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Failed to join room')
        }
        return
      }
      const data = await res.json()
      if (data.status !== 'lobby') {
        setError('Game has already started.')
        return
      }
      router.push(`/game/${code}/register`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
      <h1 className="font-caveat font-bold mb-2" style={{ fontSize: '3rem', color: '#a855f7' }}>
        Absurd Truths
      </h1>
      <p className="font-inter text-sm mb-12" style={{ color: '#94a3b8' }}>A game of beautiful lies</p>

      <div className="w-full max-w-sm space-y-6">
        <button
          onClick={() => router.push('/create')}
          className="w-full py-3 px-6 rounded-xl font-caveat font-bold text-xl shadow-md
                     transition-all active:scale-[0.97]"
          style={{ background: '#a855f7', color: '#ffffff' }}
        >
          Create Room
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: '#e2e8f0' }} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 font-inter" style={{ background: '#FFFDF7', color: '#94a3b8' }}>
              or join with code
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoin() }}
            placeholder="Enter Room Code"
            maxLength={6}
            className="flex-1 px-4 py-3 rounded-xl bg-white text-center text-lg tracking-widest uppercase
                       font-inter focus:outline-none focus:ring-2"
            style={{ border: '1px solid #e2e8f0', color: '#334155' }}
          />
          <button
            onClick={handleJoin}
            disabled={joining || !roomCode.trim()}
            className="px-6 py-3 rounded-xl font-caveat font-bold text-lg
                       transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#2dd4bf', color: '#0f4c4c' }}
          >
            {joining ? '...' : 'Join'}
          </button>
        </div>

        {error && (
          <p className="text-sm text-center rounded-lg py-2 px-4 font-inter" style={{ background: '#fef2f2', color: '#ef4444' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
