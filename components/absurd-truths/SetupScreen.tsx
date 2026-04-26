
'use client'

import { useEffect, useRef, useState, forwardRef } from 'react'

const ROUND_OPTIONS = [5, 10, 20, 30]
const TIMER_OPTIONS = [15, 30, 45, 60]

export type DeckType = 'absurd-truths' | 'chinese-sayings' | 'medical'

interface Props {
  onStart: (rounds: number, timerSecs: number, deckType: DeckType) => void
}

const REEL_ITEM_H = 38

function getReelValue(el: HTMLDivElement, options: number[]) {
  const idx = Math.max(0, Math.min(Math.round(el.scrollTop / REEL_ITEM_H), options.length - 1))
  return options[idx]
}

function ArrowRight({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center shrink-0" style={{ width: 40 }}>
      <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
        <path d="M2 14 Q10 5 20 14 Q30 23 38 14" stroke={color} strokeWidth="2.8" strokeLinecap="round" fill="none"/>
        <path d="M30 9 L38 14 L30 19" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </div>
  )
}

function Badge({ n, color }: { n: number; color: string }) {
  return (
    <div className="flex items-center justify-center font-caveat font-bold shrink-0"
      style={{ width: 22, height: 22, borderRadius: '50%', background: color, color: '#fff', fontSize: '0.8rem' }}>
      {n}
    </div>
  )
}

/* ── Mobile: compact 2×2 tiles ── */
const MOBILE_STEPS = [
  { n: 1, icon: '🕵️', topBg: '#ede9fe', bottomBg: '#faf5ff', border: '#ddd6fe', accent: '#a855f7', textColor: '#4c1d95', text: '1 guesser, everyone else plays' },
  { n: 2, icon: '📖', topBg: '#ccfbf1', bottomBg: '#f0fdfa', border: '#99f6e4', accent: '#0d9488', textColor: '#134e4a', text: 'Everyone sees the word & hints' },
  { n: 3, icon: '👁️', topBg: '#1e1b4b', bottomBg: '#f5f3ff', border: '#4c1d95', accent: '#7c3aed', textColor: '#4c1d95', text: 'Only Truthsayer peeks in secret' },
  { n: 4, icon: '🎭', topBg: '#ccfbf1', bottomBg: '#f0fdfa', border: '#99f6e4', accent: '#0d9488', textColor: '#134e4a', text: 'Bluff to fool the guesser!' },
]

