import React, { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import apiConnector from 'src/services/api.service'
import { documentLinksApi } from 'src/services/documentLinks.service'
import { SourceImputationSummary } from 'src/store/apps/documents'
import StatusChip from 'src/components/common/StatusChip'

export interface LinkableDocumentCandidate {
  id: number
  clientId?: number | null
  originalName: string
  documentType?: string | null
  normalizedDocumentType?: string | null
  documentLetter?: string | null
  documentNumber?: string | null
  documentDate?: string | null
  issuerName?: string | null
  recipientName?: string | null
  currency?: string | null
  totalAmount?: number | string | null
  paymentStatus?: string | null
  linkedCount?: number
  balanceSummary?: {
    isTrackable: boolean
    remainingBalance: number
    derivedPaymentStatus?: string
  } | null
}

interface ManualDocumentLinkDialogProps {
  open: boolean
  sourceDocument: LinkableDocumentCandidate | null
  clientId?: number | null
  alreadyLinkedIds?: number[]
  sourceImputationSummary?: SourceImputationSummary | null
  onClose: () => void
  onLinked: () => void
}

const LINK_TYPE_OPTIONS = [
  { value: '', label: 'Detectar automáticamente según tipo de comprobante' },
  { value: 'PAYMENT_IMPUTATION', label: 'Imputación de Pago / Cobro (Recibo / OP / Transf. → Factura)' },
  { value: 'CREDIT_NOTE_ADJUSTMENT', label: 'Nota de Crédito → Factura' },
  { value: 'DEBIT_NOTE_ADJUSTMENT', label: 'Nota de Débito → Factura' },
  { value: 'BILLING_FROM_DELIVERY', label: 'Facturación de Remito (Factura → Remito)' },
  { value: 'ORDER_FULFILLMENT', label: 'Cumplimiento de Orden / Presupuesto' },
  { value: 'PAYMENT_EXECUTION', label: 'Medio de Pago de Orden / Recibo' },
  { value: 'GENERAL_RELATED', label: 'Relación Documental General' }
]

const MONETARY_SOURCE_TYPES = new Set([
  'recibo',
  'orden_pago',
  'transferencia_pago',
  'certificado_retencion',
  'nota_credito',
  'nota_debito'
])

const TRACKABLE_TYPES = new Set(['factura', 'ticket_fiscal', 'nota_debito'])

function normalizeDocBucket(raw?: string | null): string {
  const val = String(raw || '').toLowerCase().trim()
  if (val.includes('nota_cred')) return 'nota_credito'
  if (val.includes('nota_deb')) return 'nota_debito'
  if (val.includes('orden_pago')) return 'orden_pago'
  if (val.includes('retencion')) return 'certificado_retencion'
  if (val.includes('transferencia') || val.includes('deposito')) return 'transferencia_pago'
  if (val.includes('ticket') || val.includes('tique')) return 'ticket_fiscal'
  if (val.includes('factura')) return 'factura'
  if (val.includes('remito')) return 'remito'
  if (val.includes('recibo')) return 'recibo'
  return val
}

export const ManualDocumentLinkDialog: React.FC<ManualDocumentLinkDialogProps> = ({
  open,
  sourceDocument,
  clientId,
  alreadyLinkedIds = [],
  sourceImputationSummary,
  onClose,
  onLinked
}) => {
  const [candidates, setCandidates] = useState<LinkableDocumentCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [companyScope, setCompanyScope] = useState(false)
  const [onlyPending, setOnlyPending] = useState(true)
  const [linkType, setLinkType] = useState('')
  const [selectedAmounts, setSelectedAmounts] = useState<Record<number, string>>({})
  const [liveLinkedIds, setLiveLinkedIds] = useState<number[]>(alreadyLinkedIds)
  const [liveImputation, setLiveImputation] = useState<SourceImputationSummary | null>(
    sourceImputationSummary || null
  )

  const effectiveClientId = clientId || sourceDocument?.clientId || null

  useEffect(() => {
    if (!open || !sourceDocument) return
    setSelectedAmounts({})
    setLinkType('')
    setSearch('')
    setOnlyPending(true)
    setCompanyScope(!effectiveClientId)
    setLiveLinkedIds(alreadyLinkedIds)
    setLiveImputation(sourceImputationSummary || null)

    if (!sourceImputationSummary || alreadyLinkedIds.length === 0) {
      documentLinksApi
        .getDocumentLinks(sourceDocument.id)
        .then(res => {
          const linked = (res.links || [])
            .map(l => l.relatedDocument?.id)
            .filter(Boolean) as number[]
          setLiveLinkedIds(linked)
          if (res.sourceImputationSummary) {
            setLiveImputation(res.sourceImputationSummary)
          }
        })
        .catch(() => null)
    }
  }, [open, sourceDocument, effectiveClientId, alreadyLinkedIds, sourceImputationSummary])

  useEffect(() => {
    if (!open || !sourceDocument) return
    let active = true
    setLoading(true)

    const load = async () => {
      try {
        if (!companyScope && effectiveClientId) {
          const res = await apiConnector.get(`/clients/${effectiveClientId}/documents`, {
            limit: 100,
            page: 1
          })
          if (active) setCandidates(Array.isArray(res?.data) ? res.data : [])
        } else {
          const rows = await documentLinksApi.searchCompanyDocuments(search, 50)
          if (active) setCandidates(rows as unknown as LinkableDocumentCandidate[])
        }
      } catch {
        if (active) setCandidates([])
      } finally {
        if (active) setLoading(false)
      }
    }

    const timer = setTimeout(load, companyScope ? 250 : 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [open, sourceDocument, effectiveClientId, companyScope, search])

  const sourceBucket = normalizeDocBucket(sourceDocument?.normalizedDocumentType || sourceDocument?.documentType)
  const isMonetaryContext = useMemo(() => {
    if (linkType === 'PAYMENT_IMPUTATION' || linkType === 'CREDIT_NOTE_ADJUSTMENT' || linkType === 'DEBIT_NOTE_ADJUSTMENT') {
      return true
    }
    return MONETARY_SOURCE_TYPES.has(sourceBucket) || TRACKABLE_TYPES.has(sourceBucket)
  }, [linkType, sourceBucket])

  const filteredCandidates = useMemo(() => {
    const excluded = new Set([sourceDocument?.id, ...liveLinkedIds].filter(Boolean) as number[])
    const q = search.trim().toLowerCase()

    const list = candidates.filter(c => {
      if (excluded.has(c.id)) return false
      if (onlyPending) {
        const payStat = c.balanceSummary?.isTrackable
          ? c.balanceSummary.derivedPaymentStatus
          : c.paymentStatus
        if (payStat === 'PAID') return false
        const bucket = normalizeDocBucket(c.normalizedDocumentType || c.documentType)
        if (bucket === 'remito' && (c.linkedCount ?? 0) > 0) return false
      }
      if (!q) return true
      const text = [c.documentType, c.documentNumber, c.originalName, c.issuerName, c.recipientName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return text.includes(q)
    })

    return [...list].sort((a, b) => {
      const aRemain = a.balanceSummary?.isTrackable ? a.balanceSummary.remainingBalance : 0
      const bRemain = b.balanceSummary?.isTrackable ? b.balanceSummary.remainingBalance : 0
      if (aRemain > 0 && bRemain === 0) return -1
      if (bRemain > 0 && aRemain === 0) return 1
      return 0
    })
  }, [candidates, sourceDocument?.id, liveLinkedIds, search, onlyPending])

  const selectedIds = useMemo(() => Object.keys(selectedAmounts).map(Number), [selectedAmounts])

  const totalImputed = useMemo(
    () =>
      selectedIds.reduce((sum, id) => {
        const val = Number(selectedAmounts[id])
        return sum + (Number.isFinite(val) && val > 0 ? val : 0)
      }, 0),
    [selectedIds, selectedAmounts]
  )

  const initialSourcePool = useMemo(() => {
    if (liveImputation?.isPaymentSource) return liveImputation.unappliedAmount
    return Number(sourceDocument?.totalAmount || 0)
  }, [liveImputation, sourceDocument?.totalAmount])

  const toggleCandidate = (candidate: LinkableDocumentCandidate) => {
    setSelectedAmounts(prev => {
      const next = { ...prev }
      if (next[candidate.id] !== undefined) {
        delete next[candidate.id]
      } else {
        const alreadyCheckedSum = Object.values(next).reduce((acc, v) => acc + (Number(v) || 0), 0)
        const remainingPool = Math.max(0, initialSourcePool - alreadyCheckedSum)
        const candRemain = candidate.balanceSummary?.isTrackable
          ? candidate.balanceSummary.remainingBalance
          : Number(candidate.totalAmount || 0)

        let defaultAmt: number | '' = ''
        if (isMonetaryContext) {
          if (candRemain > 0 && MONETARY_SOURCE_TYPES.has(sourceBucket)) {
            defaultAmt = remainingPool > 0 ? Math.min(remainingPool, candRemain) : candRemain
          } else if (candRemain > 0) {
            defaultAmt = candRemain
          } else if (remainingPool > 0) {
            defaultAmt = remainingPool
          }
        }
        next[candidate.id] = defaultAmt !== '' && defaultAmt > 0 ? String(Math.round(defaultAmt * 100) / 100) : ''
      }
      return next
    })
  }

  const handleConfirm = async () => {
    if (!sourceDocument || selectedIds.length === 0) return
    setSaving(true)
    try {
      const entries = selectedIds.map(targetId => {
        const rawAmt = selectedAmounts[targetId]
        const parsedAmt = rawAmt !== '' && rawAmt !== undefined ? Number(rawAmt) : null
        return {
          sourceDocumentId: sourceDocument.id,
          targetDocumentId: targetId,
          linkType: linkType || undefined,
          appliedAmount: parsedAmt !== null && Number.isFinite(parsedAmt) ? parsedAmt : null
        }
      })

      const res = await documentLinksApi.createBatchLinks(entries)
      if (res.createdCount > 0) {
        toast.success(
          res.createdCount === 1
            ? 'Comprobante vinculado correctamente'
            : `${res.createdCount} comprobantes vinculados correctamente`
        )
      }
      if (res.warnings?.length) {
        toast(res.warnings[0], { icon: '⚠️' })
      }
      if (res.skipped?.length) {
        toast.error(res.skipped[0].reason)
      }
      onLinked()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al vincular comprobantes')
    } finally {
      setSaving(false)
    }
  }

  if (!sourceDocument) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Icon icon='tabler:link-plus' fontSize={22} />
        <Box>
          <Typography variant='h6' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Vincular Comprobantes Manualmente
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Origen: {(sourceDocument.documentType || 'DOCUMENTO').replace(/_/g, ' ').toUpperCase()}{' '}
            {sourceDocument.documentNumber ? `N° ${sourceDocument.documentNumber}` : sourceDocument.originalName}
            {sourceDocument.totalAmount ? ` · Total ${sourceDocument.currency || '$'} ${Number(sourceDocument.totalAmount).toLocaleString('es-AR')}` : ''}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {liveImputation?.isPaymentSource && (
            <Alert severity={liveImputation.unappliedAmount > 1 ? 'info' : 'success'} sx={{ py: 0.5 }}>
              <Typography variant='body2'>
                <strong>Total comprobante:</strong> {sourceDocument.currency || '$'}{' '}
                {liveImputation.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ·{' '}
                <strong>Ya imputado:</strong> {sourceDocument.currency || '$'}{' '}
                {liveImputation.imputedAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ·{' '}
                <strong>Disponible para aplicar:</strong> {sourceDocument.currency || '$'}{' '}
                {liveImputation.unappliedAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size='small'
              sx={{ flex: 1, minWidth: 220 }}
              placeholder='Buscar por N° comprobante, emisor, receptor o archivo...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='tabler:search' fontSize={17} />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              select
              size='small'
              sx={{ minWidth: 260 }}
              label='Tipo de Relación'
              value={linkType}
              onChange={e => setLinkType(e.target.value)}
            >
              {LINK_TYPE_OPTIONS.map(opt => (
                <MenuItem key={opt.value || 'auto'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              size='small'
              variant={onlyPending ? 'contained' : 'outlined'}
              color='info'
              onClick={() => setOnlyPending(prev => !prev)}
              startIcon={<Icon icon='tabler:filter' fontSize={16} />}
            >
              {onlyPending ? 'Solo pendientes' : 'Incluyendo pagados'}
            </Button>

            {effectiveClientId && (
              <Button
                size='small'
                variant={companyScope ? 'contained' : 'outlined'}
                color='secondary'
                onClick={() => setCompanyScope(prev => !prev)}
                startIcon={<Icon icon={companyScope ? 'tabler:building' : 'tabler:user'} fontSize={16} />}
              >
                {companyScope ? 'Toda la compañía' : 'Solo este cliente'}
              </Button>
            )}
          </Box>

          {loading ? (
            <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : filteredCandidates.length === 0 ? (
            <Alert severity='info'>
              No se encontraron comprobantes disponibles para vincular con este filtro.
            </Alert>
          ) : (
            <Box sx={{ maxHeight: 340, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {filteredCandidates.map((cand, idx) => {
                const checked = selectedAmounts[cand.id] !== undefined
                const remain = cand.balanceSummary?.isTrackable ? cand.balanceSummary.remainingBalance : null
                const candTypeLabel = (cand.normalizedDocumentType || cand.documentType || 'DOCUMENTO')
                  .replace(/_/g, ' ')
                  .toUpperCase()

                return (
                  <React.Fragment key={cand.id}>
                    {idx > 0 && <Divider />}
                    <Box
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        bgcolor: checked ? 'action.selected' : 'transparent'
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0, cursor: 'pointer' }}
                        onClick={() => toggleCandidate(cand)}
                      >
                        <Checkbox checked={checked} size='small' />
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <Typography variant='body2' sx={{ fontWeight: 700 }} noWrap>
                              {candTypeLabel} {cand.documentLetter ? `(${cand.documentLetter})` : ''}
                            </Typography>
                            {cand.documentNumber && (
                              <Chip size='small' label={`N° ${cand.documentNumber}`} sx={{ height: 20 }} />
                            )}
                            {cand.documentDate && (
                              <Typography variant='caption' color='text.secondary'>
                                {cand.documentDate}
                              </Typography>
                            )}
                            {cand.balanceSummary?.isTrackable && cand.balanceSummary.derivedPaymentStatus && (
                              <StatusChip
                                variantType='payment'
                                status={cand.balanceSummary.derivedPaymentStatus}
                                sx={{ height: 18, fontSize: '0.62rem' }}
                              />
                            )}
                          </Box>
                          <Typography variant='caption' color='text.secondary' display='block' noWrap>
                            {cand.issuerName || '—'} → {cand.recipientName || '—'}
                            {cand.totalAmount !== null && cand.totalAmount !== undefined
                              ? ` · Total ${cand.currency || '$'} ${Number(cand.totalAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : ''}
                            {remain !== null
                              ? ` · Saldo pend.: $${remain.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : ''}
                          </Typography>
                        </Box>
                      </Box>

                      {checked && isMonetaryContext && (
                        <TextField
                          size='small'
                          type='number'
                          label='Monto imputado'
                          value={selectedAmounts[cand.id]}
                          onChange={e =>
                            setSelectedAmounts(prev => ({
                              ...prev,
                              [cand.id]: e.target.value
                            }))
                          }
                          sx={{ width: 155 }}
                          inputProps={{ step: '0.01', min: '0' }}
                        />
                      )}
                    </Box>
                  </React.Fragment>
                )
              })}
            </Box>
          )}

          {selectedIds.length > 0 &&
            MONETARY_SOURCE_TYPES.has(sourceBucket) &&
            initialSourcePool > 0 &&
            totalImputed > initialSourcePool + 1 && (
              <Alert severity='warning'>
                La suma imputada (${totalImputed.toLocaleString('es-AR', { minimumFractionDigits: 2 })}) supera el disponible de este comprobante ($
                {initialSourcePool.toLocaleString('es-AR', { minimumFractionDigits: 2 })}). Podés continuar si corresponde a intereses o ajustes.
              </Alert>
            )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Typography variant='caption' color='text.secondary'>
          {selectedIds.length > 0
            ? `${selectedIds.length} seleccionado(s)${totalImputed > 0 ? ` · Total imputado: $${totalImputed.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : ''}`
            : 'Seleccioná uno o más comprobantes'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant='outlined' color='secondary' onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={handleConfirm}
            disabled={saving || selectedIds.length === 0}
            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <Icon icon='tabler:check' />}
          >
            {saving ? 'Vinculando...' : `Vincular (${selectedIds.length})`}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default ManualDocumentLinkDialog
