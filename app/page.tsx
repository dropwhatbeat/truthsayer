'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'

export default function Home() {
  const router = useRouter()
  const posthog = usePostHog()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    setError('')
    setCreating(true)
    posthog.capture('create_game_clicked')
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
      posthog.capture('room_created', { room_code: data.code })
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
    posthog.capture('join_game_clicked', { room_code: code })
    try {
      const res = await fetch(`/api/rooms/${code}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Room not found. Check your code and try again.')
          posthog.capture('join_game_failed', { room_code: code, reason: 'not_found' })
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Failed to join room')
          posthog.capture('join_game_failed', { room_code: code, reason: 'error' })
        }
        return
      }
      const data = await res.json()
      if (data.status !== 'lobby') {
        setError('Game has already started.')
        posthog.capture('join_game_failed', { room_code: code, reason: 'game_already_started' })
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
      {/* Factory illustration */}
      <svg width="100%" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: 300, display: 'block', marginBottom: 4 }}>
        <defs>
          <filter id="cloud-pop" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#c8a87a" floodOpacity="0.22"/>
          </filter>
        </defs>

        {/* Left smoke cloud */}
        <g filter="url(#cloud-pop)">
          <circle cx="88" cy="52" r="14" fill="white"/>
          <circle cx="100" cy="55" r="12" fill="white"/>
          <circle cx="76" cy="55" r="12" fill="white"/>
          <circle cx="94" cy="41" r="13" fill="white"/>
          <circle cx="80" cy="43" r="12" fill="white"/>
        </g>
        <text x="88" y="52" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill="#d8401e" style={{ fontFamily: 'var(--font-caveat), cursive' }}>BS</text>

        {/* Right smoke cloud */}
        <g filter="url(#cloud-pop)">
          <circle cx="234" cy="46" r="16" fill="white"/>
          <circle cx="250" cy="50" r="14" fill="white"/>
          <circle cx="218" cy="50" r="13" fill="white"/>
          <circle cx="242" cy="33" r="15" fill="white"/>
          <circle cx="226" cy="36" r="13" fill="white"/>
        </g>
        <text x="234" y="46" textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="bold" fill="#d8401e" style={{ fontFamily: 'var(--font-caveat), cursive' }}>BS</text>

        {/* Left chimney */}
        <rect x="81" y="67" width="20" height="53" fill="#2d1a0e" rx="2"/>
        <rect x="78" y="63" width="26" height="6" fill="#1a0f06" rx="1"/>

        {/* Right chimney */}
        <rect x="224" y="62" width="22" height="58" fill="#2d1a0e" rx="2"/>
        <rect x="221" y="58" width="28" height="6" fill="#1a0f06" rx="1"/>

        {/* Roof accent band */}
        <rect x="54" y="116" width="212" height="9" fill="#b83518"/>

        {/* Main factory body */}
        <rect x="58" y="123" width="204" height="72" fill="#d8401e" rx="3"/>

        {/* Factory sign */}
        <rect x="126" y="126" width="68" height="15" fill="#a82d12" rx="2"/>
        <text x="160" y="134" textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#fff5f1" letterSpacing="1" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 700 }}>BS FACTORY</text>

        {/* Windows */}
        <rect x="76" y="137" width="26" height="22" fill="#fff5f1" rx="2"/>
        <rect x="114" y="137" width="26" height="22" fill="#fff5f1" rx="2"/>
        <rect x="184" y="137" width="26" height="22" fill="#fff5f1" rx="2"/>
        <rect x="222" y="137" width="26" height="22" fill="#fff5f1" rx="2"/>

        {/* Window cross bars */}
        <line x1="89" y1="137" x2="89" y2="159" stroke="#d8401e" strokeWidth="1" opacity="0.35"/>
        <line x1="76" y1="148" x2="102" y2="148" stroke="#d8401e" strokeWidth="1" opacity="0.35"/>
        <line x1="127" y1="137" x2="127" y2="159" stroke="#d8401e" strokeWidth="1" opacity="0.35"/>
        <line x1="114" y1="148" x2="140" y2="148" stroke="#d8401e" strokeWidth="1" opacity="0.35"/>
        <line x1="197" y1="137" x2="197" y2="159" stroke="#d8401e" strokeWidth="1" opacity="0.35"/>
        <line x1="184" y1="148" x2="210" y2="148" stroke="#d8401e" strokeWidth="1" opacity="0.35"/>
        <line x1="235" y1="137" x2="235" y2="159" stroke="#d8401e" strokeWidth="1" opacity="0.35"/>
        <line x1="222" y1="148" x2="248" y2="148" stroke="#d8401e" strokeWidth="1" opacity="0.35"/>

        {/* Central door */}
        <rect x="142" y="153" width="36" height="42" fill="#a82d12" rx="2"/>
        <circle cx="173" cy="176" r="2.5" fill="#fbbf24"/>

        {/* Ground */}
        <line x1="30" y1="195" x2="290" y2="195" stroke="#6a9a26" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        <ellipse cx="70" cy="196" rx="18" ry="6" fill="#6a9a26" opacity="0.35"/>
        <ellipse cx="250" cy="196" rx="18" ry="6" fill="#6a9a26" opacity="0.35"/>
      </svg>

      <h1 className="font-caveat font-bold mb-1" style={{ fontSize: '2.8rem', color: '#d8401e', transform: 'rotate(-1deg)', lineHeight: 1 }}>
        Bullshit Factory
      </h1>
      <svg width="160" height="10" viewBox="0 0 280 14" fill="none" className="mb-1">
        <path d="M0 7 Q35 1 70 7 Q105 13 140 7 Q175 1 210 7 Q245 13 280 7" stroke="#6a9a26" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
      <p className="font-inter text-sm mb-12" style={{ color: '#94a3b8' }}>where lies are made</p>

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
