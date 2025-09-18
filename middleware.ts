import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticación
const protectedRoutes = ['/dashboard', '/user', '/admin']

// Rutas públicas (no requieren autenticación)
const publicRoutes = ['/login']

// Roles permitidos para acceder a la aplicación web
const allowedRoles = ['ROLE_ADMIN', 'ROLE_RH', 'ADMIN', 'RH']


// Obtener la URL base de la solicitud actual
const getBaseUrl = (request: NextRequest): string => {
  // Usar siempre la URL de la solicitud actual
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  return `${protocol}://${host}`
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Obtener el token de las cookies
  const token = request.cookies.get('adp_rh_auth_token')?.value
  
  // Obtener los datos del usuario de las cookies
  const userDataCookie = request.cookies.get('adp_rh_user_data')?.value
  let userData = null;
  let userRoles: string[] = [];
  
  // Función para decodificar el token JWT compatible con Edge Runtime
  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      // Decodificación manual compatible con Edge Runtime
      const rawData = atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      // Convertir a texto y parsear como JSON
      const decoder = new TextDecoder('utf-8');
      const jsonPayload = decoder.decode(outputArray);
      
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  };
  
  // Intentar obtener roles del token directamente
  if (token) {
    const decodedToken = decodeToken(token);
    console.log('Token decodificado:', JSON.stringify(decodedToken));
    
    if (decodedToken) {
      // Intentar extraer roles de diferentes propiedades del token
      const possibleRoleProperties = ['roles', 'role', 'authorities', 'scope', 'permissions'];
      
      for (const prop of possibleRoleProperties) {
        if (decodedToken[prop]) {
          const roleData = decodedToken[prop];
          
          if (Array.isArray(roleData)) {
            userRoles = roleData.map((r: any) => {
              if (typeof r === 'object' && r.nombre) {
                return r.nombre;
              } else if (typeof r === 'object' && r.authority) {
                return r.authority;
              } else if (typeof r === 'string') {
                return r;
              }
              return '';
            }).filter(Boolean);
          } else if (typeof roleData === 'string') {
            // Si es una cadena, podría ser un solo rol o varios separados por comas o espacios
            userRoles = roleData.split(/[\s,]+/).filter(Boolean);
          } else if (typeof roleData === 'object') {
            // Si es un objeto, intentar extraer propiedades relevantes
            userRoles = Object.values(roleData).map(v => String(v)).filter(Boolean);
          }
          
          if (userRoles.length > 0) {
            console.log(`Roles extraídos del token (propiedad ${prop}):`, userRoles);
            break; // Si encontramos roles, no seguimos buscando
          }
        }
      }
      
      // Si no encontramos roles en propiedades específicas, buscar en todo el token
      if (userRoles.length === 0) {
        // Buscar cualquier propiedad que pueda contener la palabra 'admin' o 'rh'
        Object.entries(decodedToken).forEach(([key, value]) => {
          const valueStr = String(value).toUpperCase();
          if (valueStr.includes('ADMIN') || valueStr.includes('RH')) {
            userRoles.push(valueStr);
            console.log(`Rol encontrado en propiedad ${key}:`, valueStr);
          }
        });
      }
    }
  }
  
  // Si no se pudieron extraer roles del token, intentar con los datos de usuario en la cookie
  if (userRoles.length === 0 && userDataCookie) {
    try {
      userData = JSON.parse(userDataCookie);
      // Extraer roles del usuario si existen
      if (userData && userData.roles) {
        if (Array.isArray(userData.roles)) {
          userRoles = userData.roles.map((r: any) => {
            if (typeof r === 'object' && r.nombre) {
              return r.nombre;
            } else if (typeof r === 'string') {
              return r;
            }
            return '';
          }).filter(Boolean);
        } else if (typeof userData.roles === 'string') {
          userRoles = [userData.roles];
        }
        
        console.log('Roles extraídos de la cookie:', userRoles);
      }
    } catch (e) {
      console.error('Error parsing user data from cookie:', e);
    }
  }
  
  // Verificar si la ruta actual es protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Obtener la URL base
  const baseUrl = getBaseUrl(request)
  
  // Verificar para la ruta de login
  if (pathname.startsWith('/login')) {
    // Siempre permitir acceso a la página de login
    // Esto evita redirecciones infinitas cuando hay tokens expirados
    return NextResponse.next();
  }
  
  // Si es una ruta protegida y no hay token, redirigir al login
  if (isProtectedRoute && !token) {
    // Guardar la URL a la que intentaba acceder para redirigir después del login
    const url = new URL('/login', baseUrl)
    
    // Guardar solo la ruta relativa, no la URL completa
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  
  // Si es una ruta protegida y hay token, verificar si el usuario tiene un rol permitido
  if (isProtectedRoute && token) {
    // Verificar si el usuario tiene al menos uno de los roles permitidos
    const hasAllowedRole = userRoles.some(role => {
      if (!role) return false;
      
      // Normalizar el rol para la comparación (eliminar espacios, convertir a mayúsculas)
      const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';
      
      // Verificar si el rol normalizado contiene alguno de los roles permitidos
      return allowedRoles.some(allowedRole => {
        return normalizedRole === allowedRole || 
               normalizedRole.includes(`ROLE_${allowedRole}`) || 
               normalizedRole.includes(allowedRole);
      });
    });
    
    console.log('Roles del usuario:', userRoles);
    console.log('Roles permitidos:', allowedRoles);
    console.log('¿Tiene rol permitido?', hasAllowedRole);
    
    // Si no tiene un rol permitido, redirigir a una página de acceso denegado
    if (!hasAllowedRole) {
      const url = new URL('/access-denied', baseUrl);
      return NextResponse.redirect(url);
    }
  }
  
  // Si es una ruta pública (como login) y hay token, verificar si el usuario tiene un rol permitido
  if (isPublicRoute && token) {
    // Verificar si el usuario tiene al menos uno de los roles permitidos
    const hasAllowedRole = userRoles.some(role => {
      if (!role) return false;
      
      // Normalizar el rol para la comparación (eliminar espacios, convertir a mayúsculas)
      const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';
      
      // Verificar si el rol normalizado contiene alguno de los roles permitidos
      return allowedRoles.some(allowedRole => {
        return normalizedRole === allowedRole || 
               normalizedRole.includes(`ROLE_${allowedRole}`) || 
               normalizedRole.includes(allowedRole);
      });
    });
    
    // Si tiene un rol permitido, redirigir al dashboard
    if (hasAllowedRole) {
      const url = new URL('/dashboard', baseUrl)
      return NextResponse.redirect(url)
    } else {
      // Si no tiene un rol permitido, redirigir a una página de acceso denegado
      const url = new URL('/access-denied', baseUrl);
      return NextResponse.redirect(url);
    }
  }
  
  // Si la ruta es la raíz (/), redirigir según si hay token o no
  if (pathname === '/') {
    const url = new URL(token ? '/dashboard' : '/login', baseUrl)
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

// Configurar el middleware para que se ejecute en todas las rutas
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
