/**
 * Sistema de permisos granulares para la aplicación
 * 
 * Este archivo define los permisos disponibles en la aplicación y su relación con los roles.
 * Permite un control más detallado sobre las acciones que puede realizar cada rol.
 */

// Definición de permisos disponibles
export const Permissions = {
  // Permisos para usuarios
  USERS: {
    VIEW: 'users:view',       // Ver lista de usuarios
    CREATE: 'users:create',   // Crear usuarios
    EDIT: 'users:edit',       // Editar usuarios
    DELETE: 'users:delete',   // Eliminar usuarios
    MANAGE_STATUS: 'users:manage-status', // Activar/desactivar usuarios
    VIEW_ADMINS: 'users:view-admins', // Ver usuarios administradores
  },
  
  // Permisos para asistencias
  ATTENDANCE: {
    VIEW: 'attendance:view',       // Ver registros de asistencia
    VIEW_DETAILS: 'attendance:view-details', // Ver detalles de asistencia (ubicación, foto)
    EXPORT: 'attendance:export',   // Exportar registros de asistencia
    EDIT: 'attendance:edit',       // Editar registros de asistencia
  },
  
  // Permisos para configuración del sistema
  SETTINGS: {
    VIEW: 'settings:view',     // Ver configuración
    EDIT: 'settings:edit',     // Editar configuración
  },
  
  // Permisos para reportes
  REPORTS: {
    VIEW: 'reports:view',      // Ver reportes
    GENERATE: 'reports:generate', // Generar reportes
  },
  
  // Permisos de sistema
  SYSTEM: {
    LOGIN: 'system:login',           // Permiso para iniciar sesión
    ACCESS: 'system:access',         // Permiso para acceder al sistema
    WEB_LOGIN: 'system:web-login',   // Permiso para iniciar sesión en la web
    MOBILE_LOGIN: 'system:mobile-login', // Permiso para iniciar sesión en la app móvil
  }
}

// Mapeo de roles a permisos (valores por defecto)
const DefaultRolePermissions: Record<string, string[]> = {
  'ROLE_ADMIN': [
    // Permisos de sistema
    Permissions.SYSTEM.LOGIN,
    Permissions.SYSTEM.ACCESS,
    Permissions.SYSTEM.WEB_LOGIN,
    Permissions.SYSTEM.MOBILE_LOGIN,
    
    // Todos los permisos de usuarios
    Permissions.USERS.VIEW,
    Permissions.USERS.CREATE,
    Permissions.USERS.EDIT,
    Permissions.USERS.DELETE,
    Permissions.USERS.MANAGE_STATUS,
    Permissions.USERS.VIEW_ADMINS, // Solo los administradores pueden ver a otros administradores
    
    // Todos los permisos de asistencias
    Permissions.ATTENDANCE.VIEW,
    Permissions.ATTENDANCE.VIEW_DETAILS,
    Permissions.ATTENDANCE.EXPORT,
    Permissions.ATTENDANCE.EDIT,
    
    // Todos los permisos de configuración
    Permissions.SETTINGS.VIEW,
    Permissions.SETTINGS.EDIT,
    
    // Todos los permisos de reportes
    Permissions.REPORTS.VIEW,
    Permissions.REPORTS.GENERATE,
  ],
  
  'ROLE_RH': [
    // Permisos de sistema
    Permissions.SYSTEM.LOGIN,
    Permissions.SYSTEM.ACCESS,
    
    // Permisos de usuarios limitados
    Permissions.USERS.VIEW,
    Permissions.USERS.CREATE,
    Permissions.USERS.EDIT,
    Permissions.USERS.MANAGE_STATUS,
    // No tiene permiso para ver administradores
    
    // Todos los permisos de asistencias
    Permissions.ATTENDANCE.VIEW,
    Permissions.ATTENDANCE.VIEW_DETAILS,
    Permissions.ATTENDANCE.EXPORT,
    Permissions.ATTENDANCE.EDIT,
    
    // Permisos limitados de configuración
    Permissions.SETTINGS.VIEW,
    
    // Todos los permisos de reportes
    Permissions.REPORTS.VIEW,
    Permissions.REPORTS.GENERATE,
  ],
  
  'ROLE_SUPERVISOR': [
    // Permisos de sistema
    Permissions.SYSTEM.LOGIN,
    Permissions.SYSTEM.ACCESS,
    
    // Permisos limitados de usuarios
    Permissions.USERS.VIEW,
    // No tiene permiso para ver administradores
    
    // Permisos limitados de asistencias
    Permissions.ATTENDANCE.VIEW,
    Permissions.ATTENDANCE.VIEW_DETAILS,
    
    // Permisos limitados de reportes
    Permissions.REPORTS.VIEW,
  ],
  
  'ROLE_CHECKTIME': [
    // Permisos de sistema
    Permissions.SYSTEM.LOGIN,
    Permissions.SYSTEM.ACCESS,
    
    // Permisos muy limitados
    Permissions.ATTENDANCE.VIEW,
  ],
  
  'ROLE_BLOCKED': [
    // Sin permisos de sistema - no puede iniciar sesión ni acceder
    // Este rol se puede asignar a usuarios que deben ser bloqueados completamente
  ],
};

