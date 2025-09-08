"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Phone, Mail, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

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
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter()

  const handleViewDetails = () => {
    router.push(`/user/${user.usuario}`)
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

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border bg-card hover:bg-card/80">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src="/diverse-office-employee.png" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getInitials(user.nombre, user.apdPaterno)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-card-foreground truncate">
                {user.nombre} {user.apdPaterno}
              </h3>
              <Badge
                variant={user.estatus ? "default" : "secondary"}
                className={user.estatus ? "bg-accent text-accent-foreground" : ""}
              >
                {user.estatus ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3" />
                <span className="truncate">@{user.usuario}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3" />
                <span className="truncate">{user.correo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                <span>{user.telefono}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>Último acceso: {formatDate(user.fechaUltimoAcceso)}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {user.roles.map((role, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {role.nombre.replace("ROLE_", "")}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button
            onClick={handleViewDetails}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Historial
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
