"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from "lucide-react"
import * as XLSX from 'xlsx'
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getUserData } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
}

interface UserRow {
  nombre: string
  apdPaterno: string
  apdMaterno: string
  usuario: string
  correo: string
  telefono: string
  rfc: string
  curp?: string
  pswd: string
  role: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface UploadResult {
  total: number
  successful: number
  failed: number
  errors: { row: number; message: string }[]
}

export function BulkUploadModal({ isOpen, onClose, onUploadComplete }: BulkUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isAuthorized, setIsAuthorized] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  
  // Verificar si el usuario tiene el rol ROLE_ADMIN
  useEffect(() => {
    const checkUserRole = () => {
      const userData = getUserData()
      
      if (!userData) {
        // Si no hay datos de usuario, cerrar el modal y redirigir al login
        onClose()
        router.push('/login')
        return
      }
      
      // Extraer roles del usuario
      let userRoles: string[] = []
      
      if (userData.roles) {
        // Si roles es un array de objetos con propiedad nombre
        if (Array.isArray(userData.roles) && typeof userData.roles[0] === 'object') {
          userRoles = userData.roles.map((role: any) => role.nombre)
        } 
        // Si roles es un array de strings
        else if (Array.isArray(userData.roles)) {
          userRoles = userData.roles
        } 
        // Si roles es un string único
        else if (typeof userData.roles === 'string') {
          userRoles = [userData.roles]
        }
      }
      
      // Verificar si el usuario tiene el rol ROLE_ADMIN
      const isAdmin = userRoles.includes('ROLE_ADMIN')
      
      if (!isAdmin) {
        // Si no es administrador, cerrar el modal y mostrar mensaje
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para realizar carga masiva de usuarios.",
          variant: "destructive",
        })
        onClose()
        return
      }
      
      setIsAuthorized(true)
    }
    
