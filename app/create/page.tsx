'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { DeckType } from '@bsking/game-engine'
import Reel, { REEL_ITEM_H, getReelValue } from '@/components/absurd-truths/Reel'

const DECKS = [
  {
    key: 'absurd-truths' as DeckType,
    emoji: '🤪',
    label: 'Absurd Truths',
    sub: 'Chaotic prompts & punchlines',
    on: '#a855f7', off: '#e9d5ff', bg: '#f5f3ff', color: '#7c3aed', subColor: '#a78bfa',
  },
  {
    key: 'chinese-sayings' as DeckType,
    emoji: '🐉',
    label: 'Chinese Sayings',
    sub: 'Ancient wisdom & cultural curveballs',
    on: '#2dd4bf', off: '#99f6e4', bg: '#f0fdfa', color: '#0f766e', subColor: '#5eead4',
  },
  {
    key: 'medical' as DeckType,
    emoji: '🩺',
    label: 'Medical Terms',
    sub: 'Clinical jargon & health nonsense',
    on: '#f59e0b', off: '#fde68a', bg: '#fffbeb', color: '#92400e', subColor: '#fbbf24',
  },
]

const TIMER_OPTIONS = [0, 15, 30, 45, 60]
const ROUND_OPTIONS = [5, 10, 20, 30]

export default function CreateRoomPage() {
  const router = useRouter()
  const [selectedDeck, setSelectedDeck] = useState<DeckType>('absurd-truths')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const timerRef = useRef<HTMLDivElement>(null)
  const roundsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      if (timerRef.current) timerRef.current.scrollTop = REEL_ITEM_H * 2 // default 30s = index 2
      if (roundsRef.current) roundsRef.current.scrollTop = REEL_ITEM_H // default 10  = index 1
    }, 50)
    return () => clearTimeout(t)
  }, [])

  async function handleCreate() {
    const timerSecs = timerRef.current ? getReelValue(timerRef.current, TIMER_OPTIONS) : 30
    const roundCount = roundsRef.current ? getReelValue(roundsRef.current, ROUND_OPTIONS) : 10
    setError('')
    setCreating(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckType: selectedDeck, timerSecs, roundCount }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to create room')
        return
      }
      const data = await res.json()
      router.push(`/game/${data.code}/register`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10" style={{ background: '#FFFDF7' }}>
      <div className="w-full max-w-sm">

        {/* Header */}
        <button
          onClick={() => router.back()}
          className="font-caveat text-sm mb-6 block"
          style={{ color: '#94a3b8' }}
        >
          ← back
        </button>
        <h2 className="font-caveat font-bold text-3xl mb-1" style={{ color: '#a855f7' }}>
          Set up your game
        </h2>
        <p className="font-inter text-sm mb-8" style={{ color: '#94a3b8' }}>
          Choose a deck, timer, and number of rounds.
        </p>

        {/* Deck selection */}
        <p className="font-caveat font-bold text-lg mb-3" style={{ color: '#334155' }}>
          Pick a deck
        </p>
        <div className="space-y-2 mb-6">
          {DECKS.map(({ key, emoji, label, sub, on, off, bg, color, subColor }) => {
            const active = selectedDeck === key
            return (
              <button
                key={key}
                onClick={() => setSelectedDeck(key)}
                className="w-full flex items-center gap-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98]"
                style={{
                  padding: '12px 16px',
                  borderColor: active ? on : off,
                  background: active ? bg : '#fff',
                }}
              >
                <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-caveat font-bold" style={{ fontSize: '1.1rem', color, lineHeight: 1.2 }}>
                    {label}
                  </p>
                  <p className="font-inter" style={{ fontSize: '0.72rem', color: active ? subColor : '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>
                    {sub}
                  </p>
                </div>
                {active && (
                  <div className="shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 22, height: 22, background: on }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Timer + Rounds */}
        <div className="flex gap-4 mb-8">
          <Reel
            ref={timerRef}
            label="Timer"
            options={TIMER_OPTIONS.map((n) => (n === 0 ? 'None' : `${n}s`))}
            accentColor="#2dd4bf"
            highlightBg="#f0fdfa"
            highlightBorder="#99f6e4"
            borderColor="#99f6e4"
          />
          <Reel
            ref={roundsRef}
            label="Rounds"
            options={ROUND_OPTIONS.map(String)}
            accentColor="#a855f7"
            highlightBg="#f5f3ff"
            highlightBorder="#ddd6fe"
            borderColor="#e9d5ff"
          />
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full py-4 rounded-xl font-caveat font-bold text-xl shadow-md
                     transition-all active:scale-[0.97] disabled:opacity-50"
          style={{ background: '#a855f7', color: '#ffffff' }}
        >
          {creating ? 'Creating...' : 'Create Room →'}
        </button>

        {error && (
          <p className="text-sm text-center rounded-lg py-2 px-4 font-inter mt-4" style={{ background: '#fef2f2', color: '#ef4444' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