// Variable para almacenar los permisos cargados desde la API
let loadedRolePermissions: Record<string, string[]> | null = null;

// Función para cargar los permisos desde el almacenamiento local
export async function loadPermissionsFromLocal(): Promise<boolean> {
  try {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Intentar obtener los permisos del localStorage
    const ROLE_PERMISSIONS_KEY = 'adp_rh_role_permissions';
    const data = localStorage.getItem(ROLE_PERMISSIONS_KEY);
    
    if (!data) {
      return false;
    }
    
    const roles = JSON.parse(data);
    
    // Convertir los datos al formato esperado
    const permissions: Record<string, string[]> = {};
    
    roles.forEach((role: any) => {
      if (role.nombre && Array.isArray(role.permisos)) {
        permissions[role.nombre] = role.permisos;
      }
    });
    
    // Guardar los permisos cargados
    loadedRolePermissions = permissions;
    return true;
  } catch (error) {
    console.error('Error al cargar permisos desde el almacenamiento local:', error);
    return false;
  }
}

// Obtener los permisos de roles (desde la API si están disponibles, o los predeterminados)
export const getRolePermissions = (): Record<string, string[]> => {
  return loadedRolePermissions || DefaultRolePermissions;
};

// Mapeo de roles a permisos
export const RolePermissions = getRolePermissions();

/**
 * Verifica si un usuario tiene un permiso específico
 * @param userRoles Roles del usuario
 * @param permission Permiso a verificar
 * @returns Booleano que indica si el usuario tiene el permiso
 */
export function hasPermission(userRoles: string[], permission: string): boolean {
  // Si no hay roles o no hay permiso, denegar
  if (!userRoles || !userRoles.length || !permission) {
    return false;
  }
  
  // Verificar si alguno de los roles del usuario tiene el permiso
  return userRoles.some(role => {
    // Si el rol no existe en la configuración, denegar
    if (!RolePermissions[role]) {
      return false;
    }
    
    // Verificar si el rol tiene el permiso
    return RolePermissions[role].includes(permission);
  });
}

/**
 * Obtiene todos los permisos de un usuario basado en sus roles
 * @param userRoles Roles del usuario
 * @returns Array con todos los permisos del usuario
 */
export function getUserPermissions(userRoles: string[]): string[] {
  // Si no hay roles, devolver array vacío
  if (!userRoles || !userRoles.length) {
    return [];
  }
  
  // Obtener todos los permisos de todos los roles del usuario
  const permissions = userRoles.reduce((allPermissions: string[], role: string) => {
    // Si el rol existe en la configuración, añadir sus permisos
    if (RolePermissions[role]) {
      return [...allPermissions, ...RolePermissions[role]];
    }
    return allPermissions;
  }, []);
  
  // Eliminar duplicados
  return [...new Set(permissions)];
}
