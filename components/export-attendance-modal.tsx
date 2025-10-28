"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Loader2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import { getAttendanceHistory, AttendanceRecord } from "@/lib/api"

interface ExportAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  users: Array<{
    usuario: string
    nombre: string
    apdPaterno: string
    apdMaterno: string
  }>
}

interface DayAttendance {
  date: string
  entrada?: string
  salida?: string
  status: 'completo' | 'incompleto' | 'falta'
}

export function ExportAttendanceModal({ isOpen, onClose, users }: ExportAttendanceModalProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [progress, setProgress] = useState(0)
  const [currentUser, setCurrentUser] = useState("")
  const { toast } = useToast()

  const handleClose = () => {
    if (!isExporting) {
      setProgress(0)
      setCurrentUser("")
      onClose()
    }
  }

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Fechas requeridas",
        description: "Por favor, selecciona las fechas de inicio y fin.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    setProgress(0)

    try {
      // Crear arrays para almacenar los datos
      const allData: any[] = []
      const summaryData: any[] = []
      const totalUsers = users.length

      // Obtener asistencias de cada usuario
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        setCurrentUser(user.usuario)
        setProgress(Math.round(((i + 1) / totalUsers) * 100))

        try {
          // Agregar un pequeño delay para evitar saturar el servidor
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }

          const attendanceData = await getAttendanceHistory({
            employeeId: user.usuario,
            eventTimestampInit: `${startDate}T00:00:00.000`,
            eventTimestampEnd: `${endDate}T23:59:59.999`,
          })

          // Agrupar por fecha
          const attendanceByDate = groupAttendanceByDate(attendanceData, startDate, endDate)

          // Contadores para el resumen
          let completos = 0
          let incompletos = 0
          let faltas = 0

          // Agregar cada día al reporte detallado
          attendanceByDate.forEach(day => {
            allData.push({
              'Usuario': user.usuario,
              'Nombre': `${user.nombre} ${user.apdPaterno} ${user.apdMaterno}`,
              'Fecha': day.date,
              'Entrada': day.entrada || 'Sin registro',
              'Salida': day.salida || 'Sin registro',
              'Estado': day.status === 'completo' ? 'Completo' : 
                       day.status === 'incompleto' ? 'Incompleto' : 'Falta'
            })

            // Contar para el resumen
            if (day.status === 'completo') completos++
            else if (day.status === 'incompleto') incompletos++
            else faltas++
          })

          // Agregar resumen del usuario
          summaryData.push({
            'Usuario': user.usuario,
            'Nombre Completo': `${user.nombre} ${user.apdPaterno} ${user.apdMaterno}`,
            'Días Completos': completos,
            'Días Incompletos': incompletos,
            'Faltas': faltas,
            'Total Días': attendanceByDate.length
          })
        } catch (error) {
          console.error(`Error al obtener asistencias de ${user.usuario}:`, error)
          // Agregar usuario con datos vacíos si hay error
          summaryData.push({
            'Usuario': user.usuario,
            'Nombre Completo': `${user.nombre} ${user.apdPaterno} ${user.apdMaterno}`,
            'Días Completos': 0,
            'Días Incompletos': 0,
            'Faltas': 0,
            'Total Días': 0,
            'Error': 'No se pudieron obtener datos'
          })
        }
      }

      // Crear el libro de Excel
      const workbook = XLSX.utils.book_new()

      // Hoja 1: Resumen
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
      const summaryColumnWidths = [
        { wch: 20 }, // Usuario
        { wch: 35 }, // Nombre Completo
        { wch: 15 }, // Días Completos
        { wch: 18 }, // Días Incompletos
        { wch: 10 }, // Faltas
        { wch: 12 }, // Total Días
      ]
      summaryWorksheet['!cols'] = summaryColumnWidths
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Resumen")

      // Hoja 2: Detalle
      const detailWorksheet = XLSX.utils.json_to_sheet(allData)
      const detailColumnWidths = [
        { wch: 20 }, // Usuario
        { wch: 35 }, // Nombre
        { wch: 12 }, // Fecha
        { wch: 10 }, // Entrada
        { wch: 10 }, // Salida
        { wch: 12 }, // Estado
      ]
      detailWorksheet['!cols'] = detailColumnWidths
      XLSX.utils.book_append_sheet(workbook, detailWorksheet, "Detalle por Día")

      // Generar el archivo
      const fileName = `Reporte_Asistencias_${startDate}_${endDate}.xlsx`
      XLSX.writeFile(workbook, fileName)

      toast({
        title: "Reporte generado",
        description: `El archivo ${fileName} ha sido descargado exitosamente.`,
      })

      handleClose()
    } catch (error) {
      console.error("Error al exportar:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el reporte. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setProgress(0)
      setCurrentUser("")
    }
  }

  const groupAttendanceByDate = (records: AttendanceRecord[], startDate: string, endDate: string): DayAttendance[] => {
    const result: DayAttendance[] = []
    
    // Crear un mapa de fechas con sus registros
    const dateMap = new Map<string, { entrada?: string, salida?: string }>()
    
    records.forEach(record => {
      const date = new Date(record.event_timestamp).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      
      const time = new Date(record.event_timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      if (!dateMap.has(date)) {
        dateMap.set(date, {})
      }
      
      const dayData = dateMap.get(date)!
      if (record.event_type === 'ENTRADA') {
        dayData.entrada = time
      } else {
        dayData.salida = time
      }
    })
    
    // Generar todas las fechas en el rango
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      
      const dayData = dateMap.get(dateStr)
      
      let status: 'completo' | 'incompleto' | 'falta' = 'falta'
      if (dayData) {
        if (dayData.entrada && dayData.salida) {
          status = 'completo'
        } else {
          status = 'incompleto'
        }
      }
      
      result.push({
        date: dateStr,
        entrada: dayData?.entrada,
        salida: dayData?.salida,
        status
      })
    }
    
    return result
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 rounded-2xl border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span>Exportar Reporte de Asistencias</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Selecciona el rango de fechas para generar el reporte en Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha Inicio
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 dark:focus:border-green-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha Fin
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 dark:focus:border-green-400"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
              <strong>📊 El reporte incluirá {users.length} usuarios en 2 hojas:</strong>
            </p>
            <div className="space-y-2">
              <div className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Hoja 1 - Resumen:</strong>
                <ul className="ml-4 mt-1 space-y-0.5">
                  <li>• Total de días completos por usuario</li>
                  <li>• Total de días incompletos</li>
                  <li>• Total de faltas</li>
                </ul>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Hoja 2 - Detalle por Día:</strong>
                <ul className="ml-4 mt-1 space-y-0.5">
                  <li>• Fecha de cada día</li>
                  <li>• Hora de entrada y salida</li>
                  <li>• Estado (Completo/Incompleto/Falta)</li>
                </ul>
              </div>
            </div>
          </div>

          {isExporting && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Procesando usuarios...
                </span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Usuario actual: <span className="font-medium">{currentUser}</span>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isExporting}
              className="flex-1 rounded-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || !startDate || !endDate}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
