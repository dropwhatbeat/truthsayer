'use client'

import { useMemo } from 'react'
import type { Category } from '@bsking/game-engine'

interface Props {
  categories: Category[]
}

export default function CategoryPills({ categories }: Props) {
  const shuffled = useMemo(() => {
    if (!categories || categories.length === 0) return []
    const cats = [...categories]
    for (let i = cats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cats[i], cats[j]] = [cats[j], cats[i]]
    }
    return cats
  }, [categories])

  if (shuffled.length === 0) return null

  return (
    <div className="relative z-10 flex flex-wrap md:flex-nowrap gap-2 md:gap-3 justify-center w-full max-w-3xl mx-auto shrink-0">
      {shuffled.map(cat => (
        <span
          key={cat.label}
          className="inline-flex items-center gap-1.5 font-inter font-semibold whitespace-nowrap"
          style={{
            padding: '7px 18px',
            borderRadius: 999,
            border: '2px solid #ddd6fe',
            background: '#f5f3ff',
            color: '#6d28d9',
            fontSize: 'clamp(0.8rem, 1.8vw, 1rem)',
          }}
        >
          {cat.emoji} {cat.label}
        </span>
      ))}
    </div>
  )
}
