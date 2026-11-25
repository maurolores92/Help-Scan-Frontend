import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Icon from 'src/@core/components/icon'
import { DocumentItem } from 'src/store/apps/documents'

interface DocumentExtractedDataPanelProps {
  document: DocumentItem
  onReprocess?: (doc: DocumentItem) => void
  reprocessing?: boolean
}

const ENGINE_LABELS: Record<string, string> = {
  gemini_vision: 'Motor OCR Visual',
  gemini_text: 'Motor OCR Nativo',
  local_parser: 'Motor OCR Local'
}

const formatKeyLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()

const formatExtractedAttrValue = (val: any): string => {
  if (typeof val === 'boolean') return val ? 'Sí' : 'No'
  if (Array.isArray(val)) {
    return val
      .map(item => {
        if (item && typeof item === 'object') {
          const title = [
            item.voucherType || item.tipo_comprobante || item.tipo || '',
            item.voucherNumber || item.numero_comprobante || item.numero || item.comprobante || ''
          ]
            .filter(Boolean)
            .join(' ')
          const amt = item.appliedAmount ?? item.importe_imputado ?? item.importe ?? item.montoAplicado
          if (title || amt !== undefined) {
            return `${title || 'Comprobante'}${amt !== undefined && amt !== null ? ` ($${amt})` : ''}`
          }
          return Object.entries(item)
            .filter(([, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `${k}: ${v}`)
            .join(' · ')
        }
        return String(item ?? '').trim()
      })
      .filter(Boolean)
      .join(' | ')
  }
  if (val && typeof val === 'object') {
    return Object.entries(val)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ')
  }
  return String(val)
}

const MetadataFieldCard: React.FC<{ label: string; value?: string | number | null }> = ({
  label,
  value
}) => {
  if (value === null || value === undefined || value === '') return null

  return (
    <Grid item xs={12} sm={6} md={4}>
      <Box sx={{ p: 2.5, borderRadius: 1.5, border: 1, borderColor: 'divider', height: '100%' }}>
        <Typography variant='caption' sx={{ color: 'text.disabled', fontWeight: 600 }}>
          {label.toUpperCase()}
        </Typography>
        <Typography variant='body2' sx={{ mt: 0.5, fontWeight: 600, wordBreak: 'break-word' }}>
          {String(value)}
        </Typography>
      </Box>
    </Grid>
  )
}

export const DocumentExtractedDataPanel: React.FC<DocumentExtractedDataPanelProps> = ({
  document: doc,
  onReprocess,
  reprocessing = false
}) => {
  if (doc.status === 'PENDING' || doc.status === 'PROCESSING') {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Icon icon='tabler:sparkles' fontSize={48} />
        <Typography variant='h6' sx={{ mt: 2 }}>
          Extracción Inteligente en Curso
        </Typography>
        <Typography variant='body2' sx={{ color: 'text.secondary', mt: 1, maxWidth: 460, mx: 'auto' }}>
          El documento está siendo analizado automáticamente. En unos instantes verás todos sus metadatos,
          entidades, ítems y texto indexado.
        </Typography>
      </Box>
    )
  }

  const attributes = doc.extractedData?.attributes || {}
  const attributeEntries = Object.entries(attributes).filter(
    ([, val]) => val !== null && val !== undefined && val !== ''
  )
  const items = Array.isArray(doc.extractedData?.items) ? doc.extractedData!.items! : []
  const hasCodigo = items.some(item => Boolean(item.codigo || (item as any).code))
  const hasCantidad = items.some(
    item =>
      (item.cantidad !== null && item.cantidad !== undefined) ||
      ((item as any).quantity !== null && (item as any).quantity !== undefined)
  )
  const hasPrecioSinIva = items.some(
    item =>
      (item.precioSinIva !== null && item.precioSinIva !== undefined) ||
      ((item as any).unitPrice !== null && (item as any).unitPrice !== undefined)
  )
  const hasIva = items.some(
    item => (item as any).ivaPorcentaje !== null && (item as any).ivaPorcentaje !== undefined
  )
  const hasPrecioFinal = items.some(
    item =>
      (item.precioFinal !== null && item.precioFinal !== undefined) ||
      ((item as any).subtotal !== null && (item as any).subtotal !== undefined) ||
      ((item as any).total !== null && (item as any).total !== undefined)
  )
  const involvedParties = Array.isArray(doc.extractedData?.involvedParties)
    ? doc.extractedData!.involvedParties!
    : []
  const tags = Array.isArray(doc.tags) ? doc.tags : []

  const formattedTotal =
    doc.totalAmount !== null && doc.totalAmount !== undefined && doc.totalAmount !== ''
      ? `${doc.currency || '$'} ${Number(doc.totalAmount).toLocaleString('es-AR', {
          minimumFractionDigits: 2
        })}`
      : null

  const formatItemPrice = (val: any) => {
    if (val === null || val === undefined || val === '') return '—'
    const num = Number(val)
    if (!Number.isFinite(num)) return String(val)

    return `${doc.currency || '$'} ${num.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {doc.errorMessage && (
        <Alert severity='error' sx={{ mb: 1 }}>
          {doc.errorMessage}
        </Alert>
      )}

      <Box
        sx={{
          p: 3,
          borderRadius: 1.5,
          backgroundColor: 'action.hover',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2
        }}
      >
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
            {doc.documentType && (
              <Chip
                label={formatKeyLabel(doc.documentType)}
                color='primary'
                size='small'
                sx={{ fontWeight: 600 }}
              />
            )}
            {doc.extractionEngine && (
              <Chip
                label={ENGINE_LABELS[doc.extractionEngine] || doc.extractionEngine}
                variant='outlined'
                size='small'
              />
            )}
            {typeof doc.aiConfidence === 'number' && (
              <Chip
                label={`Confianza ${Math.round(doc.aiConfidence * 100)}%`}
                color={doc.aiConfidence >= 0.8 ? 'success' : 'warning'}
                variant='outlined'
                size='small'
              />
            )}
            {doc.pageCount ? (
              <Chip label={`${doc.pageCount} pág.`} variant='outlined' size='small' />
            ) : null}
          </Box>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {doc.summary || 'Documento procesado sin resumen descriptivo.'}
          </Typography>
        </Box>

        {onReprocess && (
          <Button
            size='small'
            variant='outlined'
            disabled={reprocessing}
            startIcon={<Icon icon='tabler:refresh' />}
            onClick={() => onReprocess(doc)}
          >
            {reprocessing ? 'Reprocesando...' : 'Reprocesar OCR'}
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        <MetadataFieldCard label='N° / Código Documento' value={doc.documentNumber} />
        <MetadataFieldCard label='Letra / Clase' value={doc.documentLetter} />
        <MetadataFieldCard label='Punto de Venta' value={doc.pointOfSale} />
        <MetadataFieldCard label='Fecha Documento' value={doc.documentDate} />
        <MetadataFieldCard label='Monto Total' value={formattedTotal} />
        <MetadataFieldCard label='Emisor / Proveedor' value={doc.issuerName} />
        <MetadataFieldCard label='CUIT / ID Fiscal Emisor' value={doc.issuerTaxId} />
        <MetadataFieldCard label='Destinatario / Cliente' value={doc.recipientName} />
        <MetadataFieldCard label='CUIT Cliente' value={doc.recipientTaxId} />
        <MetadataFieldCard label='N° Orden de Compra (O.C.)' value={doc.purchaseOrderNumber} />
        <MetadataFieldCard label='CAE (AFIP/ARCA)' value={doc.cae} />
        <MetadataFieldCard label='Vto. CAE' value={doc.caeDueDate} />
        <MetadataFieldCard label='Sector / Centro de Costos' value={doc.department} />
        <MetadataFieldCard label='Transporte / Logística' value={doc.carrierName} />
        <MetadataFieldCard label='Período' value={doc.period} />
        <MetadataFieldCard label='Sucursal / Planta' value={doc.branch} />
        <MetadataFieldCard label='Persona Responsable / Firmante' value={doc.responsiblePerson} />
      </Grid>

      {attributeEntries.length > 0 && (
        <Box>
          <Typography variant='subtitle2' sx={{ mb: 1.5, fontWeight: 600 }}>
            Atributos Específicos Detectados
          </Typography>
          <Grid container spacing={2}>
            {attributeEntries.map(([key, val]) => (
              <MetadataFieldCard
                key={key}
                label={formatKeyLabel(key)}
                value={formatExtractedAttrValue(val)}
              />
            ))}
          </Grid>
        </Box>
      )}

      {items.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon='tabler:list-details' fontSize={18} />
              Artículos & Ítems del Comprobante ({items.length})
            </Typography>
          </Box>
          <TableContainer component={Paper} variant='outlined'>
            <Table size='small'>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  {hasCodigo && <TableCell sx={{ fontWeight: 700, width: 120 }}>Código</TableCell>}
                  <TableCell sx={{ fontWeight: 700 }}>Nombre del Artículo / Descripción</TableCell>
                  {hasCantidad && (
                    <TableCell align='center' sx={{ fontWeight: 700, width: 100 }}>
                      Cantidad
                    </TableCell>
                  )}
                  {hasPrecioSinIva && (
                    <TableCell align='right' sx={{ fontWeight: 700, width: 130 }}>
                      Precio sin IVA
                    </TableCell>
                  )}
                  {hasIva && (
                    <TableCell align='center' sx={{ fontWeight: 700, width: 85 }}>
                      % IVA
                    </TableCell>
                  )}
                  {hasPrecioFinal && (
                    <TableCell align='right' sx={{ fontWeight: 700, width: 140 }}>
                      Precio Final
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => {
                  const code = item.codigo || (item as any).code
                  const name = item.nombre || (item as any).descripcion || (item as any).description
                  const qty =
                    item.cantidad !== null && item.cantidad !== undefined
                      ? item.cantidad
                      : (item as any).quantity
                  const pSinIva =
                    item.precioSinIva !== null && item.precioSinIva !== undefined
                      ? item.precioSinIva
                      : (item as any).unitPrice
                  const iva = (item as any).ivaPorcentaje
                  const pFinal =
                    item.precioFinal !== null && item.precioFinal !== undefined
                      ? item.precioFinal
                      : (item as any).subtotal || (item as any).total

                  return (
                    <TableRow key={idx} hover>
                      {hasCodigo && (
                        <TableCell>
                          {code ? (
                            <Chip
                              label={code}
                              size='small'
                              variant='outlined'
                              sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          ) : (
                            <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                              —
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                          {name || '—'}
                        </Typography>
                      </TableCell>
                      {hasCantidad && (
                        <TableCell align='center'>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {qty !== null && qty !== undefined ? qty : '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {hasPrecioSinIva && (
                        <TableCell align='right'>
                          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                            {formatItemPrice(pSinIva)}
                          </Typography>
                        </TableCell>
                      )}
                      {hasIva && (
                        <TableCell align='center'>
                          <Typography variant='body2'>
                            {iva !== null && iva !== undefined ? `${iva}%` : '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {hasPrecioFinal && (
                        <TableCell align='right'>
                          <Typography
                            variant='body2'
                            sx={{ fontWeight: 700, color: pFinal !== null ? 'primary.main' : 'inherit' }}
                          >
                            {formatItemPrice(pFinal)}
                          </Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {(involvedParties.length > 0 || tags.length > 0) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {involvedParties.map((party, idx) => (
            <Chip
              key={`party-${idx}`}
              size='small'
              icon={<Icon icon='tabler:user' fontSize={14} />}
              label={`${formatKeyLabel(party.role)}: ${party.name}${party.identifier ? ` (${party.identifier})` : ''}`}
              variant='outlined'
            />
          ))}
          {tags.map(tag => (
            <Chip key={tag} size='small' label={`#${tag}`} color='secondary' variant='outlined' />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default DocumentExtractedDataPanel

