'use client'

import { useEffect, useRef } from 'react'

const CIRCUMFERENCE = 2 * Math.PI * 45

interface Props {
  seconds: number
  total: number
}

export default function Timer({ seconds, total }: Props) {
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!ringRef.current) return
    const frac   = Math.max(0, seconds / total)
    const offset = CIRCUMFERENCE * (1 - frac)
    ringRef.current.style.strokeDashoffset = String(offset)
    ringRef.current.style.stroke = frac > 0.5 ? '#2dd4bf' : frac > 0.2 ? '#fb923c' : '#ef4444'
  }, [seconds, total])

  return (
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
            {Math.max(0, seconds)}
          </span>
          <span className="font-caveat" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>sec</span>
        </div>
      </div>
      <p className="font-caveat md:mt-1.5" style={{ color: '#94a3b8', fontSize: '1rem' }}>reading time</p>
    </div>
  )
}
