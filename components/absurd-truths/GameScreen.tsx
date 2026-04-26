'use client'

import { useEffect, useRef } from 'react'
import type { Card } from '@/data/absurdTruthsDeck'

export type Phase = 'waiting' | 'reading' | 'discuss' | 'reveal'

interface Props {
  card: Card
  phase: Phase
  index: number
  total: number
  timeLeft: number
  timerSecs: number
  onShowSecret: () => void
  onRevealToAll: () => void
  onBack: () => void
  onNext: () => void
  onHome: () => void
}

const CIRCUMFERENCE = 2 * Math.PI * 45

export default function GameScreen({
  card, phase, index, total, timeLeft, timerSecs,
  onShowSecret, onRevealToAll, onBack, onNext, onHome,
}: Props) {
  const pct    = ((index + 1) / total) * 100
  const isLast = index >= total - 1

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFDF7' }}>
      {/* Progress bar */}
      <div style={{ height: 6, background: '#ede9fe', width: '100%' }}>
        <div
          className="progress-bar-fill"
          style={{ height: '100%', background: '#a855f7', width: `${pct}%`, borderRadius: '0 4px 4px 0' }}
        />
      </div>

      {/* Counter + home */}
      <div className="flex justify-between items-center px-5 pt-2 pb-1">
        <button onClick={onHome} className="btn-press font-caveat text-lg" style={{ color: '#c4b5fd' }}>
          ← home
        </button>
        <span className="font-caveat text-xl" style={{ color: '#94a3b8' }}>
          {index + 1} / {total}
        </span>
      </div>

      {/* Phrase + categories */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 relative overflow-hidden">
        <span
          className="doodle font-caveat font-bold"
          style={{ fontSize: '10rem', color: '#a855f7', opacity: 0.04, top: '10%', left: '50%', transform: 'translateX(-50%)', zIndex: 0 }}
        >
          ?
        </span>
        <div className="relative z-10 w-full max-w-sm">
          <div
            className="rounded-3xl px-8 py-7 text-center shadow-sm border"
            style={{ background: '#FFF8EE', borderColor: '#fde68a' }}
          >
            <p
              className="font-black text-gray-900 leading-tight"
              style={{ fontSize: 'clamp(2.2rem, 11vw, 3.8rem)' }}
            >
              {card.phrase}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {card.categories.map(cat => (
              <span
                key={cat.label}
                className="inline-flex items-center gap-1.5 font-inter font-semibold"
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: '2px solid #ddd6fe',
                  background: '#f5f3ff',
                  color: '#6d28d9',
                  fontSize: '1rem',
                }}
              >
                {cat.emoji} {cat.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Phase-specific bottom */}
      <div className="px-5 pb-8 w-full max-w-sm mx-auto">
        {phase === 'waiting'  && <WaitingPhase onShowSecret={onShowSecret} />}
        {phase === 'reading'  && <ReadingPhase answer={card.answer} timeLeft={timeLeft} timerSecs={timerSecs} />}
        {phase === 'discuss'  && <DiscussPhase onBack={onBack} onRevealToAll={onRevealToAll} />}
        {phase === 'reveal'   && <RevealPhase  answer={card.answer} onBack={onBack} onNext={onNext} isLast={isLast} />}
      </div>
    </div>
  )
}

/* ── Phase sub-components ── */

function WaitingPhase({ onShowSecret }: { onShowSecret: () => void }) {
  return (
    <div style={{ border: '2px dashed #ddd6fe', borderRadius: 20, padding: 20, background: '#faf5ff' }}>
      <p className="font-caveat text-center" style={{ fontSize: '1.25rem', color: '#a78bfa', marginBottom: 12 }}>
        🕵️ psst. truth teller only...
      </p>
      <button
        onClick={onShowSecret}
        className="btn-press w-full font-caveat font-bold text-white"
        style={{
          padding: '20px',
          borderRadius: 14,
          background: 'linear-gradient(135deg,#1e1b4b,#4c1d95)',
          fontSize: '1.75rem',
          border: 'none',
          cursor: 'pointer',
          letterSpacing: '0.02em',
        }}
      >
        👁 SHOW THE SECRET
      </button>
      <p className="font-caveat text-center italic" style={{ fontSize: '1rem', color: '#c4b5fd', marginTop: 10 }}>
        don&apos;t let anyone see you tap this
      </p>
    </div>
  )
}

function ReadingPhase({ answer, timeLeft, timerSecs }: { answer: string; timeLeft: number; timerSecs: number }) {
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!ringRef.current) return
    const frac   = Math.max(0, timeLeft / timerSecs)
    const offset = CIRCUMFERENCE * (1 - frac)
    ringRef.current.style.strokeDashoffset = String(offset)
    ringRef.current.style.stroke = frac > 0.5 ? '#2dd4bf' : frac > 0.2 ? '#fb923c' : '#ef4444'
  }, [timeLeft, timerSecs])

  return (
    <>
      <div
        className="fade-in"
        style={{ border: '2px solid #ddd6fe', borderRadius: 18, padding: 20, background: '#FFF8EE', marginBottom: 18 }}
      >
        <p style={{ color: '#374151', lineHeight: 1.65, fontSize: '0.97rem' }}>{answer}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 130, height: 130 }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
            <g transform="rotate(-90 65 65)">
              <circle
                ref={ringRef}
                cx="65" cy="65" r="45"
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="8"
                strokeLinecap="round"
                className="timer-ring-fill"
                style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: 0 }}
              />
            </g>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-caveat font-bold" style={{ fontSize: '2.6rem', color: '#1e293b', lineHeight: 1 }}>
              {Math.max(0, timeLeft)}
            </span>
            <span className="font-caveat" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>sec</span>
          </div>
        </div>
        <p className="font-caveat" style={{ marginTop: 8, color: '#94a3b8', fontSize: '1.1rem' }}>reading time</p>
      </div>
    </>
  )
}

