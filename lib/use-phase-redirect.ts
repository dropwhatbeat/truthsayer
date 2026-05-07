'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/lib/game-context'

export function usePhaseRedirect(expectedPhase: string) {
  const router = useRouter()
  const { currentPhase, isLoading, isError } = useGame()

  useEffect(() => {
    if (isLoading) return
    if (isError) {
      router.replace('./')
      return
    }
    if (!currentPhase) return
    if (currentPhase !== expectedPhase && currentPhase !== 'complete') {
      router.replace('./')
    }
  }, [currentPhase, isLoading, isError, expectedPhase, router])
}
