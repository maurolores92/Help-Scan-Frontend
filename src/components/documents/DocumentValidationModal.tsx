import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import apiConnector from 'src/services/api.service'
import StatusChip from 'src/components/common/StatusChip'
import EmailViewerDialog from 'src/views/apps/emails/EmailViewerDialog'
import { AppDispatch, RootState } from 'src/store'
import {
  DocumentArticleItem,
  DocumentItem,
  DocumentTypeFormDefinition,
  fetchDocumentForms,
  ValidateDocumentPayload
} from 'src/store/apps/documents'
import DynamicDocumentForm from './DynamicDocumentForm'

interface DocumentValidationModalProps {
  open: boolean
  document: DocumentItem | null
  onClose: () => void
  onValidate: (payload: ValidateDocumentPayload) => Promise<void>
  onReject: (id: number, reason: string) => Promise<void>
  isValidating?: boolean
  onReprocess?: (doc: DocumentItem) => Promise<void>
  reprocessing?: boolean
}

const resolveSchemaByRawType = (
  schemas: DocumentTypeFormDefinition[],
  rawType?: string | null
): DocumentTypeFormDefinition | null => {
  if (!schemas.length) return null
  const norm = String(rawType || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  if (norm) {
    const exact = schemas.find(s => s.code.toLowerCase() === norm)
    if (exact) return exact
    const byAlias = schemas.find(
      s => Array.isArray(s.matchAliases) && s.matchAliases.some(a => a.toLowerCase() === norm)
    )
    if (byAlias) return byAlias
    if (norm.includes('factura') || norm.includes('nota_cred') || norm.includes('nota_deb')) {
      return schemas.find(s => s.code === 'factura') || schemas[0]
    }
    if (norm.includes('remito')) return schemas.find(s => s.code === 'remito') || schemas[0]
    if (norm.includes('presupuesto') || norm.includes('cotiz')) {
      return schemas.find(s => s.code === 'presupuesto') || schemas[0]
    }
    if (norm.includes('servicio')) return schemas.find(s => s.code === 'orden_servicio') || schemas[0]
  }

  return schemas.find(s => s.code === 'documento_general') || schemas[0]
}

const hydrateCustomValues = (
  schema: DocumentTypeFormDefinition | null,
  doc: DocumentItem,
  prevCustom: Record<string, any>
): Record<string, any> => {
  const attrs =
    doc.extractedData?.attributes && typeof doc.extractedData.attributes === 'object'
      ? doc.extractedData.attributes
      : {}
  const stored =
    doc.formRecord?.formData && typeof doc.formRecord.formData === 'object'
      ? doc.formRecord.formData
      : {}

  const merged: Record<string, any> = { ...stored, ...prevCustom }
  if (!schema) return merged

  for (const section of schema.sectionsSchema || []) {
    for (const field of section.fields || []) {
      if (field.target !== 'custom') continue
      if (merged[field.key] !== undefined && merged[field.key] !== '') continue

      const candidateKeys = [field.key, ...(field.aiAttrKeys || [])]
      let hit: any = undefined
      for (const k of candidateKeys) {
        if (attrs[k] !== undefined && attrs[k] !== null && String(attrs[k]).trim() !== '') {
          hit = attrs[k]
          break
        }
      }
      if (hit !== undefined) {
        merged[field.key] = hit
      } else if (field.defaultValue !== undefined && merged[field.key] === undefined) {
        merged[field.key] = field.defaultValue
      }
    }
  }

  return merged
}

export const DocumentValidationModal: React.FC<DocumentValidationModalProps> = ({
  open,
  document: doc,
  onClose,
  onValidate,
  onReject,
  isValidating = false,
  onReprocess,
  reprocessing = false
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { formSchemas, loadingForms } = useSelector((state: RootState) => state.documents)

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false)
  const [rejecting, setRejecting] = useState<boolean>(false)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [originEmailOpen, setOriginEmailOpen] = useState<boolean>(false)

  const [documentType, setDocumentType] = useState<string>('factura')
  const [coreValues, setCoreValues] = useState<Record<string, any>>({})
  const [customValues, setCustomValues] = useState<Record<string, any>>({})
  const [items, setItems] = useState<DocumentArticleItem[]>([])

  useEffect(() => {
    if (open && formSchemas.length === 0 && !loadingForms) {
      dispatch(fetchDocumentForms())
    }
  }, [open, formSchemas.length, loadingForms, dispatch])

  useEffect(() => {
    if (!doc) return

    const matchedSchema = resolveSchemaByRawType(
      formSchemas,
      doc.formRecord?.documentType || doc.documentType
    )
    const nextDocType = matchedSchema?.code || doc.documentType || 'documento_general'
    setDocumentType(nextDocType)

    const rawResp = doc.responsiblePerson || ''
    const isCity = /^(mar del plata|buenos aires|cordoba|rosario|caba)$/i.test(rawResp.trim())
    const contactCandidate = (doc.extractedData?.attributes?.contacto ||
      doc.extractedData?.attributes?.solicitante ||
      '') as string

    setCoreValues({
      documentNumber: doc.documentNumber || '',
      documentDate: doc.documentDate || '',
      dueDate: doc.dueDate || '',
      cae: doc.cae || (doc.extractedData?.attributes?.cae as string) || '',
      issuerName: doc.issuerName || '',
      issuerTaxId: doc.issuerTaxId || '',
      recipientName: doc.recipientName || '',
      recipientTaxId: doc.recipientTaxId || '',
      recipientPhone: doc.recipientPhone || '',
      recipientEmail: doc.recipientEmail || '',
      deliveryAddress: doc.deliveryAddress || '',
      responsiblePerson: isCity && contactCandidate ? contactCandidate : isCity ? '' : rawResp,
      taxCondition: doc.taxCondition || '',
      currency: doc.currency || 'ARS',
      netAmount: doc.netAmount !== null && doc.netAmount !== undefined ? String(doc.netAmount) : '',
      taxAmount: doc.taxAmount !== null && doc.taxAmount !== undefined ? String(doc.taxAmount) : '',
      totalAmount: doc.totalAmount !== null && doc.totalAmount !== undefined ? String(doc.totalAmount) : '',
      paymentTerms: doc.paymentTerms || '',
      paymentMethod: doc.paymentMethod || '',
      documentLetter: doc.documentLetter || '',
      pointOfSale: doc.pointOfSale || '',
      caeDueDate: doc.caeDueDate || '',
      purchaseOrderNumber: doc.purchaseOrderNumber || '',
      exemptAmount: doc.exemptAmount !== null && doc.exemptAmount !== undefined ? String(doc.exemptAmount) : '',
      otherTaxesAmount:
        doc.otherTaxesAmount !== null && doc.otherTaxesAmount !== undefined ? String(doc.otherTaxesAmount) : '',
      carrierName: doc.carrierName || '',
      department: doc.department || '',
      branch: doc.branch || '',
      period: doc.period || '',
      referenceNumber: doc.referenceNumber || '',
      summary: doc.summary || '',
      validationNotes: doc.validationNotes || ''
    })

    setCustomValues(hydrateCustomValues(matchedSchema, doc, {}))
    setRejecting(false)
    setRejectReason('')

    const docItems = doc.items && Array.isArray(doc.items) && doc.items.length > 0 ? doc.items : null
    const extractedDocItems =
      doc.extractedData && Array.isArray(doc.extractedData.items) && doc.extractedData.items.length > 0
        ? doc.extractedData.items
        : null
    const rawItems = docItems || extractedDocItems || []

    setItems(
      Array.isArray(rawItems)
        ? (rawItems as DocumentArticleItem[]).map((it, idx) => ({
            id: it.id || `item-${idx}`,
            codigo: it.codigo || (it as any).code || '',
            nombre: it.nombre || (it as any).descripcion || (it as any).description || '',
            cantidad:
              it.cantidad !== null && it.cantidad !== undefined ? it.cantidad : ((it as any).quantity ?? 1),
            precioSinIva:
              it.precioSinIva !== null && it.precioSinIva !== undefined
                ? it.precioSinIva
                : ((it as any).unitPrice ?? null),
            precioFinal:
              it.precioFinal !== null && it.precioFinal !== undefined
                ? it.precioFinal
                : ((it as any).subtotal ?? null),
            ivaPorcentaje: (it as any).ivaPorcentaje ?? null
          }))
        : []
    )
  }, [doc, formSchemas])

  useEffect(() => {
    let currentUrl: string | null = null

    if (open && doc?.id) {
      setLoadingPdf(true)
      apiConnector
        .getFileBlob(`/documents/${doc.id}/file`)
        .then((blob: Blob) => {
          currentUrl = URL.createObjectURL(blob)
          setBlobUrl(currentUrl)
        })
        .catch(() => {
          toast.error('No se pudo cargar la vista previa del PDF')
        })
        .finally(() => {
          setLoadingPdf(false)
        })
    }

    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      setBlobUrl(null)
    }
  }, [open, doc?.id])

  const activeSchema = useMemo(
    () => resolveSchemaByRawType(formSchemas, documentType),
    [formSchemas, documentType]
  )

  if (!doc) return null

  const handleDocumentTypeSwitch = (nextType: string) => {
    setDocumentType(nextType)
    const targetSchema = resolveSchemaByRawType(formSchemas, nextType)
    setCustomValues(prev => hydrateCustomValues(targetSchema, doc, prev))
  }

  const handleCoreChange = (key: string, value: any) => {
    setCoreValues(prev => ({ ...prev, [key]: value }))
  }

  const handleCustomChange = (key: string, value: any) => {
    setCustomValues(prev => ({ ...prev, [key]: value }))
  }

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: `new-${Date.now()}`, codigo: '', nombre: '', cantidad: 1, precioSinIva: null, precioFinal: null }
    ])
  }

  const handleUpdateItem = (index: number, field: keyof DocumentArticleItem, value: any) => {
    setItems(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }

      return copy
    })
  }

  const handleDeleteItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const optStr = (v: any) => {
    const clean = String(v ?? '').trim()

    return clean || undefined
  }

  const optNum = (v: any) => {
    if (v === '' || v === null || v === undefined) return undefined
    const n = Number(v)

    return Number.isFinite(n) ? n : undefined
  }

  const handleConfirmValidation = async () => {
    const cleanItems = items
      .filter(it => it.nombre && it.nombre.trim().length > 0)
      .map(it => ({
        codigo: it.codigo ? it.codigo.trim() : null,
        nombre: it.nombre.trim(),
        cantidad: optNum(it.cantidad) ?? null,
        precioSinIva: optNum(it.precioSinIva) ?? null,
        precioFinal: optNum(it.precioFinal) ?? null,
        ivaPorcentaje: optNum(it.ivaPorcentaje) ?? null
      }))

    const payload: ValidateDocumentPayload = {
      id: doc.id,
      documentType,
      documentNumber: optStr(coreValues.documentNumber),
      documentDate: optStr(coreValues.documentDate),
      dueDate: optStr(coreValues.dueDate),
      cae: optStr(coreValues.cae),
      issuerName: optStr(coreValues.issuerName),
      issuerTaxId: optStr(coreValues.issuerTaxId),
      recipientName: optStr(coreValues.recipientName),
      recipientTaxId: optStr(coreValues.recipientTaxId),
      recipientPhone: optStr(coreValues.recipientPhone),
      recipientEmail: optStr(coreValues.recipientEmail),
      deliveryAddress: optStr(coreValues.deliveryAddress),
      responsiblePerson: optStr(coreValues.responsiblePerson),
      taxCondition: optStr(coreValues.taxCondition),
      currency: optStr(coreValues.currency) || 'ARS',
      netAmount: optNum(coreValues.netAmount),
      taxAmount: optNum(coreValues.taxAmount),
      totalAmount: optNum(coreValues.totalAmount),
      paymentTerms: optStr(coreValues.paymentTerms),
      paymentMethod: optStr(coreValues.paymentMethod),
      documentLetter: optStr(coreValues.documentLetter),
      pointOfSale: optStr(coreValues.pointOfSale),
      caeDueDate: optStr(coreValues.caeDueDate),
      purchaseOrderNumber: optStr(coreValues.purchaseOrderNumber),
      exemptAmount: optNum(coreValues.exemptAmount),
      otherTaxesAmount: optNum(coreValues.otherTaxesAmount),
      carrierName: optStr(coreValues.carrierName),
      department: optStr(coreValues.department),
      branch: optStr(coreValues.branch),
      period: optStr(coreValues.period),
      referenceNumber: optStr(coreValues.referenceNumber),
      summary: optStr(coreValues.summary),
      validationNotes: optStr(coreValues.validationNotes),
      items: cleanItems,
      formData: customValues,
      extractedData: {
        ...(doc.extractedData || {}),
        items: cleanItems
      }
    }

    await onValidate(payload)
    onClose()
  }

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Por favor ingresa el motivo del rechazo')

      return
    }
    await onReject(doc.id, rejectReason.trim())
    onClose()
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth='xl'
        PaperProps={{
          sx: { height: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 2 }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
            px: 4,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'background.default'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.5,
                backgroundColor: 'warning.light',
                color: 'warning.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon icon={activeSchema?.icon || 'tabler:clipboard-check'} fontSize={24} />
            </Box>
            <Box sx={{ overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Revisión y Validación #{doc.id}
                </Typography>
                <StatusChip status={doc.status} />
                <StatusChip status={doc.source} />
                {activeSchema && (
                  <Chip size='small' color='primary' variant='outlined' label={activeSchema.label} />
                )}
              </Box>
              <Typography variant='caption' color='text.secondary' noWrap>
                Archivo: {doc.originalName} · Formulario adaptado automáticamente al tipo de documento.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {doc.source === 'EMAIL' && doc.sourceEmailId && (
              <Button
                size='small'
                variant='outlined'
                color='info'
                startIcon={<Icon icon='tabler:mail-opened' />}
                onClick={() => setOriginEmailOpen(true)}
                sx={{ textTransform: 'none', height: 32 }}
              >
                Ver correo de origen
              </Button>
            )}
            {onReprocess && (
              <Button
                size='small'
                variant='outlined'
                color='primary'
                startIcon={<Icon icon={reprocessing ? 'tabler:loader-2' : 'tabler:refresh'} />}
                disabled={reprocessing || isValidating}
                onClick={() => onReprocess(doc)}
                sx={{ textTransform: 'none', height: 32 }}
              >
                {reprocessing ? 'Reprocesando OCR...' : 'Reprocesar OCR'}
              </Button>
            )}
            <IconButton size='small' onClick={onClose}>
              <Icon icon='tabler:x' />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex' }}>
          <Grid container sx={{ height: '100%' }}>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                height: '100%',
                borderRight: { md: 1 },
                borderColor: 'divider',
                backgroundColor: '#2b2b2b',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {loadingPdf ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <CircularProgress sx={{ color: '#fff' }} />
                </Box>
              ) : blobUrl ? (
                <Box
                  component='iframe'
                  src={`${blobUrl}#toolbar=1&navpanes=0`}
                  sx={{ width: '100%', height: '100%', border: 'none' }}
                  title='Vista previa PDF'
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <Typography sx={{ color: '#ccc' }}>No se pudo cargar la vista previa del PDF</Typography>
                </Box>
              )}
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
              sx={{ height: '100%', overflowY: 'auto', p: 3, backgroundColor: 'background.paper' }}
            >
              {rejecting ? (
                <Alert severity='error' sx={{ mb: 2.5 }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
                    Rechazar Documento
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    size='small'
                    placeholder='Motivo del rechazo para auditoría...'
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    sx={{ backgroundColor: '#fff', borderRadius: 1, mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                    <Button size='small' variant='outlined' color='secondary' onClick={() => setRejecting(false)}>
                      Cancelar
                    </Button>
                    <Button size='small' variant='contained' color='error' onClick={handleConfirmReject} disabled={isValidating}>
                      Confirmar Rechazo
                    </Button>
                  </Box>
                </Alert>
              ) : (
                <Alert severity='info' icon={<Icon icon='tabler:sparkles' />} sx={{ mb: 2 }}>
                  Formulario seleccionado automáticamente por OCR/IA según el tipo de documento. Si cambiás el tipo, los campos se adaptan al instante.
                </Alert>
              )}

              {Array.isArray(doc.validationWarnings) && doc.validationWarnings.length > 0 && (
                <Alert
                  severity={doc.validationWarnings.some(w => w.severity === 'error') ? 'error' : 'warning'}
                  icon={<Icon icon='tabler:alert-triangle' />}
                  sx={{ mb: 2 }}
                >
                  {doc.validationWarnings.map((w, idx) => (
                    <Typography key={`${w.code}-${idx}`} variant='body2'>
                      • {w.message}
                    </Typography>
                  ))}
                </Alert>
              )}

              {doc.client && (
                <Alert severity='success' icon={<Icon icon='tabler:user-check' />} sx={{ mb: 2 }}>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    Asociado al cliente: {doc.client.name} (
                    {doc.client.taxId ? `CUIT/CUIL: ${doc.client.taxId}` : 'CUIT/CUIL pendiente de completar'})
                  </Typography>
                </Alert>
              )}

              {/* Selector de Tipo de Documento / Plantilla */}
              <Box
                sx={{
                  p: 2,
                  mb: 2.5,
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: 'primary.light',
                  bgcolor: 'action.hover'
                }}
              >
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Tipo de Documento / Plantilla de Formulario'
                  value={activeSchema?.code || documentType}
                  onChange={e => handleDocumentTypeSwitch(e.target.value)}
                  disabled={loadingForms && formSchemas.length === 0}
                  helperText={activeSchema?.description || 'Podés cambiar el formulario si la clasificación difiere.'}
                >
                  {formSchemas.length === 0 && (
                    <MenuItem value={activeSchema?.code || documentType}>
                      {activeSchema?.code || documentType}
                    </MenuItem>
                  )}
                  {formSchemas.map(schema => (
                    <MenuItem key={schema.code} value={schema.code}>
                      {schema.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {loadingForms && !activeSchema ? (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={32} />
                </Box>
              ) : activeSchema ? (
                <DynamicDocumentForm
                  schema={activeSchema}
                  coreValues={coreValues}
                  customValues={customValues}
                  items={items}
                  onCoreChange={handleCoreChange}
                  onCustomChange={handleCustomChange}
                  onAddItem={handleAddItem}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                />
              ) : (
                <Alert severity='warning'>
                  No se pudieron cargar las plantillas de formularios. Reintentá en unos segundos.
                </Alert>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            py: 2,
            px: 4,
            borderTop: 1,
            borderColor: 'divider',
            justifyContent: 'space-between',
            backgroundColor: 'background.default'
          }}
        >
          <Button
            variant='outlined'
            color='error'
            startIcon={<Icon icon='tabler:circle-x' />}
            onClick={() => setRejecting(true)}
            disabled={isValidating || rejecting}
          >
            Rechazar
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button variant='outlined' color='secondary' onClick={onClose} disabled={isValidating}>
              Cancelar
            </Button>
            <Button
              variant='contained'
              color='success'
              startIcon={isValidating ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Icon icon='tabler:check' />}
              onClick={handleConfirmValidation}
              disabled={isValidating}
            >
              {isValidating ? 'Guardando...' : 'Validar y Confirmar'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <EmailViewerDialog
        open={originEmailOpen}
        emailId={doc?.sourceEmailId ?? null}
        onClose={() => setOriginEmailOpen(false)}
      />
    </>
  )
}

export default DocumentValidationModal
