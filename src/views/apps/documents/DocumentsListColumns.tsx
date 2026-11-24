import React from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import { DocumentItem } from 'src/store/apps/documents'
import StatusChip from 'src/components/common/StatusChip'

const formatDocTypeUpper = (type?: string | null) => {
  if (!type) return null

  return type.replace(/_/g, ' ').trim().toUpperCase()
}

const resolveDocumentTypeIcon = (type?: string | null) => {
  const normalized = (type || '').toLowerCase().trim()
  if (normalized.startsWith('factura')) return 'tabler:file-invoice'
  if (normalized === 'presupuesto') return 'tabler:file-dollar'
  if (normalized === 'nota_pedido') return 'tabler:clipboard-list'
  if (normalized === 'remito') return 'tabler:truck-delivery'
  if (normalized === 'recibo') return 'tabler:receipt'
  if (normalized === 'orden_compra') return 'tabler:shopping-cart'
  if (normalized === 'orden_servicio') return 'tabler:tool'
  if (normalized === 'contrato') return 'tabler:file-certificate'
  if (normalized === 'legajo') return 'tabler:users'

  return 'tabler:file-type-pdf'
}

const formatAmount = (amount?: number | string | null, currency?: string | null) => {
  if (amount === null || amount === undefined || amount === '') return null
  const num = Number(amount)
  if (!Number.isFinite(num)) return null
  const prefix = currency || '$'

  return `${prefix} ${num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const PAYMENT_BADGE: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error' }> = {
  PENDING: { label: 'Pendiente pago', color: 'warning' },
  SCHEDULED: { label: 'Programado', color: 'info' },
  PAID: { label: 'Pagado', color: 'success' },
  NOT_APPLICABLE: { label: 'No aplica', color: 'default' }
}

export const buildDocumentsColumns = (handlers: {
  onPreview: (doc: DocumentItem) => void
  onValidate: (doc: DocumentItem) => void
  onDelete: (doc: DocumentItem) => void
  onEditPayment?: (doc: DocumentItem) => void
}): GridColDef[] => [
    {
      field: 'documentType',
      headerName: 'Tipo',
      flex: 0.14,
      minWidth: 140,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const label = formatDocTypeUpper(row.documentType)

        return label ? (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant='body2' noWrap sx={{ fontWeight: 700, letterSpacing: 0.3, color: 'text.primary' }}>
              {label}
            </Typography>
            {row.documentNumber && (
              <Typography variant='caption' noWrap sx={{ display: 'block', mt: 0.2, color: 'text.secondary' }}>
                N° {row.documentNumber}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant='caption' sx={{ color: 'text.disabled' }}>
            SIN CLASIFICAR
          </Typography>
        )
      }
    },
    {
      field: 'issuerName',
      headerName: 'Emisor / Responsable',
      flex: 0.17,
      minWidth: 170,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const issuer = row.issuerName || row.responsiblePerson || '—'
        const details: string[] = []
        if (row.responsiblePerson && row.issuerName && row.responsiblePerson !== row.issuerName) {
          details.push(`Resp: ${row.responsiblePerson}`)
        }
        if (row.issuerTaxId) {
          details.push(`CUIT: ${row.issuerTaxId}`)
        } else if (row.cae) {
          details.push(`CAE: ${row.cae}`)
        }
        const secondaryText = details.join(' · ')

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              variant='body2'
              noWrap
              sx={{ fontWeight: issuer !== '—' ? 600 : 400, color: issuer !== '—' ? 'text.primary' : 'text.disabled' }}
            >
              {issuer}
            </Typography>
            {secondaryText ? (
              <Tooltip title={secondaryText}>
                <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
                  {secondaryText}
                </Typography>
              </Tooltip>
            ) : (
              <Typography variant='caption' sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                Sin datos adicionales
              </Typography>
            )}
          </Box>
        )
      }
    },
    {
      field: 'recipientName',
      headerName: 'Cliente',
      flex: 0.18,
      minWidth: 175,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const clientName =
          row.recipientName ||
          (row.extractedData?.attributes?.cliente as string) ||
          (row.extractedData?.attributes?.razon_social as string) ||
          '—'

        const address =
          row.deliveryAddress ||
          (row.extractedData?.attributes?.domicilio as string) ||
          (row.extractedData?.attributes?.direccion as string) ||
          (row.extractedData?.attributes?.localidad as string) ||
          ''

        const taxId = row.recipientTaxId || (row.extractedData?.attributes?.cuit_cliente as string) || ''
        const subInfo = [address, taxId ? `CUIT: ${taxId}` : ''].filter(Boolean).join(' · ')

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              variant='body2'
              noWrap
              sx={{
                fontWeight: clientName !== '—' ? 600 : 400,
                color: clientName !== '—' ? 'text.primary' : 'text.disabled'
              }}
            >
              {clientName}
            </Typography>
            {subInfo ? (
              <Tooltip title={subInfo}>
                <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
                  {subInfo}
                </Typography>
              </Tooltip>
            ) : (
              <Typography variant='caption' sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                Sin dirección
              </Typography>
            )}
          </Box>
        )
      }
    },
    {
      field: 'documentDate',
      headerName: 'Fecha / Monto',
      flex: 0.12,
      minWidth: 125,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const formattedAmount = formatAmount(row.totalAmount, row.currency)
        const dateStr = row.documentDate
          ? row.documentDate
          : new Date(row.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant='body2' noWrap sx={{ fontWeight: formattedAmount ? 600 : 400 }}>
              {formattedAmount || dateStr}
            </Typography>
            {formattedAmount && (
              <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
                {dateStr}
              </Typography>
            )}
          </Box>
        )
      }
    },
    {
      field: 'paymentStatus',
      headerName: 'Pago',
      flex: 0.12,
      minWidth: 130,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const todayIso = new Date().toISOString().slice(0, 10)
        const payStatus = row.paymentStatus || 'PENDING'
        const isOverdue =
          Boolean(row.dueDate) &&
          row.dueDate! < todayIso &&
          (payStatus === 'PENDING' || payStatus === 'SCHEDULED')
        const payBadge = isOverdue
          ? { label: 'Vencido', color: 'error' as const }
          : PAYMENT_BADGE[payStatus] || PAYMENT_BADGE.PENDING
        const subDate =
          payStatus === 'PAID' && row.paidAt
            ? `Pagado: ${row.paidAt}`
            : row.dueDate && payStatus !== 'NOT_APPLICABLE'
              ? `Vto: ${row.dueDate}`
              : row.paymentReference || ''

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Tooltip title={row.paymentReference ? `Ref: ${row.paymentReference}` : 'Actualizar estado de pago'}>
              <Chip
                size='small'
                label={payBadge.label}
                color={payBadge.color}
                variant='outlined'
                onClick={handlers.onEditPayment ? () => handlers.onEditPayment?.(row) : undefined}
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  cursor: handlers.onEditPayment ? 'pointer' : 'default'
                }}
              />
            </Tooltip>
            {subDate && (
              <Typography variant='caption' noWrap sx={{ display: 'block', mt: 0.3, color: isOverdue ? 'error.main' : 'text.secondary' }}>
                {subDate}
              </Typography>
            )}
          </Box>
        )
      }
    },
    {
      field: 'originalName',
      headerName: 'PDF',
      width: 82,
      minWidth: 78,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: ({ row }: { row: DocumentItem }) => (
        <Tooltip title={`Previsualizar: ${row.originalName}`}>
          <IconButton
            size='small'
            onClick={() => handlers.onPreview(row)}
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.25,
              backgroundColor: 'error.light',
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'common.white'
              }
            }}
          >
            <Icon icon={resolveDocumentTypeIcon(row.documentType)} fontSize={19} />
          </IconButton>
        </Tooltip>
      )
    },
    {
      field: 'source',
      headerName: 'Origen',
      flex: 0.13,
      minWidth: 135,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const warnings = Array.isArray(row.validationWarnings) ? row.validationWarnings : []
        const hasDuplicate = warnings.some(w => w.code === 'DUPLICATE_FISCAL')
        const warningsTooltip = warnings.map(w => `• ${w.message}`).join('\n')

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, py: 0, justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'nowrap' }}>
              <StatusChip status={row.source} sx={{ height: 18, fontSize: '0.65rem' }} />
              {warnings.length > 0 && (
                <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{warningsTooltip}</span>}>
                  <Chip
                    size='small'
                    color={hasDuplicate ? 'error' : 'warning'}
                    label={hasDuplicate ? 'Duplicado' : `${warnings.length} alerta${warnings.length > 1 ? 's' : ''}`}
                    icon={<Icon icon='tabler:alert-triangle' fontSize={12} />}
                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                  />
                </Tooltip>
              )}
            </Box>
            {row.ftpDeviceName && (
              <Tooltip title={`Impresora / Escáner: ${row.ftpDeviceName}`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, maxWidth: 120 }}>
                  <Icon icon='tabler:printer' fontSize={13} />
                  <Typography variant='caption' color='text.secondary' noWrap sx={{ fontSize: '0.68rem' }}>
                    {row.ftpDeviceName}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        )
      }
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 0.11,
      minWidth: 130,
      sortable: false,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const isPendingApproval = row.status === 'PENDING_APPROVAL'

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <Tooltip title={isPendingApproval ? 'Revisar y Validar Datos (Split-View)' : 'Editar / Validar Datos'}>
              <IconButton
                size='small'
                color={isPendingApproval ? 'warning' : 'default'}
                onClick={() => handlers.onValidate(row)}
              >
                <Icon
                  icon={isPendingApproval ? 'tabler:clipboard-check' : 'tabler:edit'}
                  fontSize={19}
                />
              </IconButton>
            </Tooltip>
            {handlers.onEditPayment && (
              <Tooltip title='Estado de pago y vencimiento'>
                <IconButton
                  size='small'
                  color={row.paymentStatus === 'PAID' ? 'success' : 'secondary'}
                  onClick={() => handlers.onEditPayment?.(row)}
                >
                  <Icon icon='tabler:cash' fontSize={19} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title='Ver PDF y Ficha OCR'>
              <IconButton size='small' color='primary' onClick={() => handlers.onPreview(row)}>
                <Icon icon='tabler:eye' fontSize={19} />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar'>
              <IconButton size='small' color='error' onClick={() => handlers.onDelete(row)}>
                <Icon icon='tabler:trash' fontSize={19} />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    }
  ]
