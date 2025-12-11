/**
 * Módulo de validación y sanitización de datos para seguridad
 */

/**
 * Expresiones regulares para validación
 */
const VALIDATION_PATTERNS = {
  // Solo letras, números, guiones bajos y guiones medios (sin caracteres especiales peligrosos)
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  // Contraseña: mínimo 8 caracteres, sin caracteres especiales peligrosos
  PASSWORD: /^[a-zA-Z0-9@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
  // Email válido
  EMAIL: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // Teléfono (solo números, espacios, guiones y paréntesis)
  PHONE: /^[0-9\s\-()]+$/,
  // RFC (formato mexicano)
  RFC: /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/,
  // CURP (formato mexicano)
  CURP: /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/,
  // Nombres (solo letras, espacios y acentos)
  NAME: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
};

/**
 * Caracteres peligrosos que pueden usarse en inyección SQL o XSS
 */
const DANGEROUS_CHARS = [
  '<', '>', '"', "'", '\\', ';', '|', '&', '$', '`', 
  '()', '{', '}', '[', ']', '/*', '*/', '--', '#'
];

/**
 * Interfaz para el resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Sanitiza una cadena removiendo caracteres peligrosos
 * @param input Cadena a sanitizar
 * @returns Cadena sanitizada
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remover espacios al inicio y final
  let sanitized = input.trim();
  
  // Escapar caracteres HTML peligrosos
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Valida el nombre de usuario
 * @param username Nombre de usuario a validar
 * @returns Resultado de la validación
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      error: 'El nombre de usuario es requerido'
    };
  }
  
  if (username.length < 3) {
    return {
      isValid: false,
      error: 'El nombre de usuario debe tener al menos 3 caracteres'
    };
  }
  
  if (username.length > 20) {
    return {
      isValid: false,
      error: 'El nombre de usuario no puede exceder 20 caracteres'
    };
  }
  
  if (!VALIDATION_PATTERNS.USERNAME.test(username)) {
    return {
      isValid: false,
      error: 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'
    };
  }
  
  // Verificar caracteres peligrosos adicionales
  const hasDangerousChars = DANGEROUS_CHARS.some(char => username.includes(char));
  if (hasDangerousChars) {
    return {
      isValid: false,
      error: 'El nombre de usuario contiene caracteres no permitidos'
    };
  }
  
  return { isValid: true };
}

/**
 * Valida la contraseña
 * @param password Contraseña a validar
 * @returns Resultado de la validación
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.trim().length === 0) {
    return {
      isValid: false,
      error: 'La contraseña es requerida'
    };
  }
  
  if (password.length < 12) {
    return {
      isValid: false,
      error: 'La contraseña debe tener al menos 12 caracteres'
    };
  }
  
  if (password.length > 15) {
    return {
      isValid: false,
      error: 'La contraseña no puede exceder 15 caracteres'
    };
  }
  
  // Verificar que no contenga secuencias de inyección SQL comunes
  const sqlInjectionPatterns = [
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(--)/,
    /(\/\*)/,
    /(\*\/)/,
    /(;.*\b(DROP|DELETE|INSERT|UPDATE)\b)/i
  ];
  
  const hasSQLInjection = sqlInjectionPatterns.some(pattern => pattern.test(password));
  if (hasSQLInjection) {
    return {
      isValid: false,
      error: 'La contraseña contiene patrones no permitidos'
    };
  }
  
  return { isValid: true };
}

/**
 * Valida un email
 * @param email Email a validar
 * @returns Resultado de la validación
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: 'El correo electrónico es requerido'
    };
  }
  
  if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    return {
      isValid: false,
      error: 'El formato del correo electrónico no es válido'
    };
  }
  
  if (email.length > 100) {
    return {
      isValid: false,
      error: 'El correo electrónico no puede exceder 100 caracteres'
    };
  }
  
  return { isValid: true };
}

/**
 * Valida un nombre (nombre, apellidos)
 * @param name Nombre a validar
 * @param fieldName Nombre del campo para mensajes de error
 * @returns Resultado de la validación
 */
export function validateName(name: string, fieldName: string = 'nombre'): ValidationResult {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: `El ${fieldName} es requerido`
    };
  }
  
  if (name.length < 2) {
    return {
      isValid: false,
      error: `El ${fieldName} debe tener al menos 2 caracteres`
    };
  }
  
  if (name.length > 100) {
    return {
      isValid: false,
      error: `El ${fieldName} no puede exceder 100 caracteres`
    };
  }
  
  if (!VALIDATION_PATTERNS.NAME.test(name)) {
    return {
      isValid: false,
      error: `El ${fieldName} solo puede contener letras y espacios`
    };
  }
  
  return { isValid: true };
}

