interface Props {
  name: string | null
  role?: string | null
  highlight?: boolean
  small?: boolean
}

export default function PlayerAvatar({ name, role, highlight, small }: Props) {
  const displayName = name || 'Unknown'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div
      className={`flex items-center gap-2 ${small ? 'gap-1.5' : 'gap-3'} ${highlight ? 'ring-2 ring-yellow-400 rounded-xl p-1' : ''}`}
    >
      <div
        className={`rounded-full flex items-center justify-center font-caveat font-bold text-white shrink-0
          ${small ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'}`}
        style={{ background: role === 'judge' ? '#a855f7' : role === 'honest' ? '#2dd4bf' : role === 'liar' ? '#f59e0b' : '#94a3b8' }}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <p className={`font-inter truncate ${small ? 'text-sm' : 'text-base'}`} style={{ color: '#334155' }}>
          {displayName}
        </p>
        {role && (
          <p className="text-xs font-inter capitalize" style={{ color: '#94a3b8' }}>
            {role}
          </p>
        )}
      </div>
    </div>
  )
}