    if (isOpen) {
      checkUserRole()
    }
  }, [isOpen, onClose, router, toast])

  const resetState = () => {
    setFile(null)
    setProgress(0)
    setUploadResult(null)
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleModalClose = () => {
    resetState()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Verificar que sea un archivo Excel
      if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
        toast({
          title: "Formato no válido",
          description: "Por favor, selecciona un archivo Excel (.xlsx o .xls)",
          variant: "destructive",
        })
        resetState()
        return
      }
      
      setFile(selectedFile)
      setValidationErrors([])
      setUploadResult(null)
    }
  }

  const validateRow = (row: UserRow, rowIndex: number): ValidationResult => {
    const errors: string[] = []
    
    // Validaciones básicas
    if (!row.nombre) errors.push(`Fila ${rowIndex}: El nombre es obligatorio`)
    if (!row.apdPaterno) errors.push(`Fila ${rowIndex}: El apellido paterno es obligatorio`)
    if (!row.usuario) errors.push(`Fila ${rowIndex}: El nombre de usuario es obligatorio`)
    else {
      // Verificar si el usuario ya tiene el prefijo zoques_
      const username = row.usuario.trim()
      if (username.startsWith("zoques_")) {
        errors.push(`Fila ${rowIndex}: El nombre de usuario no debe incluir el prefijo "zoques_", este se agregará automáticamente`)
      }
    }
    if (!row.correo) errors.push(`Fila ${rowIndex}: El correo electrónico es obligatorio`)
    else {
      // Validación más flexible para correos electrónicos
      // Primero limpiamos el correo de espacios
      const email = row.correo.trim()
      
      // Verificamos si contiene un @ y al menos un punto después del @
      const atIndex = email.indexOf('@')
      if (atIndex === -1 || atIndex === 0 || atIndex === email.length - 1) {
        errors.push(`Fila ${rowIndex}: El formato del correo electrónico '${email}' no es válido (debe contener @)`)
      } else {
        const domainPart = email.substring(atIndex + 1)
        if (!domainPart.includes('.') || domainPart.endsWith('.')) {
          errors.push(`Fila ${rowIndex}: El formato del correo electrónico '${email}' no es válido (dominio incorrecto)`)
        }
      }
    }
    if (!row.telefono) errors.push(`Fila ${rowIndex}: El teléfono es obligatorio`)
    if (!row.rfc) errors.push(`Fila ${rowIndex}: El RFC es obligatorio`)
    if (!row.pswd) errors.push(`Fila ${rowIndex}: La contraseña es obligatoria`)
    if (!row.role) errors.push(`Fila ${rowIndex}: El rol es obligatorio`)
    else if (!['ROLE_ADMIN', 'ROLE_RH', 'ROLE_SUPERVISOR', 'ROLE_CHECKTIME'].includes(row.role)) {
      errors.push(`Fila ${rowIndex}: El rol debe ser uno de los siguientes: ROLE_ADMIN, ROLE_RH, ROLE_SUPERVISOR, ROLE_CHECKTIME`)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Función para intentar corregir formatos de correo comunes
  const tryFixEmail = (email: string): string => {
    if (!email) return email
    
    let fixedEmail = email.trim()
    
    // Reemplazar caracteres no válidos comunes
    fixedEmail = fixedEmail.replace(/\s+/g, '') // Eliminar espacios
    
    // Reemplazar comas por puntos en dominios (error común)
    const atIndex = fixedEmail.indexOf('@')
    if (atIndex !== -1) {
      const localPart = fixedEmail.substring(0, atIndex)
      let domainPart = fixedEmail.substring(atIndex + 1)
      
      // Reemplazar comas por puntos en el dominio
      domainPart = domainPart.replace(/,/g, '.')
      
      // Reconstruir el email
      fixedEmail = `${localPart}@${domainPart}`
    }
    
    // Corregir dominios comunes mal escritos
    fixedEmail = fixedEmail
      .replace(/@gmail,/g, '@gmail.')
      .replace(/@hotmail,/g, '@hotmail.')
      .replace(/@yahoo,/g, '@yahoo.')
      .replace(/@outlook,/g, '@outlook.')
      .replace(/@gmailcom/g, '@gmail.com')
      .replace(/@hotmailcom/g, '@hotmail.com')
      .replace(/@yahoocom/g, '@yahoo.com')
      .replace(/@outlookcom/g, '@outlook.com')
    
    return fixedEmail
  }
  
  // Función para limpiar y normalizar los datos del Excel
  const cleanExcelData = (data: UserRow[]): UserRow[] => {
    return data.map(row => ({
      ...row,
      // Limpiar espacios en blanco y normalizar textos
      nombre: row.nombre?.trim() || "",
      apdPaterno: row.apdPaterno?.trim() || "",
      apdMaterno: row.apdMaterno?.trim() || "",
      usuario: row.usuario?.trim() || "",
      correo: tryFixEmail(row.correo || ""), // Intentar corregir el formato del correo
      telefono: row.telefono?.toString().trim() || "", // Convertir a string en caso de que sea número
      rfc: row.rfc?.trim() || "",
      curp: row.curp?.trim() || "",
      pswd: row.pswd?.trim() || "",
      role: row.role?.trim() || ""
    }))
  }

  const processExcelFile = async () => {
    if (!file) return
    
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawJsonData = XLSX.utils.sheet_to_json<UserRow>(worksheet, { defval: "" })
      
      // Limpiar y normalizar los datos
      const jsonData = cleanExcelData(rawJsonData)
      
      // Validar datos
      let allErrors: string[] = []
      
      jsonData.forEach((row, index) => {
        const rowIndex = index + 2 // +2 porque la fila 1 es el encabezado
        const validation = validateRow(row, rowIndex)
        if (!validation.valid) {
          allErrors = [...allErrors, ...validation.errors]
        }
      })
      
      if (allErrors.length > 0) {
        setValidationErrors(allErrors)
        return false
      }
      
      return jsonData
    } catch (error) {
      console.error("Error al procesar el archivo Excel:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo Excel. Verifica que el formato sea correcto.",
        variant: "destructive",
      })
      return false
    }
  }

  // Función para esperar un tiempo determinado
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  
  const handleUpload = async () => {
    if (!file) return
    
    setIsUploading(true)
    setProgress(10)
    
    try {
      // Procesar el archivo Excel
      const userData = await processExcelFile()
      
      if (!userData || validationErrors.length > 0) {
        setIsUploading(false)
        return
      }
      
      setProgress(30)
      
      // Preparar los resultados
      const result: UploadResult = {
        total: userData.length,
        successful: 0,
        failed: 0,
        errors: []
      }
      
      // Preparar el lote de usuarios para procesar
      const usersToProcess = userData.map(user => {
        // Verificar si el nombre de usuario ya tiene el prefijo "zoques_"
        let username = user.usuario.trim()
        if (!username.startsWith("zoques_")) {
          username = `zoques_${username}`
        }
        
        return {
          nombre: user.nombre,
          apdPaterno: user.apdPaterno,
          apdMaterno: user.apdMaterno || "",
          usuario: username, // Usar el nombre de usuario con el prefijo
          correo: user.correo,
          telefono: user.telefono,
          rfc: user.rfc,
          curp: user.curp || "",
          pswd: user.pswd,
          roles: [{ nombre: user.role }],
          tenant: { nombre: "ZOQUES" } // Tenant por defecto
        }
      })
      
      setProgress(30)
      
      // Procesar cada usuario individualmente
      for (let i = 0; i < usersToProcess.length; i++) {
        const user = usersToProcess[i]
        const rowIndex = i + 2 // +2 porque la fila 1 es el encabezado
        
        try {
          // Actualizar progreso
          setProgress(30 + Math.floor((i / usersToProcess.length) * 60))
          
          // Preparar datos para la API en el formato que espera el endpoint /usuarios/save/information
          const userData = {
            nombre: user.nombre,
            apdPaterno: user.apdPaterno,
            apdMaterno: user.apdMaterno,
            usuario: user.usuario,
            correo: user.correo,
            telefono: user.telefono,
            rfc: user.rfc,
            curp: user.curp,
            pswd: user.pswd,
            roles: user.roles,
            tenant: user.tenant
          }
          
          // Mostrar en consola el usuario que se está procesando
          //console.log(`Procesando usuario ${i+1}/${usersToProcess.length}: ${user.usuario}`);
          
          // Esperar un breve tiempo entre solicitudes para no sobrecargar el servidor
          if (i > 0) {
            await delay(300) // 300ms de espera entre solicitudes
          }
          
          // Llamar a la API para crear el usuario usando el endpoint correcto
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/save/information`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem("adp_rh_auth_token")}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
          })
          
          if (response.ok) {
            result.successful++
            //console.log(`Usuario ${user.usuario} creado exitosamente`);
          } else {
            let errorMessage = 'Error desconocido';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || 'Error desconocido';
              console.error(`Error al crear usuario ${user.usuario}:`, errorData);
            } catch (e) {
              console.error(`Error al procesar respuesta para ${user.usuario}:`, e);
            }
            
            result.failed++;
            result.errors.push({
              row: rowIndex,
              message: `Error al crear usuario: ${errorMessage}`
            });
          }
        } catch (error) {
          console.error(`Error al procesar usuario en fila ${rowIndex}:`, error)
          result.failed++
          result.errors.push({
            row: rowIndex,
            message: `Error al procesar: ${(error as Error).message || 'Error desconocido'}`
          })
        }
      }
      
      setProgress(100)
      setUploadResult(result)
      
      // Notificar resultado
      if (result.failed === 0) {
        toast({
          title: "Carga exitosa",
          description: `Se han creado ${result.successful} usuarios correctamente.`,
        })
        
        // Esperar un momento antes de cerrar el modal
        setTimeout(() => {
          onUploadComplete()
          handleModalClose()
        }, 2000)
      } else {
        toast({
          title: "Carga completada con errores",
          description: `Se crearon ${result.successful} usuarios, pero fallaron ${result.failed}.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error en la carga masiva:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error durante la carga masiva. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Crear un libro de trabajo y una hoja
    const wb = XLSX.utils.book_new()
    
    // Definir las columnas del template
    const templateData = [
      {
        nombre: "Nombre",
        apdPaterno: "Apellido Paterno",
        apdMaterno: "Apellido Materno",
        usuario: "usuario", // Sin el prefijo zoques_
        correo: "correo@ejemplo.com",
        telefono: "1234567890",
        rfc: "RFC123456XXX",
        curp: "CURP123456HDFXXX01",
        pswd: "contraseña",
        role: "ROLE_RH"
      }
    ]
    
    // Crear la hoja y añadirla al libro
    const ws = XLSX.utils.json_to_sheet(templateData)
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla")
    
    // Generar el archivo y descargarlo
    XLSX.writeFile(wb, "plantilla_usuarios.xlsx")
  }

  // Solo renderizar el contenido si el usuario está autorizado
  if (!isAuthorized && isOpen) {
    return null; // No mostrar nada si no está autorizado
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Carga Masiva de Usuarios</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Carga múltiples usuarios desde un archivo Excel. El prefijo "zoques_" se agregará automáticamente a los nombres de usuario.
          </DialogDescription>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Nota:</span> Los correos electrónicos deben tener formato válido (ejemplo@dominio.com).
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Botón para descargar plantilla */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm"
              disabled={isUploading}
            >
              <Download className="w-4 h-4" />
              Descargar Plantilla
            </Button>
          </div>
          
          {/* Selector de archivo */}
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            
            {!file ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Arrastra un archivo Excel o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Formatos soportados: .xlsx, .xls
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mt-2"
                >
                  Seleccionar Archivo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetState()
                      fileInputRef.current?.click()
                    }}
                    disabled={isUploading}
                    className="text-sm"
                  >
                    Cambiar Archivo
                  </Button>
                  <Button 
                    onClick={handleUpload}
                    disabled={isUploading || validationErrors.length > 0}
                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Cargar Usuarios
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Barra de progreso */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Procesando usuarios... {progress}%
              </p>
            </div>
          )}
          
          {/* Errores de validación */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Errores de validación</AlertTitle>
              <AlertDescription>
                <div className="mt-2 max-h-60 overflow-y-auto text-sm">
                  <p className="mb-2 text-xs font-medium">Se encontraron los siguientes errores en el archivo Excel:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {validationErrors.map((error, index) => {
                      // Resaltar los errores de correo electrónico
                      const isEmailError = error.includes('correo electrónico');
                      return (
                        <li key={index} className={isEmailError ? 'font-medium' : ''}>
                          {error}
                          {isEmailError && (
                            <div className="text-xs mt-1 ml-2 text-gray-200">
                              Asegúrate de que el formato sea correcto (ejemplo@dominio.com)
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-3 text-xs bg-red-900/30 p-2 rounded">
                    <p className="font-medium">Recomendaciones:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Verifica que no haya espacios en blanco en los correos electrónicos</li>
                      <li>Asegúrate de que los correos tengan el formato usuario@dominio.com</li>
                      <li>Revisa que no haya comas en lugar de puntos en los dominios</li>
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Resultados de la carga */}
          {uploadResult && (
            <Alert className={uploadResult.failed > 0 ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${uploadResult.failed > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>
                  {uploadResult.failed > 0 ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </div>
                <div>
                  <AlertTitle className={uploadResult.failed > 0 ? "text-amber-800 dark:text-amber-300" : "text-green-800 dark:text-green-300"}>
                    Resultado de la carga
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    <p className="mt-1">
                      <span className="font-medium">Total procesados:</span> {uploadResult.total}
                    </p>
                    <p className="text-green-600 dark:text-green-400">
                      <span className="font-medium">Exitosos:</span> {uploadResult.successful}
                    </p>
                    {uploadResult.failed > 0 && (
                      <p className="text-red-600 dark:text-red-400">
                        <span className="font-medium">Fallidos:</span> {uploadResult.failed}
                      </p>
                    )}
                    
                    {uploadResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium mb-1">Detalles de errores:</p>
                        <div className="max-h-40 overflow-y-auto bg-white dark:bg-gray-800 rounded-md p-2 text-xs">
                          <ul className="list-disc pl-5 space-y-1">
                            {uploadResult.errors.map((error, index) => (
                              <li key={index}>
                                <span className="font-medium">Fila {error.row}:</span> {error.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
          <Button 
            variant="outline" 
            type="button" 
            onClick={handleModalClose}
            disabled={isUploading}
            className="rounded-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
