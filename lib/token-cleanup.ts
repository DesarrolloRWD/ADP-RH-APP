/**
 * Utilidad para limpiar tokens expirados
 */
import { getToken, removeToken } from './auth';

/**
 * Verifica si un token JWT está expirado
 * @param token Token JWT a verificar
 * @returns true si el token está expirado, false si es válido
 */
export function isTokenExpired(token: string): boolean {
  if (!token || !token.includes('.')) {
    return true;
  }

  try {
    // Decodificar el token (parte del payload)
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      return true;
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Verificar la expiración del token
    const currentTime = Date.now() / 1000;
    return payload.exp <= currentTime;
  } catch (error) {
    console.error('Error al verificar la expiración del token:', error);
    return true; // En caso de error, considerar el token como expirado
  }
}

/**
 * Limpia tokens expirados al iniciar la aplicación
 */
export function cleanupExpiredTokens(): void {
  if (typeof window === 'undefined') {
    return; // Solo ejecutar en el cliente
  }

  const token = getToken();
  if (token && isTokenExpired(token)) {
    //////console.log('Detectado token expirado al iniciar la aplicación, limpiando credenciales');
    removeToken();
  }
}

// Ejecutar limpieza automáticamente al cargar este módulo en el cliente
if (typeof window !== 'undefined') {
  cleanupExpiredTokens();
}
