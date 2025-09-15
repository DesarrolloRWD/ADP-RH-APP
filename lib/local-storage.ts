/**
 * Utilidades para manejar el almacenamiento local
 */

// Clave para almacenar los permisos de roles
const ROLE_PERMISSIONS_KEY = 'adp_rh_role_permissions';

/**
 * Guarda los permisos de roles en el almacenamiento local
 * @param roles Array de objetos de rol con sus permisos
 * @returns true si se guardó correctamente, false en caso contrario
 */
export function saveRolePermissions(roles: Array<{nombre: string, permisos: string[]}>): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    
    localStorage.setItem(ROLE_PERMISSIONS_KEY, JSON.stringify(roles));
    return true;
  } catch (error) {
    console.error('Error al guardar permisos de roles:', error);
    return false;
  }
}

/**
 * Obtiene los permisos de roles del almacenamiento local
 * @returns Array de objetos de rol con sus permisos, o null si no hay datos
 */
export function getRolePermissions(): Array<{nombre: string, permisos: string[]}> | null {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    
    const data = localStorage.getItem(ROLE_PERMISSIONS_KEY);
    if (!data) {
      return null;
    }
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Error al obtener permisos de roles:', error);
    return null;
  }
}

/**
 * Guarda la configuración de acceso web para un usuario
 * @param username Nombre de usuario
 * @param allowWebAccess Booleano que indica si el usuario puede acceder a la web
 * @returns true si se guardó correctamente, false en caso contrario
 */
export function saveUserWebAccess(username: string, allowWebAccess: boolean): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Obtener la configuración actual
    const webAccessKey = 'adp_rh_web_access';
    const currentData = localStorage.getItem(webAccessKey);
    let webAccessConfig: Record<string, boolean> = {};
    
    if (currentData) {
      webAccessConfig = JSON.parse(currentData);
    }
    
    // Actualizar la configuración para este usuario
    webAccessConfig[username] = allowWebAccess;
    
    // Guardar la configuración actualizada
    localStorage.setItem(webAccessKey, JSON.stringify(webAccessConfig));
    return true;
  } catch (error) {
    console.error('Error al guardar configuración de acceso web:', error);
    return false;
  }
}

/**
 * Obtiene la configuración de acceso web para un usuario
 * @param username Nombre de usuario
 * @returns true si el usuario puede acceder a la web, false en caso contrario, null si no hay datos
 */
export function getUserWebAccess(username: string): boolean | null {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    
    const webAccessKey = 'adp_rh_web_access';
    const data = localStorage.getItem(webAccessKey);
    if (!data) {
      return null;
    }
    
    const webAccessConfig = JSON.parse(data);
    return webAccessConfig.hasOwnProperty(username) ? webAccessConfig[username] : null;
  } catch (error) {
    console.error('Error al obtener configuración de acceso web:', error);
    return null;
  }
}
