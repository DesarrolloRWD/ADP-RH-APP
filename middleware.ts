import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Permissions } from '@/lib/permissions'

// Rutas que requieren autenticación
const protectedRoutes = ['/dashboard', '/user', '/admin']

// Rutas públicas (no requieren autenticación)
const publicRoutes = ['/login']

// Configuración de rutas por rol
const roleRoutes: Record<string, string[]> = {
  'ROLE_ADMIN': ['/dashboard', '/user', '/admin'],
  'ROLE_RH': ['/dashboard', '/user'],
  'ROLE_SUPERVISOR': ['/dashboard'],
  'ROLE_CHECKTIME': ['/dashboard']
}

// Permisos requeridos para rutas específicas
const routePermissions: Record<string, string[]> = {
  '/login': [Permissions.SYSTEM.LOGIN],
  '/dashboard': [Permissions.SYSTEM.ACCESS],
  '/user': [Permissions.SYSTEM.ACCESS, Permissions.USERS.VIEW],
  '/admin/roles': [Permissions.SYSTEM.ACCESS, Permissions.SETTINGS.EDIT]
}


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
  let userPermissions: string[] = [];
  let allowWebAccess: boolean = true; // Por defecto permitir acceso web
  
  if (userDataCookie) {
    try {
      userData = JSON.parse(userDataCookie);
      // Extraer roles del usuario si existen
      if (userData && userData.roles) {
        userRoles = Array.isArray(userData.roles) 
          ? userData.roles.map((r: any) => r.nombre || r) 
          : [userData.roles];
      }
      
      // Extraer permisos del usuario si existen
      if (userData && userData.permissions) {
        userPermissions = userData.permissions;
      }
      
      // Verificar si el usuario tiene permiso de acceso web
      if (userData.hasOwnProperty('allowWebAccess')) {
        allowWebAccess = userData.allowWebAccess;
      } else {
        // Si no está especificado, determinar por el rol
        // Los usuarios con rol ROLE_CHECKTIME no tienen acceso web por defecto
        allowWebAccess = !userRoles.includes('ROLE_CHECKTIME');
      }
    } catch (e) {
      console.error('Error parsing user data from cookie');
    }
  }
  
  // Verificar si la ruta actual es protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Obtener la URL base
  const baseUrl = getBaseUrl(request)
  
  // Verificar permisos para la ruta de login
  if (pathname.startsWith('/login')) {
    // Siempre permitir acceso a la página de login
    // Esto evita redirecciones infinitas cuando hay tokens expirados
    return NextResponse.next();
  }
  
  // Verificar acceso web para todas las rutas excepto /login y /blocked
  if (token && !pathname.startsWith('/blocked') && !allowWebAccess) {
    // Si el usuario no tiene permiso de acceso web, redirigir a la página de acceso bloqueado
    const url = new URL('/blocked', baseUrl);
    return NextResponse.redirect(url);
  }
  
  // Si es una ruta protegida y no hay token, redirigir al login
  if (isProtectedRoute && !token) {
    // Guardar la URL a la que intentaba acceder para redirigir después del login
    const url = new URL('/login', baseUrl)
    
    // Guardar solo la ruta relativa, no la URL completa
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  
  // Si es una ruta protegida y hay token, verificar permisos por rol
  if (isProtectedRoute && token && userRoles.length > 0) {
    // 1. Verificar si el usuario tiene el permiso de acceso al sistema
    const hasAccessPermission = userRoles.some(role => {
      return roleRoutes[role] && roleRoutes[role].includes('/dashboard');
    });
    
    if (!hasAccessPermission) {
      const url = new URL('/access-denied', baseUrl);
      return NextResponse.redirect(url);
    }
    
    // 2. Verificar si el usuario tiene permiso para acceder a esta ruta específica
    const hasRoutePermission = userRoles.some(role => {
      // Si el rol existe en la configuración y la ruta actual comienza con alguna de las rutas permitidas
      return roleRoutes[role] && roleRoutes[role].some(route => pathname.startsWith(route));
    });
    
    // Si no tiene permiso para esta ruta, redirigir a una página de acceso denegado
    if (!hasRoutePermission) {
      const url = new URL('/access-denied', baseUrl);
      return NextResponse.redirect(url);
    }
    
    // 3. Verificar permisos específicos para ciertas rutas
    // Obtener los permisos requeridos para la ruta actual
    let requiredPermissions: string[] = [];
    
    // Buscar la ruta más específica que coincida con el pathname actual
    Object.keys(routePermissions).forEach(route => {
      if (pathname.startsWith(route)) {
        // Si encontramos una ruta más específica, usamos esos permisos
        if (!requiredPermissions.length || route.length > requiredPermissions.length) {
          requiredPermissions = routePermissions[route];
        }
      }
    });
    
    // Si hay permisos requeridos para esta ruta, verificar si el usuario los tiene
    if (requiredPermissions.length > 0) {
      // Verificar si el usuario tiene todos los permisos requeridos
      const hasAllRequiredPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
      
      // Si no tiene todos los permisos requeridos, redirigir a una página de acceso denegado
      if (!hasAllRequiredPermissions) {
        const url = new URL('/access-denied', baseUrl);
        return NextResponse.redirect(url);
      }
    }
  }
  
  // Si es una ruta pública (como login) y hay token, redirigir al dashboard
  if (isPublicRoute && token) {
    const url = new URL('/dashboard', baseUrl)
    return NextResponse.redirect(url)
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
