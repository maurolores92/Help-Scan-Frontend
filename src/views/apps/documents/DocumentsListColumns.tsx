import React from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import { DocumentItem } from 'src/store/apps/documents'
import StatusChip from 'src/components/common/StatusChip'

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const formatDocType = (type?: string | null) => {
  if (!type) return null

  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
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

export const buildDocumentsColumns = (handlers: {
  onPreview: (doc: DocumentItem) => void
  onValidate: (doc: DocumentItem) => void
  onReprocess: (doc: DocumentItem) => void
  onDelete: (doc: DocumentItem) => void
  reprocessingId?: number | null
}): GridColDef[] => [
    {
      field: 'documentType',
      headerName: 'Tipo Detectado',
      flex: 0.14,
      minWidth: 145,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const label = formatDocType(row.documentType)

        return label ? (
          <Box sx={{ overflow: 'hidden' }}>
            <Chip label={label} size='small' color='primary' variant='outlined' sx={{ fontWeight: 600 }} />
            {row.documentNumber && (
              <Typography variant='caption' noWrap sx={{ display: 'block', mt: 0.3, color: 'text.secondary' }}>
                N° {row.documentNumber}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant='caption' sx={{ color: 'text.disabled' }}>
            Sin clasificar
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
      field: 'originalName',
      headerName: 'Documento PDF',
      flex: 0.2,
      minWidth: 250,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const hashValue = row.fileHash || row.sha256Hash

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', width: '100%' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'error.light',
                color: 'error.main'
              }}
            >
              <Icon icon='tabler:file-type-pdf' fontSize={21} />
            </Box>
            <Box sx={{ overflow: 'hidden', flex: 1 }}>
              <Typography
                variant='body2'
                noWrap
                sx={{
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                }}
                onClick={() => handlers.onPreview(row)}
              >
                {row.originalName}
              </Typography>
              <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
                {row.summary
                  ? row.summary
                  : `${formatBytes(row.fileSize)}${hashValue ? ` · ${hashValue.substring(0, 10)}...` : ''}`}
              </Typography>
            </Box>
          </Box>
        )
      }
    },
    {
      field: 'status',
      headerName: 'Estado / Origen',
      flex: 0.15,
      minWidth: 155,
      renderCell: ({ row }: { row: DocumentItem }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, py: 0.5, justifyContent: 'center' }}>
          <StatusChip status={row.status} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'nowrap' }}>
            <StatusChip status={row.source} sx={{ height: 20, fontSize: '0.68rem' }} />
            {row.ftpDeviceName && (
              <Tooltip title={`Impresora / Escáner: ${row.ftpDeviceName}`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, maxWidth: 90 }}>
                  <Icon icon='tabler:printer' fontSize={13} />
                  <Typography variant='caption' color='text.secondary' noWrap sx={{ fontSize: '0.68rem' }}>
                    {row.ftpDeviceName}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 0.11,
      minWidth: 125,
      sortable: false,
      renderCell: ({ row }: { row: DocumentItem }) => {
        const isReprocessing = handlers.reprocessingId === row.id || row.status === 'PROCESSING'
        const isPendingApproval = row.status === 'PENDING_APPROVAL'

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
            <Tooltip title='Reprocesar extracción OCR'>
              <span>
                <IconButton
                  size='small'
                  color='info'
                  disabled={isReprocessing}
                  onClick={() => handlers.onReprocess(row)}
                >
                  {isReprocessing ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Icon icon='tabler:refresh' fontSize={18} />
                  )}
                </IconButton>
              </span>
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
