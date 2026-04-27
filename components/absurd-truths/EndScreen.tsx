'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

interface Props {
  onNewRound: () => void
  onHome: () => void
}

export default function EndScreen({ onNewRound, onHome }: Props) {
  const posthog = usePostHog()

  useEffect(() => {
    posthog.capture('end_screen_viewed')
  }, [posthog])

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ background: '#FFFDF7' }}
    >
      {/* Doodles */}
      <svg className="doodle" style={{ top: 30, left: 10, opacity: 0.2 }} width="44" height="44" viewBox="0 0 44 44" fill="none">
        <path d="M22 2 L26.5 15 L41 15 L30 23.5 L34 37 L22 28.5 L10 37 L14 23.5 L3 15 L17.5 15 Z" stroke="#a855f7" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
      <svg className="doodle" style={{ top: 30, right: 10, opacity: 0.2 }} width="44" height="44" viewBox="0 0 44 44" fill="none">
        <path d="M22 2 L26.5 15 L41 15 L30 23.5 L34 37 L22 28.5 L10 37 L14 23.5 L3 15 L17.5 15 Z" stroke="#2dd4bf" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
      <span className="doodle font-caveat bottom-40 left-6 -rotate-[12deg]" style={{ fontSize: '1.5rem', color: '#a855f7', opacity: 0.15 }}>✦</span>
      <span className="doodle font-caveat bottom-52 right-8 rotate-[10deg]"  style={{ fontSize: '1.25rem', color: '#2dd4bf', opacity: 0.18 }}>✦</span>
      <svg className="doodle" style={{ bottom: 100, left: 0, opacity: 0.15 }} width="120" height="18" viewBox="0 0 120 18" fill="none">
        <path d="M0 9 Q15 1 30 9 Q45 17 60 9 Q75 1 90 9 Q105 17 120 9" stroke="#a855f7" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </svg>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="font-caveat font-bold" style={{ fontSize: '3.5rem', color: '#a855f7', lineHeight: 1.1 }}>
          Game Over.
        </h2>
        <p className="font-caveat text-3xl mt-2" style={{ color: '#64748b' }}>
          Who was the best liar?
        </p>

        <svg width="160" height="12" viewBox="0 0 160 12" fill="none" className="mt-3 mb-8">
          <path d="M0 6 Q20 0 40 6 Q60 12 80 6 Q100 0 120 6 Q140 12 160 6" stroke="#2dd4bf" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>

        <button
          onClick={() => { posthog.capture('new_round_clicked'); onNewRound() }}
          className="btn-press w-full py-5 rounded-2xl font-caveat font-bold shadow-md mb-4"
          style={{ fontSize: '1.7rem', background: '#2dd4bf', color: '#0f4c4c', border: 'none' }}
        >
          ▶ New Round (fresh cards)
        </button>
        <button
          onClick={() => { posthog.capture('end_home_clicked'); onHome() }}
          className="btn-press w-full py-4 rounded-2xl font-caveat font-bold border-2"
          style={{ fontSize: '1.6rem', color: '#a855f7', borderColor: '#a855f7', background: 'transparent' }}
        >
          ⌂ Back to Home
        </button>
      </div>
    </div>
  )
}