function DiscussPhase({ onBack, onRevealToAll }: { onBack: () => void; onRevealToAll: () => void }) {
  return (
    <>
      <div style={{ border: '2px solid #99f6e4', borderRadius: 18, padding: 18, textAlign: 'center', background: '#f0fdfa', marginBottom: 18 }}>
        <p className="font-caveat font-bold" style={{ fontSize: '1.7rem', color: '#0f766e' }}>🎤 Time to bluff!</p>
        <p className="font-caveat" style={{ fontSize: '1.15rem', color: '#64748b', marginTop: 4 }}>The guesser picks who to hear from.</p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} className="btn-press font-caveat font-semibold" style={{ flex: 1, padding: 18, borderRadius: 14, border: '2px solid #e2e8f0', background: '#fff', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}>← Back</button>
        <button onClick={onRevealToAll} className="btn-press font-caveat font-bold" style={{ flex: 2, padding: 18, borderRadius: 14, background: '#2dd4bf', border: 'none', fontSize: '1.5rem', color: '#0f4c4c', cursor: 'pointer' }}>Reveal to All</button>
      </div>
    </>
  )
}

function RevealPhase({ answer, onBack, onNext, isLast }: { answer: string; onBack: () => void; onNext: () => void; isLast: boolean }) {
  return (
    <>
      <p className="font-caveat font-bold" style={{ fontSize: '1.2rem', color: '#2dd4bf', marginBottom: 6 }}>✦ THE TRUTH:</p>
      <div
        className="slide-up"
        style={{ borderRadius: 18, padding: 20, background: '#f0fdfa', borderLeft: '5px solid #2dd4bf', marginBottom: 18 }}
      >
        <p style={{ color: '#374151', lineHeight: 1.65, fontSize: '0.97rem' }}>{answer}</p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} className="btn-press font-caveat font-semibold" style={{ flex: 1, padding: 18, borderRadius: 14, border: '2px solid #e2e8f0', background: '#fff', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}>← Back</button>
        <button onClick={onNext} className="btn-press font-caveat font-bold text-white" style={{ flex: 2, padding: 18, borderRadius: 14, background: '#a855f7', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>
          {isLast ? 'End Game →' : 'Next Question →'}
        </button>
      </div>
    </>
  )
}
