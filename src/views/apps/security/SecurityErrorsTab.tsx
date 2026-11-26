import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { SecurityErrorLogRow } from 'src/types/apps/securityTypes'

interface SecurityErrorsTabProps {
  errors: SecurityErrorLogRow[]
  total: number
  loading: boolean
  page: number
  limit: number
  search: string
  source: string
  statusFamily: string
  onSearchChange: (value: string) => void
  onSourceChange: (value: string) => void
  onStatusFamilyChange: (value: string) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export const SecurityErrorsTab = ({
  errors,
  total,
  loading,
  page,
  limit,
  search,
  source,
  statusFamily,
  onSearchChange,
  onSourceChange,
  onStatusFamilyChange,
  onPageChange,
  onLimitChange,
}: SecurityErrorsTabProps) => {
  const [selectedError, setSelectedError] = useState<SecurityErrorLogRow | null>(null)

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <TextField
          size='small'
          placeholder='Buscar por endpoint, mensaje, usuario, IP o ISP...'
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          sx={{ minWidth: { md: 320 } }}
        />
        <FormControl size='small' sx={{ minWidth: 160 }}>
          <InputLabel>Origen</InputLabel>
          <Select label='Origen' value={source} onChange={e => onSourceChange(e.target.value)}>
            <MenuItem value=''>Todos</MenuItem>
            <MenuItem value='BACKEND'>Backend</MenuItem>
            <MenuItem value='FRONTEND'>Frontend</MenuItem>
          </Select>
        </FormControl>
        <FormControl size='small' sx={{ minWidth: 160 }}>
          <InputLabel>Familia HTTP</InputLabel>
          <Select
            label='Familia HTTP'
            value={statusFamily}
            onChange={e => onStatusFamilyChange(e.target.value)}
          >
            <MenuItem value=''>Todas</MenuItem>
            <MenuItem value='4xx'>4xx (Cliente)</MenuItem>
            <MenuItem value='5xx'>5xx / Excepción</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading && <LinearProgress />}

      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Fecha y hora</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Endpoint / Ruta</TableCell>
              <TableCell>IP / ISP</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Mensaje</TableCell>
              <TableCell align='right'>Detalle</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {errors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align='center' sx={{ py: 6 }}>
                  <Typography variant='body2' color='text.secondary'>
                    No hay errores registrados con los filtros actuales.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              errors.map(row => {
                const isServer = row.statusCode >= 500 || row.statusCode === 0

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant='caption'>
                        {new Date(row.createdAt).toLocaleString('es-AR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        variant='outlined'
                        color={row.source === 'BACKEND' ? 'primary' : 'secondary'}
                        label={row.source}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        color={isServer ? 'error' : 'warning'}
                        label={row.statusCode === 0 ? 'NET/UI' : row.statusCode}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant='caption'
                        fontFamily='monospace'
                        display='block'
                        sx={{ maxWidth: 260 }}
                        noWrap
                      >
                        {row.method ? `${row.method} ` : ''}
                        {row.path}
                      </Typography>
                      {row.frontendRoute && (
                        <Typography variant='caption' color='text.secondary'>
                          Vista: {row.frontendRoute}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption' fontFamily='monospace' display='block'>
                        {row.ipAddress || '-'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {[row.countryCode, row.ispOwner].filter(Boolean).join(' · ') || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption'>
                        {row.username || (row.userId ? `Usuario #${row.userId}` : 'Anónimo')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        noWrap
                        sx={{ maxWidth: 260, display: 'block' }}
                      >
                        {row.message}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='Ver traza y payload completo'>
                        <IconButton size='small' onClick={() => setSelectedError(row)}>
                          <Icon icon='tabler:eye' fontSize={18} />
                        </IconButton>
                      </Tooltip>
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

      <Dialog
        open={Boolean(selectedError)}
        onClose={() => setSelectedError(null)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Detalle del Error ({selectedError?.source} ·{' '}
          {selectedError?.statusCode === 0 ? 'NET/UI' : selectedError?.statusCode})
        </DialogTitle>
        <DialogContent dividers>
          {selectedError && (
            <Stack spacing={2}>
              <Typography variant='body2'>
                <strong>Endpoint / Ruta:</strong>{' '}
                <code>
                  {selectedError.method} {selectedError.path}
                </code>
              </Typography>
              {selectedError.frontendRoute && (
                <Typography variant='body2'>
                  <strong>Ruta Frontend:</strong> <code>{selectedError.frontendRoute}</code>
                </Typography>
              )}
              <Typography variant='body2'>
                <strong>Origen IP:</strong>{' '}
                <code>{selectedError.ipAddress || '-'}</code> (
                {[selectedError.countryName, selectedError.ispOwner].filter(Boolean).join(' · ') ||
                  'Sin GeoIP'}
                )
              </Typography>
              <Typography variant='body2'>
                <strong>Mensaje:</strong> {selectedError.message}
              </Typography>
              {selectedError.sanitizedPayload && (
                <Box>
                  <Typography variant='subtitle2' gutterBottom>
                    Payload sanitizado
                  </Typography>
                  <Box
                    component='pre'
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      overflowX: 'auto',
                      fontSize: '0.78rem',
                    }}
                  >
                    {JSON.stringify(selectedError.sanitizedPayload, null, 2)}
                  </Box>
                </Box>
              )}
              {selectedError.stackTrace && (
                <Box>
                  <Typography variant='subtitle2' gutterBottom>
                    Stack Trace
                  </Typography>
                  <Box
                    component='pre'
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      overflowX: 'auto',
                      fontSize: '0.75rem',
                      maxHeight: 280,
                    }}
                  >
                    {selectedError.stackTrace}
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedError(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
