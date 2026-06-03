'use client'

import { forwardRef } from 'react'

export const REEL_ITEM_H = 38

export function getReelValue(el: HTMLDivElement, options: number[]): number {
  const idx = Math.max(0, Math.min(Math.round(el.scrollTop / REEL_ITEM_H), options.length - 1))
  return options[idx]
}

interface ReelProps {
  label: string
  labelFull?: string
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
    <div className="flex flex-col flex-1">
      {labelFull ? (
        <>
          <p className="font-caveat font-semibold text-center mb-2 md:mb-3 md:hidden"
            style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: '#64748b' }}>
            {label}
          </p>
          <p className="font-caveat font-semibold text-center mb-3 hidden md:block text-2xl" style={{ color: '#64748b' }}>
            {labelFull}
          </p>
        </>
      ) : (
        <p className="font-caveat font-bold text-lg mb-2" style={{ color: '#334155' }}>
          {label}
        </p>
      )}
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
          {options.map((opt: string) => (
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

export default Reel
