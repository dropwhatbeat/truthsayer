'use client'

import { useEffect } from 'react'
import { useSelector } from '@xstate/react'
import { usePostHog } from 'posthog-js/react'
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
  const posthog = usePostHog()

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

  useEffect(() => {
    posthog.capture('card_viewed', { card_index: index + 1, total_cards: total, phrase: card.phrase, deck_type: deckType })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.phrase, index])

  function track(event: string, props?: Record<string, unknown>) {
    posthog.capture(event, { card_index: index + 1, phrase: card.phrase, deck_type: deckType, ...props })
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#FFFDF7' }}>
      <div style={{ height: 6, background: '#ede9fe', width: '100%', flexShrink: 0 }}>
        <div
          className="progress-bar-fill"
          style={{ height: '100%', background: '#a855f7', width: `${pct}%`, borderRadius: '0 4px 4px 0' }}
        />
      </div>

      <div className="flex justify-between items-center px-4 md:px-8 pt-3 pb-2 shrink-0">
        <button onClick={() => { track('game_home_clicked'); actor.send({ type: 'END' }) }} className="btn-press font-caveat text-lg md:text-xl" style={{ color: '#c4b5fd' }}>
          ← home
        </button>
        <span className="font-caveat text-lg md:text-xl" style={{ color: '#94a3b8' }}>
          {index + 1} / {total}
        </span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-4 md:px-8 pt-2 md:pt-4 pb-16 md:pb-24 gap-3 md:gap-4 relative overflow-hidden">
        <span
          className="doodle font-caveat font-bold"
          style={{ fontSize: '20rem', color: '#a855f7', opacity: 0.03, top: '40%', left: '50%', transform: 'translate(-50%,-50%)', lineHeight: 1 }}
        >?</span>

        <WordCard card={card} />
        <CategoryPills categories={card.categories ?? []} />

        <div className="relative z-10 w-full max-w-3xl mx-auto flex-1 min-h-0 flex flex-col">
          {phase === 'waiting' && (
            <WaitingPhase onShowSecret={() => { track('secret_shown'); actor.send({ type: 'SHOW_SECRET' }) }} />
          )}
          {phase === 'reading' && (
            <ReadingPhase answer={card.answer} timeLeft={timeLeft} timerSecs={timerSecs} />
          )}
          {phase === 'discuss' && (
            <DiscussPhase
              onBack={() => { track('back_clicked', { from_phase: 'discuss' }); actor.send({ type: 'BACK' }) }}
              onRevealToAll={() => { track('reveal_to_all_clicked'); actor.send({ type: 'REVEAL_ALL' }) }}
            />
          )}
          {phase === 'reveal' && (
            <RevealPhase
              answer={card.answer}
              onBack={() => { track('back_clicked', { from_phase: 'reveal' }); actor.send({ type: 'BACK' }) }}
              onNext={() => { track(isLast ? 'game_end_clicked' : 'next_card_clicked'); actor.send({ type: 'NEXT_CARD' }) }}
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
  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 flex-1 min-h-0">
      <div
        className="fade-in flex-1 min-h-0 overflow-y-auto"
        style={{ border: '2px solid #ddd6fe', borderRadius: 18, padding: 'clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 24px)', background: '#FFF8EE' }}
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