/**
 * Valida un teléfono
 * @param phone Teléfono a validar
 * @returns Resultado de la validación
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim().length === 0) {
    return {
      isValid: false,
      error: 'El teléfono es requerido'
    };
  }
  
  // Remover espacios, guiones y paréntesis para validar solo números
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  if (cleanPhone.length < 10) {
    return {
      isValid: false,
      error: 'El teléfono debe tener al menos 10 dígitos'
    };
  }
  
  if (!VALIDATION_PATTERNS.PHONE.test(phone)) {
    return {
      isValid: false,
      error: 'El teléfono solo puede contener números, espacios, guiones y paréntesis'
    };
  }
  
  return { isValid: true };
}

/**
 * Valida un RFC
 * @param rfc RFC a validar
 * @returns Resultado de la validación
 */
export function validateRFC(rfc: string): ValidationResult {
  if (!rfc || rfc.trim().length === 0) {
    return {
      isValid: false,
      error: 'El RFC es requerido'
    };
  }
  
  const cleanRFC = rfc.toUpperCase().trim();
  
  if (!VALIDATION_PATTERNS.RFC.test(cleanRFC)) {
    return {
      isValid: false,
      error: 'El formato del RFC no es válido'
    };
  }
  
  return { isValid: true };
}

/**
 * Valida un CURP
 * @param curp CURP a validar
 * @returns Resultado de la validación
 */
export function validateCURP(curp: string): ValidationResult {
  if (!curp || curp.trim().length === 0) {
    return { isValid: true };
  }
  
  const cleanCURP = curp.toUpperCase().trim();
  
  if (!VALIDATION_PATTERNS.CURP.test(cleanCURP)) {
    return {
      isValid: false,
      error: 'El formato del CURP no es válido'
    };
  }
  
  return { isValid: true };
}

/**
 * Detecta intentos de inyección SQL en cualquier entrada
 * @param input Entrada a verificar
 * @returns true si se detecta un intento de inyección
 */
export function detectSQLInjection(input: string): boolean {
  if (!input) return false;
  
  const sqlPatterns = [
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    /(--)/,
    /(\/\*)/,
    /(\*\/)/,
    /(;.*\b(DROP|DELETE|INSERT|UPDATE|SELECT)\b)/i,
    /('.*OR.*'.*=.*')/i,
    /(".*OR.*".*=.*")/i,
    /(1=1)/,
    /(1='1')/,
    /(\bxp_\w+)/i,
    /(\bsp_\w+)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detecta intentos de XSS en cualquier entrada
 * @param input Entrada a verificar
 * @returns true si se detecta un intento de XSS
 */
export function detectXSS(input: string): boolean {
  if (!input) return false;
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Valida credenciales de login de forma segura
 * @param username Nombre de usuario
 * @param password Contraseña
 * @returns Resultado de la validación con errores específicos
 */
export function validateLoginCredentials(username: string, password: string): ValidationResult {
  // Validar usuario
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    return usernameValidation;
  }
  
  // Validar contraseña
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }
  
  // Detectar inyección SQL
  if (detectSQLInjection(username) || detectSQLInjection(password)) {
    return {
      isValid: false,
      error: 'Se detectaron caracteres o patrones no permitidos en las credenciales'
    };
  }
  
  // Detectar XSS
  if (detectXSS(username) || detectXSS(password)) {
    return {
      isValid: false,
      error: 'Se detectaron caracteres o patrones no permitidos en las credenciales'
    };
  }
  
  return { isValid: true };
}
