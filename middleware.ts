import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticación
const protectedRoutes = ['/dashboard', '/user']

// Rutas públicas (no requieren autenticación)
const publicRoutes = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Obtener el token de las cookies
  const token = request.cookies.get('adp_rh_auth_token')?.value
  
  // Verificar si la ruta actual es protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Si es una ruta protegida y no hay token, redirigir al login
  if (isProtectedRoute && !token) {
    // Guardar la URL a la que intentaba acceder para redirigir después del login
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', encodeURI(request.url))
    return NextResponse.redirect(url)
  }
  
  // Si es una ruta pública (como login) y hay token, redirigir al dashboard
  if (isPublicRoute && token) {
    const url = new URL('/dashboard', request.url)
    return NextResponse.redirect(url)
  }
  
  // Si la ruta es la raíz (/), redirigir según si hay token o no
  if (pathname === '/') {
    const url = new URL(token ? '/dashboard' : '/login', request.url)
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

// Configurar el middleware para que se ejecute en todas las rutas
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
