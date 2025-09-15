"use client"

import { Button } from "@/components/ui/button"
import { Lock, AlertTriangle } from "lucide-react"
import { useEffect } from "react"
import { removeToken } from "@/lib/auth"

export default function BlockedPage() {
  // Al cargar la página, eliminar cualquier token o información de usuario
  useEffect(() => {
    removeToken()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-red-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-800 rounded-2xl mb-4 shadow-lg">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Acceso Bloqueado</h1>
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl mb-6">
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Usuario sin acceso</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Tu cuenta no tiene permiso para acceder al sistema.
            Contacta al administrador para más información.
          </p>
        </div>
        
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Este usuario ha sido bloqueado o no tiene los permisos necesarios para iniciar sesión.
        </p>
        
        <div className="flex justify-center">
          <Button 
            onClick={() => window.location.href = "/login"}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
