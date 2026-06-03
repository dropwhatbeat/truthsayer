'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCredentials } from '@/lib/game-context'
import CopyCode from '@/components/absurd-truths/CopyCode'

const joinRequests = new Map<
  string,
  Promise<{ playerId: string; playerSecret: string }>
>()

export default function RegisterPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const code = String(params.code).toUpperCase()
  const joinAttemptedRef = useRef(false)

  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [credentials, setCredentials] = useState<{
    playerId: string
    playerSecret: string
  } | null>(null)

  const joinRoom = useCallback(async () => {
    if (joinAttemptedRef.current) return
    joinAttemptedRef.current = true

    const existingCreds = getCredentials(code)
    if (existingCreds) {
      setCredentials({
        playerId: existingCreds.playerId,
        playerSecret: existingCreds.playerSecret,
      })
      setLoading(false)
      return
    }

    try {
      let joinRequest = joinRequests.get(code)
      if (!joinRequest) {
        joinRequest = fetch(`/api/rooms/${code}/join`, { method: 'POST' }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || 'Failed to join room')
          }
          const data = await res.json()
          return { playerId: data.playerId, playerSecret: data.playerSecret }
        })
        joinRequests.set(code, joinRequest)
      }

      const data = await joinRequest
      const creds = { roomCode: code, playerId: data.playerId, playerSecret: data.playerSecret }
      localStorage.setItem('bsking-player', JSON.stringify(creds))
      setCredentials({ playerId: data.playerId, playerSecret: data.playerSecret })
    } catch (error) {
      joinRequests.delete(code)
      setError(error instanceof Error ? error.message : 'Network error. Please try again.')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [code, router])

  useEffect(() => {
    joinRoom()
  }, [joinRoom])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a name')
      return
    }
    if (!credentials) {
      setError('Session expired. Please go back to lobby.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/rooms/${code}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: credentials.playerId,
          playerSecret: credentials.playerSecret,
          name: trimmed,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 401) {
          localStorage.removeItem('bsking-player')
          setError('Invalid session. Redirecting to lobby...')
          setTimeout(() => router.push('/'), 1500)
          return
        }
        if (res.status === 409) {
          setError('You have already registered.')
          return
        }
        setError(data.error || 'Failed to register')
        return
      }

      router.push(`/game/${code}/waiting`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
        <p className="font-inter" style={{ color: '#94a3b8' }}>Joining room...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="font-caveat font-bold" style={{ fontSize: '2rem', color: '#a855f7' }}>
            Enter Your Name
          </p>
          <p className="font-inter text-sm mt-1" style={{ color: '#94a3b8' }}>
            Room: <CopyCode code={code} />
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            maxLength={30}
            className="w-full px-4 py-3 rounded-xl bg-white text-lg text-center font-inter
                       focus:outline-none focus:ring-2"
            style={{ border: '1px solid #e2e8f0', color: '#334155' }}
          />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full py-3 px-6 rounded-xl font-caveat font-bold text-xl shadow-md
                       transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#a855f7', color: '#ffffff' }}
          >
            {submitting ? 'Joining...' : 'Join Game'}
          </button>
        </form>

        {error && (
          <p className="text-sm text-center rounded-lg py-2 px-4 font-inter" style={{ background: '#fef2f2', color: '#ef4444' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
