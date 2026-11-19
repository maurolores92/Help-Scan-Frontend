import React, { useMemo } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
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
  purchaseOrderNumber?: string
  onPurchaseOrderNumberChange?: (value: string) => void
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
  status?: string
  onStatusChange?: (value: string) => void
  source: string
  onSourceChange: (value: string) => void
  onResetFilters: () => void
  hasActiveFilters: boolean
  onToggleUpload: () => void
  showUpload: boolean
  onSyncFtp: () => Promise<void> | void
  isSyncing: boolean
}

const TYPE_ICONS: Record<string, string> = {
  factura: 'tabler:file-invoice',
  presupuesto: 'tabler:file-dollar',
  nota_pedido: 'tabler:clipboard-list',
  remito: 'tabler:truck-delivery',
  recibo: 'tabler:receipt',
  orden_compra: 'tabler:shopping-cart',
  orden_servicio: 'tabler:tool',
  contrato: 'tabler:file-certificate',
  legajo: 'tabler:users',
  documento_general: 'tabler:file-text'
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
  purchaseOrderNumber = '',
  onPurchaseOrderNumberChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  source,
  onSourceChange,
  onResetFilters,
  hasActiveFilters,
  onToggleUpload,
  showUpload,
  onSyncFtp,
  isSyncing
}) => {
  // Filtrar exclusivamente los tipos de documentos que realmente existen con conteo > 0
  const availableTypes = useMemo(() => {
    return (facets || []).filter(f => Boolean(f.value) && Number(f.count) > 0)
  }, [facets])

  // Total acumulado en las categorías existentes
  const totalCount = useMemo(() => {
    return availableTypes.reduce((sum, f) => sum + Number(f.count), 0)
  }, [availableTypes])

  return (
    <Box sx={{ p: 4, borderTop: 1, borderColor: 'divider' }}>
      {/* Botones de Categorías: Solo se muestran si existen tipos de documentos en la base de datos */}
      {availableTypes.length > 0 && (
        <Box sx={{ mb: 3.5 }}>
          <Typography
            variant='caption'
            sx={{
              display: 'block',
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              mb: 1.5
            }}
          >
            Tipos de Documentos:
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              size='small'
              variant={!documentType ? 'contained' : 'outlined'}
              color={!documentType ? 'primary' : 'secondary'}
              onClick={() => onDocumentTypeChange('')}
              startIcon={<Icon icon='tabler:layout-grid' fontSize={16} />}
            >
              Todos ({totalCount})
            </Button>

            {availableTypes.map(facet => {
              const isSelected = documentType?.toLowerCase() === facet.value.toLowerCase()
              const icon = TYPE_ICONS[facet.value.toLowerCase()] || 'tabler:file-text'

              return (
                <Button
                  key={facet.value}
                  size='small'
                  variant={isSelected ? 'contained' : 'outlined'}
                  color={isSelected ? 'primary' : 'secondary'}
                  onClick={() => onDocumentTypeChange(isSelected ? '' : facet.value)}
                  startIcon={<Icon icon={icon} fontSize={16} />}
                >
                  {formatDocumentTypeLabel(facet.value)} ({facet.count})
                </Button>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Buscador Universal + Sincronización + Botón Carga */}
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

      {/* Filtros secundarios: N° O.C./Referencia, Origen, Rango de Fechas */}
      <Grid container spacing={2} alignItems='center'>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size='small'
            label='N° O.C. / Referencia'
            placeholder='Ej: OC-4819, REM-203'
            value={purchaseOrderNumber}
            onChange={e => onPurchaseOrderNumberChange?.(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='tabler:clipboard-check' fontSize={16} />
                </InputAdornment>
              ),
              endAdornment: purchaseOrderNumber ? (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={() => onPurchaseOrderNumberChange?.('')}>
                    <Icon icon='tabler:x' fontSize={14} />
                  </IconButton>
                </InputAdornment>
              ) : undefined
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
            <MenuItem value='EMAIL'>Correo Electrónico</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={6} sm={3} md={2.5}>
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

        <Grid item xs={6} sm={3} md={2.5}>
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
          <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
