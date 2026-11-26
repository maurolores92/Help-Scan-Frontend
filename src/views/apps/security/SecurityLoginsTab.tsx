import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { SecurityLoginEventRow, SecurityLoginEventType } from 'src/types/apps/securityTypes'

interface SecurityLoginsTabProps {
  logins: SecurityLoginEventRow[]
  total: number
  loading: boolean
  page: number
  limit: number
  search: string
  eventType: string
  onSearchChange: (value: string) => void
  onEventTypeChange: (value: string) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

const EVENT_LABELS: Record<
  SecurityLoginEventType,
  { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }
> = {
  LOGIN_SUCCESS: { label: 'Login exitoso', color: 'success' },
  LOGIN_FAILED: { label: 'Intento fallido', color: 'error' },
  LOGIN_BLOCKED_ACTIVE_SESSION: { label: 'Bloqueado (sesión activa)', color: 'warning' },
  SESSION_FORCED_TAKEOVER: { label: 'Reemplazo de sesión', color: 'info' },
  SESSION_REVOKED: { label: 'Sesión revocada', color: 'warning' },
  LOGOUT: { label: 'Cierre de sesión', color: 'default' },
}

export const SecurityLoginsTab = ({
  logins,
  total,
  loading,
  page,
  limit,
  search,
  eventType,
  onSearchChange,
  onEventTypeChange,
  onPageChange,
  onLimitChange,
}: SecurityLoginsTabProps) => {
  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <TextField
          size='small'
          placeholder='Buscar por usuario, IP, país, ISP o motivo...'
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          sx={{ minWidth: { md: 320 } }}
        />
        <FormControl size='small' sx={{ minWidth: 230 }}>
          <InputLabel>Tipo de evento</InputLabel>
          <Select
            label='Tipo de evento'
            value={eventType}
            onChange={e => onEventTypeChange(e.target.value)}
          >
            <MenuItem value=''>Todos los eventos</MenuItem>
            {Object.entries(EVENT_LABELS).map(([key, meta]) => (
              <MenuItem key={key} value={key}>
                {meta.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading && <LinearProgress />}

      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Fecha y hora</TableCell>
              <TableCell>Evento</TableCell>
              <TableCell>Usuario / Rol</TableCell>
              <TableCell>IP / País / ISP</TableCell>
              <TableCell>Dispositivo / Navegador</TableCell>
              <TableCell>Detalle / Motivo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center' sx={{ py: 6 }}>
                  <Typography variant='body2' color='text.secondary'>
                    No se registraron eventos de sesión con los filtros actuales.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logins.map(row => {
                const meta = EVENT_LABELS[row.eventType] || {
                  label: row.eventType,
                  color: 'default' as const,
                }

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant='caption'>
                        {new Date(row.createdAt).toLocaleString('es-AR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size='small' color={meta.color} label={meta.label} />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>
                        {row.usernameAttempted || (row.userId ? `Usuario #${row.userId}` : '-')}
                      </Typography>
                      {row.userRole && (
                        <Typography variant='caption' color='text.secondary'>
                          Rol: {row.userRole}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' fontFamily='monospace' fontWeight={600}>
                        {row.ipAddress}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {[row.countryCode || row.countryName, row.ispOwner]
                          .filter(Boolean)
                          .join(' · ') || 'Sin datos GeoIP'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {[row.browser, row.os].filter(Boolean).join(' / ') || '-'}
                      </Typography>
                      {row.deviceType && (
                        <Typography variant='caption' color='text.secondary'>
                          {row.deviceType}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption' color='text.secondary'>
                        {row.failureReason || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component='div'
        count={total}
        page={Math.max(0, page - 1)}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        rowsPerPage={limit}
        onRowsPerPageChange={e => onLimitChange(Number(e.target.value))}
        rowsPerPageOptions={[15, 25, 50, 100]}
        labelRowsPerPage='Filas por página:'
      />
    </Box>
  )
}
