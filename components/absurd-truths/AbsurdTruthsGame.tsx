'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePostHog } from 'posthog-js/react'
import type { Card, DeckType, GamePhase } from '@/lib/types'
import { prepareDeck } from '@/lib/deck'
import SetupScreen from './SetupScreen'
import GameScreen from './GameScreen'
import EndScreen from './EndScreen'

type Screen = 'setup' | 'game' | 'end'

export default function AbsurdTruthsGame() {
  const posthog = usePostHog()
  const [screen,    setScreen]    = useState<Screen>('setup')
  const [rounds,    setRounds]    = useState(10)
  const [timerSecs, setTimerSecs] = useState(30)
  const [deckType,  setDeckType]  = useState<DeckType>('absurd-truths')
  const [deck,      setDeck]      = useState<Card[]>([])
  const [index,     setIndex]     = useState(0)
  const [phase,     setPhase]     = useState<GamePhase>('waiting')
  const [timeLeft,  setTimeLeft]  = useState(0)

  /* Countdown — runs only during 'reading' phase */
  useEffect(() => {
    if (phase !== 'reading') return
    setTimeLeft(timerSecs)

    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          setPhase('discuss')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [phase, timerSecs])

  /* ── Handlers ── */
  const handleStart = useCallback((r: number, t: number, dt: DeckType) => {
    setRounds(r)
    setTimerSecs(t)
    setDeckType(dt)
    setDeck(prepareDeck(dt, r))
    setIndex(0)
    setPhase('waiting')
    setScreen('game')
    posthog.capture('game_started', { rounds: r, timer_secs: t, deck_type: dt })
  }, [posthog])

  const handleShowSecret  = useCallback(() => setPhase('reading'),  [])
  const handleRevealToAll = useCallback(() => setPhase('reveal'),   [])

  const handleBack = useCallback(() => {
    setPhase(prev => (prev === 'reveal' ? 'discuss' : 'waiting'))
  }, [])

  const handleNext = useCallback(() => {
    setIndex(prev => {
      if (prev >= deck.length - 1) {
        setScreen('end')
        posthog.capture('game_completed', { total_cards: deck.length, deck_type: deckType })
        return prev
      }
      setPhase('waiting')
      return prev + 1
    })
  }, [deck.length, deckType, posthog])

  const handleNewRound = useCallback(() => {
    setDeck(prepareDeck(deckType, rounds))
    setIndex(0)
    setPhase('waiting')
    setScreen('game')
    posthog.capture('new_round_started', { rounds, deck_type: deckType })
  }, [rounds, deckType, posthog])

  const handleHome = useCallback(() => {
    posthog.capture('home_clicked', { from_screen: screen })
    setScreen('setup')
  }, [screen, posthog])

  /* ── Render ── */
  if (screen === 'setup') {
    return <SetupScreen onStart={handleStart} />
  }

  if (screen === 'game' && deck.length > 0) {
    return (
      <GameScreen
        card={deck[index]}
        phase={phase}
        index={index}
        total={deck.length}
        timeLeft={timeLeft}
        timerSecs={timerSecs}
        deckType={deckType}
        onShowSecret={handleShowSecret}
        onRevealToAll={handleRevealToAll}
        onBack={handleBack}
        onNext={handleNext}
        onHome={handleHome}
      />
    )
  }

  return <EndScreen onNewRound={handleNewRound} onHome={handleHome} />
}
