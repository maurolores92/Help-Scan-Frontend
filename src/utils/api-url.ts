/**
 * Utilidades para resolver URLs dinámicas de la API y recursos estáticos
 * garantizando que apunten siempre a la IP, dominio y puerto configurados en .env
 */

/**
 * Obtiene la URL base de la API del Backend garantizando que apunte a la IP y URL del .env.
 * Si la variable de entorno no incluye /api al final, se normaliza para coincidir con el prefijo global de NestJS.
 * Si no está definida en .env, toma la IP/hostname actual del navegador en el puerto 5002 como fallback.
 */
export const getApiBaseUrl = (): string => {
  // En el navegador: autodetección inteligente de dominio de producción
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.startsWith('scan.')) {
      return `${window.location.protocol}//api-${host}/api`;
    }
    if (host.includes('helpcopies.com')) {
      return `${window.location.protocol}//api-scan.helpcopies.com/api`;
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5002/api`;
  }

  return 'http://localhost:5002/api';
};

/**
 * Obtiene la URL base para conexiones WebSocket (socket.io).
 * Si NEXT_PUBLIC_WS_URL no se define en .env, se deduce automáticamente de NEXT_PUBLIC_API_URL eliminando /api.
 */
export const getWsUrl = (): string => {
  const envWs = process.env.NEXT_PUBLIC_WS_URL?.trim()
  if (envWs) {
    return envWs.replace(/\/+$/, '')
  }

  const apiUrl = getApiBaseUrl()
  
return apiUrl.replace(/\/api$/, '')
}

/**
 * Resuelve la URL absoluta para imágenes y avatares alojados en el backend.
 * @param imagePath Ruta relativa del archivo (ej: 'users/avatar.jpg' o '/images/users/avatar.jpg')
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return ''
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath
  }

  const baseUrl = getApiBaseUrl()
  const clean = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath

  if (clean.startsWith('images/')) {
    return `${baseUrl}/${clean}`
  }

  return `${baseUrl}/images/${clean}`
}

