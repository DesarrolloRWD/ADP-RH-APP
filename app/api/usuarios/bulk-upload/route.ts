import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface UserRequest {
  nombre: string
  apdPaterno: string
  apdMaterno: string
  usuario: string
  correo: string
  telefono: string
  rfc: string
  curp?: string
  pswd: string
  roles: Array<{ nombre: string }>
  tenant: { nombre: string }
}

interface BulkUploadRequest {
  users: UserRequest[]
}

export async function POST(request: NextRequest) {
  try {
    // Obtener el token de autenticación
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No autorizado: Token no encontrado' },
        { status: 401 }
      )
    }

    // Obtener los datos de la solicitud
    const data: BulkUploadRequest = await request.json()

    if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
      return NextResponse.json(
        { message: 'No se proporcionaron usuarios para crear' },
        { status: 400 }
      )
    }

    // Resultados de la operación
    const results = {
      total: data.users.length,
      successful: 0,
      failed: 0,
      errors: [] as { index: number; usuario: string; message: string }[]
    }

    // Procesar cada usuario
    for (let i = 0; i < data.users.length; i++) {
      const user = data.users[i]
      
      try {
        // Preparar la solicitud para crear el usuario
        const userPayload = {
          usuarioInformationRequest: {
            nombre: user.nombre,
            apdPaterno: user.apdPaterno,
            apdMaterno: user.apdMaterno || "",
            usuario: user.usuario,
            correo: user.correo,
            telefono: user.telefono,
            rfc: user.rfc,
            curp: user.curp || "",
            pswd: user.pswd,
            roles: user.roles,
            tenant: user.tenant
          }
        }

        // Llamar a la API externa para crear el usuario
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/usuarios/crear`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userPayload)
        })

        if (response.ok) {
          results.successful++
        } else {
          const errorData = await response.json()
          results.failed++
          results.errors.push({
            index: i,
            usuario: user.usuario,
            message: errorData.message || 'Error desconocido'
          })
        }
      } catch (error) {
        results.failed++
        results.errors.push({
          index: i,
          usuario: user.usuario,
          message: (error as Error).message || 'Error desconocido'
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error en la carga masiva de usuarios:', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
