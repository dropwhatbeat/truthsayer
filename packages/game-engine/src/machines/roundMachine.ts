import { setup, assign, fromPromise } from 'xstate'
import type { RoundContext, RoundEvent } from '../types'

const timerActor = fromPromise<{ type: 'TIMER_END' }, { timerSecs: number }>(
  async ({ input }) => {
    await new Promise(resolve => setTimeout(resolve, input.timerSecs * 1000))
    return { type: 'TIMER_END' }
  }
)

export const roundMachine = setup({
  types: {
    context: {} as RoundContext,
    events: {} as RoundEvent,
  },
  actors: {
    timerActor,
  },
  actions: {
    decrementTime: assign({
      timeLeft: ({ context }) => Math.max(0, context.timeLeft - 1),
    }),
    resetTimeLeft: assign({
      timeLeft: ({ context }) => context.timerSecs,
    }),
  },
}).createMachine({
  id: 'roundMachine',
  initial: 'waiting',
  context: {
    card: null,
    timeLeft: 30,
    timerSecs: 30,
    roundIndex: 0,
  },
  states: {
    waiting: {
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
      },
    },
    reveal: {
      on: {
        NEXT_CARD: {
          target: 'complete',
        },
        BACK: {
          target: 'discuss',
        },
      },
    },
    complete: {
      type: 'final',
    },
  },
})
