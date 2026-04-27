'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePostHog } from 'posthog-js/react'
import { GAME_DECK, type Card } from '@/data/absurdTruthsDeck'
import { CHINESE_SAYINGS_DECK } from '@/data/chineseSayingsDeck'
import { MEDICAL_DECK } from '@/data/medicalDeck'
import SetupScreen, { type DeckType } from './SetupScreen'
import GameScreen, { type Phase } from './GameScreen'
import EndScreen from './EndScreen'

type Screen = 'setup' | 'game' | 'end'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function AbsurdTruthsGame() {
  const posthog = usePostHog()
  const [screen,    setScreen]    = useState<Screen>('setup')
  const [rounds,    setRounds]    = useState(10)
  const [timerSecs, setTimerSecs] = useState(30)
  const [deckType,  setDeckType]  = useState<DeckType>('absurd-truths')
  const [deck,      setDeck]      = useState<Card[]>([])
  const [index,     setIndex]     = useState(0)
  const [phase,     setPhase]     = useState<Phase>('waiting')
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
  function pickDeck(dt: DeckType) {
    if (dt === 'chinese-sayings') return CHINESE_SAYINGS_DECK
    if (dt === 'medical') return MEDICAL_DECK
    return GAME_DECK
  }

  const handleStart = useCallback((r: number, t: number, dt: DeckType) => {
    const sourceDeck = pickDeck(dt)
    setRounds(r)
    setTimerSecs(t)
    setDeckType(dt)
    setDeck(shuffle(sourceDeck).slice(0, r))
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
    const sourceDeck = pickDeck(deckType)
    setDeck(shuffle(sourceDeck).slice(0, rounds))
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
