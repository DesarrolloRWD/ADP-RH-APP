"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Phone, Mail, Calendar, Power, Loader2, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ConfirmDialog } from "./confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface UserCardProps {
  user: User
  onUpdateStatus?: (username: string, newStatus: boolean) => Promise<void>
  onEditUser?: (user: User) => void
}

export function UserCard({ user, onUpdateStatus, onEditUser }: UserCardProps) {
  const router = useRouter()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleViewDetails = () => {
    router.push(`/user/${user.usuario}`)
  }
  
  // Mostrar diálogo de confirmación antes de cambiar el estado
  const handleStatusButtonClick = () => {
    if (user.estatus) {
      // Si está activo y vamos a desactivarlo, mostrar confirmación
      setShowConfirmDialog(true)
    } else {
      // Si está inactivo, activarlo directamente sin confirmación
      handleToggleStatus()
    }
  }
  
  // Función para procesar el cambio de estado
  const handleToggleStatus = async () => {
    if (!onUpdateStatus) return
    
    try {
      setIsUpdatingStatus(true)
      await onUpdateStatus(user.usuario, !user.estatus)
    } catch (error) {
      console.error('Error al cambiar el estado del usuario:', error)
    } finally {
      setIsUpdatingStatus(false)
      setShowConfirmDialog(false) // Cerrar el diálogo si está abierto
    }
  }
  
  const handleEdit = () => {
    if (onEditUser) {
      onEditUser(user)
    }
  }

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }
  
  // Función para convertir el nombre del rol a un nombre amigable
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
          .replace(/(^|\s)\S/g, l => l.toUpperCase()); // Capitalizar primera letra
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-white/50 dark:border-gray-700 bg-white dark:bg-gray-900/90 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14 border-2 border-white dark:border-gray-800 shadow-sm">
            {user.image ? (
              <AvatarImage 
                src={user.image.startsWith('data:') ? user.image : `data:image/jpeg;base64,${user.image}`} 
                alt={user.nombre}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <AvatarImage src="/diverse-office-employee.png" />
            )}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-medium">
              {getInitials(user.nombre, user.apdPaterno)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {user.nombre} {user.apdPaterno}
              </h3>
              <Badge
                variant={user.estatus ? "default" : "secondary"}
                className={user.estatus ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2.5 py-0.5" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full px-2.5 py-0.5"}
              >
                {user.estatus ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs">@</span>
                <span className="truncate">{user.usuario}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <span className="truncate">{user.correo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <span>{user.telefono || "No disponible"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <span>Último acceso: {formatDate(user.fechaUltimoAcceso)}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.roles.map((role, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                  {getFriendlyRoleName(role.nombre)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleViewDetails}
              className="flex-1 min-w-[100px] bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm"
              size="sm"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Ver Historial
            </Button>
            
            {onEditUser && (
              <Button
                onClick={handleEdit}
                className="flex-1 min-w-[100px] bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-full shadow-sm"
                size="sm"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </Button>
            )}
            
            {onUpdateStatus && (
              <Button
                onClick={handleStatusButtonClick}
                className={`flex-1 min-w-[100px] ${user.estatus ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400'} rounded-full shadow-sm`}
                size="sm"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Power className="w-3.5 h-3.5 mr-1.5" />
                    {user.estatus ? 'Desactivar' : 'Activar'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Diálogo de confirmación para desactivar usuario */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleToggleStatus}
        title="Desactivar usuario"
        description={`¿Estás seguro de que deseas desactivar al usuario ${user.nombre} ${user.apdPaterno}? Esta acción impedirá que el usuario inicie sesión en el sistema.`}
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </Card>
  )
}
