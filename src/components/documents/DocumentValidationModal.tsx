import React, { useEffect, useState } from 'react'
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
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import apiConnector from 'src/services/api.service'
import StatusChip from 'src/components/common/StatusChip'
import EmailViewerDialog from 'src/views/apps/emails/EmailViewerDialog'
import { DocumentArticleItem, DocumentItem, ValidateDocumentPayload } from 'src/store/apps/documents'

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

const DOCUMENT_TYPES = [
  { value: 'factura', label: 'Factura' },
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'nota_pedido', label: 'Nota de Pedido' },
  { value: 'remito', label: 'Remito' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'orden_compra', label: 'Orden de Compra' },
  { value: 'orden_servicio', label: 'Orden de Servicio Técnico' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'legajo', label: 'Legajo / RRHH' },
  { value: 'documento_general', label: 'Documento General' }
]

const TAX_CONDITIONS = [
  'Responsable Inscripto',
  'Monotributo',
  'Exento',
  'Consumidor Final',
  'No Responsable'
]

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
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false)
  const [rejecting, setRejecting] = useState<boolean>(false)
  const [rejectReason, setRejectReason] = useState<string>('')

  // Form Fields
  const [documentType, setDocumentType] = useState<string>('')
  const [documentNumber, setDocumentNumber] = useState<string>('')
  const [documentDate, setDocumentDate] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [cae, setCae] = useState<string>('')
  const [issuerName, setIssuerName] = useState<string>('')
  const [issuerTaxId, setIssuerTaxId] = useState<string>('')
  const [recipientName, setRecipientName] = useState<string>('')
  const [recipientTaxId, setRecipientTaxId] = useState<string>('')
  const [recipientPhone, setRecipientPhone] = useState<string>('')
  const [recipientEmail, setRecipientEmail] = useState<string>('')
  const [deliveryAddress, setDeliveryAddress] = useState<string>('')
  const [responsiblePerson, setResponsiblePerson] = useState<string>('')
  const [taxCondition, setTaxCondition] = useState<string>('')
  const [currency, setCurrency] = useState<string>('ARS')
  const [netAmount, setNetAmount] = useState<string>('')
  const [taxAmount, setTaxAmount] = useState<string>('')
  const [totalAmount, setTotalAmount] = useState<string>('')
  const [paymentTerms, setPaymentTerms] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [documentLetter, setDocumentLetter] = useState<string>('')
  const [pointOfSale, setPointOfSale] = useState<string>('')
  const [caeDueDate, setCaeDueDate] = useState<string>('')
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState<string>('')
  const [exemptAmount, setExemptAmount] = useState<string>('')
  const [otherTaxesAmount, setOtherTaxesAmount] = useState<string>('')
  const [carrierName, setCarrierName] = useState<string>('')
  const [department, setDepartment] = useState<string>('')
  const [branch, setBranch] = useState<string>('')
  const [period, setPeriod] = useState<string>('')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [summary, setSummary] = useState<string>('')
  const [validationNotes, setValidationNotes] = useState<string>('')
  const [items, setItems] = useState<DocumentArticleItem[]>([])
  const [showItemsSection, setShowItemsSection] = useState<boolean>(false)
  const [originEmailOpen, setOriginEmailOpen] = useState<boolean>(false)

  // Sync state whenever doc changes
  useEffect(() => {
    if (doc) {
      setDocumentType(doc.documentType || 'factura')
      setDocumentNumber(doc.documentNumber || '')
      setDocumentDate(doc.documentDate || '')
      setDueDate(doc.dueDate || '')
      setCae(doc.cae || (doc.extractedData?.attributes?.cae as string) || '')
      setIssuerName(doc.issuerName || '')
      setIssuerTaxId(doc.issuerTaxId || '')
      setRecipientName(doc.recipientName || '')
      setRecipientTaxId(doc.recipientTaxId || '')
      setRecipientPhone(doc.recipientPhone || '')
      setRecipientEmail(doc.recipientEmail || '')
      setDeliveryAddress(doc.deliveryAddress || '')
      const rawResp = doc.responsiblePerson || ''
      const isCity = /^(mar del plata|buenos aires|cordoba|rosario|caba)$/i.test(rawResp.trim())
      const contactCandidate = (doc.extractedData?.attributes?.contacto ||
        doc.extractedData?.attributes?.solicitante ||
        '') as string
      setResponsiblePerson(isCity && contactCandidate ? contactCandidate : isCity ? '' : rawResp)
      setTaxCondition(doc.taxCondition || 'Responsable Inscripto')
      setCurrency(doc.currency || 'ARS')
      setNetAmount(doc.netAmount !== null && doc.netAmount !== undefined ? String(doc.netAmount) : '')
      setTaxAmount(doc.taxAmount !== null && doc.taxAmount !== undefined ? String(doc.taxAmount) : '')
      setTotalAmount(doc.totalAmount !== null && doc.totalAmount !== undefined ? String(doc.totalAmount) : '')
      setPaymentTerms(doc.paymentTerms || '')
      setPaymentMethod(doc.paymentMethod || '')
      setDocumentLetter(doc.documentLetter || '')
      setPointOfSale(doc.pointOfSale || '')
      setCaeDueDate(doc.caeDueDate || '')
      setPurchaseOrderNumber(doc.purchaseOrderNumber || '')
      setExemptAmount(doc.exemptAmount !== null && doc.exemptAmount !== undefined ? String(doc.exemptAmount) : '')
      setOtherTaxesAmount(doc.otherTaxesAmount !== null && doc.otherTaxesAmount !== undefined ? String(doc.otherTaxesAmount) : '')
      setCarrierName(doc.carrierName || '')
      setDepartment(doc.department || '')
      setBranch(doc.branch || '')
      setPeriod(doc.period || '')
      setReferenceNumber(doc.referenceNumber || '')
      setSummary(doc.summary || '')
      setValidationNotes(doc.validationNotes || '')
      setRejecting(false)
      setRejectReason('')

      const docItems = doc.items && Array.isArray(doc.items) && doc.items.length > 0 ? doc.items : null
      const extractedDocItems =
        doc.extractedData && Array.isArray(doc.extractedData.items) && doc.extractedData.items.length > 0
          ? doc.extractedData.items
          : null
      const rawItems = docItems || extractedDocItems || []

      const extractedItems: DocumentArticleItem[] = Array.isArray(rawItems)
        ? (rawItems as DocumentArticleItem[]).map((it, idx) => ({
            id: it.id || `item-${idx}`,
            codigo: it.codigo || (it as any).code || '',
            nombre: it.nombre || (it as any).descripcion || (it as any).description || '',
            cantidad:
              it.cantidad !== null && it.cantidad !== undefined
                ? it.cantidad
                : ((it as any).quantity ?? 1),
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

      setItems(extractedItems)
      const isCommercialDoc = ['factura', 'presupuesto', 'nota_pedido', 'orden_compra', 'orden_servicio'].includes(
        (doc.documentType || '').toLowerCase()
      )
      setShowItemsSection(extractedItems.length > 0 || isCommercialDoc)
    }
  }, [doc])

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        codigo: '',
        nombre: '',
        cantidad: 1,
        precioSinIva: null,
        precioFinal: null
      }
    ])
    setShowItemsSection(true)
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

  // Load PDF Stream Blob
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
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
      setBlobUrl(null)
    }
  }, [open, doc?.id])

  if (!doc) return null

  const handleConfirmValidation = async () => {
    const payload: ValidateDocumentPayload = {
      id: doc.id,
      documentType,
      documentNumber: documentNumber.trim() || undefined,
      documentDate: documentDate || undefined,
      dueDate: dueDate || undefined,
      cae: cae.trim() || undefined,
      issuerName: issuerName.trim() || undefined,
      issuerTaxId: issuerTaxId.trim() || undefined,
      recipientName: recipientName.trim() || undefined,
      recipientTaxId: recipientTaxId.trim() || undefined,
      recipientPhone: recipientPhone.trim() || undefined,
      recipientEmail: recipientEmail.trim() || undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
      responsiblePerson: responsiblePerson.trim() || undefined,
      taxCondition: taxCondition || undefined,
      currency,
      netAmount: netAmount ? Number(netAmount) : undefined,
      taxAmount: taxAmount ? Number(taxAmount) : undefined,
      totalAmount: totalAmount ? Number(totalAmount) : undefined,
      paymentTerms: paymentTerms.trim() || undefined,
      paymentMethod: paymentMethod.trim() || undefined,
      documentLetter: documentLetter.trim() || undefined,
      pointOfSale: pointOfSale.trim() || undefined,
      caeDueDate: caeDueDate || undefined,
      purchaseOrderNumber: purchaseOrderNumber.trim() || undefined,
      exemptAmount: exemptAmount ? Number(exemptAmount) : undefined,
      otherTaxesAmount: otherTaxesAmount ? Number(otherTaxesAmount) : undefined,
      carrierName: carrierName.trim() || undefined,
      department: department.trim() || undefined,
      branch: branch.trim() || undefined,
      period: period.trim() || undefined,
      referenceNumber: referenceNumber.trim() || undefined,
      summary: summary.trim() || undefined,
      validationNotes: validationNotes.trim() || undefined,
      items: items
        .filter(it => it.nombre && it.nombre.trim().length > 0)
        .map(it => ({
          codigo: it.codigo ? it.codigo.trim() : null,
          nombre: it.nombre.trim(),
          cantidad:
            it.cantidad !== null && it.cantidad !== undefined && it.cantidad !== ('' as any)
              ? Number(it.cantidad)
              : null,
          precioSinIva:
            it.precioSinIva !== null &&
            it.precioSinIva !== undefined &&
            it.precioSinIva !== ('' as any)
              ? Number(it.precioSinIva)
              : null,
          precioFinal:
            it.precioFinal !== null &&
            it.precioFinal !== undefined &&
            it.precioFinal !== ('' as any)
              ? Number(it.precioFinal)
              : null,
          ivaPorcentaje:
            it.ivaPorcentaje !== null &&
            it.ivaPorcentaje !== undefined &&
            it.ivaPorcentaje !== ('' as any)
              ? Number(it.ivaPorcentaje)
              : null
        })),
      extractedData: {
        ...(doc.extractedData || {}),
        items: items
          .filter(it => it.nombre && it.nombre.trim().length > 0)
          .map(it => ({
            codigo: it.codigo ? it.codigo.trim() : null,
            nombre: it.nombre.trim(),
            cantidad:
              it.cantidad !== null && it.cantidad !== undefined && it.cantidad !== ('' as any)
                ? Number(it.cantidad)
                : null,
            precioSinIva:
              it.precioSinIva !== null &&
              it.precioSinIva !== undefined &&
              it.precioSinIva !== ('' as any)
                ? Number(it.precioSinIva)
                : null,
            precioFinal:
              it.precioFinal !== null &&
              it.precioFinal !== undefined &&
              it.precioFinal !== ('' as any)
                ? Number(it.precioFinal)
                : null,
            ivaPorcentaje:
              it.ivaPorcentaje !== null &&
              it.ivaPorcentaje !== undefined &&
              it.ivaPorcentaje !== ('' as any)
                ? Number(it.ivaPorcentaje)
                : null
          }))
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
        sx: {
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2
        }
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
            <Icon icon='tabler:clipboard-check' fontSize={24} />
          </Box>
          <Box sx={{ overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                Revisión y Validación de Documento #{doc.id}
              </Typography>
              <StatusChip status={doc.status} />
              <StatusChip status={doc.source} />
            </Box>
            <Typography variant='caption' color='text.secondary' noWrap>
              Archivo: {doc.originalName} · OCR Automático precargado. Verifique y confirme los datos.
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
          {onReprocess && doc && (
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
          {/* Columna Izquierda: Visor PDF interactivo (50%) */}
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

          {/* Columna Derecha: Formulario de Validación y Edición (50%) */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              height: '100%',
              overflowY: 'auto',
              p: 3,
              backgroundColor: 'background.paper'
            }}
          >
            {rejecting ? (
              <Alert severity='error' sx={{ mb: 3 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
                  Rechazar Documento
                </Typography>
                <Typography variant='body2' sx={{ mb: 2 }}>
                  Al rechazar el comprobante se marcará como RECHAZADO y se guardará el motivo para auditoría.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size='small'
                  placeholder='Ej: Documento borroso/ilegible, comprobante duplicado, factura no perteneciente a esta empresa...'
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
              <Alert severity='info' icon={<Icon icon='tabler:sparkles' />} sx={{ mb: 3 }}>
                Revise los campos extraídos automáticamente del PDF a la izquierda. Puede editar cualquier valor antes de validar.
              </Alert>
            )}

            {Array.isArray(doc.validationWarnings) && doc.validationWarnings.length > 0 && (
              <Alert
                severity={doc.validationWarnings.some(w => w.severity === 'error') ? 'error' : 'warning'}
                icon={<Icon icon='tabler:alert-triangle' />}
                sx={{ mb: 3 }}
              >
                <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 0.5 }}>
                  Controles fiscales y administrativos detectaron observaciones:
                </Typography>
                {doc.validationWarnings.map((w, idx) => (
                  <Typography key={`${w.code}-${idx}`} variant='body2' sx={{ display: 'block' }}>
                    • {w.message}
                  </Typography>
                ))}
              </Alert>
            )}

            {/* SECCIÓN 1: Identificación del Documento */}
            <Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'primary.main', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon='tabler:file-invoice' fontSize={18} />
              1. Identificación del Comprobante
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Tipo de Documento'
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value)}
                >
                  {DOCUMENT_TYPES.map(t => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size='small'
                  label='N° de Comprobante'
                  placeholder='Ej: 00008-00041980'
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  type='date'
                  label='Fecha Emisión'
                  value={documentDate}
                  onChange={e => setDocumentDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  type='date'
                  label='Fecha Vencimiento'
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  label='CAE (AFIP)'
                  placeholder='14 dígitos'
                  value={cae}
                  onChange={e => setCae(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* SECCIÓN 2: Emisor & Cliente */}
            <Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'primary.main', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon='tabler:users' fontSize={18} />
              2. Partes Involucradas & Fiscal
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={7}>
                <TextField
                  fullWidth
                  size='small'
                  label='Emisor / Proveedor'
                  value={issuerName}
                  onChange={e => setIssuerName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size='small'
                  label='CUIT / Tax ID Emisor'
                  placeholder='30-XXXXXXXX-X'
                  value={issuerTaxId}
                  onChange={e => setIssuerTaxId(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={7}>
                <TextField
                  fullWidth
                  size='small'
                  label='Cliente / Destinatario'
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size='small'
                  label='CUIT / DNI Cliente'
                  placeholder='30-XXXXXXXX-X'
                  value={recipientTaxId}
                  onChange={e => setRecipientTaxId(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Condición Fiscal'
                  value={taxCondition}
                  onChange={e => setTaxCondition(e.target.value)}
                >
                  {TAX_CONDITIONS.map(cond => (
                    <MenuItem key={cond} value={cond}>
                      {cond}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size='small'
                  label='Contacto / Responsable'
                  placeholder='Ej: Gonzalo Calderón'
                  value={responsiblePerson}
                  onChange={e => setResponsiblePerson(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size='small'
                  label='Teléfono / Celular'
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size='small'
                  label='Email de Contacto'
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size='small'
                  label='Domicilio / Dirección de Entrega'
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* SECCIÓN 3: Importes y Medios de Pago */}
            <Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'primary.main', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon='tabler:cash' fontSize={18} />
              3. Importes & Condiciones de Pago
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Moneda'
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                >
                  <MenuItem value='ARS'>ARS ($)</MenuItem>
                  <MenuItem value='USD'>USD (U$S)</MenuItem>
                  <MenuItem value='EUR'>EUR (€)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='Importe Neto'
                  value={netAmount}
                  onChange={e => setNetAmount(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='IVA / Impuestos'
                  value={taxAmount}
                  onChange={e => setTaxAmount(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='Importe Total *'
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  sx={{ '& input': { fontWeight: 700, color: 'primary.main' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size='small'
                  label='Condición de Venta'
                  placeholder='Ej: CTA. CTE. 15 DIAS, Contado, 5 días...'
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size='small'
                  label='Medio de Pago'
                  placeholder='Ej: Transferencia Bancaria, Cheque, Efectivo'
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* SECCIÓN 4: Artículos & Ítems del Comprobante */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.5,
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Typography
                  variant='subtitle2'
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Icon icon='tabler:list-details' fontSize={18} />
                  4. Artículos & Ítems del Comprobante ({items.length})
                </Typography>
                <Button
                  size='small'
                  variant={showItemsSection ? 'outlined' : 'text'}
                  startIcon={<Icon icon={showItemsSection ? 'tabler:plus' : 'tabler:list-details'} />}
                  onClick={() => {
                    if (!showItemsSection) {
                      setShowItemsSection(true)
                      if (items.length === 0) handleAddItem()
                    } else {
                      handleAddItem()
                    }
                  }}
                >
                  {showItemsSection ? 'Agregar Artículo' : 'Habilitar Artículos'}
                </Button>
              </Box>

              {showItemsSection && (
                <>
                  {items.length === 0 ? (
                    <Box
                      sx={{
                        p: 3,
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        No se detectaron artículos en este comprobante.
                      </Typography>
                      <Button
                        size='small'
                        variant='outlined'
                        sx={{ mt: 1.5 }}
                        onClick={handleAddItem}
                        startIcon={<Icon icon='tabler:plus' />}
                      >
                        Agregar primer artículo
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {items.map((item, idx) => (
                        <Box
                          key={item.id || idx}
                          sx={{
                            p: 2,
                            borderRadius: 1.5,
                            border: 1,
                            borderColor: 'divider',
                            backgroundColor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            flexWrap: 'wrap'
                          }}
                        >
                          <TextField
                            size='small'
                            label='Código'
                            placeholder='Ej: ART01'
                            value={item.codigo || ''}
                            onChange={e => handleUpdateItem(idx, 'codigo', e.target.value)}
                            sx={{ width: { xs: '100%', sm: 110 } }}
                          />
                          <TextField
                            size='small'
                            label='Nombre / Descripción *'
                            placeholder='Descripción del artículo o servicio'
                            value={item.nombre || ''}
                            onChange={e => handleUpdateItem(idx, 'nombre', e.target.value)}
                            sx={{ flex: 1, minWidth: 160 }}
                          />
                          <TextField
                            size='small'
                            type='number'
                            label='Cant.'
                            value={item.cantidad ?? ''}
                            onChange={e =>
                              handleUpdateItem(
                                idx,
                                'cantidad',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            sx={{ width: { xs: '48%', sm: 80 } }}
                          />
                          <TextField
                            size='small'
                            type='number'
                            label='Precio s/IVA'
                            value={item.precioSinIva ?? ''}
                            onChange={e =>
                              handleUpdateItem(
                                idx,
                                'precioSinIva',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            sx={{ width: { xs: '48%', sm: 120 } }}
                          />
                          <TextField
                            size='small'
                            type='number'
                            label='Precio Final'
                            value={item.precioFinal ?? ''}
                            onChange={e =>
                              handleUpdateItem(
                                idx,
                                'precioFinal',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            sx={{ width: { xs: '100%', sm: 120 } }}
                          />
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDeleteItem(idx)}
                            sx={{ ml: 'auto' }}
                          >
                            <Icon icon='tabler:trash' fontSize={18} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* SECCIÓN 5: Referencias Administrativas, Sector y Logística */}
            <Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'primary.main', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon='tabler:building' fontSize={18} />
              5. Referencias Administrativas, Sector y Logística
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  label='N° Orden de Compra (O.C.)'
                  placeholder='Ej: OC-2026-0041'
                  value={purchaseOrderNumber}
                  onChange={e => setPurchaseOrderNumber(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='tabler:clipboard-check' fontSize={16} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  label='N° Comprobante / Remito Asoc.'
                  placeholder='Ej: R-0001-0004921'
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='tabler:link' fontSize={16} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  label='Empresa de Transporte / Logística'
                  placeholder='Ej: Vía Cargo, Andreani, Propio'
                  value={carrierName}
                  onChange={e => setCarrierName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='tabler:truck' fontSize={16} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  label='Sector / Centro de Costos'
                  placeholder='Ej: Administración, Ventas, Taller'
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='tabler:briefcase' fontSize={16} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  label='Sucursal / Depósito'
                  placeholder='Ej: Casa Central, Depósito 1'
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='tabler:map-pin' fontSize={16} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  label='Período Facturado / Mes'
                  placeholder='Ej: 11/2026'
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='tabler:calendar' fontSize={16} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  label='Letra Comprobante'
                  placeholder='Ej: A, B, C, M, R, X'
                  value={documentLetter}
                  onChange={e => setDocumentLetter(e.target.value.toUpperCase())}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  label='Punto de Venta'
                  placeholder='Ej: 0001, 00014'
                  value={pointOfSale}
                  onChange={e => setPointOfSale(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  type='date'
                  label='Fecha Vto. CAE'
                  value={caeDueDate}
                  onChange={e => setCaeDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='Monto No Gravado / Exento'
                  placeholder='0.00'
                  value={exemptAmount}
                  onChange={e => setExemptAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='Percepciones / Otros Tributos'
                  placeholder='0.00'
                  value={otherTaxesAmount}
                  onChange={e => setOtherTaxesAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size='small'
                  label='Notas de Validación'
                  placeholder='Observaciones internas del revisor'
                  value={validationNotes}
                  onChange={e => setValidationNotes(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size='small'
                  label='Resumen Ejecutivo'
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                />
              </Grid>
            </Grid>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant='outlined'
            color='error'
            startIcon={<Icon icon='tabler:circle-x' />}
            onClick={() => setRejecting(true)}
            disabled={isValidating || rejecting}
          >
            Rechazar
          </Button>
        </Box>

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
