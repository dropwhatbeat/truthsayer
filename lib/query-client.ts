'use client'

import { QueryClient } from '@tanstack/react-query'

let queryClientInstance: QueryClient | null = null

export function getQueryClient(): QueryClient {
  if (queryClientInstance) return queryClientInstance

  queryClientInstance = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000,
        retry: 1,
      },
    },
  })

  return queryClientInstance
}
