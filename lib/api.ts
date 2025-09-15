// Servicios de API para la autenticación y otras funcionalidades

/**
 * Interfaz para la solicitud de login
 */
export interface LoginRequest {
  usuario: string;
  pswd: string;
}

/**
 * Interfaz para la respuesta de login
 */
export interface LoginResponse {
  token?: string;
  "token "?: string; // Formato alternativo con espacio
}

/**
 * Función para realizar el login del usuario
 * @param credentials Credenciales del usuario (usuario y contraseña)
 * @returns Promesa con la respuesta del servidor que incluye el token JWT
 */
export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_AUTH_ENDPOINT}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la autenticación');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en el servicio de login:', error);
    throw error;
  }
}

/**
 * Función para verificar si el token JWT es válido
 * @param token Token JWT a verificar
 * @returns Booleano que indica si el token es válido
 */
export function isTokenValid(token: string): boolean {
  if (!token) return false;
  
  try {
    // Decodificar el token (parte del payload)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Verificar la expiración del token
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return false;
  }
}

/**
 * Interfaz para los roles del sistema
 */
export interface Role {
  nombre: string;
  descripcion?: string;
}

/**
 * Interfaz para los tenants del sistema
 */
export interface Tenant {
  nombre: string;
  descripcion?: string;
}

/**
 * Función para obtener los roles disponibles en el sistema
 * @returns Promesa con la lista de roles disponibles
 */
export async function getRoles(): Promise<Role[]> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/get/roles`;
  
  try {
    const token = localStorage.getItem('adp_rh_auth_token');
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener los roles');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en el servicio de obtención de roles:', error);
    throw error;
  }
}

/**
 * Función para obtener los tenants disponibles en el sistema
 * @returns Promesa con la lista de tenants disponibles
 */
export async function getTenants(): Promise<Tenant[]> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/get/tenant`;
  
  try {
    const token = localStorage.getItem('adp_rh_auth_token');
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener los tenants');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en el servicio de obtención de tenants:', error);
    throw error;
  }
}

/**
 * Interfaz para actualizar el estado de un usuario
 */
export interface UpdateStatusRequest {
  value: string; // nombre de usuario
  status: boolean; // estado (activo/inactivo)
}

/**
 * Función para actualizar el estado de un usuario (activo/inactivo)
 * @param request Datos para actualizar el estado
 * @returns Promesa con la respuesta del servidor
 */
export async function updateUserStatus(request: UpdateStatusRequest): Promise<any> {
  // NO eliminar el prefijo del tenant, enviar el nombre de usuario completo
  // El backend espera el formato "zoques_username"
  
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/update/status`;
  
  try {
    // Asegurarse de que estamos en el cliente antes de acceder a localStorage
    let token;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('adp_rh_auth_token');
    }
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    console.log('Enviando solicitud para actualizar estado:', request);
    
    const response = await fetch(apiUrl, {
      method: 'PUT', // El servidor espera el método PUT
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        "value": request.value,
        "status": request.status
      })
    });

    // Registrar la respuesta para depuración
    console.log('Respuesta del servidor:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Error al actualizar el estado del usuario';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Si no se puede parsear como JSON, usar el mensaje por defecto
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Datos de respuesta:', data);
    return data;
  } catch (error) {
    console.error('Error al actualizar el estado del usuario:', error);
    throw error;
  }
}

/**
 * Interfaz para actualizar la imagen de un usuario
 */
export interface UpdateImageRequest {
  value: string; // nombre de usuario
  image: string; // imagen en base64
}

/**
 * Función para actualizar la imagen de un usuario
 * @param request Datos para actualizar la imagen
 * @returns Promesa con la respuesta del servidor
 */
export async function updateUserImage(request: UpdateImageRequest): Promise<any> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/update/image`;
  
  try {
    const token = localStorage.getItem('adp_rh_auth_token');
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar la imagen del usuario');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al actualizar la imagen del usuario:', error);
    throw error;
  }
}

/**
 * Interfaz para la solicitud de historial de asistencias
 */
export interface AttendanceHistoryRequest {
  employeeId: string;
  eventTimestampInit: string;
  eventTimestampEnd: string;
}

/**
 * Interfaz para la respuesta de historial de asistencias
 */
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  event_timestamp: string;
  event_type: 'ENTRADA' | 'SALIDA';
}

/**
 * Interfaz para la solicitud de detalles de asistencia
 */
export interface AttendanceDetailRequest {
  id: string;
}

/**
 * Interfaz para la respuesta de detalles de asistencia
 */
export interface AttendanceDetail {
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  deviceInfo: {
    deviceId: string;
    platform: string;
    appVersion: string;
  };
  photo?: string;
}

/**
 * Función para obtener el historial de entradas y salidas de un usuario
 * @param request Datos para la consulta (ID de empleado y rango de fechas)
 * @returns Promesa con la lista de registros de asistencia
 */
