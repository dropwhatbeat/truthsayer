import PlayerAvatar from './PlayerAvatar'

interface Player {
  id: string
  name: string | null
  role?: string | null
}

interface Props {
  players: Player[]
  highlightId?: string
}

export default function PlayerList({ players, highlightId }: Props) {
  return (
    <div className="space-y-3">
      {players.map((player) => (
        <div
          key={player.id}
          className={`p-3 rounded-xl border ${player.id === highlightId ? 'border-yellow-400' : ''}`}
          style={{
            background: '#FFFDF7',
            borderColor: player.id === highlightId ? '#fbbf24' : '#e2e8f0',
          }}
        >
          <PlayerAvatar
            name={player.name}
            role={player.role}
            highlight={player.id === highlightId}
          />
        </div>
      ))}
    </div>
  )
}
