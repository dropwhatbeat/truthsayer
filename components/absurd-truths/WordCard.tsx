import type { Card } from '@/lib/types'

interface Props {
  card: Card
}

export default function WordCard({ card }: Props) {
  return (
    <div className="relative z-10 w-full max-w-3xl mx-auto shrink-0">
      <div
        className="rounded-3xl px-6 py-4 md:px-10 md:py-5 text-center shadow-sm border"
        style={{ background: '#FFF8EE', borderColor: '#fde68a' }}
      >
        <p
          className="font-caveat font-bold text-gray-900 leading-tight"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', overflowWrap: 'break-word' }}
        >
          {card.phrase}
        </p>
      </div>
    </div>
  )
}
