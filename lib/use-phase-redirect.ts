'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useGame } from '@/lib/game-context'

export function usePhaseRedirect(expectedPhase: string) {
  const router = useRouter()
  const params = useParams<{ code: string }>()
  const { currentPhase, isLoading, isError } = useGame()
  const code = String(params.code).toUpperCase()

  useEffect(() => {
    if (isLoading) return
    if (isError) {
      router.replace(`/game/${code}`)
      return
    }
    if (!currentPhase) return
    if (currentPhase !== expectedPhase && currentPhase !== 'complete') {
      router.replace(`/game/${code}`)
    }
  }, [code, currentPhase, isLoading, isError, expectedPhase, router])
}
