"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin, Smartphone, Camera, Download, AlertCircle } from "lucide-react"
import { getAttendanceDetail, AttendanceDetail, AttendanceRecord as ApiAttendanceRecord } from "@/lib/api"

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

interface AttendanceRecord {
  id: string
  employeeId: string
  event_timestamp: string
  event_type: "ENTRADA" | "SALIDA"
}

interface AttendanceDetailModalProps {
  record: AttendanceRecord
  isOpen: boolean
  onClose: () => void
}

export function AttendanceDetailModal({ record, isOpen, onClose }: AttendanceDetailModalProps) {
  const [detailData, setDetailData] = useState<AttendanceDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && record.id) {
      fetchDetailData()
    } else {
      // Limpiar los datos cuando se cierra el modal
      setDetailData(null)
      setError(null)
    }
  }, [isOpen, record.id])

  const fetchDetailData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getAttendanceDetail({ id: record.id })
      setDetailData(data)
    } catch (error) {
      console.error("Error fetching detail data:", error)
      setError("No se pudo obtener la información adicional del registro")
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
    return type === "ENTRADA" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Badge className={getTypeColor(record.event_type)}>
              {record.event_type === "ENTRADA" ? "Entrada" : "Salida"}
            </Badge>
            Detalle de Registro
          </DialogTitle>
          <DialogDescription>Información completa del registro de asistencia</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información básica */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                <p className="font-medium">{formatDateTime(record.event_timestamp)}</p>
              </div>
            </div>
            <Badge className={`${getTypeColor(record.event_type)} text-sm`}>
              {record.event_type === "ENTRADA" ? "Entrada" : "Salida"}
            </Badge>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {/* Información adicional - Solo se muestra cuando se ha cargado */}
          {detailData && (
            <div className="grid grid-cols-1 gap-4">
              {/* Fotografía */}
              {detailData.photo && (
                <div className="bg-muted rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Fotografía</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (detailData.photo) {
                        let imageData = detailData.photo;
                        if (!imageData.startsWith('data:')) {
                          imageData = `data:image/jpeg;base64,${imageData}`;
                        }
                        
                        const link = document.createElement('a');
                        link.href = imageData;
                        link.download = `registro-${record.id}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4 flex justify-center">
                    {(() => {
                      let imageUrl = detailData.photo;
                      if (!imageUrl.startsWith('data:')) {
                        imageUrl = `data:image/jpeg;base64,${imageUrl}`;
                      }
                      
                      return (
                        <img 
                          src={imageUrl} 
                          alt="Fotografía del registro" 
                          className="max-w-full max-h-[300px] h-auto rounded-md object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.innerHTML = `
                                <div class="flex flex-col items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground mb-2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                                  <p class="text-sm text-muted-foreground">Fotografía no disponible en formato visible</p>
                                </div>
                              `;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      );
                    })()} 
                  </div>
                </div>
              )}
              
              {/* Ubicación */}
              <div className="bg-muted rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Ubicación</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const { latitude, longitude } = detailData.location;
                      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Latitud</p>
                      <p className="font-mono">{detailData.location.latitude.toFixed(8)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Longitud</p>
                      <p className="font-mono">{detailData.location.longitude.toFixed(8)}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground mb-1">Precisión</p>
                    <p>±{detailData.location.accuracy} metros</p>
                  </div>
                </div>
              </div>
              
              {/* Dispositivo */}
              <div className="bg-muted rounded-lg overflow-hidden">
                <div className="flex items-center p-3 bg-muted/50">
                  <Smartphone className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm font-medium">Dispositivo</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">ID</p>
                    <p className="truncate">{detailData.deviceInfo.deviceId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Plataforma</p>
                    <p>{detailData.deviceInfo.platform}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Versión</p>
                    <p>{detailData.deviceInfo.appVersion}</p>
                  </div>
                </div>
              </div>
              
              {/* Información del registro */}
              <div className="bg-muted rounded-lg overflow-hidden">
                <div className="flex items-center p-3 bg-muted/50">
                  <Smartphone className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm font-medium">Detalles del registro</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">ID de Registro</p>
                    <p className="font-mono">{record.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">ID de Empleado</p>
                    <p>{record.employeeId}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading indicator */}
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
