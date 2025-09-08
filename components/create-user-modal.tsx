"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { UserPlus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: () => void
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
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
    password: "",
    estatus: true,
    role: "ROLE_CHECKTIME",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          roles: [{ nombre: formData.role }],
        }),
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
          password: "",
          estatus: true,
          role: "ROLE_CHECKTIME",
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription>Completa la información para registrar un nuevo empleado en el sistema.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Nombre del empleado"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario *</Label>
              <Input
                id="usuario"
                value={formData.usuario}
                onChange={(e) => handleInputChange("usuario", e.target.value)}
                placeholder="Nombre de usuario único"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apdPaterno">Apellido Paterno *</Label>
              <Input
                id="apdPaterno"
                value={formData.apdPaterno}
                onChange={(e) => handleInputChange("apdPaterno", e.target.value)}
                placeholder="Apellido paterno"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apdMaterno">Apellido Materno</Label>
              <Input
                id="apdMaterno"
                value={formData.apdMaterno}
                onChange={(e) => handleInputChange("apdMaterno", e.target.value)}
                placeholder="Apellido materno"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico *</Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => handleInputChange("correo", e.target.value)}
                placeholder="correo@empresa.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Contraseña temporal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
                placeholder="5555555555"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfc">RFC</Label>
              <Input
                id="rfc"
                value={formData.rfc}
                onChange={(e) => handleInputChange("rfc", e.target.value)}
                placeholder="ABCD123456EFG"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="curp">CURP</Label>
              <Input
                id="curp"
                value={formData.curp}
                onChange={(e) => handleInputChange("curp", e.target.value)}
                placeholder="ABCD123456HDFGHI01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROLE_CHECKTIME">Empleado</SelectItem>
                  <SelectItem value="ROLE_ADMIN">Administrador</SelectItem>
                  <SelectItem value="ROLE_SUPERVISOR">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="estatus"
              checked={formData.estatus}
              onCheckedChange={(checked) => handleInputChange("estatus", checked)}
            />
            <Label htmlFor="estatus">Usuario activo</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
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
