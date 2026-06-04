
'use client'

import { useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import type { DeckType } from '@bsking/game-engine'

export type { DeckType }

const ROUND_OPTIONS = [5, 10, 20, 30]
const TIMER_OPTIONS = [0, 15, 30, 45, 60]
const TILTS = [-1.2, 0.7, -0.6, 0.9, -1, 0.7, -0.8, 1]

interface DeckInfo {
  key: string
  glyph: string
  title: string
  sub: string
  hints: string[]
  count: number
  comingSoon?: boolean
}

const DECKS: DeckInfo[] = [
  { key: 'absurd-truths',   glyph: '🧠', title: 'Absurd Truths',   sub: 'real words that sound completely fake',            hints: ['🦑','💃','🍳'], count: 48 },
  { key: 'chinese-sayings', glyph: '🐉', title: 'Chinese Sayings',  sub: 'ancient wisdom, gloriously misremembered',          hints: ['🥟','📜','🀄'], count: 40 },
  { key: 'medical',         glyph: '🩺', title: 'Medical Marvels',  sub: "syndromes you'll swear we made up",                 hints: ['🧠','🦴','💊'], count: 36 },
  { key: 'science',         glyph: '🔬', title: 'Mad Science',      sub: 'real phenomena, gloriously unhinged',               hints: ['🧪','🦠','🌋'], count: 44, comingSoon: true },
  { key: 'history',         glyph: '📜', title: 'Bad History',      sub: 'things that absolutely happened. probably.',        hints: ['🏛️','⚔️','👑'], count: 42, comingSoon: true },
  { key: 'geography',       glyph: '🌍', title: 'Cursed Places',    sub: 'spots too weird to be on a map',                   hints: ['🗺️','🏔️','🏝️'], count: 38, comingSoon: true },
  { key: 'art',             glyph: '🎨', title: 'Fancy Nonsense',   sub: 'pretentious art facts, exquisitely faked',          hints: ['🖼️','🎭','🎻'], count: 34, comingSoon: true },
  { key: 'space',           glyph: '🪐', title: 'Deep Space',       sub: 'cosmic facts that sound like lies',                 hints: ['🌠','🛰️','🌑'], count: 30, comingSoon: true },
]

interface Props {
  onStart: (rounds: number, timerSecs: number, deckType: DeckType) => void
}

function DeckCard({ deck, selected, onSelect, tilt }: {
  deck: DeckInfo
  selected: boolean
  onSelect: () => void
  tilt: number
}) {
  return (
    <button
      data-deck={deck.key}
      onClick={deck.comingSoon ? undefined : onSelect}
      className={`ts-deck-card${selected ? ' is-selected' : ''}`}
      style={{
        ['--deck-tilt' as string]: `${tilt}deg`,
        transform: `rotate(${tilt}deg)`,
        opacity: deck.comingSoon ? 0.55 : 1,
        cursor: deck.comingSoon ? 'default' : 'pointer',
        width: '100%',
      }}
    >
      <span className="ts-deck-card__check" aria-hidden="true">✓</span>
      <div className="ts-deck-card__top">
        <div className="ts-deck-card__glyph">{deck.glyph}</div>
        <div className="ts-deck-card__titles">
          <div className="ts-deck-card__title">{deck.title}</div>
          <div className="ts-deck-card__sub">
            {deck.comingSoon
              ? <em style={{ color: '#94a3b8', fontStyle: 'normal' }}>coming soon</em>
              : deck.sub}
          </div>
        </div>
      </div>
      <div className="ts-deck-card__bot">
        <span className="ts-deck-card__meta">{deck.count} cards</span>
        <span className="ts-deck-card__hints">
          {deck.hints.map((h, i) => <span key={i} className="ts-deck-card__hint">{h}</span>)}
        </span>
      </div>
    </button>
  )
}

function OptionRow({ label, options, value, onChange, fmt }: {
  label: string
  options: number[]
  value: number
  onChange: (v: number) => void
  fmt?: (v: number) => string
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ textAlign: 'center', margin: '0 0 10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', color: '#94a3b8' }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {options.map(o => {
          const on = o === value
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              className="btn-press"
              style={{
                fontFamily: 'var(--font-caveat), cursive',
                fontWeight: 700,
                fontSize: '1.5rem',
                lineHeight: 1,
                minWidth: 52,
                padding: '10px 14px',
                cursor: 'pointer',
                borderRadius: 14,
                border: `2px solid ${on ? 'var(--deck-accent)' : '#e2e8f0'}`,
                background: on ? 'var(--deck-soft)' : '#fff',
                color: on ? 'var(--deck-ink)' : '#64748b',
                boxShadow: on ? '3px 3px 0 var(--deck-shadow)' : 'none',
                transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
              }}
            >
              {fmt ? fmt(o) : o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SetupScreen({ onStart }: Props) {
  const posthog = usePostHog()
  const [selectedDeck, setSelectedDeck] = useState<DeckType>('absurd-truths')
  const [rounds, setRounds] = useState(10)
  const [timer, setTimer] = useState(30)

  const selected = DECKS.find(d => d.key === selectedDeck)!

  function handleDeckSelect(deck: DeckInfo) {
    if (deck.comingSoon) return
    posthog.capture('deck_selected', { deck_type: deck.key })
    setSelectedDeck(deck.key as DeckType)
  }

  function handleStart() {
    posthog.capture('setup_confirmed', { rounds, timer_secs: timer, deck_type: selectedDeck })
    onStart(rounds, timer, selectedDeck)
  }

  return (
    <div
      data-deck={selectedDeck}
      style={{
        position: 'relative',
        minHeight: '100vh',
        padding: 'clamp(20px,3vw,28px) clamp(16px,3vw,20px) 140px',
        overflow: 'hidden',
        background: '#FFF9EC',
      }}
    >
      {/* Background doodles */}
      <span className="doodle font-caveat font-bold" style={{ fontSize: 'clamp(6rem,18vw,18rem)', color: '#d8401e', opacity: 0.04, top: '-3%', left: '-2%', transform: 'rotate(-14deg)', lineHeight: 1 }}>?</span>
      <span className="doodle font-caveat font-bold" style={{ fontSize: 'clamp(5rem,12vw,13rem)', color: '#6a9a26', opacity: 0.05, top: '1%', right: '2%', transform: 'rotate(10deg)', lineHeight: 1 }}>!</span>
      <span className="doodle font-caveat" style={{ fontStyle: 'italic', fontSize: 'clamp(1.6rem,4vw,4rem)', color: '#2f8fd6', opacity: 0.06, top: '52%', left: '1%', transform: 'rotate(-8deg)' }}>pick one…</span>
      <svg className="doodle" style={{ top: '7%', left: '42%', opacity: 0.06 }} width="52" height="52" viewBox="0 0 38 38" fill="none">
        <path d="M19 2 L22.5 12.5 L34 12.5 L25 19.5 L28.5 30 L19 23.5 L9.5 30 L13 19.5 L4 12.5 L15.5 12.5 Z" stroke="#f5b820" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
      <svg className="doodle" style={{ top: '40%', right: '2%', opacity: 0.07 }} width="64" height="64" viewBox="0 0 36 36" fill="none">
        <path d="M18 4 C27 4 32 11 32 18 C32 27 27 32 18 32 C9 32 4 27 4 18 C4 9 9 4 18 4" stroke="#d6457f" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round"/>
      </svg>
      <span className="doodle font-caveat" style={{ fontSize: '2rem', color: '#4a57c4', opacity: 0.08, bottom: '16%', left: '5%', transform: 'rotate(-12deg)' }}>✦</span>
      <span className="doodle font-caveat" style={{ fontSize: '1.7rem', color: '#14a08a', opacity: 0.08, bottom: '20%', right: '7%', transform: 'rotate(18deg)' }}>✦</span>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 className="font-caveat" style={{ fontWeight: 700, fontSize: 'clamp(2.6rem,7vw,4.4rem)', color: '#d8401e', lineHeight: 1, transform: 'rotate(-1deg)', margin: 0 }}>
            Truthsayer
          </h1>
          <svg width="210" height="13" viewBox="0 0 280 14" fill="none" style={{ display: 'block', margin: '4px auto 0' }}>
            <path d="M0 7 Q35 1 70 7 Q105 13 140 7 Q175 1 210 7 Q245 13 280 7" stroke="#6a9a26" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
          <p className="font-caveat" style={{ fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(1.05rem,2.6vw,1.5rem)', color: '#94a3b8', marginTop: 2 }}>
            a game of beautiful lies
          </p>
          <p className="font-caveat" style={{ fontWeight: 700, fontSize: 'clamp(1.5rem,3.4vw,2.1rem)', color: '#64748b', marginTop: 16, marginBottom: 0, transform: 'rotate(0.5deg)' }}>
            Pick a pack.
          </p>
          <p className="font-inter" style={{ fontWeight: 500, fontSize: 'clamp(0.78rem,1.8vw,0.95rem)', color: '#94a3b8', marginTop: 6 }}>
            every deck is 80% true and 100% ridiculous
          </p>
        </div>

        {/* Deck shelf */}
        <section style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 4px 16px' }}>
            <span className="ts-pack-tag">🎉 Eight packs of nonsense</span>
            <span style={{ flex: 1, height: 0, borderTop: '2px dashed #e2e8f0' }} />
            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>pick one</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {DECKS.map((deck, i) => (
              <DeckCard
                key={deck.key}
                deck={deck}
                selected={selectedDeck === deck.key}
                onSelect={() => handleDeckSelect(deck)}
                tilt={TILTS[i]}
              />
            ))}
          </div>
        </section>

        {/* Rounds + Timer */}
        <div style={{
          display: 'flex',
          gap: 18,
          marginTop: 30,
          padding: 'clamp(14px,2.5vw,18px) clamp(12px,2vw,16px)',
          borderRadius: 20,
          border: '2px solid #e2e8f0',
          background: '#FFF1D6',
        }}>
          <OptionRow label="How many rounds?" options={ROUND_OPTIONS} value={rounds} onChange={setRounds} />
          <div style={{ width: 2, background: '#e2e8f0', borderRadius: 2, flexShrink: 0 }} />
          <OptionRow
            label="Reading timer?"
            options={TIMER_OPTIONS}
            value={timer}
            onChange={setTimer}
            fmt={o => o === 0 ? 'None' : `${o}s`}
          />
        </div>
      </div>

      {/* Sticky dock */}
      <div
        data-deck={selectedDeck}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          padding: 'clamp(12px,2vw,14px) clamp(16px,5vw,40px)',
          background: '#FFF1D6',
          borderTop: '2.5px solid var(--deck-border)',
          boxShadow: '0 -6px 22px rgba(63,42,20,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 46, height: 46, flexShrink: 0, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
            background: 'var(--deck-soft)', border: '2px solid var(--deck-border)',
          }}>
            {selected.glyph}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.62rem', letterSpacing: '.06em', textTransform: 'uppercase', color: '#94a3b8' }}>
              Playing with
            </div>
            <div className="font-caveat" style={{ fontWeight: 700, fontSize: '1.5rem', lineHeight: 1, color: 'var(--deck-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selected.title}
            </div>
          </div>
        </div>
        <button
          onClick={handleStart}
          className="btn-press font-caveat"
          style={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
            fontWeight: 700,
            fontSize: 'clamp(1.2rem,3vw,1.7rem)',
            lineHeight: 1,
            color: 'var(--deck-on-accent)',
            background: 'var(--deck-accent)',
            border: '3px solid var(--deck-shadow)',
            borderRadius: '8px 26px 6px 22px / 22px 6px 26px 8px',
            boxShadow: '4px 4px 0 var(--deck-shadow)',
            transform: 'rotate(-1deg)',
            padding: 'clamp(10px,2vw,13px) clamp(22px,5vw,46px)',
            cursor: 'pointer',
          }}
        >
          LET&apos;S GO →
        </button>
      </div>
    </div>
  )
}
