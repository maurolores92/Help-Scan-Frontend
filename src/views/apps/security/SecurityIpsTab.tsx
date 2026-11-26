import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { SecurityIpIntelligenceRow } from 'src/types/apps/securityTypes'

interface SecurityIpsTabProps {
  ips: SecurityIpIntelligenceRow[]
  total: number
  loading: boolean
  actionLoadingIp: string | null
  page: number
  limit: number
  search: string
  blockedOnly: boolean
  hasErrors: boolean
  onSearchChange: (value: string) => void
  onBlockedOnlyChange: (checked: boolean) => void
  onHasErrorsChange: (checked: boolean) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onRefreshIp: (ip: string) => void
  onToggleBlock: (ip: string, blocked: boolean, reason?: string) => Promise<void>
}

export const SecurityIpsTab = ({
  ips,
  total,
  loading,
  actionLoadingIp,
  page,
  limit,
  search,
  blockedOnly,
  hasErrors,
  onSearchChange,
  onBlockedOnlyChange,
  onHasErrorsChange,
  onPageChange,
  onLimitChange,
  onRefreshIp,
  onToggleBlock,
}: SecurityIpsTabProps) => {
  const [blockDialog, setBlockDialog] = useState<{
    ip: string
    nextBlocked: boolean
  } | null>(null)
  const [reason, setReason] = useState('')

  const handleConfirmToggle = async () => {
    if (!blockDialog) return
    await onToggleBlock(blockDialog.ip, blockDialog.nextBlocked, reason)
    setBlockDialog(null)
    setReason('')
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <TextField
          size='small'
          placeholder='Buscar por IP, país, ISP, organización o ASN...'
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          sx={{ minWidth: { md: 320 } }}
        />
        <FormControlLabel
          control={
            <Switch
              size='small'
              checked={blockedOnly}
              onChange={e => onBlockedOnlyChange(e.target.checked)}
            />
          }
          label='Solo bloqueadas'
        />
        <FormControlLabel
          control={
            <Switch
              size='small'
              checked={hasErrors}
              onChange={e => onHasErrorsChange(e.target.checked)}
            />
          }
          label='Con errores 4xx/5xx'
        />
      </Stack>

      {loading && <LinearProgress />}

      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Dirección IP</TableCell>
              <TableCell>País / Ubicación</TableCell>
              <TableCell>Dueño / ISP / ASN</TableCell>
              <TableCell align='right'>Requests</TableCell>
              <TableCell align='right'>Fallos / Errores</TableCell>
              <TableCell>Último acceso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align='right'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align='center' sx={{ py: 6 }}>
                  <Typography variant='body2' color='text.secondary'>
                    No hay direcciones IP registradas con los filtros actuales.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              ips.map(row => {
                const isBusy = actionLoadingIp === row.ipAddress

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={700} fontFamily='monospace'>
                        {row.ipAddress}
                      </Typography>
                      {row.lookupProvider && (
                        <Typography variant='caption' color='text.secondary'>
                          Fuente: {row.lookupProvider}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>
                        {row.countryCode ? `${row.countryCode} · ` : ''}
                        {row.countryName || 'Desconocido'}
                      </Typography>
                      {(row.city || row.region) && (
                        <Typography variant='caption' color='text.secondary'>
                          {[row.city, row.region].filter(Boolean).join(', ')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {row.isp || row.organization || 'Sin datos de proveedor'}
                      </Typography>
                      {row.asn && (
                        <Typography variant='caption' color='text.secondary' fontFamily='monospace'>
                          {row.asn}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' fontWeight={600}>
                        {Number(row.totalRequests || 0).toLocaleString('es-AR')}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Stack direction='row' spacing={0.5} justifyContent='flex-end'>
                        <Chip
                          size='small'
                          label={`Fallos: ${row.failedLoginsCount || 0}`}
                          color={(row.failedLoginsCount || 0) >= 5 ? 'warning' : 'default'}
                          variant='outlined'
                        />
                        <Chip
                          size='small'
                          label={`Err: ${row.errorCount || 0}`}
                          color={(row.errorCount || 0) > 0 ? 'error' : 'default'}
                          variant='outlined'
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption' display='block'>
                        {row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString('es-AR') : '-'}
                      </Typography>
                      {row.lastPath && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          fontFamily='monospace'
                          noWrap
                          sx={{ maxWidth: 200, display: 'block' }}
                        >
                          {row.lastPath}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.isBlocked ? (
                        <Tooltip title={row.blockReason || 'IP bloqueada manualmente'}>
                          <Chip size='small' color='error' label='Bloqueada' />
                        </Tooltip>
                      ) : (
                        <Chip size='small' color='success' variant='outlined' label='Permitida' />
                      )}
                    </TableCell>
                    <TableCell align='right'>
                      <Stack direction='row' spacing={0.5} justifyContent='flex-end'>
                        <Tooltip title='Actualizar información GeoIP / ISP'>
                          <span>
                            <IconButton
                              size='small'
                              disabled={isBusy}
                              onClick={() => onRefreshIp(row.ipAddress)}
                            >
                              <Icon icon='tabler:refresh' fontSize={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Button
                          size='small'
                          variant={row.isBlocked ? 'outlined' : 'contained'}
                          color={row.isBlocked ? 'success' : 'error'}
                          disabled={isBusy}
                          onClick={() => {
                            setReason('')
                            setBlockDialog({
                              ip: row.ipAddress,
                              nextBlocked: !row.isBlocked,
                            })
                          }}
                        >
                          {row.isBlocked ? 'Desbloquear' : 'Bloquear'}
                        </Button>
                      </Stack>
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

      <Dialog open={Boolean(blockDialog)} onClose={() => setBlockDialog(null)} maxWidth='xs' fullWidth>
        <DialogTitle>
          {blockDialog?.nextBlocked ? `Bloquear IP ${blockDialog?.ip}` : `Desbloquear IP ${blockDialog?.ip}`}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {blockDialog?.nextBlocked
              ? 'Todas las peticiones entrantes desde esta IP recibirán HTTP 403 de forma inmediata.'
              : 'La IP volverá a tener acceso normal a la API.'}
          </Typography>
          {blockDialog?.nextBlocked && (
            <TextField
              fullWidth
              size='small'
              label='Motivo del bloqueo (opcional)'
              placeholder='Ej: Fuerza bruta o escaneo sospechoso'
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialog(null)}>Cancelar</Button>
          <Button
            variant='contained'
            color={blockDialog?.nextBlocked ? 'error' : 'success'}
            onClick={handleConfirmToggle}
          >
            {blockDialog?.nextBlocked ? 'Confirmar bloqueo' : 'Confirmar desbloqueo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
