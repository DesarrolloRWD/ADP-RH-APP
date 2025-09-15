"use client"

import { useEffect, useState } from 'react'
import { getUserData } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

interface PermissionGuardProps {
  children: React.ReactNode
  permission: string
  fallback?: React.ReactNode
}

/**
 * Componente que muestra u oculta contenido basado en permisos específicos
 * @param children Contenido a mostrar si el usuario tiene el permiso
 * @param permission Permiso requerido para ver el contenido
 * @param fallback Contenido opcional a mostrar si el usuario no tiene el permiso
 */
export default function PermissionGuard({ 
  children, 
  permission, 
  fallback = null 
}: PermissionGuardProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Verificar permisos del usuario
    const checkPermission = () => {
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
      
      // Verificar si el usuario tiene el permiso específico
      const permitted = hasPermission(userRoles, permission)
      setHasAccess(permitted)
      setIsChecking(false)
    }

    checkPermission()
  }, [permission])

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
