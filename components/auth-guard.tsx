"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, getUserData } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: string[] // Roles requeridos para acceder a la ruta
}

/**
 * Componente que protege rutas verificando autenticación y opcionalmente roles
 * @param children Contenido protegido
 * @param requiredRoles Roles requeridos para acceder (opcional)
 */
export default function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Verificar autenticación y roles
    const checkAuth = () => {
      setIsChecking(true)
      
      if (!isAuthenticated()) {
        // No autenticado, redirigir a login con callback
        const callbackUrl = encodeURIComponent(pathname || '/')
        router.push(`/login?callbackUrl=${callbackUrl}`)
        return
      }
      
      // Si se requieren roles específicos, verificarlos
      if (requiredRoles && requiredRoles.length > 0) {
        const userData = getUserData()
        
        if (!userData) {
          router.push('/login')
          return
        }
        
        // Extraer roles del usuario
        let userRoles: string[] = []
        
        if (userData.roles) {
          // Si roles es un array de objetos con propiedad nombre
          if (Array.isArray(userData.roles) && typeof userData.roles[0] === 'object') {
            userRoles = userData.roles.map((role: any) => role.nombre)
          } 
          // Si roles es un array de strings
          else if (Array.isArray(userData.roles)) {
            userRoles = userData.roles
          } 
          // Si roles es un string único
          else if (typeof userData.roles === 'string') {
            userRoles = [userData.roles]
          }
        }
        
        // Verificar si el usuario tiene al menos uno de los roles requeridos
        const hasRequiredRole = userRoles.some(role => requiredRoles.includes(role))
        
        if (!hasRequiredRole) {
          // No tiene los roles requeridos, redirigir a página de acceso denegado
          router.push('/access-denied')
          return
        }
      }
      
      // Si pasa todas las verificaciones, autorizar
      setAuthorized(true)
      setIsChecking(false)
    }

    checkAuth()

    // Escuchar eventos de cambio de ruta
    const handleRouteChange = () => {
      checkAuth()
    }

    // Limpiar evento al desmontar si es necesario
    return () => {
      // Cleanup if needed
    }
  }, [router, pathname, requiredRoles])

  // Mostrar página de carga mientras se verifica la autenticación
  if (isChecking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si está autenticado y tiene los roles requeridos, mostrar el contenido protegido
  return <>{children}</>
}
