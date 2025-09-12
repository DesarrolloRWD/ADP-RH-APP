"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, Filter, Download, Mail, Phone } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { AttendanceRecord } from "@/components/attendance-record"
import { AttendanceDetailView } from "@/components/attendance-detail-view"
import { getAttendanceHistory, AttendanceRecord as AttendanceRecordType, getSpecificUser, SpecificUserRequest } from "@/lib/api"

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
  image?: string
  estatus: boolean
}

// Usamos el tipo AttendanceRecordType importado de la API

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [user, setUser] = useState<User | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecordType[]>([])
  const [groupedAttendance, setGroupedAttendance] = useState<{[key: string]: AttendanceRecordType[]}>({})
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordType | null>(null)

  useEffect(() => {
    fetchUserData()
    fetchAttendanceHistory()
  }, [username])

  const fetchUserData = async () => {
    try {
      // Crear la solicitud para obtener información específica del usuario
      const request: SpecificUserRequest = {
        value: username
      }
      
      // Llamar al endpoint real
      const userData = await getSpecificUser(request)
      
      console.log('Datos de usuario recibidos:', userData)
      
      // Procesar la imagen base64 si existe
      let imageUrl = "/diverse-office-employee.png"
      if (userData.image) {
        // Verificar si la imagen ya tiene el prefijo data:image
        if (!userData.image.startsWith('data:')) {
          imageUrl = `data:image/jpeg;base64,${userData.image}`
        } else {
          imageUrl = userData.image
        }
        console.log('Imagen procesada correctamente')
      }
      
      // Transformar la respuesta al formato esperado por la interfaz User
      const user: User = {
        ...userData,
        curp: userData.curp || null,
        image: imageUrl,
        estatus: true, // Asumimos que el usuario está activo si podemos obtener sus datos
      }
      
      setUser(user)
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const fetchAttendanceHistory = async () => {
    try {
      setIsLoading(true)

      // Preparar fechas por defecto si no se han seleccionado
      const today = new Date()
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(today.getDate() - 10)
      
      // Formatear fechas para la API
      const formatDate = (date: Date) => {
        return date.toISOString().split('.')[0] + '.000'
      }
      
      const requestBody = {
        employeeId: username,
        eventTimestampInit: startDate ? `${startDate}T00:00:00.000` : formatDate(tenDaysAgo),
        eventTimestampEnd: endDate ? `${endDate}T23:59:59.999` : formatDate(today),
      }

      console.log('Consultando historial de asistencias:', requestBody)
      
      // Usar la función de la API para obtener el historial
      const data = await getAttendanceHistory(requestBody)
      setAttendanceHistory(data)
      
      // Agrupar los registros por fecha
      const grouped = data.reduce((acc: {[key: string]: AttendanceRecordType[]}, record) => {
        const date = new Date(record.event_timestamp).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
        
        if (!acc[date]) {
          acc[date] = []
        }
        
        acc[date].push(record)
        return acc
      }, {})
      
      setGroupedAttendance(grouped)
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
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Volver
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Información del Empleado</h2>
              </div>
              <div className="px-6 pb-6 space-y-5">
                <div className="text-center pb-5 border-b border-gray-100 dark:border-gray-800">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-white dark:border-gray-800 shadow-sm">
                    <AvatarImage src={user.image} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-medium">
                      {user.nombre.charAt(0)}
                      {user.apdPaterno.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {user.nombre} {user.apdPaterno}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">@{user.usuario}</p>
                  <Badge
                    variant={user.estatus ? "default" : "secondary"}
                    className={user.estatus ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-3 py-1" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full px-3 py-1"}
                  >
                    {user.estatus ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Correo</Label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.correo}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Teléfono</Label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.telefono || "No disponible"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">RFC</Label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.rfc}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Roles</Label>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-11">
                      {user.roles.map((role, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                          {role.nombre.replace("ROLE_", "")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Último Acceso</Label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(user.fechaUltimoAcceso).toLocaleString("es-ES")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historial de Asistencias</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Registros de entrada y salida del empleado</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Exportar
                    </Button>
                  </div>
                </div>

                {/* Date Filters */}
                <div className="flex flex-col sm:flex-row gap-4 pt-5 mt-2">
                  <div className="flex-1">
                    <Label htmlFor="startDate" className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Fecha Inicio
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="endDate" className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Fecha Fin
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleFilterChange} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm">
                      <Filter className="w-3.5 h-3.5 mr-1.5" />
                      Filtrar
                    </Button>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-24"></div>
                      </div>
                    ))}
                  </div>
                ) : selectedRecord ? (
                  <AttendanceDetailView 
                    record={selectedRecord} 
                    onBack={() => setSelectedRecord(null)} 
                  />
                ) : attendanceHistory.length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedAttendance)
                      .sort(([dateA], [dateB]) => {
                        // Ordenar las fechas de más reciente a más antigua
                        const partsA = dateA.split('/')
                        const partsB = dateB.split('/')
                        const dateObjA = new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}`)
                        const dateObjB = new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}`)
                        return dateObjB.getTime() - dateObjA.getTime()
                      })
                      .map(([date, records]) => (
                        <div key={date} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <h3 className="font-medium text-gray-900 dark:text-white">{date}</h3>
                            </div>
                            <Badge className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                              {records.length} {records.length === 1 ? 'registro' : 'registros'}
                            </Badge>
                          </div>
                          <div className="p-3">
                            <div className="flex flex-wrap gap-4">
                              {records.map((record) => (
                                <AttendanceRecord 
                                  key={record.id} 
                                  record={record} 
                                  onViewDetails={(record) => setSelectedRecord(record)}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay registros</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No se encontraron registros de asistencia en el período seleccionado
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
