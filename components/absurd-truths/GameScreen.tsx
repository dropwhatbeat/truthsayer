'use client'

import { useSelector } from '@xstate/react'
import type { Card } from '@bsking/game-engine'
import type { ActorRefFrom } from 'xstate'
import type { gameMachine } from '@bsking/game-engine'
import Timer from './Timer'
import WordCard from './WordCard'
import CategoryPills from './CategoryPills'

type GameActor = ActorRefFrom<typeof gameMachine>

interface Props {
  actor: GameActor
  card: Card
  index: number
  total: number
  deckType: string
}

export default function GameScreen({ actor, card, index, total, deckType }: Props) {
  const phase = useSelector(actor, (state) => {
    if (state.matches({ playing: 'waiting' })) return 'waiting'
    if (state.matches({ playing: 'reading' })) return 'reading'
    if (state.matches({ playing: 'discuss' })) return 'discuss'
    if (state.matches({ playing: 'reveal' })) return 'reveal'
    return 'waiting'
  })

  const timeLeft = useSelector(actor, (state) => state.context.timeLeft)
  const timerSecs = useSelector(actor, (state) => state.context.timerSecs)

  const pct = ((index + 1) / total) * 100
  const isLast = index >= total - 1

  return (
    <div className="h-screen flex flex-col" style={{ background: '#FFF9EC' }} data-deck={deckType}>
      {/* Progress bar — deck-themed */}
      <div style={{ height: 6, background: 'var(--deck-soft)', width: '100%', flexShrink: 0 }}>
        <div
          className="progress-bar-fill"
          style={{ height: '100%', background: 'var(--deck-accent)', width: `${pct}%`, borderRadius: '0 4px 4px 0' }}
        />
      </div>

      <div className="flex justify-between items-center px-4 md:px-8 pt-3 pb-2 shrink-0">
        <button
          onClick={() => { actor.send({ type: 'END' }) }}
          className="btn-press font-caveat text-lg md:text-xl"
          style={{ color: '#64748b' }}
        >
          ← home
        </button>
        <span className="font-caveat text-lg md:text-xl" style={{ color: '#94a3b8' }}>
          {index + 1} / {total}
        </span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-4 md:px-8 pt-2 md:pt-4 pb-16 md:pb-24 gap-3 md:gap-4 relative overflow-hidden">
        <span
          className="doodle font-caveat font-bold"
          style={{ fontSize: '20rem', color: '#d8401e', opacity: 0.03, top: '40%', left: '50%', transform: 'translate(-50%,-50%)', lineHeight: 1 }}
        >?</span>

        <WordCard card={card} />
        <CategoryPills categories={card.categories ?? []} />

        <div className="relative z-10 w-full max-w-3xl mx-auto flex-1 min-h-0 flex flex-col">
          {phase === 'waiting' && (
            <WaitingPhase onShowSecret={() => { actor.send({ type: 'SHOW_SECRET' }) }} />
          )}
          {phase === 'reading' && (
            <ReadingPhase answer={card.answer} timeLeft={timeLeft} timerSecs={timerSecs} />
          )}
          {phase === 'discuss' && (
            <DiscussPhase
              onBack={() => { actor.send({ type: 'BACK' }) }}
              onRevealToAll={() => { actor.send({ type: 'REVEAL_ALL' }) }}
            />
          )}
          {phase === 'reveal' && (
            <RevealPhase
              answer={card.answer}
              onBack={() => { actor.send({ type: 'BACK' }) }}
              onNext={() => { actor.send({ type: 'NEXT_CARD' }) }}
              isLast={isLast}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function WaitingPhase({ onShowSecret }: { onShowSecret: () => void }) {
  return (
    <div
      className="flex-1 flex flex-col justify-center"
      style={{
        border: '2px dashed var(--deck-border)',
        borderRadius: 20,
        padding: 'clamp(24px, 4vw, 40px) clamp(20px, 3vw, 32px)',
        background: 'var(--deck-pale)',
      }}
    >
      <p className="font-caveat text-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', color: 'var(--deck-ink)', opacity: 0.7, marginBottom: 14 }}>
        🕵️ psst — truth teller only...
      </p>
      {/* Secret-peek button stays universal dark indigo — per design system */}
      <button
        onClick={onShowSecret}
        className="btn-press w-full font-caveat font-bold"
        style={{
          padding: 'clamp(18px, 3vw, 28px)',
          borderRadius: 16,
          background: 'linear-gradient(135deg,#1e1b4b,#4c1d95)',
          border: '3px solid #3b0764',
          boxShadow: '4px 4px 0 #3b0764, inset 0 0 0 2px rgba(167,139,250,0.18)',
          color: '#e9d5ff',
          fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
          cursor: 'pointer',
          letterSpacing: '0.03em',
        }}
      >
        👁 SHOW THE SECRET
      </button>
      <p className="font-caveat text-center italic" style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', color: '#a78bfa', marginTop: 10 }}>
        don&apos;t let anyone see you tap this
      </p>
    </div>
  )
}

function ReadingPhase({ answer, timeLeft, timerSecs }: { answer: string; timeLeft: number; timerSecs: number }) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 flex-1 min-h-0">
      <div
        className="fade-in flex-1 min-h-0 overflow-y-auto"
        style={{
          border: '2px solid var(--deck-border)',
          borderRadius: 18,
          padding: 'clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 24px)',
          background: '#FFF8EE',
        }}
      >
        <p className="font-inter" style={{ color: '#374151', lineHeight: 1.75, fontSize: 'clamp(0.88rem, 1.8vw, 1.05rem)' }}>
          {answer}
        </p>
      </div>
      <Timer seconds={timeLeft} total={timerSecs} />
    </div>
  )
}

function DiscussPhase({ onBack, onRevealToAll }: { onBack: () => void; onRevealToAll: () => void }) {
  return (
    <div className="flex-1 flex flex-col gap-3">
      <div
        className="flex-1 flex flex-col justify-center"
        style={{
          border: '2px solid var(--deck-border)',
          borderRadius: 18,
          padding: 'clamp(18px, 3vw, 28px)',
          textAlign: 'center',
          background: 'var(--deck-soft)',
        }}
      >
        <p className="font-caveat font-bold" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 1.9rem)', color: 'var(--deck-ink)' }}>🎤 Time to bluff!</p>
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
          style={{
            flex: 2,
            padding: 'clamp(14px, 2vw, 18px)',
            borderRadius: 14,
            background: 'var(--deck-accent)',
            border: '3px solid var(--deck-shadow)',
            boxShadow: '3px 3px 0 var(--deck-shadow)',
            color: 'var(--deck-on-accent)',
            fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
            cursor: 'pointer',
          }}>
          Reveal to All
        </button>
      </div>
    </div>
  )
}

function RevealPhase({ answer, onBack, onNext, isLast }: { answer: string; onBack: () => void; onNext: () => void; isLast: boolean }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      <p className="font-caveat font-bold shrink-0" style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--deck-accent)' }}>✦ THE TRUTH:</p>
      <div
        className="slide-up flex-1 min-h-0 overflow-y-auto"
        style={{
          borderRadius: 18,
          padding: 'clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 24px)',
          background: 'var(--deck-pale)',
          borderTop: '2px solid var(--deck-border)',
          borderRight: '2px solid var(--deck-border)',
          borderBottom: '2px solid var(--deck-border)',
          borderLeft: '5px solid var(--deck-accent)',
        }}
      >
        <p className="font-inter" style={{ color: '#374151', lineHeight: 1.75, fontSize: 'clamp(0.88rem, 1.8vw, 1.05rem)' }}>{answer}</p>
      </div>
      <div className="flex gap-3 shrink-0">
        <button onClick={onBack} className="btn-press font-caveat font-semibold"
          style={{ flex: 1, padding: 'clamp(14px, 2vw, 18px)', borderRadius: 14, border: '2px solid #e2e8f0', background: '#fff', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', color: '#64748b', cursor: 'pointer' }}>
          ← Back
        </button>
        <button onClick={onNext} className="btn-press font-caveat font-bold"
          style={{
            flex: 2,
            padding: 'clamp(14px, 2vw, 18px)',
            borderRadius: 14,
            background: 'var(--deck-accent)',
            border: '3px solid var(--deck-shadow)',
            boxShadow: '3px 3px 0 var(--deck-shadow)',
            color: 'var(--deck-on-accent)',
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            cursor: 'pointer',
          }}>
          {isLast ? 'End Game →' : 'Next Question →'}
        </button>
      </div>
    </div>
  )
}
