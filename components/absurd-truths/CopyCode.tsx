'use client'

import { useState } from 'react'

export default function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select the text manually if clipboard API unavailable
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tracking-widest font-mono">{code}</span>
      <button
        onClick={handleCopy}
        aria-label="Copy room code"
        className="inline-flex items-center justify-center rounded-md transition-colors"
        style={{ color: copied ? '#2dd4bf' : '#cbd5e1', padding: '2px' }}
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="4.5" y="1" width="8" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 10.5v1.5A1.5 1.5 0 0 1 8 13.5H2A1.5 1.5 0 0 1 .5 12V5A1.5 1.5 0 0 1 2 3.5h1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </span>
  )
}
