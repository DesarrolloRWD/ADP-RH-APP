import { useState, useEffect } from 'react'
import { getUserData } from '@/lib/auth'
import { hasPermission, getUserPermissions, loadPermissionsFromLocal } from '@/lib/permissions'

/**
 * Hook personalizado para manejar permisos de usuario
 * @returns Objeto con funciones y estados relacionados con permisos
 */
export function usePermissions() {
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar roles y permisos del usuario
    const loadUserPermissions = async () => {
      setIsLoading(true)
      
      // Intentar cargar los permisos desde el almacenamiento local primero
      await loadPermissionsFromLocal()
      
      const userData = getUserData()
      
      if (!userData) {
        setUserRoles([])
        setUserPermissions([])
        setIsLoading(false)
        return
      }
      
      // Extraer roles del usuario
      let roles: string[] = []
      
      if (userData.roles) {
        // Si roles es un array de objetos con propiedad nombre
        if (Array.isArray(userData.roles) && typeof userData.roles[0] === 'object') {
          roles = userData.roles.map((role: any) => role.nombre)
        } 
        // Si roles es un array de strings
        else if (Array.isArray(userData.roles)) {
          roles = userData.roles
        } 
        // Si roles es un string único
        else if (typeof userData.roles === 'string') {
          roles = [userData.roles]
        }
      }
      
      setUserRoles(roles)
      
      // Obtener todos los permisos del usuario
      const permissions = getUserPermissions(roles)
      setUserPermissions(permissions)
      
      setIsLoading(false)
    }

    loadUserPermissions()
  }, [])

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param permission Permiso a verificar
   * @returns Booleano que indica si el usuario tiene el permiso
   */
  const checkPermission = (permission: string): boolean => {
    return hasPermission(userRoles, permission)
  }

  /**
   * Verifica si el usuario tiene al menos uno de los roles especificados
   * @param roles Roles a verificar
   * @returns Booleano que indica si el usuario tiene al menos uno de los roles
   */
  const hasRole = (roles: string[]): boolean => {
    return userRoles.some(role => roles.includes(role))
  }

  return {
    roles: userRoles,
    permissions: userPermissions,
    isLoading,
    hasPermission: checkPermission,
    hasRole
  }
}
