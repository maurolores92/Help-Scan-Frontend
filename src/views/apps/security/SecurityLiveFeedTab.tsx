import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { LiveSecurityEvent } from 'src/types/apps/securityTypes'

interface SecurityLiveFeedTabProps {
  events: LiveSecurityEvent[]
  connected: boolean
  onClear: () => void
}

const KIND_META: Record<
  LiveSecurityEvent['kind'],
  { label: string; color: 'info' | 'error' | 'warning' | 'default' }
> = {
  LOGIN: { label: 'SESIÓN', color: 'info' },
  ERROR: { label: 'ERROR', color: 'warning' },
  IP_BLOCK: { label: 'BLOQUEO IP', color: 'error' },
  THREAT: { label: 'AMENAZA', color: 'error' },
}

export const SecurityLiveFeedTab = ({
  events,
  connected,
  onClear,
}: SecurityLiveFeedTabProps) => {
  return (
    <Box sx={{ p: 3 }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
        <Stack direction='row' spacing={1.5} alignItems='center'>
          <Chip
            size='small'
            color={connected ? 'success' : 'default'}
            icon={<Icon icon='tabler:broadcast' fontSize={16} />}
            label={connected ? 'WebSocket conectado (/notifications)' : 'Reconectando WebSocket...'}
          />
          <Typography variant='caption' color='text.secondary'>
            Últimos {events.length} eventos en vivo recibidos en esta sesión
          </Typography>
        </Stack>
        <Button size='small' variant='outlined' onClick={onClear} disabled={events.length === 0}>
          Limpiar feed
        </Button>
      </Stack>

      {events.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant='body2' color='text.secondary'>
            Esperando eventos en tiempo real (inicios de sesión, errores 4xx/5xx, amenazas o bloqueos de IP)...
          </Typography>
        </Box>
      ) : (
        <List dense disablePadding>
          {events.map((ev, index) => {
            const meta = KIND_META[ev.kind] || { label: ev.kind, color: 'default' as const }

            return (
              <ListItem
                key={`${ev.createdAt}-${ev.id ?? index}`}
                divider
                sx={{ px: 1.5, py: 1.25 }}
              >
                <ListItemText
                  primary={
                    <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
                      <Chip size='small' color={meta.color} label={meta.label} />
                      {ev.statusCode ? (
                        <Chip
                          size='small'
                          color={ev.statusCode >= 500 ? 'error' : 'warning'}
                          variant='outlined'
                          label={`HTTP ${ev.statusCode}`}
                        />
                      ) : null}
                      {ev.eventType && (
                        <Typography variant='body2' fontWeight={600}>
                          {ev.eventType}
                        </Typography>
                      )}
                      {ev.path && (
                        <Typography variant='body2' fontFamily='monospace'>
                          {ev.method ? `${ev.method} ` : ''}
                          {ev.path}
                        </Typography>
                      )}
                      {ev.ipAddress && (
                        <Chip size='small' variant='outlined' label={ev.ipAddress} />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.5 }}>
                      {new Date(ev.createdAt).toLocaleString('es-AR')}
                      {ev.username ? ` · Usuario: ${ev.username}` : ''}
                      {ev.countryName ? ` · País: ${ev.countryName}` : ''}
                      {ev.ispOwner ? ` · ISP: ${ev.ispOwner}` : ''}
                      {ev.message ? ` · ${ev.message}` : ''}
                      {ev.failureReason ? ` · ${ev.failureReason}` : ''}
                      {ev.reason ? ` · Motivo: ${ev.reason}` : ''}
                    </Typography>
                  }
                />
              </ListItem>
            )
          })}
        </List>
      )}
    </Box>
  )
}
