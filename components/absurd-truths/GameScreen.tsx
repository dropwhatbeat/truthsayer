'use client'

import { useEffect, useMemo, useRef } from 'react'
import { usePostHog } from 'posthog-js/react'
import type { Card } from '@/data/absurdTruthsDeck'

export type Phase = 'waiting' | 'reading' | 'discuss' | 'reveal'

interface Props {
  card: Card
  phase: Phase
  index: number
  total: number
  timeLeft: number
  timerSecs: number
  deckType: string
  onShowSecret: () => void
  onRevealToAll: () => void
  onBack: () => void
  onNext: () => void
  onHome: () => void
}

const CIRCUMFERENCE = 2 * Math.PI * 45

export default function GameScreen({
  card, phase, index, total, timeLeft, timerSecs, deckType,
  onShowSecret, onRevealToAll, onBack, onNext, onHome,
}: Props) {
  const posthog = usePostHog()
  const pct    = ((index + 1) / total) * 100
  const isLast = index >= total - 1

  useEffect(() => {
    posthog.capture('card_viewed', { card_index: index + 1, total_cards: total, phrase: card.phrase, deck_type: deckType })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.phrase, index])

  function track(event: string, props?: Record<string, unknown>) {
    posthog.capture(event, { card_index: index + 1, phrase: card.phrase, deck_type: deckType, ...props })
  }

  const shuffledCategories = useMemo(() => {
    if (!card.categories) return []
    const cats = [...card.categories]
    for (let i = cats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cats[i], cats[j]] = [cats[j], cats[i]]
    }
    return cats
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.phrase])

  return (
    /* h-screen keeps the whole game in the viewport — no page scroll */
    <div className="h-screen flex flex-col" style={{ background: '#FFFDF7' }}>

      {/* Progress bar */}
      <div style={{ height: 6, background: '#ede9fe', width: '100%', flexShrink: 0 }}>
        <div
          className="progress-bar-fill"
          style={{ height: '100%', background: '#a855f7', width: `${pct}%`, borderRadius: '0 4px 4px 0' }}
        />
      </div>

      {/* Top bar */}
      <div className="flex justify-between items-center px-4 md:px-8 pt-3 pb-2 shrink-0">
        <button onClick={() => { track('game_home_clicked'); onHome() }} className="btn-press font-caveat text-lg md:text-xl" style={{ color: '#c4b5fd' }}>
          ← home
        </button>
        <span className="font-caveat text-lg md:text-xl" style={{ color: '#94a3b8' }}>
          {index + 1} / {total}
        </span>
      </div>

      {/* ── Main content: top-aligned, fills remaining height ── */}
      <div className="flex-1 min-h-0 flex flex-col px-4 md:px-8 pt-2 md:pt-4 pb-16 md:pb-24 gap-3 md:gap-4 relative overflow-hidden">

        {/* Background doodle */}
        <span
          className="doodle font-caveat font-bold"
          style={{ fontSize: '20rem', color: '#a855f7', opacity: 0.03, top: '40%', left: '50%', transform: 'translate(-50%,-50%)', lineHeight: 1 }}
        >?</span>

        {/* Word card — compact, sits near top */}
        <div className="relative z-10 w-full max-w-3xl mx-auto shrink-0">
          <div
            className="rounded-3xl px-6 py-4 md:px-10 md:py-5 text-center shadow-sm border"
            style={{ background: '#FFF8EE', borderColor: '#fde68a' }}
          >
            <p
              className="font-caveat font-bold text-gray-900 leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', overflowWrap: 'break-word' }}
            >
              {card.phrase}
            </p>
          </div>
        </div>

        {/* Category pills — only shown for decks that include categories */}
        {shuffledCategories.length > 0 && (
          <div className="relative z-10 flex flex-wrap md:flex-nowrap gap-2 md:gap-3 justify-center w-full max-w-3xl mx-auto shrink-0">
            {shuffledCategories.map(cat => (
              <span
                key={cat.label}
                className="inline-flex items-center gap-1.5 font-inter font-semibold whitespace-nowrap"
                style={{
                  padding: '7px 18px',
                  borderRadius: 999,
                  border: '2px solid #ddd6fe',
                  background: '#f5f3ff',
                  color: '#6d28d9',
                  fontSize: 'clamp(0.8rem, 1.8vw, 1rem)',
                }}
              >
                {cat.emoji} {cat.label}
              </span>
            ))}
          </div>
        )}

        {/* Phase controls — flex-1 so they fill ALL remaining space */}
        <div className="relative z-10 w-full max-w-3xl mx-auto flex-1 min-h-0 flex flex-col">
          {phase === 'waiting' && <WaitingPhase onShowSecret={() => { track('secret_shown'); onShowSecret() }} />}
          {phase === 'reading' && (
            <ReadingPhase
              answer={card.answer}
              timeLeft={timeLeft}
              timerSecs={timerSecs}
            />
          )}
          {phase === 'discuss' && (
            <DiscussPhase
              onBack={() => { track('back_clicked', { from_phase: 'discuss' }); onBack() }}
              onRevealToAll={() => { track('reveal_to_all_clicked'); onRevealToAll() }}
            />
          )}
          {phase === 'reveal'  && (
            <RevealPhase
              answer={card.answer}
              onBack={() => { track('back_clicked', { from_phase: 'reveal' }); onBack() }}
              onNext={() => { track(isLast ? 'game_end_clicked' : 'next_card_clicked'); onNext() }}
              isLast={isLast}
            />
          )}
        </div>

      </div>
    </div>
  )
}

