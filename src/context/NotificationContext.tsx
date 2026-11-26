// ** React Imports
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'

// ** Socket.io
import { io, Socket } from 'socket.io-client'

// ** Store
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'src/store'
import { addNotification, fetchUnreadCount } from 'src/store/apps/notifications'
import { pushLiveSecurityEvent } from 'src/store/apps/security'
import toast from 'react-hot-toast'

// ** Auth
import { useAuth } from 'src/hooks/useAuth'

// ** Config & Utils
import { getWsUrl } from 'src/utils/api-url'

/**
 * Remueve emojis al inicio de una cadena para evitar que se muestren duplicados
 * cuando react-hot-toast ya renderiza el emoji en la ranura de icono.
 */
export function stripLeadingEmoji(text?: string | null): string {
  if (!text) return ''

  return text
    .replace(
      /^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\uFE0F|\u200D|\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/u,
      ''
    )
    .trim()
}

interface NotificationContextValue {
  socket: Socket | null
  connected: boolean
}

const NotificationContext = createContext<NotificationContextValue>({
  socket: null,
  connected: false,
})

interface Props {
  children: ReactNode
}

export const NotificationProvider = ({ children }: Props) => {
  const socketRef = useRef<Socket | null>(null)
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (!user) {
      // Si no hay usuario, desconectar si había socket abierto
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setSocketInstance(null)
      setConnected(false)

      return
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!token) return

    let currentSessionId: string | null = null
    try {
      const payloadSegment = token.split('.')[1]
      if (payloadSegment) {
        const parsed = JSON.parse(atob(payloadSegment.replace(/-/g, '+').replace(/_/g, '/')))
        currentSessionId = parsed?.sessionId || null
      }
    } catch {
      currentSessionId = null
    }

    // Conectar al namespace /notifications con el JWT
    const socket = io(`${getWsUrl()}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socket.on('session:revoked', (data: { activeSessionId?: string; message?: string }) => {
      if (data?.activeSessionId && currentSessionId && data.activeSessionId === currentSessionId) {
        return
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userData')
        localStorage.removeItem('user')
        localStorage.removeItem('role')
        toast.error(
          data?.message || 'Tu sesión se cerró porque se inició sesión desde otro dispositivo.',
          { id: 'session-revoked' }
        )
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    })

    socket.on('connect', () => {
      console.log('[WS] Connected to /notifications')
      setConnected(true)
      dispatch(fetchUnreadCount())
    })

    socket.on('notification', (notification: any) => {
      dispatch(addNotification(notification))
      dispatch(fetchUnreadCount())

      if (notification?.title) {
        // Extraer icono limpio: usar el emoji del backend o el primer emoji del título, o '🔔'
        const emojiFromTitle = notification.title.match(
          /^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\uFE0F|\u200D|\p{Emoji_Presentation}|\p{Extended_Pictographic})+/u
        )?.[0]

        const icon = notification?.data?.emoji || emojiFromTitle || '🔔'
        const cleanTitle = stripLeadingEmoji(notification.title)
        const cleanBody = stripLeadingEmoji(notification.body)

        // Usar id único para deduplicar automáticamente toasts idénticos en react-hot-toast
        const toastId = notification?.id ? `notif-${notification.id}` : `notif-${cleanTitle}-${cleanBody}`

        toast(
          () => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '340px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }}>
                {cleanTitle}
              </div>
              {cleanBody && cleanBody !== cleanTitle && (
                <div style={{ fontSize: '0.78rem', opacity: 0.88, lineHeight: 1.25 }}>
                  {cleanBody}
                </div>
              )}
            </div>
          ),
          {
            id: toastId,
            icon,
            duration: 6000,
            style: {
              borderRadius: '10px',
              background: '#1e1e2d',
              color: '#fff',
              border: '1px solid #32A048',
            },
          }
        )
      }
    })

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected from /notifications')
      setConnected(false)
    })

    socket.on('security:event', (event: any) => {
      if (user?.role === 'superadmin' && event) {
        dispatch(pushLiveSecurityEvent(event))
      }
    })

    socket.on('connect_error', (err: any) => {
      console.error('[WS] Connection error:', err.message)
      setConnected(false)
    })

    socketRef.current = socket
    setSocketInstance(socket)

    return () => {
      socket.disconnect()
      socketRef.current = null
      setSocketInstance(null)
      setConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return (
    <NotificationContext.Provider
      value={{
        socket: socketInstance,
        connected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotificationSocket = () => useContext(NotificationContext)
