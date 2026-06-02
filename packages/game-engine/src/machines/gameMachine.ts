import { setup, assign, fromPromise } from 'xstate'
import type { GameContext, GameEvent } from '../types'
import { prepareDeck } from '../deck'

const timerActor = fromPromise<{ type: 'TIMER_END' }, { timerSecs: number }>(
  async ({ input }) => {
    await new Promise(resolve => setTimeout(resolve, input.timerSecs * 1000))
    return { type: 'TIMER_END' }
  }
)

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  actors: {
    timerActor,
  },
  actions: {
    assignConfig: assign({
      deckType: ({ event }) => (event.type === 'START' ? event.deckType : 'absurd-truths'),
      roundCount: ({ event }) => (event.type === 'START' ? event.roundCount : 10),
      timerSecs: ({ event }) => (event.type === 'START' ? event.timerSecs : 30),
    }),
    prepareCards: assign({
      deck: ({ context }) => prepareDeck(context.deckType, context.roundCount),
      currentRoundIndex: 0,
    }),
    advanceRound: assign({
      currentRoundIndex: ({ context }) => context.currentRoundIndex + 1,
    }),
    decrementTime: assign({
      timeLeft: ({ context }) => Math.max(0, (context.timeLeft ?? context.timerSecs) - 1),
    }),
    resetTimeLeft: assign({
      timeLeft: ({ context }) => context.timerSecs,
    }),
    reshuffleDeck: assign({
      deck: ({ context }) => prepareDeck(context.deckType, context.roundCount),
      currentRoundIndex: 0,
    }),
  },
}).createMachine({
  id: 'gameMachine',
  initial: 'setup',
  context: {
    deckType: 'absurd-truths',
    roundCount: 10,
    timerSecs: 30,
    players: [],
    currentRoundIndex: 0,
    deck: [],
    timeLeft: 0,
  },
  states: {
    setup: {
      on: {
        START: {
          target: 'playing',
          actions: ['assignConfig', 'prepareCards', 'resetTimeLeft'],
        },
      },
    },
    playing: {
      initial: 'waiting',
      states: {
        waiting: {
          entry: 'resetTimeLeft',
          on: {
            SHOW_SECRET: {
              target: 'reading',
              actions: 'resetTimeLeft',
            },
          },
        },
        reading: {
          entry: 'resetTimeLeft',
          invoke: {
            src: 'timerActor',
            input: ({ context }) => ({ timerSecs: context.timerSecs }),
            onDone: {
              target: 'discuss',
            },
          },
          on: {
            SKIP_TIMER: {
              target: 'discuss',
            },
            TICK: {
              actions: 'decrementTime',
            },
          },
        },
        discuss: {
          on: {
            REVEAL_ALL: {
              target: 'reveal',
            },
            BACK: {
              target: 'waiting',
            },
          },
        },
        reveal: {
          on: {
            NEXT_CARD: [
              {
                guard: ({ context }) => context.currentRoundIndex >= context.deck.length - 1,
                target: '#gameMachine.finished',
              },
              {
                target: 'waiting',
                actions: 'advanceRound',
              },
            ],
            BACK: {
              target: 'discuss',
            },
          },
        },
      },
    },
    finished: {
      on: {
        RESET: {
          target: 'setup',
          actions: 'reshuffleDeck',
        },
        START: {
          target: 'playing',
          actions: ['assignConfig', 'prepareCards', 'resetTimeLeft'],
        },
      },
    },
  },
})
