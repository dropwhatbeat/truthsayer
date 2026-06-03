'use client'

import PlayerAvatar from './PlayerAvatar'

interface Player {
  id: string
  name: string | null
}

interface Props {
  players: Player[]
  onVote: (playerId: string) => void
  disabled?: boolean
}

export default function VoteButtons({ players, onVote, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto">
      {players.map((player) => (
        <button
          key={player.id}
          onClick={() => onVote(player.id)}
          disabled={disabled}
          className="p-3 rounded-xl border text-left transition-all
                     hover:shadow-md active:scale-[0.97]
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#FFFDF7', borderColor: '#e2e8f0' }}
        >
          <PlayerAvatar name={player.name} small />
        </button>
      ))}
    </div>
  )
}
