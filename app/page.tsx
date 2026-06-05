'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    setError('')
    setCreating(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to create room')
        return
      }
      const data = await res.json()
      router.push(`/game/${data.code}/register?host=1`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFF9EC' }}>
      <h1 className="font-caveat font-bold mb-2" style={{ fontSize: '3rem', color: '#d8401e', transform: 'rotate(-1deg)' }}>
        Absurd Truths
      </h1>
      <svg width="160" height="10" viewBox="0 0 280 14" fill="none" className="mb-1">
        <path d="M0 7 Q35 1 70 7 Q105 13 140 7 Q175 1 210 7 Q245 13 280 7" stroke="#6a9a26" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
      <p className="font-inter text-sm mb-12" style={{ color: '#94a3b8' }}>a game of beautiful lies</p>

      <div className="w-full max-w-xl space-y-6">
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full py-3 px-6 font-caveat font-bold text-2xl
                     transition-all active:scale-[0.97] disabled:opacity-60"
          style={{
            background: '#d8401e',
            color: '#fff5f1',
            border: '3px solid #a82d12',
            borderRadius: '8px 26px 6px 22px / 22px 6px 26px 8px',
            boxShadow: '5px 5px 0 #a82d12',
            transform: 'rotate(-0.5deg)',
          }}
        >
          {creating ? 'Creating...' : 'Create Game'}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: '#e2e8f0' }} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 font-inter" style={{ background: '#FFF9EC', color: '#94a3b8' }}>
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
            className="flex-1 px-4 py-3 rounded-xl bg-white text-center text-xl tracking-widest uppercase
                       font-caveat font-bold focus:outline-none focus:ring-2"
            style={{ border: '2px solid #e2e8f0', color: '#334155' }}
          />
          <button
            onClick={handleJoin}
            disabled={joining || !roomCode.trim()}
            className="px-6 py-3 rounded-xl font-caveat font-bold text-2xl
                       transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#6a9a26', color: '#f4faea', border: '2px solid #4f7a1c' }}
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
