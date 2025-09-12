import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticación
const protectedRoutes = ['/dashboard', '/user']

// Rutas públicas (no requieren autenticación)
const publicRoutes = ['/login']

// Obtener la URL base del entorno o usar la URL de la solicitud
const getBaseUrl = (request: NextRequest): string => {
  // Si estamos en producción y hay una URL base configurada, usarla
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  // De lo contrario, usar la URL de la solicitud
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  return `${protocol}://${host}`
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Obtener el token de las cookies
  const token = request.cookies.get('adp_rh_auth_token')?.value
  
  // Verificar si la ruta actual es protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Obtener la URL base
  const baseUrl = getBaseUrl(request)
  
  // Si es una ruta protegida y no hay token, redirigir al login
  if (isProtectedRoute && !token) {
    // Guardar la URL a la que intentaba acceder para redirigir después del login
    const url = new URL('/login', baseUrl)
    
    // Guardar solo la ruta relativa, no la URL completa
    // Esto evita problemas con redirecciones a localhost
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
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
