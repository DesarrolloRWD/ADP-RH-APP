// Servicio de autenticación para manejar tokens JWT y sesiones
import Cookies from 'js-cookie';

const TOKEN_KEY = 'adp_rh_auth_token';
const USER_DATA_KEY = 'adp_rh_user_data';

// Opciones para las cookies con seguridad mejorada
const cookieOptions = {
  expires: 1, // 1 día (reducido por seguridad)
  path: '/',
  sameSite: 'strict' as 'strict', // Protección contra CSRF
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:', // Activado en HTTPS
};

/**
 * Valida el formato del token JWT
 * @param token Token a validar
 * @returns true si el token tiene formato válido
 */
const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  // Un JWT debe tener exactamente 3 partes separadas por puntos
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Cada parte debe ser base64url válido (no vacío)
  return parts.every(part => part.length > 0);
};

/**
 * Guarda el token JWT en cookies y localStorage
 * @param token Token JWT a guardar
 */
export const saveToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    // Validar formato del token antes de guardar
    if (!isValidTokenFormat(token)) {
      console.error('Intento de guardar token con formato inválido');
      return;
    }
    
    // Guardar en localStorage para compatibilidad con código existente
    localStorage.setItem(TOKEN_KEY, token);
    
    // Guardar en cookies para el middleware
    Cookies.set(TOKEN_KEY, token, cookieOptions);
  }
};

/**
 * Obtiene el token JWT de cookies o localStorage
 * @returns Token JWT o null si no existe
 */
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Intentar obtener de cookies primero
    const cookieToken = Cookies.get(TOKEN_KEY);
    if (cookieToken && isValidTokenFormat(cookieToken)) {
      return cookieToken;
    }
    
    // Si no está en cookies, intentar obtener de localStorage
    const localToken = localStorage.getItem(TOKEN_KEY);
    if (localToken && isValidTokenFormat(localToken)) {
      return localToken;
    }
    
    // Si ningún token es válido, limpiar todo
    if (cookieToken || localToken) {
      removeToken();
    }
  }
  return null;
};

/**
 * Elimina el token JWT de cookies y localStorage
 */
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    // Eliminar de localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    // Eliminar de cookies
    Cookies.remove(TOKEN_KEY, { path: '/' });
    Cookies.remove(USER_DATA_KEY, { path: '/' });
  }
};

/**
 * Sanitiza los datos del usuario antes de guardarlos
 * @param userData Datos del usuario
 * @returns Datos sanitizados
 */
const sanitizeUserData = (userData: any): any => {
  if (!userData || typeof userData !== 'object') return null;
  
  // Crear una copia limpia solo con campos permitidos
  const sanitized: any = {};
  const allowedFields = ['usuario', 'nombre', 'correo', 'roles', 'tenant', 'exp', 'iat'];
  
  allowedFields.forEach(field => {
    if (userData[field] !== undefined) {
      sanitized[field] = userData[field];
    }
  });
  
  return sanitized;
};

/**
 * Guarda los datos del usuario en cookies y localStorage
 * @param userData Datos del usuario a guardar
 */
export const saveUserData = (userData: any): void => {
  if (typeof window !== 'undefined') {
    // Sanitizar datos antes de guardar
    const sanitizedData = sanitizeUserData(userData);
    if (!sanitizedData) {
      console.error('Datos de usuario inválidos');
      return;
    }
    
    const userDataString = JSON.stringify(sanitizedData);
    
    // Guardar en localStorage
    localStorage.setItem(USER_DATA_KEY, userDataString);
    
    // Guardar en cookies
    Cookies.set(USER_DATA_KEY, userDataString, cookieOptions);
  }
};

/**
 * Obtiene los datos del usuario de cookies o localStorage
 * @returns Datos del usuario o null si no existen
 */
export const getUserData = (): any | null => {
  if (typeof window !== 'undefined') {
    // Intentar obtener de cookies primero
    const cookieUserData = Cookies.get(USER_DATA_KEY);
    if (cookieUserData) {
      try {
        return JSON.parse(cookieUserData);
      } catch (e) {
        console.error('Error parsing user data from cookie:', e);
      }
    }
    
    // Si no está en cookies o hay error, intentar obtener de localStorage
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }
  return null;
};

/**
 * Verifica si el usuario está autenticado
 * @returns Booleano que indica si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Verificar que el token tenga el formato correcto
    if (!token.includes('.')) {
      removeToken(); // Limpiar token inválido
      return false;
    }
    
    // Decodificar el token (parte del payload)
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      removeToken(); // Limpiar token inválido
      return false;
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Verificar la expiración del token
    const currentTime = Date.now() / 1000;
    if (payload.exp <= currentTime) {
      //////console.log('Token expirado, eliminando credenciales');
      removeToken(); // Limpiar token expirado
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error al verificar la autenticación:', error);
    removeToken(); // Limpiar token en caso de error
    return false;
  }
};

/**
 * Decodifica el token JWT para obtener la información del usuario
 * @param token Token JWT a decodificar
 * @returns Información del usuario contenida en el token
 */
export const decodeToken = (token: string): any => {
  if (!token || typeof token !== 'string') {
    console.error('Token inválido o no proporcionado');
    return null;
  }
  
  try {
    // Validar formato del token
    if (!isValidTokenFormat(token)) {
      console.error('Formato de token inválido');
      return null;
    }
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(base64));
    
    // Validar que el payload tenga los campos mínimos requeridos
    if (!decoded.exp || !decoded.iat) {
      console.error('Token no contiene campos de expiración requeridos');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return null;
  }
};

/**
 * Cierra la sesión del usuario
 */
export const logout = (): void => {
  // Eliminar tokens y datos de usuario
  removeToken();
  
  // Forzar la eliminación de cookies directamente
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${USER_DATA_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  
  // Redireccionar al login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};
