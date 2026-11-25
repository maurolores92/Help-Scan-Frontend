import { useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { useAuth } from 'src/hooks/useAuth'
import { useNotificationSocket } from 'src/context/NotificationContext'
import apiConnector from 'src/services/api.service'
import { RootState } from 'src/store'

interface QueueDocumentItem {
  id: number
  originalName: string
  status: 'PENDING' | 'PROCESSING' | string
  source: string
  createdAt: string
}

interface CompanyQueueSnapshot {
  isProcessing: boolean
  pendingCount: number
  processingCount: number
  totalInQueue: number
  items: QueueDocumentItem[]
}

const SOURCE_LABELS: Record<string, string> = {
  APP_UPLOAD: 'Web',
  FTP: 'SFTP / Impresora',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram'
}

const QueueBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    fontSize: '0.6rem',
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    fontWeight: 700,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
  }
}))

const DocumentQueueIndicator = () => {
  const router = useRouter()
  const auth = useAuth()
  const ability = useContext(AbilityContext)
  const { socket, connected } = useNotificationSocket()
  const latestNotification = useSelector((state: RootState) => state.notifications.notifications[0])

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [queueState, setQueueState] = useState<CompanyQueueSnapshot>({
    isProcessing: false,
    pendingCount: 0,
    processingCount: 0,
    totalInQueue: 0,
    items: []
  })

  const isTenantDocViewer =
    Boolean(auth.user?.companyId) &&
    auth.user?.role !== 'superadmin' &&
    ability.can('read', 'documents')

  const fetchQueueStatus = useCallback(async () => {
    if (!isTenantDocViewer) return
    try {
      const res: CompanyQueueSnapshot = await apiConnector.get('/documents/queue-status')
      if (res && typeof res.totalInQueue === 'number') {
        setQueueState(res)
      }
    } catch {
      // Silencioso en navbar para no mostrar toasts ante navegación/sesión expirada
    }
  }, [isTenantDocViewer])

  useEffect(() => {
    fetchQueueStatus()
  }, [fetchQueueStatus, connected])

  useEffect(() => {
    if (!socket || !isTenantDocViewer) return

    const handleQueueSnapshot = (snapshot: CompanyQueueSnapshot) => {
      if (snapshot && typeof snapshot.totalInQueue === 'number') {
        setQueueState(snapshot)
      }
    }

    socket.on('documents:queue-status', handleQueueSnapshot)

    return () => {
      socket.off('documents:queue-status', handleQueueSnapshot)
    }
  }, [socket, isTenantDocViewer])

  useEffect(() => {
    if (latestNotification?.type?.startsWith('document.')) {
      fetchQueueStatus()
    }
  }, [latestNotification?.id, latestNotification?.type, fetchQueueStatus])

  if (!isTenantDocViewer) return null

  const total = queueState.totalInQueue || 0
  const tooltipText =
    total > 0
      ? `Procesando ${total} documento${total === 1 ? '' : 's'} en cola OCR/IA`
      : 'Cola OCR al día (0 en proceso)'

  return (
    <>
      <Tooltip title={tooltipText}>
        <IconButton
          color='inherit'
          aria-label='document processing queue'
          onClick={e => {
            setAnchorEl(e.currentTarget)
            fetchQueueStatus()
          }}
          sx={{ position: 'relative' }}
        >
          <QueueBadge
            badgeContent={total > 99 ? '99+' : total}
            color='info'
            invisible={total === 0}
          >
            {total > 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                <CircularProgress size={20} thickness={4.5} color='info' />
              </Box>
            ) : (
              <Icon fontSize='1.5rem' icon='tabler:files' />
            )}
          </QueueBadge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 340, maxWidth: '92vw', mt: 1 } }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {total > 0 ? (
              <CircularProgress size={18} thickness={4.5} color='info' />
            ) : (
              <Icon icon='tabler:circle-check' fontSize={20} />
            )}
            <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
              Cola de Procesamiento OCR / IA
            </Typography>
          </Box>
          <Chip
            size='small'
            color={total > 0 ? 'info' : 'success'}
            label={total > 0 ? `${total} activo${total === 1 ? '' : 's'}` : 'Al día'}
          />
        </Box>

        <Divider />

        {total === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              No hay documentos pendientes ni procesándose en este momento.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
            {queueState.items.map(item => {
              const isActive = item.status === 'PROCESSING'

              return (
                <Box
                  key={item.id}
                  sx={{
                    px: 3,
                    py: 1.75,
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5
                  }}
                >
                  <Box sx={{ overflow: 'hidden', flex: 1 }}>
                    <Typography variant='body2' noWrap sx={{ fontWeight: 600 }}>
                      {item.originalName}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Origen: {SOURCE_LABELS[item.source] || item.source}
                    </Typography>
                  </Box>
                  <Chip
                    size='small'
                    variant='outlined'
                    color={isActive ? 'info' : 'warning'}
                    icon={
                      isActive ? (
                        <CircularProgress size={11} color='inherit' />
                      ) : (
                        <Icon icon='tabler:clock' fontSize={13} />
                      )
                    }
                    label={isActive ? 'Analizando' : 'En cola'}
                    sx={{ height: 22, fontSize: '0.68rem' }}
                  />
                </Box>
              )
            })}
            {total > queueState.items.length && (
              <Box sx={{ px: 3, py: 1.25 }}>
                <Typography variant='caption' color='text.secondary'>
                  y {total - queueState.items.length} documento(s) más en espera...
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Divider />
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            size='small'
            variant='outlined'
            startIcon={<Icon icon='tabler:file-text' />}
            onClick={() => {
              setAnchorEl(null)
              router.push('/documents')
            }}
          >
            Ir a Documentos PDF
          </Button>
        </Box>
      </Popover>
    </>
  )
}

export default DocumentQueueIndicator
