"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Clock, Calendar, Search, UserCheck, Building, LogOut, UserPlus, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserCard } from "@/components/user-card"
import { StatsCard } from "@/components/stats-card"
import { CreateUserModal } from "@/components/create-user-modal"
import { EditUserModal } from "@/components/edit-user-modal"
import { UserFilters, UserFilters as UserFiltersType } from "@/components/user-filters"
import { useRouter } from "next/navigation"
import AuthGuard from "@/components/auth-guard"
import { getToken, logout, getUserData } from "@/lib/auth"
import { updateUserStatus, getSpecificUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeFilters, setActiveFilters] = useState<UserFiltersType>({
    roles: [],
    status: null
  })
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [pageSize] = useState(9) // Número de usuarios por página
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    fetchCurrentUser()
  }, [])
  
  // Función para obtener los datos del usuario actual
  const fetchCurrentUser = async () => {
    try {
      const userData = getUserData()
      if (userData && userData.sub) {
        const username = userData.sub
        
        // Obtener información detallada del usuario actual
        const response = await getSpecificUser({ value: username })
        
        // Procesar la imagen base64 si existe
        let imageUrl = "/admin-interface.png"
        if (response.image) {
          // Verificar si la imagen ya tiene el prefijo data:image
          if (!response.image.startsWith('data:')) {
            imageUrl = `data:image/jpeg;base64,${response.image}`
          } else {
            imageUrl = response.image
          }
        }
        
        setCurrentUser({
          ...response,
          curp: response.curp || null,
          image: imageUrl,
          estatus: true
        })
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario actual:", error)
    }
  }

  useEffect(() => {
    // Aplicar filtros a los usuarios
    let filtered = users.filter(
      (user) =>
        (user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.correo.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    // Filtrar por roles si hay roles seleccionados
    if (activeFilters.roles.length > 0) {
      filtered = filtered.filter(user => 
        user.roles.some(role => activeFilters.roles.includes(role.nombre))
      )
    }
    
    // Filtrar por estado
    if (activeFilters.status === "active") {
      filtered = filtered.filter(user => user.estatus)
    } else if (activeFilters.status === "inactive") {
      filtered = filtered.filter(user => !user.estatus)
    }
    
    setFilteredUsers(filtered)
  }, [users, searchTerm, activeFilters])

  const fetchUsers = async (pageNum = 1, reset = true) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      // Obtener el token
      const token = getToken();
      
      if (!token) {
        console.error("No hay token disponible");
        router.push("/login");
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/get/all-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        // Simular paginación en el cliente (ya que la API devuelve todos los usuarios)
        // En un entorno real, la API debería soportar paginación
        const totalPages = Math.ceil(data.length / pageSize);
        setHasMore(pageNum < totalPages);
        
        if (reset) {
          // Si es la primera carga o un reseteo, reemplazar los usuarios
          setUsers(data);
          setPage(1);
        } else {
          // Si estamos cargando más, añadir a los existentes
          // En un entorno real, esto no sería necesario ya que la API devolvería solo los nuevos usuarios
          setUsers(prevUsers => [...prevUsers]);
          setPage(pageNum);
        }
      } else {
        // Si hay un error 401 (no autorizado), redirigir al login
        if (response.status === 401) {
          console.error("Sesión expirada o token inválido");
          router.push("/login");
          return;
        }
        console.error("Error en la respuesta del servidor:", response.status);
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }
  
  // Función para cargar más usuarios
  const loadMoreUsers = () => {
    if (!isLoadingMore && hasMore) {
      fetchUsers(page + 1, false);
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
    logout()
  }

  const handleUserCreated = () => {
    fetchUsers() // Refresh users list
    setIsCreateUserModalOpen(false)
  }
  
  // Manejar cambios en los filtros
  const handleFilterChange = (filters: UserFiltersType) => {
    setActiveFilters(filters)
  }
  
  // Manejar la edición de un usuario
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditUserModalOpen(true)
  }
  
  // Manejar la actualización de un usuario
  const handleUserUpdated = () => {
    fetchUsers() // Actualizar la lista de usuarios
    setIsEditUserModalOpen(false)
    setSelectedUser(null)
  }
  
  // Función para actualizar el estado de un usuario
  const handleUpdateUserStatus = async (username: string, newStatus: boolean) => {
    try {
      await updateUserStatus({
        value: username,
        status: newStatus
      })
      
      // Actualizar la lista de usuarios localmente
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.usuario === username ? { ...user, estatus: newStatus } : user
        )
      )
      
      // Mostrar notificación de éxito
      toast({
        title: "Estado actualizado",
        description: `El usuario ${username} ha sido ${newStatus ? 'activado' : 'desactivado'} correctamente.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error al actualizar el estado del usuario:", error)
      // Mostrar notificación de error
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario. Intenta nuevamente más tarde.",
        variant: "destructive",
      })
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 dark:bg-gray-900/80 dark:border-gray-800">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">ADP SYSTEM</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de gestión de asistencias</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-none px-2.5 py-1 rounded-full">
                <Building className="w-3.5 h-3.5 mr-1.5" />
                Administrador
              </Badge>
              <ThemeToggle />
              <Avatar className="border-2 border-white dark:border-gray-800 shadow-sm">
                {currentUser && currentUser.image ? (
                  <AvatarImage 
                    src={currentUser.image} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <AvatarImage src="/admin-interface.png" />
                )}
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {currentUser ? `${currentUser.nombre.charAt(0)}${currentUser.apdPaterno.charAt(0)}` : 'AD'}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-full"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Empleados</h3>
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalUsers.toString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Usuarios registrados</p>
              </div>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
                <span className="mr-1">+2.5%</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5L19 12L12 19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuarios Activos</h3>
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeUsers.toString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Con acceso habilitado</p>
              </div>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
                <span className="mr-1">+1.2%</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5L19 12L12 19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Acceso Reciente</h3>
              <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{recentAccess.toString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Últimos 7 días</p>
              </div>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
                <span className="mr-1">+5.1%</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5L19 12L12 19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Empleados Registrados</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona y visualiza la información de todos los empleados</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar empleados..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full text-sm"
                  />
                </div>
                <UserFilters onFilterChange={handleFilterChange} />
                <Button
                  size="sm"
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Nuevo Usuario
                </Button>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-36"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredUsers.map((user) => (
                  <UserCard 
                    key={user.usuario} 
                    user={user} 
                    onUpdateStatus={handleUpdateUserStatus}
                    onEditUser={handleEditUser}
                  />
                ))}
              </div>
            )}

            {!isLoading && filteredUsers.length === 0 && (
              <div className="text-center py-16 col-span-full">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No se encontraron empleados</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? "Intenta con otros términos de búsqueda" : "No hay empleados registrados"}
                </p>
              </div>
            )}
            
            {/* Botón para cargar más usuarios */}
            {hasMore && filteredUsers.length > 0 && (
              <div className="mt-8 text-center col-span-full">
                <Button
                  onClick={loadMoreUsers}
                  variant="outline"
                  disabled={isLoadingMore}
                  className="mx-auto rounded-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Cargar más usuarios"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
      
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />
    </div>
    </AuthGuard>
  )
}
