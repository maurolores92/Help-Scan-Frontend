import { getApiBaseUrl } from 'src/utils/api-url'

export type ClientErrorReportPayload = {
  statusCode?: number
  method?: string
  path: string
  frontendRoute?: string
  errorCode?: string
  message: string
  stackTrace?: string
}

const recentReportTimestamps = new Map<string, number>()
const DEDUP_WINDOW_MS = 10000

/**
 * Envía errores de cliente (4xx/5xx en Axios, excepciones JS globales y React ErrorBoundary)
 * usando fetch directo con keepalive para evitar bucles con los interceptores de Axios.
 */
export const reportClientError = (payload: ClientErrorReportPayload): void => {
  if (typeof window === 'undefined') return

  try {
    const cleanPath = String(payload.path || '/').slice(0, 500)
    if (cleanPath.includes('/security/client-errors')) return

    const message = String(payload.message || 'Error inesperado en interfaz').slice(0, 2000)
    const dedupKey = `${payload.statusCode ?? 0}:${payload.method || 'UI'}:${cleanPath}:${message.slice(0, 120)}`
    const now = Date.now()
    const lastSentAt = recentReportTimestamps.get(dedupKey)
    if (lastSentAt && now - lastSentAt < DEDUP_WINDOW_MS) {
      return
    }
    recentReportTimestamps.set(dedupKey, now)
    if (recentReportTimestamps.size > 100) {
      const oldestKey = recentReportTimestamps.keys().next().value
      if (oldestKey) recentReportTimestamps.delete(oldestKey)
    }

    const token = localStorage.getItem('accessToken')
    const baseUrl = getApiBaseUrl().replace(/\/+$/, '')

    void fetch(`${baseUrl}/security/client-errors`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        statusCode: payload.statusCode ?? 0,
        method: payload.method ? String(payload.method).toUpperCase().slice(0, 16) : 'UI',
        path: cleanPath,
        frontendRoute: (payload.frontendRoute || window.location.pathname || '/').slice(0, 255),
        errorCode: payload.errorCode ? String(payload.errorCode).slice(0, 80) : undefined,
        message,
        stackTrace: payload.stackTrace ? String(payload.stackTrace).slice(0, 8000) : undefined,
      }),
    }).catch(() => {
      // Silencioso para no afectar la experiencia del usuario si el servidor está caído
    })
  } catch {
    // Nunca lanzar errores desde el reportero de telemetría
  }
}
