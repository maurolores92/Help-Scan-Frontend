import React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import StatusChip from 'src/components/common/StatusChip'
import {
  ClientDocumentItem,
  ClientDocumentRole,
  ClientDocumentsSummary
} from 'src/types/apps/clientTypes'

const DOCUMENT_TYPE_TABS: Array<{ code: string; label: string; icon: string }> = [
  { code: 'all', label: 'Todos', icon: 'tabler:files' },
  { code: 'factura', label: 'Facturas', icon: 'tabler:file-invoice' },
  { code: 'nota_credito', label: 'Notas de Crédito', icon: 'tabler:file-minus' },
  { code: 'nota_debito', label: 'Notas de Débito', icon: 'tabler:file-plus' },
  { code: 'presupuesto', label: 'Presupuestos', icon: 'tabler:calculator' },
  { code: 'remito', label: 'Remitos', icon: 'tabler:truck-delivery' },
  { code: 'recibo', label: 'Recibos', icon: 'tabler:receipt' },
  { code: 'orden_pago', label: 'Órdenes de Pago', icon: 'tabler:cash-banknote' },
  { code: 'certificado_retencion', label: 'Retenciones', icon: 'tabler:certificate' },
  { code: 'ticket_fiscal', label: 'Tickets Fiscales', icon: 'tabler:ticket' },
  { code: 'transferencia_pago', label: 'Transferencias', icon: 'tabler:arrows-exchange' },
  { code: 'orden_compra', label: 'Órdenes de Compra', icon: 'tabler:shopping-cart' },
  { code: 'nota_pedido', label: 'Notas de Pedido', icon: 'tabler:clipboard-list' },
  { code: 'orden_servicio', label: 'Órdenes de Servicio', icon: 'tabler:tool' },
  { code: 'contrato', label: 'Contratos', icon: 'tabler:file-text' },
  { code: 'legajo', label: 'Legajos / RRHH', icon: 'tabler:id-badge-2' },
  { code: 'documento_general', label: 'Generales', icon: 'tabler:file' }
]

const ROLE_CONFIG: Record<ClientDocumentRole, { label: string; color: 'success' | 'info' | 'warning' | 'default' }> = {
  issuer: { label: 'Emitido por cliente', color: 'success' },
  recipient: { label: 'Cliente destinatario', color: 'info' },
  both: { label: 'Emisor y destinatario', color: 'warning' },
  linked: { label: 'Vinculado', color: 'default' }
}

interface ClientDetailDocumentsPanelProps {
  documents: ClientDocumentItem[]
  total: number
  summary: ClientDocumentsSummary | null
  loading: boolean
  activeType: string
  roleFilter: 'all' | 'issuer' | 'recipient' | 'linked'
  searchInput: string
  page: number
  pageSize: number
  onTypeChange: (nextType: string) => void
  onRoleChange: (nextRole: 'all' | 'issuer' | 'recipient' | 'linked') => void
  onSearchChange: (val: string) => void
  onPageChange: (nextPage: number, nextPageSize: number) => void
  onPreviewPdf: (doc: ClientDocumentItem) => void
  onOpenValidation: (doc: ClientDocumentItem) => void
  onOpenLinkDialog?: (doc: ClientDocumentItem) => void
}

