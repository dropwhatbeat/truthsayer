'use client'

import { useMachine, useSelector } from '@xstate/react'
import { usePostHog } from 'posthog-js/react'
import { gameMachine } from '@bsking/game-engine'
import type { ActorRefFrom } from 'xstate'
import SetupScreen from './SetupScreen'
import GameScreen from './GameScreen'
import EndScreen from './EndScreen'

type GameActor = ActorRefFrom<typeof gameMachine>

export default function AbsurdTruthsGame() {
  const posthog = usePostHog()
  const [state, send, actor] = useMachine(gameMachine)

  const isSetup = state.matches('setup')
  const isPlaying = state.matches('playing')
  const isFinished = state.matches('finished')
  const deck = state.context.deck
  const cardIndex = state.context.currentRoundIndex

  function track(event: string, props?: Record<string, unknown>) {
    posthog.capture(event, props ?? {})
  }

  if (isSetup) {
    return (
      <SetupScreen
        onStart={(rounds, timerSecs, deckType) => {
          track('game_started', { rounds, timer_secs: timerSecs, deck_type: deckType })
          send({ type: 'START', deckType, roundCount: rounds, timerSecs })
        }}
      />
    )
  }

  if (isPlaying && deck.length > 0) {
    return (
      <GameScreen
        actor={actor as GameActor}
        card={deck[cardIndex]}
        index={cardIndex}
        total={deck.length}
        deckType={state.context.deckType}
      />
    )
  }

  return (
    <EndScreen
      onNewRound={() => {
        track('new_round_started', { deck_type: state.context.deckType })
        send({ type: 'START', deckType: state.context.deckType, roundCount: state.context.roundCount, timerSecs: state.context.timerSecs })
      }}
      onHome={() => {
        track('home_clicked')
        send({ type: 'RESET' })
      }}
    />
  )
}
