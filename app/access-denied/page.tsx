"use client"

import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"

export default function AccessDeniedPage() {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-red-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-800 rounded-2xl mb-4 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          No tienes permisos suficientes para acceder a esta página.
          Contacta al administrador si crees que deberías tener acceso.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleBack}
            variant="outline" 
            className="flex items-center gap-2 rounded-xl border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <Button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  )
}
