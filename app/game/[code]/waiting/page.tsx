'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { DECK_METADATA } from '@bsking/game-engine'
import type { DeckType } from '@bsking/game-engine'
import { usePhaseRedirect } from '@/lib/use-phase-redirect'
import { useGame } from '@/lib/game-context'
import PlayerList from '@/components/absurd-truths/PlayerList'
import CopyCode from '@/components/absurd-truths/CopyCode'
import HowToPlay from '@/components/absurd-truths/HowToPlay'

const DECKS: { key: DeckType; emoji: string; sub: string }[] = [
  { key: 'absurd-truths',   emoji: '🏭', sub: 'manufacture the most convincing BS' },
  { key: 'chinese-sayings', emoji: '🐉', sub: 'ancient wisdom, gloriously misremembered' },
  { key: 'medical',         emoji: '🩺', sub: "syndromes you'll swear we made up" },
]

const DECK_EMOJI: Record<string, string> = {
  'absurd-truths': '🏭',
  'chinese-sayings': '🐉',
  medical: '🩺',
}

const TIMER_OPTIONS  = [0, 15, 30, 45, 60]
const ROUND_OPTIONS  = [5, 10, 20, 30]

// Deck accent colours for the dot indicator
const DECK_ACCENT: Record<string, string> = {
  'absurd-truths':   '#d8401e',
  'chinese-sayings': '#6a9a26',
  medical:           '#f5b820',
}

