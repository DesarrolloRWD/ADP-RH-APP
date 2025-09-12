"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Smartphone, Camera, Download, AlertCircle, ArrowLeft } from "lucide-react"
import { getAttendanceDetail, AttendanceDetail, AttendanceRecord as ApiAttendanceRecord } from "@/lib/api"

interface AttendanceRecord {
  id: string
  employeeId: string
  event_timestamp: string
  event_type: "ENTRADA" | "SALIDA"
}

interface AttendanceDetailViewProps {
  record: AttendanceRecord
  onBack: () => void
}

export function AttendanceDetailView({ record, onBack }: AttendanceDetailViewProps) {
  const [detailData, setDetailData] = useState<AttendanceDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDetailData()
  }, [record.id])

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
    return type === "ENTRADA" 
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  }

  return (
    <div className="space-y-4">
      {/* Header con botón de regreso e información básica */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack} className="p-0 hover:bg-transparent hover:text-blue-500 dark:hover:text-blue-400">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <div className="text-sm ml-2">
            <span className="text-gray-400 dark:text-gray-600 mr-1">|</span>
            <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mr-1.5">
              <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">
              {new Date(record.event_timestamp).toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <Badge className={`${getTypeColor(record.event_type)} text-sm rounded-full px-2.5 py-0.5`}>
          {record.event_type === "ENTRADA" ? "Entrada" : "Salida"}
        </Badge>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Información adicional - Solo se muestra cuando se ha cargado */}
      {detailData && (
        <>
          {/* Sección principal: Foto e información del empleado */}
          <div className="flex flex-col md:flex-row gap-5">
            {/* Columna izquierda: Fotografía */}
            <div className="md:w-1/2">
              {detailData.photo && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden h-full border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Camera className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Fotografía</span>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => {
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
                      <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
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
                          className="max-w-full max-h-[300px] h-auto rounded-lg object-contain shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.innerHTML = `
                                <div class="flex flex-col items-center justify-center py-8">
                                  <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 dark:text-gray-500"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                                  </div>
                                  <p class="text-sm text-gray-500 dark:text-gray-400">Fotografía no disponible</p>
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
            </div>
            
            {/* Columna derecha: Ubicación y Dispositivo */}
            <div className="md:w-1/2 space-y-5">
              {/* Ubicación */}
              <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Coordenadas</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      const { latitude, longitude } = detailData.location;
                      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Latitud</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">{detailData.location.latitude.toFixed(8)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Longitud</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">{detailData.location.longitude.toFixed(8)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Precisión</p>
                    <p className="text-sm text-gray-900 dark:text-white">±{detailData.location.accuracy} metros</p>
                  </div>
                </div>
              </div>
              
              {/* Dispositivo */}
              <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Dispositivo</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">ID</p>
                    <p className="truncate text-sm text-gray-900 dark:text-white">{detailData.deviceInfo.deviceId}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Plataforma</p>
                    <p className="text-sm text-gray-900 dark:text-white">{detailData.deviceInfo.platform}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Versión</p>
                    <p className="text-sm text-gray-900 dark:text-white">{detailData.deviceInfo.appVersion}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
