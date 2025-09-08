"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Smartphone, Eye } from "lucide-react"
import { useState } from "react"
import { AttendanceDetailModal } from "@/components/attendance-detail-modal"

interface AttendanceRecord {
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

interface AttendanceRecordProps {
  record: AttendanceRecord
}

export function AttendanceRecord({ record }: AttendanceRecordProps) {
  const [showModal, setShowModal] = useState(false)

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
    return type === "entrada" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
  }

  return (
    <>
      <Card className="border-border hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <Badge className={getTypeColor(record.type)}>
                  {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">{formatTime(record.timestamp)}</div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">
                    {new Date(record.timestamp).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {record.location.latitude.toFixed(6)}, {record.location.longitude.toFixed(6)}
                  </span>
                  <span className="text-xs">(±{record.location.accuracy}m)</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Smartphone className="w-4 h-4" />
                  <span>{record.deviceInfo.deviceId}</span>
                  <span className="text-xs">
                    {record.deviceInfo.platform} v{record.deviceInfo.appVersion}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(true)}
              className="border-border hover:bg-muted"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalles
            </Button>
          </div>
        </CardContent>
      </Card>

      <AttendanceDetailModal record={record} isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
