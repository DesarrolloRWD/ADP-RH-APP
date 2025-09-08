"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, Filter, Download } from "lucide-react"
import { AttendanceRecord } from "@/components/attendance-record"

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

interface AttendanceHistory {
  id: string
  timestamp: string
  type: "entrada" | "salida"
  location: {
    latitude: number
    longitude: number
    accuracy: number
  }
  deviceInfo: {
    deviceId: string
    platform: string
    appVersion: string
  }
  photo?: string
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [user, setUser] = useState<User | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    fetchUserData()
    fetchAttendanceHistory()
  }, [username])

  const fetchUserData = async () => {
    try {
      // Simulate API call to get user data
      // In real implementation, you would fetch from your API
      const mockUser: User = {
        correo: "desarrollo@gmail.com",
        nombre: "desarrollo",
        apdPaterno: "prueba",
        apdMaterno: "almacen",
        usuario: username,
        curp: null,
        telefono: "5577889900",
        rfc: "MENJ001222",
        roles: [{ nombre: "ROLE_CHECKTIME" }],
        fechaUltimoAcceso: "2025-09-08T02:48:03.182+00:00",
        image: "[B@12221b4",
        estatus: true,
      }
      setUser(mockUser)
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const fetchAttendanceHistory = async () => {
    try {
      setIsLoading(true)

      const requestBody = {
        employeeId: username,
        eventTimestampInit: startDate || "2025-08-20T00:00:00.000",
        eventTimestampEnd: endDate || "2025-08-30T23:59:59.999",
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance/history`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const data = await response.json()
        setAttendanceHistory(data)
      }
    } catch (error) {
      console.error("Error fetching attendance history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = () => {
    fetchAttendanceHistory()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/diverse-office-employee.png" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.nombre.charAt(0)}
                  {user.apdPaterno.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {user.nombre} {user.apdPaterno} {user.apdMaterno}
                </h1>
                <p className="text-sm text-muted-foreground">@{user.usuario}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Información del Empleado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center pb-4 border-b border-border">
                  <Avatar className="w-20 h-20 mx-auto mb-3">
                    <AvatarImage src="/diverse-office-employee.png" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {user.nombre.charAt(0)}
                      {user.apdPaterno.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-card-foreground">
                    {user.nombre} {user.apdPaterno}
                  </h3>
                  <p className="text-sm text-muted-foreground">@{user.usuario}</p>
                  <Badge
                    variant={user.estatus ? "default" : "secondary"}
                    className={user.estatus ? "bg-accent text-accent-foreground mt-2" : "mt-2"}
                  >
                    {user.estatus ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Correo</Label>
                    <p className="text-sm text-card-foreground">{user.correo}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Teléfono</Label>
                    <p className="text-sm text-card-foreground">{user.telefono}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">RFC</Label>
                    <p className="text-sm text-card-foreground">{user.rfc}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Roles</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.roles.map((role, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {role.nombre.replace("ROLE_", "")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Último Acceso</Label>
                    <p className="text-sm text-card-foreground">
                      {new Date(user.fechaUltimoAcceso).toLocaleString("es-ES")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-card-foreground">Historial de Asistencias</CardTitle>
                    <CardDescription>Registros de entrada y salida del empleado</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>

                {/* Date Filters */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <div className="flex-1">
                    <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                      Fecha Inicio
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                      Fecha Fin
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleFilterChange} className="bg-primary hover:bg-primary/90">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-muted rounded-lg h-20"></div>
                      </div>
                    ))}
                  </div>
                ) : attendanceHistory.length > 0 ? (
                  <div className="space-y-4">
                    {attendanceHistory.map((record) => (
                      <AttendanceRecord key={record.id} record={record} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No hay registros</h3>
                    <p className="text-muted-foreground">
                      No se encontraron registros de asistencia en el período seleccionado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
