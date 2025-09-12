"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Users, Clock, Shield } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter, useSearchParams } from "next/navigation"
import { loginUser } from "@/lib/api"
import { saveToken, decodeToken, saveUserData, getToken } from "@/lib/auth"

// Login form component that uses searchParams
function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const token = getToken()
    if (token) {
      router.push('/dashboard')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Llamada a la API real de autenticación
      const response = await loginUser({ usuario, pswd: password })
      
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
      
      // Obtener la URL base del entorno (obligatorio para producción)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      
      if (!baseUrl) {
        console.error('NEXT_PUBLIC_BASE_URL no está configurado')
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
      
      // Construir la URL completa para la redirección
      const redirectUrl = `${baseUrl}${relativePath}`
      
      // Redireccionar a la URL de callback o al dashboard por defecto
      window.location.href = redirectUrl
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.')
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
                  onChange={(e) => setUsuario(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  required
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
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 pr-10"
                    required
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
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm mb-4">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl shadow-sm"
                disabled={isLoading}
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
