"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserData } from '@/lib/auth'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

/**
 * Componente que protege rutas basado en roles de usuario
 * @param children Contenido a mostrar si el usuario tiene los roles permitidos
 * @param allowedRoles Array de roles permitidos para acceder al contenido
 * @param fallback Contenido opcional a mostrar si el usuario no tiene los roles permitidos
 */
export default function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback 
}: RoleGuardProps) {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Verificar roles del usuario
    const checkRoles = () => {
      const userData = getUserData()
      
      if (!userData) {
        // Si no hay datos de usuario, redirigir al login
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
      
      // Verificar si el usuario tiene al menos uno de los roles permitidos
      const hasPermission = userRoles.some(role => allowedRoles.includes(role))
      
      if (hasPermission) {
        setHasAccess(true)
      } else if (!fallback) {
        // Si no tiene permiso y no hay fallback, redirigir a página de acceso denegado
        router.push('/access-denied')
      }
      
      setIsChecking(false)
    }

    checkRoles()
  }, [router, allowedRoles, fallback])

  // Mostrar página de carga mientras se verifica
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Si tiene acceso, mostrar el contenido protegido
  if (hasAccess) {
    return <>{children}</>
  }

  // Si no tiene acceso y hay fallback, mostrar el fallback
  return fallback ? <>{fallback}</> : null
}
