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
  if (normalized.includes('nota_cred') || normalized === 'nc') return 'tabler:file-minus'
  if (normalized.includes('nota_deb') || normalized === 'nd') return 'tabler:file-plus'
  if (normalized.includes('orden_pago') || normalized === 'op') return 'tabler:cash-banknote'
  if (normalized.includes('retencion')) return 'tabler:certificate'
  if (normalized.includes('transferencia') || normalized.includes('deposito')) return 'tabler:arrows-exchange'
  if (normalized.includes('ticket') || normalized.includes('tique')) return 'tabler:ticket'
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

export const buildDocumentsColumns = (handlers: {
  onPreview: (doc: DocumentItem) => void
  onValidate: (doc: DocumentItem) => void
  onDelete: (doc: DocumentItem) => void
  onPaymentStatus?: (doc: DocumentItem) => void
}): GridColDef[] => [
    {
      field: 'documentDate',
      headerName: 'Fecha',
      flex: 0.1,
      minWidth: 110,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const dateStr = row.documentDate
          ? row.documentDate
          : new Date(row.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })

        return (
          <Typography variant='body2' noWrap sx={{ color: 'text.primary' }}>
            {dateStr}
          </Typography>
        )
      }
    },
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
            {row.paymentStatus === 'PARTIALLY_PAID' && (
              <Chip
                size='small'
                color='info'
                label='Pagado Parcial'
                sx={{ height: 17, mt: 0.25, fontSize: '0.62rem', fontWeight: 700 }}
              />
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
          row.client?.name ||
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

        const taxId =
          row.client?.taxId ||
          row.recipientTaxId ||
          (row.extractedData?.attributes?.cuit_cliente as string) ||
          ''
        const subInfo = [address, taxId ? `CUIT: ${taxId}` : ''].filter(Boolean).join(' · ')

        return (
          <Box sx={{ overflow: 'hidden', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
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
              {row.client && (
                <Tooltip
                  title={
                    row.client.taxId
                      ? `Vinculado al cliente #${row.client.id} (${row.client.taxId})`
                      : `Vinculado al cliente #${row.client.id} (CUIT/CUIL pendiente)`
                  }
                >
                  <Chip
                    label='Vinculado'
                    size='small'
                    color='primary'
                    variant='outlined'
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                  />
                </Tooltip>
              )}
            </Box>
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
      field: 'totalAmount',
      headerName: 'Importe / Saldo',
      flex: 0.13,
      minWidth: 145,
      renderCell: ({ row }: { row: DocumentItem }) => {
        if (row.totalAmount === null || row.totalAmount === undefined) {
          return <Typography variant='body2' color='text.disabled'>—</Typography>
        }
        const curr = row.currency || '$'
        const bal = row.balanceSummary
        const imp = row.imputationSummary

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant='body2' noWrap sx={{ fontWeight: 700 }}>
              {curr} {Number(row.totalAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
            {bal?.isTrackable && bal.paidAmount > 0 && bal.remainingBalance > 0 && (
              <Typography variant='caption' color='info.main' noWrap display='block' sx={{ fontWeight: 600 }}>
                Falta: {curr} {bal.remainingBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            )}
            {imp?.isPaymentSource && imp.unappliedAmount > 1 && (
              <Typography variant='caption' color='warning.main' noWrap display='block' sx={{ fontWeight: 600 }}>
                Sin imputar: {curr} {imp.unappliedAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
      field: 'paymentStatus',
      headerName: 'Pago / Vínculos',
      flex: 0.14,
      minWidth: 155,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const payStatus = row.balanceSummary?.isTrackable
          ? row.balanceSummary.derivedPaymentStatus
          : row.paymentStatus || 'PENDING'
        const linked = row.linkedCount ?? 0

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, alignItems: 'flex-start' }}>
            <Box
              onClick={() => handlers.onPaymentStatus?.(row)}
              sx={{ cursor: handlers.onPaymentStatus ? 'pointer' : 'default' }}
            >
              <StatusChip variantType='payment' status={payStatus} sx={{ height: 20, fontSize: '0.68rem' }} />
            </Box>
            <Chip
              size='small'
              variant='outlined'
              color={linked > 0 ? 'primary' : 'default'}
              icon={<Icon icon={linked > 0 ? 'tabler:link' : 'tabler:link-off'} fontSize={12} />}
              label={linked > 0 ? `${linked} vínculo${linked > 1 ? 's' : ''}` : 'Sin vincular'}
              onClick={() => handlers.onValidate(row)}
              sx={{ height: 18, fontSize: '0.62rem', cursor: 'pointer' }}
            />
          </Box>
        )
      }
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 0.1,
      minWidth: 115,
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
