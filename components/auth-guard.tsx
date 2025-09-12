"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Verificar autenticación
    const checkAuth = () => {
      if (!isAuthenticated()) {
        // No autenticado, redirigir a login
        router.push('/login')
      } else {
        setAuthorized(true)
      }
    }

    checkAuth()

    // Escuchar eventos de cambio de ruta
    const handleRouteChange = () => {
      checkAuth()
    }

    // Limpiar evento al desmontar
    return () => {
      // Cleanup if needed
    }
  }, [router])

  // Mostrar página de carga mientras se verifica la autenticación
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si está autenticado, mostrar el contenido protegido
  return <>{children}</>
}
