'use client'

import { useEffect, useRef, useState, forwardRef } from 'react'

const ROUND_OPTIONS = [5, 10, 15, 20]
const TIMER_OPTIONS = [15, 30, 45, 60]

interface Props {
  onStart: (rounds: number, timerSecs: number) => void
}

function getReelValue(el: HTMLDivElement, options: number[]) {
  const idx = Math.max(0, Math.min(Math.round(el.scrollTop / 52), options.length - 1))
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
    <div
      className="flex items-center justify-center font-caveat font-bold shrink-0"
      style={{ width: 26, height: 26, borderRadius: '50%', background: color, color: '#fff', fontSize: '0.9rem' }}
    >
      {n}
    </div>
  )
}

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
              style={{ width: 48, height: 48, background: '#a855f7', fontSize: '1.6rem' }}>🕵️</div>
            <span style={{ fontSize: '0.6rem', color: '#6d28d9', fontFamily: 'Inter', fontWeight: 700, letterSpacing: '0.06em' }}>GUESSER</span>
          </div>
          {['😄','😄','😄','😄'].map((e, i) => (
            <div key={i} className="flex items-center justify-center rounded-full"
              style={{ width: 36, height: 36, background: '#c4b5fd', fontSize: '1.15rem' }}>{e}</div>
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
          <div className="rounded-xl text-center py-2 px-4 font-black w-full"
            style={{ background: '#FFF8EE', border: '2px solid #fde68a', fontSize: '1.2rem', color: '#1e293b' }}>
            Groak
          </div>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {[['🦑','sea creature'],['💃','old dance'],['🍳','kitchen tool']].map(([e, l]) => (
              <span key={l} className="font-inter font-semibold"
                style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 999, background: '#f5f3ff', border: '1.5px solid #ddd6fe', color: '#6d28d9' }}>
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
              <div style={{ position: 'absolute', inset: -6, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)' }}/>
              <span style={{ fontSize: '1.7rem', position: 'relative' }}>👁️</span>
            </div>
            <span style={{ fontSize: '1.4rem', opacity: 0.6 }}>😑</span>
          </div>
          <div className="rounded-xl px-3 py-2 text-center w-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(167,139,250,0.4)' }}>
            <p className="font-caveat font-bold text-sm" style={{ color: '#c4b5fd' }}>👁 only truthsayer peeks</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4" style={{ background: '#f5f3ff' }}>
        <p className="font-inter font-semibold text-sm leading-snug" style={{ color: '#4c1d95' }}>
          Everyone closes their eyes — only one sees the answer
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
          <span className="font-caveat font-bold text-base" style={{ color: '#0f766e' }}>time to bluff!</span>
        </div>
        <div className="flex flex-col gap-2 flex-1 justify-center">
          <div className="rounded-2xl px-3 py-2 font-inter text-xs"
            style={{ background: '#fff', border: '1.5px solid #a855f7', color: '#374151', borderRadius: '14px 14px 14px 4px' }}>
            &ldquo;It&apos;s clearly a type of cheese...&rdquo; 🧀
          </div>
          <div className="rounded-2xl px-3 py-2 font-inter text-xs self-end"
            style={{ background: '#fff', border: '1.5px solid #2dd4bf', color: '#374151', borderRadius: '14px 14px 4px 14px', maxWidth: '90%' }}>
            &ldquo;An ancient Peruvian ritual!&rdquo; ✨
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

export default function SetupScreen({ onStart }: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const roundsRef = useRef<HTMLDivElement>(null)
  const timerRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showSettings) return
    setTimeout(() => {
      if (roundsRef.current) roundsRef.current.scrollTop = 52
      if (timerRef.current)  timerRef.current.scrollTop  = 52
    }, 50)
  }, [showSettings])

  function handleStart() {
    const rounds    = roundsRef.current ? getReelValue(roundsRef.current, ROUND_OPTIONS) : 10
    const timerSecs = timerRef.current  ? getReelValue(timerRef.current,  TIMER_OPTIONS) : 30
    onStart(rounds, timerSecs)
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-8 py-16 overflow-hidden"
      style={{ background: '#FFFDF7' }}
    >
      {/* ── Background doodles — big, scattered ── */}

      {/* top-left: giant ? */}
      <span className="doodle font-caveat font-bold" style={{ fontSize: '20rem', color: '#a855f7', opacity: 0.04, top: '-4%', left: '-2%', transform: 'rotate(-14deg)', lineHeight: 1 }}>?</span>

      {/* top-right: big ! */}
      <span className="doodle font-caveat font-bold" style={{ fontSize: '14rem', color: '#2dd4bf', opacity: 0.05, top: '2%', right: '3%', transform: 'rotate(10deg)', lineHeight: 1 }}>!</span>

      {/* mid-left: hmm */}
      <span className="doodle font-caveat" style={{ fontSize: '5rem', color: '#a855f7', opacity: 0.06, top: '44%', left: '1%', transform: 'rotate(-8deg)' }}>hmm</span>

      {/* left side: wavy squiggle */}
      <svg className="doodle" style={{ top: '62%', left: '0%', opacity: 0.06 }} width="60" height="200" viewBox="0 0 60 200" fill="none">
        <path d="M30 5 Q5 30 30 55 Q55 80 30 105 Q5 130 30 155 Q55 180 30 195" stroke="#a855f7" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>

      {/* bottom-left: sparkle */}
      <span className="doodle font-caveat" style={{ fontSize: '3rem', color: '#a855f7', opacity: 0.07, bottom: '8%', left: '6%', transform: 'rotate(-12deg)' }}>✦</span>

      {/* center-top: star */}
      <svg className="doodle" style={{ top: '6%', left: '42%', opacity: 0.06 }} width="70" height="70" viewBox="0 0 38 38" fill="none">
        <path d="M19 2 L22.5 12.5 L34 12.5 L25 19.5 L28.5 30 L19 23.5 L9.5 30 L13 19.5 L4 12.5 L15.5 12.5 Z" stroke="#a855f7" strokeWidth="2" strokeLinejoin="round"/>
      </svg>

      {/* mid-right: dashed circle */}
      <svg className="doodle" style={{ top: '36%', right: '2%', opacity: 0.07 }} width="100" height="100" viewBox="0 0 36 36" fill="none">
        <path d="M18 4 C27 4 32 11 32 18 C32 27 27 32 18 32 C9 32 4 27 4 18 C4 9 9 4 18 4" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round"/>
      </svg>

      {/* right side: lightning bolt */}
      <svg className="doodle" style={{ top: '58%', right: '1%', opacity: 0.07 }} width="50" height="80" viewBox="0 0 28 44" fill="none">
        <path d="M16 2 L4 22 L13 22 L12 42 L24 20 L15 20 Z" stroke="#2dd4bf" strokeWidth="2.2" strokeLinejoin="round"/>
      </svg>

      {/* bottom-right: sparkle */}
      <span className="doodle font-caveat" style={{ fontSize: '2.5rem', color: '#2dd4bf', opacity: 0.07, bottom: '10%', right: '7%', transform: 'rotate(18deg)' }}>✦</span>

      {/* bottom-center: wide wavy line */}
      <svg className="doodle" style={{ bottom: '5%', left: '15%', opacity: 0.05 }} width="500" height="24" viewBox="0 0 500 24" fill="none">
        <path d="M0 12 Q31 2 62 12 Q93 22 124 12 Q155 2 186 12 Q217 22 248 12 Q279 2 310 12 Q341 22 372 12 Q403 2 434 12 Q465 22 496 12" stroke="#2dd4bf" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">

        {/* Header */}
        <h1 className="font-caveat font-bold text-center leading-none" style={{ fontSize: '5.5rem', color: '#a855f7' }}>
          Absurd Truths
        </h1>
        <svg width="280" height="14" viewBox="0 0 280 14" fill="none" className="mt-1">
          <path d="M0 7 Q35 1 70 7 Q105 13 140 7 Q175 1 210 7 Q245 13 280 7" stroke="#2dd4bf" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>
        <p className="font-caveat text-2xl mt-1 italic text-center" style={{ color: '#94a3b8' }}>
          a game of beautiful lies
        </p>

        {!showSettings ? (
          <>
            {/* ── 4-card horizontal flow ── */}
            <div className="flex items-stretch gap-3 w-full mt-12">
              <Card1 />
              <ArrowRight color="#a855f7" />
              <Card2 />
              <ArrowRight color="#2dd4bf" />
              <Card3 />
              <ArrowRight color="#a855f7" />
              <Card4 />
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="btn-press mt-12 px-20 py-5 rounded-2xl font-caveat font-bold text-white shadow-md"
              style={{ fontSize: '2rem', background: '#a855f7' }}
            >
              Start a Game 🎲
            </button>

            <p className="font-inter text-sm mt-4 text-center" style={{ color: '#cbd5e1' }}>
              6–8 players · no phones needed · just beautiful lies
            </p>
          </>
        ) : (
          <>
            <p className="font-caveat text-3xl mt-10 font-semibold" style={{ color: '#64748b' }}>
              Set up your game
            </p>

            {/* Reels side by side */}
            <div className="flex gap-12 mt-8 items-start">
              <Reel
                label="How many rounds?"
                ref={roundsRef}
                options={ROUND_OPTIONS.map(String)}
                accentColor="#a855f7"
                highlightBg="#f5f3ff"
                highlightBorder="#ddd6fe"
                borderColor="#e9d5ff"
              />
              <Reel
                label="Reading timer?"
                ref={timerRef}
                options={TIMER_OPTIONS.map(n => `${n}s`)}
                accentColor="#2dd4bf"
                highlightBg="#f0fdfa"
                highlightBorder="#99f6e4"
                borderColor="#99f6e4"
              />
            </div>

            <button
              onClick={handleStart}
              className="btn-press mt-10 px-20 py-5 rounded-2xl font-caveat font-bold text-white shadow-md"
              style={{ fontSize: '2rem', background: '#a855f7' }}
            >
              LET&apos;S GO 🎲
            </button>

            <button
              onClick={() => setShowSettings(false)}
              className="font-caveat text-xl mt-4"
              style={{ color: '#94a3b8' }}
            >
              ← back
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Reel sub-component ── */
interface ReelProps {
  label: string
  options: string[]
  accentColor: string
  highlightBg: string
  highlightBorder: string
  borderColor: string
}

const Reel = forwardRef<HTMLDivElement, ReelProps>(function Reel(
  { label, options, accentColor, highlightBg, highlightBorder, borderColor },
  ref,
) {
  return (
    <div style={{ width: 220 }}>
      <p className="font-caveat text-2xl font-semibold text-center mb-3" style={{ color: '#64748b' }}>
        {label}
      </p>
      <div
        className="relative rounded-2xl overflow-hidden border-2"
        style={{ height: 156, borderColor, background: '#fff' }}
      >
        <div className="absolute top-0 inset-x-0 z-10 pointer-events-none"
          style={{ height: 52, background: 'linear-gradient(to bottom,#fffdf7 30%,transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 z-10 pointer-events-none"
          style={{ height: 52, background: 'linear-gradient(to top,#fffdf7 30%,transparent)' }} />
        <div className="absolute inset-x-0 pointer-events-none"
          style={{ top: 52, height: 52, background: highlightBg, borderTop: `2px solid ${highlightBorder}`, borderBottom: `2px solid ${highlightBorder}` }} />
        <div ref={ref} className="reel absolute inset-0">
          <div className="reel-item" />
          {options.map(opt => (
            <div key={opt} className="reel-item font-caveat font-bold" style={{ fontSize: '2rem', color: accentColor }}>
              {opt}
            </div>
          ))}
          <div className="reel-item" />
        </div>
      </div>
    </div>
  )
})