export const ClientDetailDocumentsPanel: React.FC<ClientDetailDocumentsPanelProps> = ({
  documents,
  total,
  summary,
  loading,
  activeType,
  roleFilter,
  searchInput,
  page,
  pageSize,
  onTypeChange,
  onRoleChange,
  onSearchChange,
  onPageChange,
  onPreviewPdf,
  onOpenValidation,
  onOpenLinkDialog
}) => {
  const byType = summary?.byType || {}

  const columns: GridColDef[] = [
    {
      field: 'documentType',
      headerName: 'Comprobante',
      flex: 0.22,
      minWidth: 185,
      renderCell: ({ row }: { row: ClientDocumentItem }) => (
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant='body2' noWrap sx={{ fontWeight: 600 }}>
            {(row.normalizedDocumentType || row.documentType || 'DOCUMENTO').replace(/_/g, ' ').toUpperCase()}
            {row.documentLetter ? ` (${row.documentLetter})` : ''}
          </Typography>
          <Typography variant='caption' noWrap color='text.secondary' display='block'>
            {row.documentNumber ? `N° ${row.documentNumber}` : row.originalName}
          </Typography>
        </Box>
      )
    },
    {
      field: 'clientRole',
      headerName: 'Rol en el Documento',
      flex: 0.16,
      minWidth: 155,
      renderCell: ({ row }: { row: ClientDocumentItem }) => {
        const cfg = ROLE_CONFIG[row.clientRole] || ROLE_CONFIG.linked

        return <Chip size='small' color={cfg.color} variant='outlined' label={cfg.label} sx={{ fontWeight: 600 }} />
      }
    },
    {
      field: 'counterparty',
      headerName: 'Emisor ↔ Destinatario',
      flex: 0.24,
      minWidth: 210,
      renderCell: ({ row }: { row: ClientDocumentItem }) => (
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant='body2' noWrap>
            De: {row.issuerName || '—'}
          </Typography>
          <Typography variant='caption' noWrap color='text.secondary' display='block'>
            Para: {row.recipientName || '—'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'documentDate',
      headerName: 'Fecha',
      width: 110,
      renderCell: ({ row }: { row: ClientDocumentItem }) => (
        <Typography variant='body2'>{row.documentDate || row.createdAt.slice(0, 10)}</Typography>
      )
    },
    {
      field: 'totalAmount',
      headerName: 'Importe / Saldo',
      width: 150,
      renderCell: ({ row }: { row: ClientDocumentItem }) => {
        if (row.totalAmount === null || row.totalAmount === undefined) {
          return <Typography variant='body2' color='text.disabled'>—</Typography>
        }

        const bal = row.balanceSummary
        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant='body2' sx={{ fontWeight: 600 }}>
              {row.currency || '$'} {Number(row.totalAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
            {bal?.isTrackable && bal.paidAmount > 0 && bal.remainingBalance > 0 && (
              <Typography variant='caption' color='info.main' display='block' noWrap sx={{ fontWeight: 600 }}>
                Saldo: {row.currency || '$'} {bal.remainingBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            )}
          </Box>
        )
      }
    },
    {
      field: 'status',
      headerName: 'Estado / Pago',
      width: 155,
      renderCell: ({ row }: { row: ClientDocumentItem }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, alignItems: 'flex-start' }}>
          <StatusChip status={row.status} />
          {row.paymentStatus === 'PARTIALLY_PAID' && <StatusChip status='PARTIALLY_PAID' sx={{ height: 18, fontSize: '0.65rem' }} />}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 130,
      sortable: false,
      renderCell: ({ row }: { row: ClientDocumentItem }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <Tooltip title='Ver PDF'>
            <IconButton size='small' color='secondary' onClick={() => onPreviewPdf(row)}>
              <Icon icon='tabler:file-type-pdf' fontSize={19} />
            </IconButton>
          </Tooltip>
          <Tooltip title='Abrir formulario y validar'>
            <IconButton size='small' color='primary' onClick={() => onOpenValidation(row)}>
              <Icon icon='tabler:forms' fontSize={19} />
            </IconButton>
          </Tooltip>
          {onOpenLinkDialog && (
            <Tooltip title={row.linkedCount ? `Vincular comprobantes (${row.linkedCount})` : 'Vincular comprobantes'}>
              <IconButton
                size='small'
                color={row.linkedCount ? 'info' : 'default'}
                onClick={() => onOpenLinkDialog(row)}
              >
                <Icon icon='tabler:link-plus' fontSize={19} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ]

  return (
    <Card>
      <CardHeader
        title='Comprobantes y Documentos del Cliente'
        subheader='Visualización segmentada por tipo de documento y rol (emitidos por el cliente o dirigidos al cliente)'
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs
          value={activeType}
          onChange={(_e, val) => onTypeChange(val)}
          variant='scrollable'
          scrollButtons='auto'
        >
          {DOCUMENT_TYPE_TABS.map(tab => {
            const count = tab.code === 'all' ? summary?.total ?? 0 : byType[tab.code] ?? 0
            if (tab.code !== 'all' && count === 0 && activeType !== tab.code) {
              return null
            }

            return (
              <Tab
                key={tab.code}
                value={tab.code}
                icon={<Icon icon={tab.icon} fontSize={17} />}
                iconPosition='start'
                label={`${tab.label} (${count})`}
                sx={{ minHeight: 46, textTransform: 'none', fontWeight: 600 }}
              />
            )
          })}
        </Tabs>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          size='small'
          sx={{ flex: 1, minWidth: 240 }}
          placeholder='Buscar por N° comprobante, emisor, receptor, orden de compra o archivo...'
          value={searchInput}
          onChange={e => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Icon icon='tabler:search' fontSize={18} />
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={() => onSearchChange('')}>
                  <Icon icon='tabler:x' fontSize={16} />
                </IconButton>
              </InputAdornment>
            ) : undefined
          }}
        />

        <TextField
          select
          size='small'
          sx={{ minWidth: 230 }}
          label='Rol del Cliente'
          value={roleFilter}
          onChange={e => onRoleChange(e.target.value as any)}
        >
          <MenuItem value='all'>Todos ({summary?.byRole?.all ?? 0})</MenuItem>
          <MenuItem value='recipient'>Cliente / Destinatario ({summary?.byRole?.recipient ?? 0})</MenuItem>
          <MenuItem value='issuer'>Emitidos por el Cliente ({summary?.byRole?.issuer ?? 0})</MenuItem>
          <MenuItem value='linked'>Vínculo directo ({summary?.byRole?.linked ?? 0})</MenuItem>
        </TextField>
      </Box>

      <DataGrid
        autoHeight
        rowHeight={56}
        columnHeaderHeight={44}
        rows={documents}
        rowCount={total}
        columns={columns}
        loading={loading}
        paginationMode='server'
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={model => onPageChange(model.page, model.pageSize)}
        pageSizeOptions={[10, 15, 25, 50]}
        disableRowSelectionOnClick
      />
    </Card>
  )
}

export default ClientDetailDocumentsPanel
