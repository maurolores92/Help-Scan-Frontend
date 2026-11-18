import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import SyncFtpButton from 'src/components/documents/SyncFtpButton'
import { DocumentTypeFacet } from 'src/store/apps/documents'

interface DocumentFilterToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  documentType: string
  onDocumentTypeChange: (value: string) => void
  facets: DocumentTypeFacet[]
  equipmentId?: string
  onEquipmentIdChange?: (value: string) => void
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  source: string
  onSourceChange: (value: string) => void
  onResetFilters: () => void
  hasActiveFilters: boolean
  onToggleUpload: () => void
  showUpload: boolean
  onSyncFtp: () => Promise<void> | void
  isSyncing: boolean
}

const formatDocumentTypeLabel = (raw: string) =>
  raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())

export const DocumentFilterToolbar: React.FC<DocumentFilterToolbarProps> = ({
  search,
  onSearchChange,
  documentType,
  onDocumentTypeChange,
  facets,
  equipmentId = '',
  onEquipmentIdChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  status,
  onStatusChange,
  source,
  onSourceChange,
  onResetFilters,
  hasActiveFilters,
  onToggleUpload,
  showUpload,
  onSyncFtp,
  isSyncing
}) => {
  return (
    <Box sx={{ p: 4, borderTop: 1, borderColor: 'divider' }}>
      {/* Barra superior de pestañas rápidas de estado */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', mr: 1 }}>
          FILTRAR ESTADO:
        </Typography>
        <Chip
          label='Todos'
          clickable
          color={!status ? 'primary' : 'default'}
          variant={!status ? 'filled' : 'outlined'}
          size='small'
          onClick={() => onStatusChange('')}
        />
        <Chip
          icon={<Icon icon='tabler:clock-check' fontSize={16} />}
          label='Por Aprobar'
          clickable
          color={status === 'PENDING_APPROVAL' ? 'warning' : 'default'}
          variant={status === 'PENDING_APPROVAL' ? 'filled' : 'outlined'}
          size='small'
          onClick={() => onStatusChange(status === 'PENDING_APPROVAL' ? '' : 'PENDING_APPROVAL')}
          sx={{ fontWeight: 600 }}
        />
        <Chip
          icon={<Icon icon='tabler:check' fontSize={16} />}
          label='Validados'
          clickable
          color={status === 'VALIDATED' ? 'success' : 'default'}
          variant={status === 'VALIDATED' ? 'filled' : 'outlined'}
          size='small'
          onClick={() => onStatusChange(status === 'VALIDATED' ? '' : 'VALIDATED')}
        />
        <Chip
          icon={<Icon icon='tabler:circle-x' fontSize={16} />}
          label='Rechazados'
          clickable
          color={status === 'REJECTED' ? 'error' : 'default'}
          variant={status === 'REJECTED' ? 'filled' : 'outlined'}
          size='small'
          onClick={() => onStatusChange(status === 'REJECTED' ? '' : 'REJECTED')}
        />
        <Chip
          label='Procesado OCR'
          clickable
          color={status === 'PROCESSED' ? 'info' : 'default'}
          variant={status === 'PROCESSED' ? 'filled' : 'outlined'}
          size='small'
          onClick={() => onStatusChange(status === 'PROCESSED' ? '' : 'PROCESSED')}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
          mb: 3
        }}
      >
        <TextField
          size='small'
          placeholder='Buscar por cualquier dato, texto del PDF, emisor, cliente, CUIT, ID de equipo, N° o monto...'
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          sx={{ flex: 1, minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Icon icon='tabler:search' fontSize={18} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={() => onSearchChange('')}>
                  <Icon icon='tabler:x' fontSize={16} />
                </IconButton>
              </InputAdornment>
            ) : undefined
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <SyncFtpButton onSync={onSyncFtp} loading={isSyncing} />

          <Button
            variant={showUpload ? 'outlined' : 'contained'}
            color='primary'
            onClick={onToggleUpload}
            startIcon={<Icon icon={showUpload ? 'tabler:chevron-up' : 'tabler:upload'} />}
          >
            {showUpload ? 'Ocultar Carga' : 'Subir PDF'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} alignItems='center'>
        <Grid item xs={12} sm={6} md={2.5}>
          <TextField
            select
            fullWidth
            size='small'
            label='Tipo de Documento'
            value={documentType}
            onChange={e => onDocumentTypeChange(e.target.value)}
          >
            <MenuItem value=''>Todos los tipos</MenuItem>
            {facets.map(facet => (
              <MenuItem key={facet.value} value={facet.value}>
                {formatDocumentTypeLabel(facet.value)} ({facet.count})
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            size='small'
            label='ID de Equipo'
            placeholder='Ej: 7016, 1532'
            value={equipmentId}
            onChange={e => onEquipmentIdChange?.(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='tabler:printer' fontSize={16} />
                </InputAdornment>
              ),
              endAdornment: equipmentId ? (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={() => onEquipmentIdChange?.('')}>
                    <Icon icon='tabler:x' fontSize={14} />
                  </IconButton>
                </InputAdornment>
              ) : undefined
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            fullWidth
            size='small'
            label='Estado'
            value={status}
            onChange={e => onStatusChange(e.target.value)}
          >
            <MenuItem value=''>Todos los estados</MenuItem>
            <MenuItem value='PENDING_APPROVAL'>Por Aprobar</MenuItem>
            <MenuItem value='VALIDATED'>Validado</MenuItem>
            <MenuItem value='REJECTED'>Rechazado</MenuItem>
            <MenuItem value='PROCESSED'>Procesado OCR</MenuItem>
            <MenuItem value='PROCESSING'>Procesando IA</MenuItem>
            <MenuItem value='PENDING'>En Cola</MenuItem>
            <MenuItem value='ERROR'>Error</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={1.8}>
          <TextField
            select
            fullWidth
            size='small'
            label='Origen'
            value={source}
            onChange={e => onSourceChange(e.target.value)}
          >
            <MenuItem value=''>Todos los orígenes</MenuItem>
            <MenuItem value='APP_UPLOAD'>Subida Web</MenuItem>
            <MenuItem value='FTP'>SFTP / Bandeja</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={6} sm={3} md={1.6}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='Fecha Desde'
            value={dateFrom}
            onChange={e => onDateFromChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={6} sm={3} md={1.6}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='Fecha Hasta'
            value={dateTo}
            onChange={e => onDateToChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {hasActiveFilters && (
          <Grid item xs={12} md={0.5} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title='Limpiar todos los filtros'>
              <IconButton color='secondary' onClick={onResetFilters} size='small'>
                <Icon icon='tabler:filter-off' />
              </IconButton>
            </Tooltip>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default DocumentFilterToolbar
