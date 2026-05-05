import Link from 'next/link'

export default function GameEntryPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFFDF7' }}>
      <div className="text-center">
        <p className="font-caveat font-bold" style={{ fontSize: '2rem', color: '#a855f7' }}>
          Game Entry
        </p>
        <p className="font-inter mt-2" style={{ color: '#94a3b8' }}>
          Placeholder — will redirect to the current game phase (not yet implemented)
        </p>
        <Link href="/" className="font-caveat mt-4 inline-block" style={{ fontSize: '1.2rem', color: '#2dd4bf' }}>
          ← back to lobby
        </Link>
      </div>
    </div>
  )
}
