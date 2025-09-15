"use client"

import { useEffect } from 'react'
import { cleanupExpiredTokens } from '@/lib/token-cleanup'

export function TokenCleanupProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ejecutar limpieza de tokens al montar el componente
    cleanupExpiredTokens()
  }, [])

  return <>{children}</>
}
