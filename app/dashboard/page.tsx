"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Clock, Calendar, Search, Filter, UserCheck, Building, LogOut, UserPlus } from "lucide-react"
import { UserCard } from "@/components/user-card"
import { StatsCard } from "@/components/stats-card"
import { CreateUserModal } from "@/components/create-user-modal"
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

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.correo.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredUsers(filtered)
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const activeUsers = users.filter((user) => user.estatus).length
  const totalUsers = users.length
  const recentAccess = users.filter((user) => {
    const lastAccess = new Date(user.fechaUltimoAcceso)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lastAccess.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }).length

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleUserCreated = () => {
    fetchUsers() // Refresh users list
    setIsCreateUserModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">RH Dashboard</h1>
                <p className="text-sm text-muted-foreground">Sistema de gestión de asistencias</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                <Building className="w-3 h-3 mr-1" />
                Administrador
              </Badge>
              <Avatar>
                <AvatarImage src="/admin-interface.png" />
                <AvatarFallback className="bg-primary text-primary-foreground">AD</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-border bg-transparent hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Empleados"
            value={totalUsers.toString()}
            description="Usuarios registrados"
            icon={Users}
            trend="+2.5%"
            trendUp={true}
          />
          <StatsCard
            title="Usuarios Activos"
            value={activeUsers.toString()}
            description="Con acceso habilitado"
            icon={UserCheck}
            trend="+1.2%"
            trendUp={true}
          />
          <StatsCard
            title="Acceso Reciente"
            value={recentAccess.toString()}
            description="Últimos 7 días"
            icon={Clock}
            trend="+5.1%"
            trendUp={true}
          />
          <StatsCard
            title="Registros Hoy"
            value="24"
            description="Asistencias del día"
            icon={Calendar}
            trend="+8.3%"
            trendUp={true}
          />
        </div>

        {/* Users Section */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-card-foreground">Empleados Registrados</CardTitle>
                <CardDescription>Gestiona y visualiza la información de todos los empleados</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar empleados..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 bg-input border-border"
                  />
                </div>
                <Button variant="outline" size="sm" className="border-border bg-transparent">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-32"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <UserCard key={user.usuario} user={user} />
                ))}
              </div>
            )}

            {!isLoading && filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron empleados</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Intenta con otros términos de búsqueda" : "No hay empleados registrados"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  )
}
