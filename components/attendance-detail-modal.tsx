"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin, Smartphone, Camera, Download } from "lucide-react"

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

interface AttendanceDetailData {
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
  photo: string
}

interface AttendanceDetailModalProps {
  record: AttendanceRecord
  isOpen: boolean
  onClose: () => void
}

export function AttendanceDetailModal({ record, isOpen, onClose }: AttendanceDetailModalProps) {
  const [detailData, setDetailData] = useState<AttendanceDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && record.id) {
      fetchDetailData()
    }
  }, [isOpen, record.id])

  const fetchDetailData = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance/detail`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: record.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setDetailData(data)
      }
    } catch (error) {
      console.error("Error fetching detail data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getTypeColor = (type: string) => {
    return type === "entrada" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Badge className={getTypeColor(record.type)}>
              {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
            </Badge>
            Detalle de Registro
          </DialogTitle>
          <DialogDescription>Información completa del registro de asistencia</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timestamp */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Fecha y Hora</h3>
              </div>
              <p className="text-foreground font-medium">{formatDateTime(record.timestamp)}</p>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Ubicación</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Latitud:</span>
                    <p className="font-mono text-foreground">
                      {(detailData?.location.latitude || record.location.latitude).toFixed(8)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Longitud:</span>
                    <p className="font-mono text-foreground">
                      {(detailData?.location.longitude || record.location.longitude).toFixed(8)}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Precisión:</span>
                  <p className="text-foreground">±{detailData?.location.accuracy || record.location.accuracy} metros</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Smartphone className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Información del Dispositivo</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Dispositivo:</span>
                  <p className="text-foreground">{detailData?.deviceInfo.deviceId || record.deviceInfo.deviceId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Plataforma:</span>
                  <p className="text-foreground">{detailData?.deviceInfo.platform || record.deviceInfo.platform}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Versión de la App:</span>
                  <p className="text-foreground">{detailData?.deviceInfo.appVersion || record.deviceInfo.appVersion}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo */}
          {(detailData?.photo || record.photo) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Fotografía</h3>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Fotografía capturada durante el registro</p>
                  <p className="text-xs text-muted-foreground mt-1">Datos base64 disponibles</p>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
