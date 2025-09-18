"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getToken } from "@/lib/auth"
import AuthGuard from "@/components/auth-guard"

// Interfaz para los roles
interface Role {
  nombre: string
  descripcion?: string
}

// Roles predefinidos
const defaultRoles: Role[] = [
  {
    nombre: "ROLE_ADMIN",
    descripcion: "Administrador"
  },
  {
    nombre: "ROLE_RH",
    descripcion: "Recursos Humanos"
  },
  {
    nombre: "ROLE_SUPERVISOR",
    descripcion: "Supervisor"
  },
  {
    nombre: "ROLE_CHECKTIME",
    descripcion: "Asistencia"
  }
];

export default function RolesAdminPage() {
  const [roles] = useState<Role[]>(defaultRoles)
  const router = useRouter()
  const { toast } = useToast()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 dark:bg-gray-900/80 dark:border-gray-800">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Administración de Roles</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gestión de roles del sistema</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Volver
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-6">
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle>Roles del Sistema</CardTitle>
              <CardDescription>
                Esta funcionalidad ha sido simplificada. La gestión de permisos ha sido eliminada del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map(role => (
                  <Card key={role.nombre} className="border border-gray-200 dark:border-gray-800">
                    <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
                      <CardTitle className="text-lg">{role.descripcion || role.nombre.replace('ROLE_', '')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Rol: {role.nombre}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-8 flex justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  La gestión de permisos ha sido deshabilitada en esta versión del sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
