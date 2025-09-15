"use client"

import { useEffect, useState } from 'react'
import { getUserData } from '@/lib/auth'

interface RoleContentProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

/**
 * Componente que muestra u oculta contenido basado en roles de usuario
 * @param children Contenido a mostrar si el usuario tiene los roles permitidos
 * @param allowedRoles Array de roles permitidos para ver el contenido
 * @param fallback Contenido opcional a mostrar si el usuario no tiene los roles permitidos
 */
export default function RoleContent({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleContentProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Verificar roles del usuario
    const checkRoles = () => {
      const userData = getUserData()
      
      if (!userData) {
        setHasAccess(false)
        setIsChecking(false)
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
      setHasAccess(hasPermission)
      setIsChecking(false)
    }

    checkRoles()
  }, [allowedRoles])

  // Si está verificando, no mostrar nada
  if (isChecking) {
    return null
  }

  // Si tiene acceso, mostrar el contenido
  if (hasAccess) {
    return <>{children}</>
  }

  // Si no tiene acceso y hay fallback, mostrar el fallback
  return fallback ? <>{fallback}</> : null
}