/* ── Phase sub-components ── */

function WaitingPhase({ onShowSecret }: { onShowSecret: () => void }) {
  return (
    <div
      className="flex-1 flex flex-col justify-center"
      style={{ border: '2px dashed #ddd6fe', borderRadius: 20, padding: 'clamp(24px, 4vw, 40px) clamp(20px, 3vw, 32px)', background: '#faf5ff' }}
    >
      <p className="font-caveat text-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', color: '#a78bfa', marginBottom: 14 }}>
        🕵️ psst — truth teller only...
      </p>
      <button
        onClick={onShowSecret}
        className="btn-press w-full font-caveat font-bold text-white"
        style={{
          padding: 'clamp(18px, 3vw, 28px)',
          borderRadius: 16,
          background: 'linear-gradient(135deg,#1e1b4b,#4c1d95)',
          fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
          border: 'none',
          cursor: 'pointer',
          letterSpacing: '0.03em',
        }}
      >
        👁 SHOW THE SECRET
      </button>
      <p className="font-caveat text-center italic" style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', color: '#c4b5fd', marginTop: 10 }}>
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
    /* flex-1 min-h-0: fills all remaining height after word card + categories */
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 flex-1 min-h-0">

      {/* Answer text — grows to fill available height, scrolls only if still too long */}
      <div
        className="fade-in flex-1 min-h-0 overflow-y-auto"
        style={{ border: '2px solid #ddd6fe', borderRadius: 18, padding: 'clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 24px)', background: '#FFF8EE' }}
      >
        <p className="font-inter" style={{ color: '#374151', lineHeight: 1.75, fontSize: 'clamp(0.88rem, 1.8vw, 1.05rem)' }}>
          {answer}
        </p>
      </div>

      {/* Timer — fixed size on desktop, compact row on mobile */}
      <div className="flex flex-row md:flex-col items-center justify-center gap-3 md:gap-0 shrink-0 md:py-2">
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 130 130">
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
            <span className="font-caveat font-bold" style={{ fontSize: '2.4rem', color: '#1e293b', lineHeight: 1 }}>
              {Math.max(0, timeLeft)}
            </span>
            <span className="font-caveat" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>sec</span>
          </div>
        </div>
        <p className="font-caveat md:mt-1.5" style={{ color: '#94a3b8', fontSize: '1rem' }}>reading time</p>
      </div>
    </div>
  )
}

function DiscussPhase({ onBack, onRevealToAll }: { onBack: () => void; onRevealToAll: () => void }) {
  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="flex-1 flex flex-col justify-center" style={{ border: '2px solid #99f6e4', borderRadius: 18, padding: 'clamp(18px, 3vw, 28px)', textAlign: 'center', background: '#f0fdfa' }}>
        <p className="font-caveat font-bold" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 1.9rem)', color: '#0f766e' }}>🎤 Time to bluff!</p>
        <p className="font-inter" style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', color: '#64748b', marginTop: 4 }}>
          The guesser picks who to hear from.
        </p>
      </div>
      <div className="shrink-0" style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} className="btn-press font-caveat font-semibold"
          style={{ flex: 1, padding: 'clamp(14px, 2vw, 18px)', borderRadius: 14, border: '2px solid #e2e8f0', background: '#fff', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', color: '#64748b', cursor: 'pointer' }}>
          ← Back
        </button>
        <button onClick={onRevealToAll} className="btn-press font-caveat font-bold"
          style={{ flex: 2, padding: 'clamp(14px, 2vw, 18px)', borderRadius: 14, background: '#2dd4bf', border: 'none', fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)', color: '#0f4c4c', cursor: 'pointer' }}>
          Reveal to All
        </button>
      </div>
    </div>
  )
}

function RevealPhase({ answer, onBack, onNext, isLast }: { answer: string; onBack: () => void; onNext: () => void; isLast: boolean }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      <p className="font-caveat font-bold shrink-0" style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#2dd4bf' }}>✦ THE TRUTH:</p>

      {/* Answer fills remaining height */}
      <div
        className="slide-up flex-1 min-h-0 overflow-y-auto"
        style={{ borderRadius: 18, padding: 'clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 24px)', background: '#f0fdfa', borderLeft: '5px solid #2dd4bf' }}
      >
        <p className="font-inter" style={{ color: '#374151', lineHeight: 1.75, fontSize: 'clamp(0.88rem, 1.8vw, 1.05rem)' }}>{answer}</p>
      </div>

      <div className="flex gap-3 shrink-0">
        <button onClick={onBack} className="btn-press font-caveat font-semibold"
          style={{ flex: 1, padding: 'clamp(14px, 2vw, 18px)', borderRadius: 14, border: '2px solid #e2e8f0', background: '#fff', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', color: '#64748b', cursor: 'pointer' }}>
          ← Back
        </button>
        <button onClick={onNext} className="btn-press font-caveat font-bold text-white"
          style={{ flex: 2, padding: 'clamp(14px, 2vw, 18px)', borderRadius: 14, background: '#a855f7', border: 'none', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', cursor: 'pointer' }}>
          {isLast ? 'End Game →' : 'Next Question →'}
        </button>
      </div>
    </div>
  )
}
