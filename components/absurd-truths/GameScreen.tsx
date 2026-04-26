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

      {/* Top bar */}
      <div className="flex justify-between items-center px-8 pt-3 pb-1">
        <button onClick={onHome} className="btn-press font-caveat text-xl" style={{ color: '#c4b5fd' }}>
          ← home
        </button>
        <span className="font-caveat text-xl" style={{ color: '#94a3b8' }}>
          {index + 1} / {total}
        </span>
      </div>

      {/* ── All content in one centered column — no gap between card and controls ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-6 relative overflow-hidden">

        {/* Background doodle */}
        <span
          className="doodle font-caveat font-bold"
          style={{ fontSize: '22rem', color: '#a855f7', opacity: 0.03, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', lineHeight: 1 }}
        >?</span>

        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-6">

          {/* Word card */}
          <div
            className="rounded-3xl px-14 py-10 text-center shadow-sm border w-full"
            style={{ background: '#FFF8EE', borderColor: '#fde68a' }}
          >
            <p
              className="font-caveat font-bold text-gray-900 leading-tight"
              style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', overflowWrap: 'break-word' }}
            >
              {card.phrase}
            </p>
          </div>

          {/* Category pills — single row, no wrapping */}
          <div className="flex gap-3 justify-center">
            {card.categories.map(cat => (
              <span
                key={cat.label}
                className="inline-flex items-center gap-2 font-inter font-semibold whitespace-nowrap"
                style={{
                  padding: '10px 22px',
                  borderRadius: 999,
                  border: '2px solid #ddd6fe',
                  background: '#f5f3ff',
                  color: '#6d28d9',
                  fontSize: '1.05rem',
                }}
              >
                {cat.emoji} {cat.label}
              </span>
            ))}
          </div>

          {/* Phase controls — same width as card above */}
          <div className="w-full">
            {phase === 'waiting' && <WaitingPhase onShowSecret={onShowSecret} />}
            {phase === 'reading' && <ReadingPhase answer={card.answer} timeLeft={timeLeft} timerSecs={timerSecs} />}
            {phase === 'discuss' && <DiscussPhase onBack={onBack} onRevealToAll={onRevealToAll} />}
            {phase === 'reveal'  && <RevealPhase  answer={card.answer} onBack={onBack} onNext={onNext} isLast={isLast} />}
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Phase sub-components ── */

function WaitingPhase({ onShowSecret }: { onShowSecret: () => void }) {
  return (
    <div style={{ border: '2px dashed #ddd6fe', borderRadius: 20, padding: 24, background: '#faf5ff' }}>
      <p className="font-caveat text-center" style={{ fontSize: '1.3rem', color: '#a78bfa', marginBottom: 16 }}>
        🕵️ psst — truth teller only...
      </p>
      <button
        onClick={onShowSecret}
        className="btn-press w-full font-caveat font-bold text-white"
        style={{
          padding: '22px',
          borderRadius: 16,
          background: 'linear-gradient(135deg,#1e1b4b,#4c1d95)',
          fontSize: '2rem',
          border: 'none',
          cursor: 'pointer',
          letterSpacing: '0.03em',
        }}
      >
        👁 SHOW THE SECRET
      </button>
      <p className="font-caveat text-center italic" style={{ fontSize: '1.05rem', color: '#c4b5fd', marginTop: 12 }}>
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
    <div className="flex gap-6 items-start">
      {/* Answer text */}
      <div
        className="fade-in flex-1"
        style={{ border: '2px solid #ddd6fe', borderRadius: 18, padding: '20px 24px', background: '#FFF8EE' }}
      >
        <p className="font-inter" style={{ color: '#374151', lineHeight: 1.75, fontSize: '1.05rem' }}>{answer}</p>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center shrink-0">
        <div style={{ position: 'relative', width: 130, height: 130 }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
            <g transform="rotate(-90 65 65)">
              <circle
                ref={ringRef}
                cx="65" cy="65" r="45"
                fill="none" stroke="#2dd4bf" strokeWidth="8" strokeLinecap="round"
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
    </div>
  )
}

function DiscussPhase({ onBack, onRevealToAll }: { onBack: () => void; onRevealToAll: () => void }) {
  return (
    <>
      <div style={{ border: '2px solid #99f6e4', borderRadius: 18, padding: '18px 24px', textAlign: 'center', background: '#f0fdfa', marginBottom: 16 }}>
        <p className="font-caveat font-bold" style={{ fontSize: '1.9rem', color: '#0f766e' }}>🎤 Time to bluff!</p>
        <p className="font-inter" style={{ fontSize: '1rem', color: '#64748b', marginTop: 4 }}>The guesser picks who to hear from.</p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} className="btn-press font-caveat font-semibold"
          style={{ flex: 1, padding: '18px', borderRadius: 14, border: '2px solid #e2e8f0', background: '#fff', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>
          ← Back
        </button>
        <button onClick={onRevealToAll} className="btn-press font-caveat font-bold"
          style={{ flex: 2, padding: '18px', borderRadius: 14, background: '#2dd4bf', border: 'none', fontSize: '1.6rem', color: '#0f4c4c', cursor: 'pointer' }}>
          Reveal to All
        </button>
      </div>
    </>
  )
}

function RevealPhase({ answer, onBack, onNext, isLast }: { answer: string; onBack: () => void; onNext: () => void; isLast: boolean }) {
  return (
    <>
      <p className="font-caveat font-bold" style={{ fontSize: '1.3rem', color: '#2dd4bf', marginBottom: 8 }}>✦ THE TRUTH:</p>
      <div
        className="slide-up"
        style={{ borderRadius: 18, padding: '20px 24px', background: '#f0fdfa', borderLeft: '5px solid #2dd4bf', marginBottom: 16 }}
      >
        <p className="font-inter" style={{ color: '#374151', lineHeight: 1.75, fontSize: '1.05rem' }}>{answer}</p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} className="btn-press font-caveat font-semibold"
          style={{ flex: 1, padding: '18px', borderRadius: 14, border: '2px solid #e2e8f0', background: '#fff', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>
          ← Back
        </button>
        <button onClick={onNext} className="btn-press font-caveat font-bold text-white"
          style={{ flex: 2, padding: '18px', borderRadius: 14, background: '#a855f7', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
          {isLast ? 'End Game →' : 'Next Question →'}
        </button>
      </div>
    </>
  )
}
