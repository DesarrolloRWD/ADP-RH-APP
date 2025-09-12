"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Eye } from "lucide-react"

interface AttendanceRecord {
  id: string
  employeeId: string
  event_timestamp: string
  event_type: "ENTRADA" | "SALIDA"
}

interface AttendanceRecordProps {
  record: AttendanceRecord
  onViewDetails: (record: AttendanceRecord) => void
}

export function AttendanceRecord({ record, onViewDetails }: AttendanceRecordProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeColor = (type: string) => {
    return type === "ENTRADA" 
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  }

  const formatHourMinute = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow w-[calc(50%-0.5rem)]">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${getTypeColor(record.event_type)} rounded-full px-2 py-0.5 text-xs`}>
            {record.event_type === "ENTRADA" ? "Entrada" : "Salida"}
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(record)}
            className="h-7 w-7 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-gray-900 dark:text-white font-medium text-sm">
            {formatHourMinute(record.event_timestamp)}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {new Date(record.event_timestamp).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          })}
        </div>
      </div>
    </div>
  )
}
