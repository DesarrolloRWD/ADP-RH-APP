"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Shield, Users, ArrowLeft, Save, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Permissions } from "@/lib/permissions"
import { saveRolePermissions, getRolePermissions } from "@/lib/local-storage"
import AuthGuard from "@/components/auth-guard"

// Interfaz para los roles
interface Role {
  nombre: string
  descripcion?: string
  permisos: string[]
}

// Agrupar permisos por categoría para la UI
interface PermissionCategory {
  name: string
  key: string
  permissions: {
    id: string
    label: string
  }[]
}

// Convertir el objeto de permisos a categorías para la UI
const permissionCategories: PermissionCategory[] = [
  {
    name: "Usuarios",
    key: "USERS",
    permissions: Object.entries(Permissions.USERS).map(([key, value]) => ({
      id: value,
      label: key === 'VIEW' ? 'Ver usuarios' :
             key === 'CREATE' ? 'Crear usuarios' :
             key === 'EDIT' ? 'Editar usuarios' :
             key === 'DELETE' ? 'Eliminar usuarios' :
             key === 'MANAGE_STATUS' ? 'Activar/desactivar usuarios' : value
    }))
  },
  {
    name: "Asistencias",
    key: "ATTENDANCE",
    permissions: Object.entries(Permissions.ATTENDANCE).map(([key, value]) => ({
      id: value,
      label: key === 'VIEW' ? 'Ver asistencias' :
             key === 'VIEW_DETAILS' ? 'Ver detalles de asistencia' :
             key === 'EXPORT' ? 'Exportar asistencias' :
             key === 'EDIT' ? 'Editar asistencias' : value
    }))
  },
  {
    name: "Configuración",
    key: "SETTINGS",
    permissions: Object.entries(Permissions.SETTINGS).map(([key, value]) => ({
      id: value,
      label: key === 'VIEW' ? 'Ver configuración' :
             key === 'EDIT' ? 'Editar configuración' : value
    }))
  },
  {
    name: "Reportes",
    key: "REPORTS",
    permissions: Object.entries(Permissions.REPORTS).map(([key, value]) => ({
      id: value,
      label: key === 'VIEW' ? 'Ver reportes' :
             key === 'GENERATE' ? 'Generar reportes' : value
    }))
  }
];

// Roles predefinidos
const defaultRoles: Role[] = [
  {
    nombre: "ROLE_ADMIN",
    descripcion: "Administrador",
    permisos: [
      // Todos los permisos
      ...Object.values(Permissions.USERS),
      ...Object.values(Permissions.ATTENDANCE),
      ...Object.values(Permissions.SETTINGS),
      ...Object.values(Permissions.REPORTS)
    ]
  },
  {
    nombre: "ROLE_RH",
    descripcion: "Recursos Humanos",
    permisos: [
      // Permisos de usuarios limitados
      Permissions.USERS.VIEW,
      Permissions.USERS.CREATE,
      Permissions.USERS.EDIT,
      Permissions.USERS.MANAGE_STATUS,
      
      // Todos los permisos de asistencias
      ...Object.values(Permissions.ATTENDANCE),
      
      // Permisos limitados de configuración
      Permissions.SETTINGS.VIEW,
      
      // Todos los permisos de reportes
      ...Object.values(Permissions.REPORTS)
    ]
  },
  {
    nombre: "ROLE_SUPERVISOR",
    descripcion: "Supervisor",
    permisos: [
      // Permisos limitados de usuarios
      Permissions.USERS.VIEW,
      
      // Permisos limitados de asistencias
      Permissions.ATTENDANCE.VIEW,
      Permissions.ATTENDANCE.VIEW_DETAILS,
      
      // Permisos limitados de reportes
      Permissions.REPORTS.VIEW
    ]
  },
  {
    nombre: "ROLE_CHECKTIME",
    descripcion: "Asistencia",
    permisos: [
      // Permisos muy limitados
      Permissions.ATTENDANCE.VIEW
    ]
  }
];

export default function RolesAdminPage() {
  const [roles, setRoles] = useState<Role[]>(defaultRoles)
  const [activeTab, setActiveTab] = useState("ROLE_ADMIN")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Cargar roles desde el almacenamiento local o usar predefinidos
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true)
      try {
        // Intentar cargar roles desde el almacenamiento local
        const savedRoles = getRolePermissions()
        
        if (savedRoles && savedRoles.length > 0) {
          console.log("Usando roles guardados localmente")
          setRoles(savedRoles)
        } else {
          // Si no hay roles guardados, usar los predefinidos
          console.log("Usando roles predefinidos")
          setRoles(defaultRoles)
          
          // Guardar los roles predefinidos en el almacenamiento local
          saveRolePermissions(defaultRoles)
        }
      } catch (error) {
        console.error("Error al cargar roles:", error)
        // Si hay error, usar los roles predefinidos
        setRoles(defaultRoles)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [])

  // Manejar cambio de permisos
  const handlePermissionChange = (roleName: string, permissionId: string, isChecked: boolean) => {
    setRoles(prevRoles => 
      prevRoles.map(role => {
        if (role.nombre === roleName) {
          return {
            ...role,
            permisos: isChecked 
              ? [...role.permisos, permissionId] 
              : role.permisos.filter(p => p !== permissionId)
          }
        }
        return role
      })
    )
  }

  // Guardar cambios localmente
  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      // Guardar los roles actualizados en el almacenamiento local
      const success = saveRolePermissions(roles)

      if (success) {
        toast({
          title: "Permisos actualizados",
          description: "Los permisos de los roles han sido actualizados correctamente.",
        })
      } else {
        throw new Error("Error al actualizar permisos")
      }
    } catch (error) {
      console.error("Error al guardar permisos:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Verificar si un permiso está seleccionado
  const isPermissionSelected = (roleName: string, permissionId: string): boolean => {
    const role = roles.find(r => r.nombre === roleName)
    return role ? role.permisos.includes(permissionId) : false
  }

  return (
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gestiona los permisos de cada rol</p>
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
              <CardTitle>Configuración de Permisos por Rol</CardTitle>
              <CardDescription>
                Selecciona los permisos que tendrá cada rol en el sistema. Los cambios afectarán a todos los usuarios con ese rol.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground">Cargando roles...</p>
                  </div>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
                    {roles.map(role => (
                      <TabsTrigger key={role.nombre} value={role.nombre} className="text-sm">
                        {role.descripcion || role.nombre.replace('ROLE_', '')}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {roles.map(role => (
                    <TabsContent key={role.nombre} value={role.nombre} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {permissionCategories.map(category => (
                          <Card key={category.key} className="border border-gray-200 dark:border-gray-800">
                            <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
                              <CardTitle className="text-lg">{category.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="space-y-4">
                                {category.permissions.map(permission => (
                                  <div key={permission.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`${role.nombre}-${permission.id}`}
                                      checked={isPermissionSelected(role.nombre, permission.id)}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(role.nombre, permission.id, checked === true)
                                      }
                                    />
                                    <Label 
                                      htmlFor={`${role.nombre}-${permission.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {permission.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                  
                  <div className="mt-8 flex justify-end">
                    <Button 
                      onClick={handleSaveChanges} 
                      disabled={isSaving}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
