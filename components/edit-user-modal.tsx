"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, Upload, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getRoles, getTenants, Role, Tenant, updateUserInformation, updateUserImage } from "@/lib/api"
import Image from "next/image"

interface User {
  correo: string
  nombre: string
  apdPaterno: string
  apdMaterno: string
  usuario: string
  curp: string | null
  telefono: string
  rfc: string
  roles: Array<{ nombre: string }>
  fechaUltimoAcceso: string
  image: string
  estatus: boolean
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserUpdated: () => void
  user: User | null
}

export function EditUserModal({ isOpen, onClose, onUserUpdated, user }: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [tenantsError, setTenantsError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { toast } = useToast()
  
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

  // Cargar roles y tenants cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadRoles()
      loadTenants()
    }
  }, [isOpen])

  // Cargar datos del usuario cuando cambia
  useEffect(() => {
    if (user) {
      // Procesar la imagen base64 si existe
      let imageUrl = "";
      if (user.image) {
        // Verificar si la imagen ya tiene el prefijo data:image
        if (!user.image.startsWith('data:')) {
          imageUrl = `data:image/jpeg;base64,${user.image}`;
        } else {
          imageUrl = user.image;
        }
        console.log('Imagen procesada correctamente para el modal de edición');
      }
      
      
      setFormData({
        correo: user.correo || "",
        nombre: user.nombre || "",
        apdPaterno: user.apdPaterno || "",
        apdMaterno: user.apdMaterno || "",
        usuario: user.usuario || "",
        curp: user.curp || "",
        telefono: user.telefono || "",
        rfc: user.rfc || "",
        pswd: "", // No cargar la contraseña por seguridad
        image: imageUrl || "",
        estatus: user.estatus,
        role: user.roles && user.roles.length > 0 ? user.roles[0].nombre : "",
        tenant: "" // Se cargará automáticamente del backend
      })
      
      // Si el usuario tiene una imagen, mostrarla
      if (imageUrl) {
        setImagePreview(imageUrl);
      } else {
        setImagePreview(null);
      }
    }
  }, [user])

  const loadRoles = async () => {
    setIsLoadingRoles(true)
    setRolesError(null)
    
    try {
      const rolesData = await getRoles()
      setRoles(rolesData)
    } catch (error) {
      console.error("Error al cargar roles:", error)
      setRolesError("No se pudieron cargar los roles. Intenta nuevamente.")
    } finally {
      setIsLoadingRoles(false)
    }
  }

  const loadTenants = async () => {
    setIsLoadingTenants(true)
    setTenantsError(null)
    
    try {
      const tenantsData = await getTenants()
      setTenants(tenantsData)
    } catch (error) {
      console.error("Error al cargar tenants:", error)
      setTenantsError("No se pudieron cargar los tenants. Intenta nuevamente.")
    } finally {
      setIsLoadingTenants(false)
    }
  }

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
        toast({
          title: "Espera un momento",
          description: "Estamos cargando la información necesaria para actualizar el usuario.",
        })
        setIsLoading(false)
        return
      }
      
      // Seleccionar el tenant a usar
      let tenantToUse = ""
      
      // Si hay tenants disponibles, usar el primero
      if (tenants.length > 0) {
        tenantToUse = tenants[0].nombre
      } else {
        toast({
          title: "Error",
          description: "No se pudo obtener la información de tenant. Por favor, intenta nuevamente más tarde.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      
      // Preparar los datos para la actualización
      const updateData: {
        valueSearch: string;
        usuarioInformationRequest: {
          correo: string;
          nombre: string;
          apdPaterno: string;
          apdMaterno: string;
          usuario: string;
          curp: string;
          telefono: string;
          rfc: string;
          image: string;
          roles: Array<{ nombre: string }>;
          tenant: { nombre: string };
          pswd?: string; // Hacemos que pswd sea opcional
        };
      } = {
        valueSearch: user?.usuario || "", // Nombre de usuario original para buscar
        usuarioInformationRequest: {
          correo: formData.correo,
          nombre: formData.nombre,
          apdPaterno: formData.apdPaterno,
          apdMaterno: formData.apdMaterno,
          usuario: formData.usuario,
          curp: formData.curp,
          telefono: formData.telefono,
          rfc: formData.rfc,
          image: formData.image,
          roles: [{ nombre: formData.role }],
          tenant: { nombre: tenantToUse }
        }
      }
      
      // Si se proporcionó una contraseña, incluirla
      if (formData.pswd) {
        updateData.usuarioInformationRequest.pswd = formData.pswd
      }
      
      console.log('Enviando solicitud para actualizar usuario:', updateData)
      
      // Actualizar la información del usuario
      await updateUserInformation(updateData)
      
      toast({
        title: "Usuario actualizado exitosamente",
        description: `El usuario ${formData.usuario} ha sido actualizado correctamente.`,
      })
      
      onUserUpdated()
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploadingImage(true)
    
    try {
      // Convertir la imagen a base64
      const base64Image = await convertToBase64(file)
      
      // Actualizar el preview
      setImagePreview(base64Image as string)
      
      // Actualizar el formData
      setFormData(prev => ({
        ...prev,
        image: base64Image as string
      }))
      
      // Si tenemos el usuario, actualizar la imagen directamente
      if (user && user.usuario) {
        await updateUserImage({
          value: user.usuario,
          image: base64Image as string
        })
        
        toast({
          title: "Imagen actualizada",
          description: "La imagen del usuario ha sido actualizada correctamente.",
        })
      }
    } catch (error) {
      console.error("Error al procesar la imagen:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen. Intenta con otra imagen.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
    }
  }
  
  const convertToBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  // Función para obtener el nombre amigable del rol
  const getFriendlyRoleName = (roleName: string) => {
    switch(roleName) {
      case "ROLE_CHECKTIME":
        return "Asistencia";
      case "ROLE_ADMIN":
        return "Administrador";
      case "ROLE_RH":
        return "Recursos Humanos";
      case "ROLE_SUPERVISOR":
        return "Supervisor";
      default:
        return roleName.replace('ROLE_', '').toLowerCase()
          .replace(/(^|\\s)\\S/g, l => l.toUpperCase()); // Capitalizar primera letra
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Editar Usuario</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Actualiza la información del usuario. Deja la contraseña en blanco si no deseas cambiarla.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Imagen de perfil */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-28 h-28 mb-3">
              {isUploadingImage ? (
                <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 shadow-md">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400" />
                </div>
              ) : imagePreview ? (
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-md">
                  <img 
                    src={imagePreview} 
                    alt="Perfil" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-800';
                        fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-800 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-md">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              
              <label 
                htmlFor="image-upload" 
                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer shadow-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
              </label>
              <input 
                id="image-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={isUploadingImage}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Haz clic para cambiar la imagen</p>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apdPaterno" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Apellido Paterno</Label>
              <Input
                id="apdPaterno"
                value={formData.apdPaterno}
                onChange={(e) => handleInputChange("apdPaterno", e.target.value)}
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="apdMaterno" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Apellido Materno</Label>
              <Input
                id="apdMaterno"
                value={formData.apdMaterno}
                onChange={(e) => handleInputChange("apdMaterno", e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Nombre de Usuario</Label>
              <Input
                id="usuario"
                value={formData.usuario}
                onChange={(e) => handleInputChange("usuario", e.target.value)}
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="correo" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => handleInputChange("correo", e.target.value)}
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
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="curp" className="text-gray-700 dark:text-gray-300 text-sm font-medium">CURP</Label>
              <Input
                id="curp"
                value={formData.curp}
                onChange={(e) => handleInputChange("curp", e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfc" className="text-gray-700 dark:text-gray-300 text-sm font-medium">RFC</Label>
              <Input
                id="rfc"
                value={formData.rfc}
                onChange={(e) => handleInputChange("rfc", e.target.value)}
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>
          </div>


          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="pswd" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Contraseña</Label>
              <Input
                id="pswd"
                type="password"
                value={formData.pswd}
                onChange={(e) => handleInputChange("pswd", e.target.value)}
                placeholder="••••••••"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
              {/* <p className="text-xs text-gray-500 dark:text-gray-400">Dejar en blanco para mantener la actual</p> */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-700 dark:text-gray-300 text-sm font-medium">Rol</Label>
              {isLoadingRoles ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500 dark:text-blue-400" />
                  Cargando roles...
                </div>
              ) : rolesError ? (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-xl">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadRoles}
                    className="rounded-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Reintentar
                  </Button>
                  {rolesError}
                </div>
              ) : (
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl">
                    {roles.map((role) => (
                      <SelectItem key={role.nombre} value={role.nombre}>
                        {getFriendlyRoleName(role.nombre)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
            <Button 
              variant="outline" 
              type="button" 
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
                  Actualizando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
