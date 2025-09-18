"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { UserPlus, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getRoles, getTenants, Role, Tenant } from "@/lib/api"
import { getUserData } from "@/lib/auth"

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: () => void
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [tenantsError, setTenantsError] = useState<string | null>(null)
  const [isUserRH, setIsUserRH] = useState(false)
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const { toast } = useToast()
  
  // Detectar si el usuario actual es RH o ADMIN
  useEffect(() => {
    const userData = getUserData();
    if (userData && userData.roles) {
      let roles: string[] = [];
      
      // Extraer roles del userData
      if (Array.isArray(userData.roles)) {
        roles = userData.roles.map((r: any) => {
          if (typeof r === 'object' && r.nombre) return r.nombre;
          if (typeof r === 'string') return r;
          return '';
        }).filter(Boolean);
      } else if (typeof userData.roles === 'string') {
        roles = [userData.roles];
      }
      
      // Verificar si el usuario tiene rol RH o ADMIN
      setIsUserRH(roles.some(r => r.includes('RH') || r.includes('ROLE_RH')));
      setIsUserAdmin(roles.some(r => r.includes('ADMIN') || r.includes('ROLE_ADMIN')));
    }
  }, []);
  
  // Cargar roles y tenants cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadRoles()
      loadTenants()
    }
  }, [isOpen])
  
  // Función para cargar los roles desde el API
  const loadRoles = async () => {
    setIsLoadingRoles(true)
    setRolesError(null)
    
    try {
      const rolesData = await getRoles()
      
      // Si el usuario es RH pero no es ADMIN, filtrar el rol ADMIN
      if (isUserRH && !isUserAdmin) {
        setRoles(rolesData.filter(role => role.nombre !== 'ROLE_ADMIN'))
      } else {
        setRoles(rolesData)
      }
    } catch (error) {
      console.error('Error al cargar los roles:', error)
      setRolesError('No se pudieron cargar los roles. Por favor, intenta nuevamente.')
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingRoles(false)
    }
  }
  
  // Función para cargar los tenants desde el API
  const loadTenants = async () => {
    setIsLoadingTenants(true)
    setTenantsError(null)
    
    try {
      const tenantsData = await getTenants()
      setTenants(tenantsData)
      // No establecemos un tenant por defecto, se seleccionará al enviar el formulario
    } catch (error) {
      console.error('Error al cargar los tenants:', error)
      setTenantsError('No se pudieron cargar los tenants.')
      // No mostrar toast para no interrumpir la experiencia del usuario
    } finally {
      setIsLoadingTenants(false)
    }
  }
  const [formData, setFormData] = useState({
    correo: "",
    nombre: "",
    apdPaterno: "",
    apdMaterno: "",
    usuario: "",
    curp: "",
    telefono: "",
    rfc: "",
    pswd: "",
    image: "",
    estatus: true,
    role: "",
    tenant: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar que se haya seleccionado un rol
      if (!formData.role) {
        toast({
          title: "Error",
          description: "Por favor, selecciona un rol para el usuario.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      
      // Verificar si tenemos un tenant disponible
      if (tenants.length === 0 && !tenantsError) {
        // Si no hay tenants cargados y no hubo error, es posible que aún estén cargando
        toast({
          title: "Espera un momento",
          description: "Estamos cargando la información necesaria para crear el usuario.",
        })
        setIsLoading(false)
        return
      }
      
      // Seleccionar el tenant a usar
      let tenantToUse = "";
      
      // Si hay tenants disponibles, usar el primero
      if (tenants.length > 0) {
        tenantToUse = tenants[0].nombre;
      } else {
        // Si hubo un error al cargar los tenants, mostrar un mensaje
        toast({
          title: "Error",
          description: "No se pudo obtener la información de tenant. Por favor, intenta nuevamente más tarde.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      
      // Asegurarse de que el nombre de usuario tenga el prefijo 'zoques_'
      let usuarioFinal = formData.usuario;
      
      // Si el usuario ya tiene el prefijo 'zoques_', no hacer nada
      if (!usuarioFinal.startsWith('zoques_')) {
        usuarioFinal = `zoques_${usuarioFinal}`;
      }
      
      // Crear el objeto de datos para enviar, excluyendo imagen y estatus
      const userData = {
        correo: formData.correo,
        nombre: formData.nombre,
        apdPaterno: formData.apdPaterno,
        apdMaterno: formData.apdMaterno,
        usuario: usuarioFinal, // Usar el nombre de usuario con el prefijo 'zoques_'
        curp: formData.curp,
        telefono: formData.telefono,
        rfc: formData.rfc,
        pswd: formData.pswd,
        roles: [{ nombre: formData.role }],
        tenant: { nombre: tenantToUse }
      };
      
      console.log('Enviando solicitud para crear usuario:', userData);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/save/information`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adp_rh_auth_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        toast({
          title: "Usuario creado exitosamente",
          description: `El usuario ${formData.usuario} ha sido registrado correctamente.`,
        })
        onUserCreated()
        setFormData({
          correo: "",
          nombre: "",
          apdPaterno: "",
          apdMaterno: "",
          usuario: "",
          curp: "",
          telefono: "",
          rfc: "",
          pswd: "",
          image: "",
          estatus: true,
          role: "ROLE_RH",
          tenant: "ZOQUES"
        })
      } else {
        throw new Error("Error al crear usuario")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el usuario. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Crear Nuevo Usuario</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">Completa la información para registrar un nuevo empleado en el sistema.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Nombre del empleado"
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Usuario *</Label>
              <Input
                id="usuario"
                value={formData.usuario}
                onChange={(e) => handleInputChange("usuario", e.target.value)}
                placeholder="Nombre de usuario único"
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apdPaterno" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Apellido Paterno *</Label>
              <Input
                id="apdPaterno"
                value={formData.apdPaterno}
                onChange={(e) => handleInputChange("apdPaterno", e.target.value)}
                placeholder="Apellido paterno"
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apdMaterno" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Apellido Materno</Label>
              <Input
                id="apdMaterno"
                value={formData.apdMaterno}
                onChange={(e) => handleInputChange("apdMaterno", e.target.value)}
                placeholder="Apellido materno"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Correo Electrónico *</Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => handleInputChange("correo", e.target.value)}
                placeholder="correo@empresa.com"
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pswd" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Contraseña *</Label>
              <Input
                id="pswd"
                type="password"
                value={formData.pswd}
                onChange={(e) => handleInputChange("pswd", e.target.value)}
                placeholder="Contraseña temporal"
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
                placeholder="5555555555"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfc" className="text-gray-700 dark:text-gray-300 text-sm font-medium">RFC</Label>
              <Input
                id="rfc"
                value={formData.rfc}
                onChange={(e) => handleInputChange("rfc", e.target.value)}
                placeholder="ABCD123456EFG"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="curp" className="text-gray-700 dark:text-gray-300 text-sm font-medium">CURP</Label>
              <Input
                id="curp"
                value={formData.curp}
                onChange={(e) => handleInputChange("curp", e.target.value)}
                placeholder="ABCD123456HDFGHI01"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Rol</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => handleInputChange("role", value)}
                disabled={isLoadingRoles || !!rolesError}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400">
                  {isLoadingRoles ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Cargando roles...</span>
                    </div>
                  ) : rolesError ? (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>Error al cargar roles</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Seleccionar rol" />
                  )}
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl">
                  {roles.length > 0 ? (
                    roles.map((role) => {
                      // Crear nombres amigables para los roles
                      let displayName = role.descripcion || "";
                      
                      if (!displayName) {
                        // Si no hay descripción, crear un nombre amigable basado en el nombre del rol
                        switch(role.nombre) {
                          case "ROLE_CHECKTIME":
                            displayName = "Asistencia";
                            break;
                          case "ROLE_ADMIN":
                            displayName = "Administrador";
                            break;
                          case "ROLE_RH":
                            displayName = "Recursos Humanos";
                            break;
                          case "ROLE_SUPERVISOR":
                            displayName = "Supervisor";
                            break;
                          default:
                            displayName = role.nombre.replace('ROLE_', '').toLowerCase()
                              .replace(/(^|\s)\S/g, l => l.toUpperCase()); // Capitalizar primera letra
                        }
                      }
                      
                      return (
                        <SelectItem key={role.nombre} value={role.nombre}>
                          {displayName}
                        </SelectItem>
                      );
                    })
                  ) : !isLoadingRoles && !rolesError ? (
                    <div className="p-2 text-center text-muted-foreground">
                      No hay roles disponibles
                    </div>
                  ) : null}
                </SelectContent>
              </Select>
              {rolesError && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-1 text-xs" 
                  onClick={loadRoles}
                >
                  <Loader2 className={`h-3 w-3 mr-1 ${isLoadingRoles ? 'animate-spin' : ''}`} />
                  Reintentar
                </Button>
              )}
            </div>
            
            {/* El selector de tenant se ha eliminado y se maneja automáticamente */}
          </div>

          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
            <Switch
              id="estatus"
              checked={formData.estatus}
              onCheckedChange={(checked) => handleInputChange("estatus", checked)}
              className="data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="estatus" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Usuario activo</Label>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Crear Usuario
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
