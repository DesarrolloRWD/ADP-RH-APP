"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Users, Clock, Shield, AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter, useSearchParams } from "next/navigation"
import { loginUser } from "@/lib/api"
import { saveToken, decodeToken, saveUserData, getToken } from "@/lib/auth"
import { validateLoginCredentials, sanitizeInput } from "@/lib/validation"

// Login form component that uses searchParams
function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  const MAX_LOGIN_ATTEMPTS = 5
  const BLOCK_DURATION = 5 * 60 * 1000
  
  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const token = getToken()
    if (token) {
      router.push('/dashboard')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Verificar si está bloqueado por intentos fallidos
    if (isBlocked) {
      setError('Demasiados intentos fallidos. Por favor, espera 5 minutos antes de intentar nuevamente.')
      return
    }
    
    // Validar credenciales antes de enviar
    const validation = validateLoginCredentials(usuario, password)
    if (!validation.isValid) {
      setError(validation.error || 'Credenciales inválidas')
      return
    }
    
    setIsLoading(true)

    try {
      // Sanitizar las entradas antes de enviar
      const sanitizedUsuario = sanitizeInput(usuario.trim())
      const sanitizedPassword = password.trim()
      
      // Llamada a la API real de autenticación
      const response = await loginUser({ usuario: sanitizedUsuario, pswd: sanitizedPassword })
      
      // Obtener el token (puede venir en diferentes formatos)
      const token = response.token || response["token "];
      
      if (!token) {
        throw new Error('No se recibió un token válido del servidor');
      }
      
      // Guardar el token en localStorage
      saveToken(token)
      
      // Decodificar el token para obtener información del usuario
      const userData = decodeToken(token)
      if (userData) {
        saveUserData(userData)
      }
      
      // Asegurarse de que callbackUrl sea una ruta relativa
      // Si comienza con http, extraer solo la ruta
      let relativePath = callbackUrl
      if (callbackUrl.startsWith('http')) {
        try {
          const urlObj = new URL(callbackUrl)
          relativePath = urlObj.pathname + urlObj.search
        } catch (e) {
          console.error('Error al parsear callbackUrl:', e)
          relativePath = '/dashboard' // Fallback seguro
        }
      }
      
      // Resetear intentos de login en caso de éxito
      setLoginAttempts(0)
      
      // Usar router.push para la navegación en lugar de window.location
      // Esto asegura que se use la URL base correcta automáticamente
      router.push(relativePath)
    } catch (err: any) {
      // Incrementar intentos fallidos
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)
      
      // Bloquear si se exceden los intentos máximos
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setIsBlocked(true)
        setError(`Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por 5 minutos.`)
        
        // Desbloquear después del tiempo especificado
        setTimeout(() => {
          setIsBlocked(false)
          setLoginAttempts(0)
        }, BLOCK_DURATION)
      } else {
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts
        setError(`${err.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.'} (${remainingAttempts} intentos restantes)`)
      }
      
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 relative">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-800 rounded-2xl mb-4 shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ADP System Assist</h1>
          <p className="text-gray-500 dark:text-gray-400">Sistema de gestión de asistencias</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400">Accede al panel de administración de RH</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-gray-700 dark:text-gray-300 font-medium">
                  Usuario
                </Label>
                <Input
                  id="usuario"
                  type="text"
                  placeholder="nombre_usuario"
                  value={usuario}
                  onChange={(e) => {
                    const value = e.target.value
                    // Permitir solo caracteres alfanuméricos, guiones y guiones bajos
                    const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '')
                    setUsuario(sanitized)
                  }}
                  maxLength={20}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  required
                  disabled={isBlocked}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={15}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 pr-10"
                    required
                    disabled={isBlocked}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {loginAttempts > 0 && loginAttempts < MAX_LOGIN_ATTEMPTS && !error && (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Intento {loginAttempts} de {MAX_LOGIN_ATTEMPTS}</span>
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl shadow-sm"
                disabled={isLoading || isBlocked}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm shadow-sm">
            <Shield className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Seguro</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm shadow-sm">
            <Clock className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">24/7</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm shadow-sm">
            <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Confiable</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-800 rounded-2xl mb-4 shadow-lg">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300">Cargando...</h2>
      </div>
    </div>
  )
}

// Main page component that wraps the login form in a Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}