export default function WaitingPage() {
  usePhaseRedirect('waiting')
  const router = useRouter()
  const { room, currentPlayerId, currentPlayerSecret } = useGame()
  const posthog = usePostHog()
  const [starting, setStarting]   = useState(false)
  const [error,    setError]      = useState('')

  // ── Carousel ──────────────────────────────────────────────
  const carouselRef    = useRef<HTMLDivElement>(null)
  const scrollTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const didInit        = useRef(false)
  const wheelCleanup   = useRef<(() => void) | null>(null)
  const [centerIdx, setCenterIdx] = useState(0)

  // One-time init: jump to selected deck + attach wheel listener for desktop
  useEffect(() => {
    if (!room || didInit.current || !carouselRef.current) return
    didInit.current = true
    const el  = carouselRef.current
    const idx = Math.max(0, DECKS.findIndex(d => d.key === room.config.deckType))
    setCenterIdx(idx)
    const child = el.children[idx + 1] as HTMLElement  // +1 to skip leading spacer
    if (child) el.scrollLeft = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2

    // Convert vertical mouse-wheel to horizontal scroll (desktop)
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    wheelCleanup.current = () => el.removeEventListener('wheel', onWheel)
  }, [room])

  // Remove wheel listener on unmount
  useEffect(() => () => { wheelCleanup.current?.() }, [])

  if (!room) return null

  const registeredPlayers = room.players.filter(p => p.name)
  const isHost   = currentPlayerId === room.createdBy
  const canStart = registeredPlayers.length >= 3
  const selectedDeckType = room.config.deckType
  const selectedDeck     = DECK_METADATA[selectedDeckType] ?? DECK_METADATA['absurd-truths']

  function handleBack() {
    localStorage.removeItem('bsking-player')
    router.push('/')
  }

  async function patchSetting(update: { deckType?: string; timerSecs?: number; roundCount?: number }) {
    try {
      await fetch(`/api/rooms/${room!.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId, playerSecret: currentPlayerSecret, ...update }),
      })
    } catch { /* polling corrects on next tick */ }
  }

  // Returns the deck index (ignoring leading/trailing spacers) closest to centre
  function getClosestIndex(el: HTMLDivElement): number {
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0, bestDist = Infinity
    // children: [spacer, deck0, deck1, …, spacer] — skip first and last
    Array.from(el.children).slice(1, -1).forEach((child, i) => {
      const c    = child as HTMLElement
      const dist = Math.abs((c.offsetLeft + c.clientWidth / 2) - mid)
      if (dist < bestDist) { bestDist = dist; best = i }
    })
    return best
  }

  function handleCarouselScroll() {
    const el = carouselRef.current
    if (!el) return

    // Update highlight live while dragging
    const live = getClosestIndex(el)
    if (live !== centerIdx) setCenterIdx(live)

    // After scrolling stops: snap to nearest card center, then PATCH
    clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      const settled = getClosestIndex(el)
      setCenterIdx(settled)
      // Programmatic snap — avoids CSS snap's sub-pixel rounding bug on last card
      const snapChild = el.children[settled + 1] as HTMLElement
      if (snapChild) {
        const target = Math.max(0, Math.min(
          snapChild.offsetLeft - (el.clientWidth - snapChild.clientWidth) / 2,
          el.scrollWidth - el.clientWidth,
        ))
        el.scrollTo({ left: target, behavior: 'smooth' })
      }
      if (DECKS[settled] && DECKS[settled].key !== room!.config.deckType) {
        posthog.capture('deck_changed', { deck_type: DECKS[settled].key, room_code: room!.code })
        patchSetting({ deckType: DECKS[settled].key })
      }
    }, 300)
  }

  function scrollCardIntoCenter(i: number) {
    const el = carouselRef.current
    if (!el) return
    // children[0] is the leading spacer, so deck i is at index i+1
    const child = el.children[i + 1] as HTMLElement
    if (child) el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: 'smooth' })
  }

  async function handleStart() {
    setError('')
    setStarting(true)
    try {
      const res = await fetch(`/api/rooms/${room!.code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId, playerSecret: currentPlayerSecret }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) { router.replace(`/game/${room!.code}`); return }
        setError(data.error || 'Failed to start game')
        return
      }
      posthog.capture('game_started', {
        room_code: room!.code,
        deck_type: room!.config.deckType,
        timer_secs: room!.config.timerSecs,
        round_count: room!.config.roundCount,
        player_count: registeredPlayers.length,
      })
      router.replace(`/game/${room!.code}/reading`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: '#FFF9EC' }}>
      <div className="w-full max-w-xl space-y-6 text-center">

        {/* Header */}
        <div className="relative">
          <button
            onClick={handleBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 font-caveat text-sm"
            style={{ color: '#94a3b8' }}
          >
            ← back
          </button>
          <p className="font-caveat font-bold text-3xl" style={{ color: '#d8401e' }}>
            Waiting Room
          </p>
          <div
            className="inline-flex flex-col items-center mt-2 px-6 py-3 rounded-2xl border"
            style={{ background: '#fff', borderColor: '#fde68a' }}
          >
            <p className="font-inter text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>
              Room Code
            </p>
            <p className="font-caveat font-bold tracking-widest" style={{ fontSize: '2.4rem', color: '#1e293b', lineHeight: 1.1 }}>
              <CopyCode code={room.code} />
            </p>
          </div>
        </div>

        {isHost ? (
          <div className="space-y-4 text-left">
            <p className="font-caveat font-bold text-lg" style={{ color: '#334155' }}>
              Pick a deck
            </p>

            {/* ── Deck Carousel ───────────────────────────────── */}
            {/* Spacer children (not container padding) so the browser
                includes them in scrollWidth and the last card can snap. */}
            <div
              ref={carouselRef}
              className="no-scrollbar flex"
              style={{
                overflowX: 'scroll',
                WebkitOverflowScrolling: 'touch',
                position: 'relative', // makes this the offsetParent so child.offsetLeft is correct
              }}
              onScroll={handleCarouselScroll}
            >
              <div style={{ flex: '0 0 12%' }} aria-hidden="true" />
                {DECKS.map((deck, i) => {
                  const isCenter = centerIdx === i
                  return (
                    <div
                      key={deck.key}
                      style={{
                        flex: '0 0 76%',
                        padding: '4px 8px 8px',
                      }}
                      onClick={() => { if (!isCenter) scrollCardIntoCenter(i) }}
                    >
                      <div
                        data-deck={deck.key}
                        className={`ts-deck-card${isCenter ? ' is-selected' : ''}`}
                        style={{
                          '--deck-tilt': '0deg',
                          transition: 'opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                          opacity:   isCenter ? 1 : 0.45,
                          transform: isCenter ? 'scale(1)' : 'scale(0.93)',
                          cursor:    isCenter ? 'default' : 'pointer',
                        } as React.CSSProperties}
                      >
                        <div className="ts-deck-card__top">
                          <div className="ts-deck-card__glyph">{deck.emoji}</div>
                          <div className="ts-deck-card__titles">
                            <p className="ts-deck-card__title">{DECK_METADATA[deck.key].label}</p>
                            <p className="ts-deck-card__sub">{deck.sub}</p>
                          </div>
                          <div className="ts-deck-card__check">✓</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              <div style={{ flex: '0 0 12%' }} aria-hidden="true" />
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 -mt-1">
              {DECKS.map((_, i) => (
                <div
                  key={i}
                  onClick={() => scrollCardIntoCenter(i)}
                  style={{
                    width:        i === centerIdx ? 20 : 6,
                    height:       6,
                    borderRadius: 3,
                    background:   i === centerIdx ? (DECK_ACCENT[DECKS[i].key] ?? '#94a3b8') : '#e2e8f0',
                    transition:   'width 0.25s ease, background 0.25s ease',
                    cursor:       'pointer',
                  }}
                />
              ))}
            </div>

            {/* Timer + Rounds */}
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="font-caveat font-bold text-sm mb-2" style={{ color: '#64748b' }}>Timer</p>
                <div className="flex flex-wrap gap-1">
                  {TIMER_OPTIONS.map(t => {
                    const active = room.config.timerSecs === t
                    return (
                      <button
                        key={t}
                        onClick={() => { posthog.capture('timer_changed', { timer_secs: t, room_code: room.code }); patchSetting({ timerSecs: t }) }}
                        className="font-inter text-xs font-semibold rounded-full px-2.5 py-1 border transition-all"
                        style={{
                          borderColor: active ? '#6a9a26' : '#e2e8f0',
                          background:  active ? '#f4faea' : '#fff',
                          color:       active ? '#0f766e' : '#64748b',
                        }}
                      >
                        {t === 0 ? 'None' : `${t}s`}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex-1">
                <p className="font-caveat font-bold text-sm mb-2" style={{ color: '#64748b' }}>Rounds</p>
                <div className="flex flex-wrap gap-1">
                  {ROUND_OPTIONS.map(r => {
                    const active = room.config.roundCount === r
                    return (
                      <button
                        key={r}
                        onClick={() => { posthog.capture('rounds_changed', { round_count: r, room_code: room.code }); patchSetting({ roundCount: r }) }}
                        className="font-inter text-xs font-semibold rounded-full px-2.5 py-1 border transition-all"
                        style={{
                          borderColor: active ? '#d8401e' : '#e2e8f0',
                          background:  active ? '#fff5f1' : '#fff',
                          color:       active ? '#a82d12' : '#64748b',
                        }}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Non-host: static deck card */
          <div className="rounded-2xl border p-4 flex items-center gap-4" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
            <span style={{ fontSize: '2.4rem', lineHeight: 1, flexShrink: 0 }}>
              {DECK_EMOJI[selectedDeckType] ?? '🃏'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-caveat font-bold text-xl leading-tight" style={{ color: '#0f172a' }}>
                {selectedDeck.label}
              </p>
              <p className="font-inter text-xs mt-0.5 leading-snug" style={{ color: '#94a3b8' }}>
                {selectedDeck.description}
              </p>
              <div className="flex gap-3 mt-2">
                <span className="font-inter text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: '#f4faea', color: '#0f766e' }}>
                  {room.config.timerSecs === 0 ? 'No timer' : `${room.config.timerSecs}s timer`}
                </span>
                <span className="font-inter text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: '#fff5f1', color: '#a82d12' }}>
                  {room.config.roundCount} rounds
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Players */}
        <div className="text-left">
          <p className="font-inter text-sm mb-2" style={{ color: '#64748b' }}>
            Players ({registeredPlayers.length})
          </p>
          {registeredPlayers.length > 0 ? (
            <PlayerList
              players={registeredPlayers.map(p => ({ id: p.id, name: p.name }))}
              highlightId={currentPlayerId ?? undefined}
            />
          ) : (
            <p className="font-inter text-sm text-center py-4" style={{ color: '#94a3b8' }}>
              Waiting for players to join...
            </p>
          )}
        </div>

        <HowToPlay />

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={!canStart || starting}
            className="w-full py-4 rounded-xl font-caveat font-bold text-xl shadow-md
                       transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#6a9a26', color: '#2a3f10' }}
          >
            {starting ? 'Starting...' : canStart ? 'Start Game' : `Need at least 3 players (${registeredPlayers.length})`}
          </button>
        ) : (
          <p className="font-inter text-sm" style={{ color: '#94a3b8' }}>
            Waiting for host to start...
          </p>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-lg py-2 px-4">{error}</p>
        )}
      </div>
    </div>
  )
}