export async function getAttendanceHistory(request: AttendanceHistoryRequest): Promise<AttendanceRecord[]> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/checktime/list/detalle`;
  
  try {
    const token = localStorage.getItem('adp_rh_auth_token');
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    console.log('Consultando historial de asistencias:', request);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });
    
    // Registrar la respuesta para depuración
    console.log('Respuesta del servidor:', response.status);

    if (!response.ok) {
      let errorMessage = 'Error al obtener el historial de asistencias';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log('Detalles del error:', errorData);
      } catch (e) {
        // Si no se puede parsear como JSON, usar el mensaje por defecto
        console.log('No se pudo obtener detalles del error');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener el historial de asistencias:', error);
    throw error;
  }
}

/**
 * Interfaz para la información del usuario a actualizar
 */
export interface UserInformationRequest {
  correo: string;
  pswd?: string;
  nombre: string;
  apdPaterno: string;
  apdMaterno: string;
  usuario: string;
  curp?: string;
  telefono: string;
  rfc: string;
  image?: string;
  roles: Array<{ nombre: string }>;
  tenant: { nombre: string };
  allowWebAccess?: boolean; // Indica si el usuario puede acceder a la aplicación web
}

/**
 * Interfaz para actualizar la información de un usuario
 */
export interface UpdateInformationRequest {
  valueSearch: string; // nombre de usuario a buscar
  usuarioInformationRequest: UserInformationRequest; // nueva información
}

/**
 * Función para actualizar la información de un usuario
 * @param request Datos para actualizar la información
 * @returns Promesa con la respuesta del servidor
 */
export async function updateUserInformation(request: UpdateInformationRequest): Promise<any> {
  // Usar el endpoint correcto que funciona en la otra aplicación
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/update/information`;
  
  try {
    // Asegurarse de que estamos en el cliente antes de acceder a localStorage
    let token;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('adp_rh_auth_token');
    }
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    // Limpiar y validar los datos antes de enviarlos
    const cleanedRequest = {
      valueSearch: request.valueSearch,
      usuarioInformationRequest: {
        ...request.usuarioInformationRequest,
        // Asegurarse de que los campos requeridos estén presentes
        correo: request.usuarioInformationRequest.correo || '',
        nombre: request.usuarioInformationRequest.nombre || '',
        apdPaterno: request.usuarioInformationRequest.apdPaterno || '',
        apdMaterno: request.usuarioInformationRequest.apdMaterno || '',
        usuario: request.usuarioInformationRequest.usuario || '',
        telefono: request.usuarioInformationRequest.telefono || '',
        rfc: request.usuarioInformationRequest.rfc || '',
        // Asegurarse de que roles y tenant estén correctamente formateados
        roles: request.usuarioInformationRequest.roles || [{ nombre: 'ROLE_RH' }],
        tenant: request.usuarioInformationRequest.tenant || { nombre: '' }
      }
    };
    
    console.log('Enviando solicitud para actualizar usuario (limpia):', cleanedRequest);
    
    // Usar PUT como requiere el servidor
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cleanedRequest)
    });
    
    // Registrar la respuesta para depuración
    console.log('Respuesta del servidor:', response.status);

    if (!response.ok) {
      let errorMessage = 'Error al actualizar la información del usuario';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log('Detalles del error:', errorData);
      } catch (e) {
        // Si no se puede parsear como JSON, usar el mensaje por defecto
        console.log('No se pudo obtener detalles del error');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al actualizar la información del usuario:', error);
    throw error;
  }
}

/**
 * Función para obtener información adicional de un registro de asistencia
 * @param request Datos para la consulta (ID del registro)
 * @returns Promesa con los detalles del registro de asistencia
 */
export async function getAttendanceDetail(request: AttendanceDetailRequest): Promise<AttendanceDetail> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/checktime/get/informacion/adicional`;
  
  try {
    const token = localStorage.getItem('adp_rh_auth_token');
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    console.log('Consultando detalles de registro de asistencia:', request);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });
    
    // Registrar la respuesta para depuración
    console.log('Respuesta del servidor:', response.status);

    if (!response.ok) {
      let errorMessage = 'Error al obtener detalles del registro de asistencia';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log('Detalles del error:', errorData);
      } catch (e) {
        // Si no se puede parsear como JSON, usar el mensaje por defecto
        console.log('No se pudo obtener detalles del error');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener detalles del registro de asistencia:', error);
    throw error;
  }
}

/**
 * Interfaz para la solicitud de información específica de usuario
 */
export interface SpecificUserRequest {
  value: string; // nombre de usuario
}

/**
 * Interfaz para la respuesta de información específica de usuario
 */
export interface SpecificUserResponse {
  correo: string;
  nombre: string;
  apdPaterno: string;
  apdMaterno: string;
  usuario: string;
  curp: string;
  telefono: string;
  rfc: string;
  roles: Array<{ nombre: string }>;
  fechaUltimoAcceso: string;
  image?: string;
}

/**
 * Función para obtener información específica de un usuario
 * @param request Datos para la consulta (nombre de usuario)
 * @returns Promesa con la información del usuario
 */
export async function getSpecificUser(request: SpecificUserRequest): Promise<SpecificUserResponse> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/specific/user`;
  
  try {
    const token = localStorage.getItem('adp_rh_auth_token');
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    console.log('Consultando información específica de usuario:', request);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });
    
    // Registrar la respuesta para depuración
    console.log('Respuesta del servidor:', response.status);

    if (!response.ok) {
      let errorMessage = 'Error al obtener información específica del usuario';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log('Detalles del error:', errorData);
      } catch (e) {
        // Si no se puede parsear como JSON, usar el mensaje por defecto
        console.log('No se pudo obtener detalles del error');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener información específica del usuario:', error);
    throw error;
  }
}