function MobileTiles() {
  return (
    <div className="grid grid-cols-2 gap-2 w-full mt-4">
      {MOBILE_STEPS.map(({ n, icon, topBg, bottomBg, border, accent, textColor, text }) => (
        <div key={n} className="flex flex-col rounded-2xl overflow-hidden border-2" style={{ borderColor: border }}>
          <div className="flex flex-col items-center justify-center py-3 gap-1.5" style={{ background: topBg }}>
            <div className="flex items-center justify-center font-caveat font-bold"
              style={{ width: 20, height: 20, borderRadius: '50%', background: accent, color: '#fff', fontSize: '0.7rem' }}>
              {n}
            </div>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>{icon}</span>
          </div>
          <div className="px-2.5 py-2" style={{ background: bottomBg }}>
            <p className="font-inter font-semibold leading-snug" style={{ fontSize: '0.65rem', color: textColor }}>
              {text}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Desktop: rich illustrated cards ── */
function Card1() {
  return (
    <div className="flex-1 flex flex-col rounded-3xl overflow-hidden border-2 min-w-0" style={{ borderColor: '#ddd6fe' }}>
      <div className="flex-1 flex flex-col px-5 pt-5 pb-4" style={{ background: '#ede9fe' }}>
        <div className="flex items-center justify-between mb-4">
          <Badge n={1} color="#a855f7" />
          <span className="font-caveat font-bold text-base" style={{ color: '#7c3aed' }}>pick a guesser</span>
        </div>
        <div className="flex items-end justify-center gap-2 flex-1">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center rounded-full border-2 border-violet-600"
              style={{ width: 44, height: 44, background: '#a855f7', fontSize: '1.4rem' }}>🕵️</div>
            <span style={{ fontSize: '0.55rem', color: '#6d28d9', fontFamily: 'Inter', fontWeight: 700, letterSpacing: '0.06em' }}>GUESSER</span>
          </div>
          {['😄','😄','😄','😄'].map((e, i) => (
            <div key={i} className="flex items-center justify-center rounded-full"
              style={{ width: 32, height: 32, background: '#c4b5fd', fontSize: '1.1rem' }}>{e}</div>
          ))}
        </div>
      </div>
      <div className="px-5 py-4" style={{ background: '#faf5ff' }}>
        <p className="font-inter font-semibold text-sm leading-snug" style={{ color: '#4c1d95' }}>
          1 guesser, as many players as you want
        </p>
      </div>
    </div>
  )
}

function Card2() {
  return (
    <div className="flex-1 flex flex-col rounded-3xl overflow-hidden border-2 min-w-0" style={{ borderColor: '#99f6e4' }}>
      <div className="flex-1 flex flex-col px-5 pt-5 pb-4" style={{ background: '#ccfbf1' }}>
        <div className="flex items-center justify-between mb-4">
          <Badge n={2} color="#0d9488" />
          <span className="font-caveat font-bold text-base" style={{ color: '#0f766e' }}>see the prompt</span>
        </div>
        <div className="flex flex-col items-center gap-2 flex-1 justify-center">
          <div className="rounded-xl text-center py-1.5 px-3 font-black w-full"
            style={{ background: '#FFF8EE', border: '2px solid #fde68a', fontSize: '1.15rem', color: '#1e293b' }}>
            Psithurism
          </div>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {[['🦑','sea creature'],['💃','old dance'],['🍳','kitchen tool']].map(([e, l]) => (
              <span key={l} className="font-inter font-semibold"
                style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: 999, background: '#f5f3ff', border: '1.5px solid #ddd6fe', color: '#6d28d9' }}>
                {e} {l}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 py-4" style={{ background: '#f0fdfa' }}>
        <p className="font-inter font-semibold text-sm leading-snug" style={{ color: '#134e4a' }}>
          Everyone sees the word and hint categories
        </p>
      </div>
    </div>
  )
}

function Card3() {
  return (
    <div className="flex-1 flex flex-col rounded-3xl overflow-hidden border-2 min-w-0" style={{ borderColor: '#4c1d95' }}>
      <div className="flex-1 flex flex-col px-5 pt-5 pb-4" style={{ background: '#1e1b4b' }}>
        <div className="flex items-center justify-between mb-4">
          <Badge n={3} color="#7c3aed" />
          <span className="font-caveat font-bold text-base" style={{ color: '#a78bfa' }}>the secret peek</span>
        </div>
        <div className="flex flex-col items-center gap-3 flex-1 justify-center">
          <div className="flex items-center justify-center gap-3">
            <span style={{ fontSize: '1.4rem', opacity: 0.6 }}>😑</span>
            <span style={{ fontSize: '1.4rem', opacity: 0.6 }}>😑</span>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -5, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)' }}/>
              <span style={{ fontSize: '1.6rem', position: 'relative' }}>👁️</span>
            </div>
            <span style={{ fontSize: '1.4rem', opacity: 0.6 }}>😑</span>
          </div>
          <div className="rounded-xl px-3 py-1.5 text-center w-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(167,139,250,0.4)' }}>
            <p className="font-caveat font-bold text-sm" style={{ color: '#c4b5fd' }}>👁 only truthsayer peeks</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4" style={{ background: '#f5f3ff' }}>
        <p className="font-inter font-semibold text-sm leading-snug" style={{ color: '#4c1d95' }}>
          Everyone closes their eyes, gamemaster picks a truthsayer to see the truth
        </p>
      </div>
    </div>
  )
}

function Card4() {
  return (
    <div className="flex-1 flex flex-col rounded-3xl overflow-hidden border-2 min-w-0" style={{ borderColor: '#99f6e4' }}>
      <div className="flex-1 flex flex-col px-5 pt-5 pb-4" style={{ background: '#ccfbf1' }}>
        <div className="flex items-center justify-between mb-4">
          <Badge n={4} color="#0d9488" />
          <span className="font-caveat font-bold text-base" style={{ color: '#0f766e' }}>storytelling time!</span>
        </div>
        <div className="flex flex-col gap-2 flex-1 justify-center">
          <div className="rounded-2xl px-3 py-2 font-inter text-xs"
            style={{ background: '#fff', border: '1.5px solid #a855f7', color: '#374151', borderRadius: '14px 14px 14px 4px' }}>
            &ldquo;It&apos;s a a Greek word, it means to fall down &rdquo;
          </div>
          <div className="rounded-2xl px-3 py-2 font-inter text-xs self-end"
            style={{ background: '#fff', border: '1.5px solid #2dd4bf', color: '#374151', borderRadius: '14px 14px 4px 14px', maxWidth: '90%' }}>
            &ldquo;An ancient ritual where people sneeze many times&rdquo; 
          </div>
        </div>
      </div>
      <div className="px-5 py-4" style={{ background: '#f0fdfa' }}>
        <p className="font-inter font-semibold text-sm leading-snug" style={{ color: '#134e4a' }}>
          Invent a story to fool the guesser — only Truthsayer tells the truth!
        </p>
      </div>
    </div>
  )
}

/* ── Main screen ── */
export default function SetupScreen({ onStart }: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const [selectedDeck, setSelectedDeck] = useState<DeckType>('absurd-truths')
  const roundsRef = useRef<HTMLDivElement>(null)
  const timerRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showSettings) return
    setTimeout(() => {
      if (roundsRef.current) roundsRef.current.scrollTop = REEL_ITEM_H
      if (timerRef.current)  timerRef.current.scrollTop  = REEL_ITEM_H
    }, 50)
  }, [showSettings])

  function handleStart() {
    const rounds    = roundsRef.current ? getReelValue(roundsRef.current, ROUND_OPTIONS) : 10
    const timerSecs = timerRef.current  ? getReelValue(timerRef.current,  TIMER_OPTIONS) : 30
    onStart(rounds, timerSecs, selectedDeck)
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-8 md:py-16 overflow-hidden"
      style={{ background: '#FFFDF7' }}
    >
      {/* ── Background doodles ── */}
      <span className="doodle font-caveat font-bold" style={{ fontSize: 'clamp(6rem,18vw,20rem)', color: '#a855f7', opacity: 0.04, top: '-4%', left: '-2%', transform: 'rotate(-14deg)', lineHeight: 1 }}>?</span>
      <span className="doodle font-caveat font-bold" style={{ fontSize: 'clamp(5rem,12vw,14rem)', color: '#2dd4bf', opacity: 0.05, top: '2%', right: '3%', transform: 'rotate(10deg)', lineHeight: 1 }}>!</span>
      <span className="doodle font-caveat" style={{ fontSize: 'clamp(1.5rem,4vw,5rem)', color: '#a855f7', opacity: 0.06, top: '44%', left: '1%', transform: 'rotate(-8deg)' }}>hmm</span>
      <svg className="doodle" style={{ top: '6%', left: '40%', opacity: 0.06 }} width="55" height="55" viewBox="0 0 38 38" fill="none">
        <path d="M19 2 L22.5 12.5 L34 12.5 L25 19.5 L28.5 30 L19 23.5 L9.5 30 L13 19.5 L4 12.5 L15.5 12.5 Z" stroke="#a855f7" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
      <svg className="doodle" style={{ top: '38%', right: '2%', opacity: 0.07 }} width="70" height="70" viewBox="0 0 36 36" fill="none">
        <path d="M18 4 C27 4 32 11 32 18 C32 27 27 32 18 32 C9 32 4 27 4 18 C4 9 9 4 18 4" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round"/>
      </svg>
      <svg className="doodle" style={{ top: '60%', right: '1%', opacity: 0.07 }} width="36" height="58" viewBox="0 0 28 44" fill="none">
        <path d="M16 2 L4 22 L13 22 L12 42 L24 20 L15 20 Z" stroke="#2dd4bf" strokeWidth="2.2" strokeLinejoin="round"/>
      </svg>
      <span className="doodle font-caveat" style={{ fontSize: '2rem', color: '#a855f7', opacity: 0.07, bottom: '8%', left: '5%', transform: 'rotate(-12deg)' }}>✦</span>
      <span className="doodle font-caveat" style={{ fontSize: '1.8rem', color: '#2dd4bf', opacity: 0.07, bottom: '8%', right: '6%', transform: 'rotate(18deg)' }}>✦</span>
      <svg className="doodle hidden md:block" style={{ bottom: '5%', left: '12%', opacity: 0.05 }} width="460" height="22" viewBox="0 0 460 22" fill="none">
        <path d="M0 11 Q29 2 58 11 Q87 20 116 11 Q145 2 174 11 Q203 20 232 11 Q261 2 290 11 Q319 20 348 11 Q377 2 406 11 Q435 20 460 11" stroke="#2dd4bf" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-lg md:max-w-5xl flex flex-col items-center">

        {/* Header — scales via clamp, no breakpoint jump */}
        <h1 className="font-caveat font-bold text-center leading-none"
          style={{ fontSize: 'clamp(2.4rem, 6vw, 5.5rem)', color: '#a855f7' }}>
          Absurd Truths
        </h1>
        <svg width="200" height="12" viewBox="0 0 280 14" fill="none" className="mt-1">
          <path d="M0 7 Q35 1 70 7 Q105 13 140 7 Q175 1 210 7 Q245 13 280 7" stroke="#2dd4bf" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>
        <p className="font-caveat italic text-center mt-1" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', color: '#94a3b8' }}>
          a game of beautiful lies
        </p>

        {!showSettings ? (
          <>
            {/* Mobile only: compact 2×2 grid */}
            <div className="md:hidden w-full">
              <MobileTiles />
            </div>

            {/* Desktop only: illustrated card row */}
            <div className="hidden md:flex items-stretch gap-3 w-full mt-10">
              <Card1 />
              <ArrowRight color="#a855f7" />
              <Card2 />
              <ArrowRight color="#2dd4bf" />
              <Card3 />
              <ArrowRight color="#a855f7" />
              <Card4 />
            </div>

            {/* Doodle button */}
            <div className="mt-5 md:mt-10 w-full md:w-auto flex justify-center">
              <button
                onClick={() => setShowSettings(true)}
                className="btn-press font-caveat font-bold text-white relative w-full md:w-auto"
                style={{
                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                  padding: 'clamp(14px, 2.5vw, 22px) clamp(36px, 6vw, 88px)',
                  background: '#a855f7',
                  border: '3px solid #7c3aed',
                  borderRadius: '8px 26px 6px 22px / 22px 6px 26px 8px',
                  boxShadow: '5px 5px 0 #7c3aed',
                  transform: 'rotate(-1deg)',
                  cursor: 'pointer',
                }}
              >
                Start a Game
              </button>
            </div>

            <p className="font-inter text-center mt-3" style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.875rem)', color: '#cbd5e1' }}>
              6–8 players · no phones needed · just beautiful lies
            </p>
          </>
        ) : (
          <>
            <p className="font-caveat font-semibold mt-3 md:mt-5" style={{ fontSize: 'clamp(2.2rem, 3vw, 1.75rem)', color: '#64748b' }}>
              Set up your game
            </p>

            {/* Deck selector */}
            <div className="flex gap-3 w-full mt-5">
              {([
                { key: 'absurd-truths', label: 'Absurd Truths', sub: 'weird English words', on: '#a855f7', off: '#e9d5ff', bg: '#f5f3ff', color: '#7c3aed' },
                { key: 'chinese-sayings', label: 'Chinese Sayings', sub: 'ancient wisdom & slang', on: '#2dd4bf', off: '#99f6e4', bg: '#f0fdfa', color: '#0f766e' },
                { key: 'medical', label: 'Medical Terms', sub: 'syndromes & signs', on: '#f59e0b', off: '#fde68a', bg: '#fffbeb', color: '#92400e' },
              ] as const).map(({ key, label, sub, on, off, bg, color }) => (
                <button
                  key={key}
                  onClick={() => setSelectedDeck(key)}
                  className="flex-1 flex flex-col justify-center rounded-2xl border-2 transition-all"
                  style={{
                    padding: '10px 10px 8px',
                    borderColor: selectedDeck === key ? on : off,
                    background: selectedDeck === key ? bg : '#fff',
                  }}
                >
                  <span className="font-caveat font-bold leading-tight" style={{ fontSize: 'clamp(1.5rem, 2.2vw, 1.15rem)', color }}>
                    {label}
                  </span>
                  <span className="font-inter" style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4, marginTop: 2 }}>
                    {sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Reels */}
            <div className="flex flex-row gap-4 md:gap-12 mt-3 md:mt-5 w-full justify-center">
              <Reel
                label="Rounds"
                labelFull="How many rounds?"
                ref={roundsRef}
                options={ROUND_OPTIONS.map(String)}
                accentColor="#a855f7"
                highlightBg="#f5f3ff"
                highlightBorder="#ddd6fe"
                borderColor="#e9d5ff"
              />
              <Reel
                label="Timer"
                labelFull="Reading timer?"
                ref={timerRef}
                options={TIMER_OPTIONS.map(n => `${n}s`)}
                accentColor="#2dd4bf"
                highlightBg="#f0fdfa"
                highlightBorder="#99f6e4"
                borderColor="#99f6e4"
              />
            </div>

            {/* Start button */}
            <div className="mt-4 md:mt-6 w-full md:w-auto flex justify-center">
              <button
                onClick={handleStart}
                className="btn-press font-caveat font-bold text-white w-full md:w-auto"
                style={{
                  fontSize: 'clamp(1.3rem, 3vw, 2rem)',
                  padding: 'clamp(11px, 2vw, 18px) clamp(36px, 6vw, 88px)',
                  background: '#a855f7',
                  border: '3px solid #7c3aed',
                  borderRadius: '22px 8px 26px 6px / 6px 22px 8px 26px',
                  boxShadow: '5px 5px 0 #7c3aed',
                  transform: 'rotate(0.8deg)',
                  cursor: 'pointer',
                }}
              >
                LET&apos;S GO
              </button>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="font-caveat mt-3"
              style={{ fontSize: 'clamp(0.95rem, 2vw, 1.2rem)', color: '#94a3b8' }}
            >
              ← back
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Reel ── */
interface ReelProps {
  label: string
  labelFull: string
  options: string[]
  accentColor: string
  highlightBg: string
  highlightBorder: string
  borderColor: string
}

const Reel = forwardRef<HTMLDivElement, ReelProps>(function Reel(
  { label, labelFull, options, accentColor, highlightBg, highlightBorder, borderColor },
  ref,
) {
  return (
    <div className="flex flex-col flex-1 md:flex-none md:w-[220px]">
      {/* Short label on mobile, full label on desktop */}
      <p className="font-caveat font-semibold text-center mb-2 md:mb-3 md:hidden"
        style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: '#64748b' }}>
        {label}
      </p>
      <p className="font-caveat font-semibold text-center mb-3 hidden md:block text-2xl" style={{ color: '#64748b' }}>
        {labelFull}
      </p>
      <div className="relative rounded-2xl overflow-hidden border-2"
        style={{ height: 114, borderColor, background: '#fff' }}>
        <div className="absolute top-0 inset-x-0 z-10 pointer-events-none"
          style={{ height: 38, background: 'linear-gradient(to bottom,#fffdf7 30%,transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 z-10 pointer-events-none"
          style={{ height: 38, background: 'linear-gradient(to top,#fffdf7 30%,transparent)' }} />
        <div className="absolute inset-x-0 pointer-events-none"
          style={{ top: 38, height: 38, background: highlightBg, borderTop: `2px solid ${highlightBorder}`, borderBottom: `2px solid ${highlightBorder}` }} />
        <div ref={ref} className="reel absolute inset-0">
          <div className="reel-item" />
          {options.map(opt => (
            <div key={opt} className="reel-item font-caveat font-bold" style={{ fontSize: '1.5rem', color: accentColor }}>
              {opt}
            </div>
          ))}
          <div className="reel-item" />
        </div>
      </div>
    </div>
  )
})
