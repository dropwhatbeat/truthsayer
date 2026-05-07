interface PlayerScore {
  id: string
  name: string | null
  score: number
}

interface Props {
  scores: PlayerScore[]
}

export default function ScoreBoard({ scores }: Props) {
  if (scores.length === 0) {
    return (
      <p className="text-center font-inter text-sm" style={{ color: '#94a3b8' }}>
        No scores yet
      </p>
    )
  }

  const maxScore = Math.max(...scores.map((s) => s.score), 0)

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
        <div
          className="flex px-4 py-2 font-inter text-xs font-semibold"
          style={{ background: '#f8fafc', color: '#64748b' }}
        >
          <span className="flex-1">Player</span>
          <span className="w-16 text-right">Score</span>
        </div>
        {scores.map((player, idx) => {
          const isWinner = maxScore > 0 && player.score === maxScore
          return (
            <div
              key={player.id}
              className={`flex items-center px-4 py-3 border-t ${isWinner ? '' : ''}`}
              style={{
                background: isWinner ? '#fefce8' : idx % 2 === 0 ? '#FFFDF7' : '#ffffff',
                borderColor: '#e2e8f0',
              }}
            >
              <span
                className="flex-1 font-inter text-sm truncate"
                style={{ color: '#334155' }}
              >
                {player.name || 'Unknown'}
                {isWinner && (
                  <span className="ml-2 text-xs" style={{ color: '#f59e0b' }}>
                    👑
                  </span>
                )}
              </span>
              <span
                className="w-16 text-right font-caveat font-bold text-lg"
                style={{ color: isWinner ? '#a855f7' : '#64748b' }}
              >
                {player.score}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
