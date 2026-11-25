import React, { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import StatusChip from 'src/components/common/StatusChip'
import { documentLinksApi } from 'src/services/documentLinks.service'
import {
  DocumentItem,
  DocumentLinkItem,
  DocumentLinksResponse,
  DocumentLinkSuggestion
} from 'src/store/apps/documents'
import ManualDocumentLinkDialog from './ManualDocumentLinkDialog'

interface DocumentLinksPanelProps {
  document: DocumentItem
  onLinksChanged?: () => void
  onCountChange?: (count: number) => void
}

const MATCH_SOURCE_LABELS: Record<string, { label: string; color: 'success' | 'info' | 'default' }> = {
  AUTO_EXACT: { label: 'Auto IA', color: 'success' },
  SUGGESTED_ACCEPTED: { label: 'Sugerencia', color: 'info' },
  MANUAL: { label: 'Manual', color: 'default' }
}

const fmtMoney = (val: number | null | undefined, currency?: string | null) =>
  `${currency || '$'} ${Number(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

export const DocumentLinksPanel: React.FC<DocumentLinksPanelProps> = ({
  document: doc,
  onLinksChanged,
  onCountChange
}) => {
  const [data, setData] = useState<DocumentLinksResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | string | null>(null)
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null)
  const [editingAmount, setEditingAmount] = useState('')
  const [manualOpen, setManualOpen] = useState(false)

  const loadLinks = useCallback(async () => {
    if (!doc?.id) return
    setLoading(true)
    try {
      const res = await documentLinksApi.getDocumentLinks(doc.id)
      setData(res)
      onCountChange?.(res.links?.length || 0)
    } catch {
      toast.error('No se pudieron cargar los vínculos del documento')
    } finally {
      setLoading(false)
    }
  }, [doc?.id, onCountChange])

  useEffect(() => {
    loadLinks()
  }, [loadLinks])

  const handleAcceptSuggestion = async (suggestion: DocumentLinkSuggestion) => {
    setBusyId(`sug-${suggestion.targetDocumentId}`)
    try {
      const res = await documentLinksApi.createLink(doc.id, {
        targetDocumentId: suggestion.targetDocumentId,
        linkType: suggestion.linkType,
        appliedAmount: suggestion.suggestedAppliedAmount,
        matchSource: 'SUGGESTED_ACCEPTED',
        swapDirection: suggestion.swapDirection
      })
      toast.success('Vínculo confirmado')
      if (res.warnings?.length) toast(res.warnings[0], { icon: '⚠️' })
      await loadLinks()
      onLinksChanged?.()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo vincular la sugerencia')
    } finally {
      setBusyId(null)
    }
  }

  const handleRunAutoMatch = async () => {
    setBusyId('auto')
    try {
      const res = await documentLinksApi.runAutoMatch(doc.id)
      if (res.autoMatchedCount > 0) {
        toast.success(`Se vincularon ${res.autoMatchedCount} comprobante(s) automáticamente`)
        await loadLinks()
        onLinksChanged?.()
      } else {
        toast('No hubo coincidencias exactas inequívocas; revisá las sugerencias o vinculá manualmente.', {
          icon: 'ℹ️'
        })
      }
    } catch {
      toast.error('Error al ejecutar detección automática')
    } finally {
      setBusyId(null)
    }
  }

  const handleSaveAmount = async (link: DocumentLinkItem) => {
    setBusyId(`save-${link.id}`)
    try {
      const parsed = editingAmount !== '' ? Number(editingAmount) : null
      await documentLinksApi.updateLink(doc.id, link.id, { appliedAmount: parsed })
      setEditingLinkId(null)
      toast.success('Monto imputado actualizado')
      await loadLinks()
      onLinksChanged?.()
    } catch {
      toast.error('No se pudo actualizar el vínculo')
    } finally {
      setBusyId(null)
    }
  }

  const handleRemoveLink = async (linkId: number) => {
    setBusyId(`del-${linkId}`)
    try {
      await documentLinksApi.removeLink(doc.id, linkId)
      toast.success('Vínculo eliminado')
      await loadLinks()
      onLinksChanged?.()
    } catch {
      toast.error('No se pudo eliminar el vínculo')
    } finally {
      setBusyId(null)
    }
  }

  const balance = data?.balanceSummary
  const links = data?.links || []
  const suggestions = data?.suggestions || []
  const alreadyLinkedIds = links.map(l => l.relatedDocument?.id).filter(Boolean) as number[]

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
          Conciliación y Trazabilidad Documental
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size='small'
            variant='outlined'
            onClick={handleRunAutoMatch}
            disabled={busyId === 'auto'}
            startIcon={<Icon icon='tabler:wand' fontSize={16} />}
          >
            Auto-detectar
          </Button>
          <Button
            size='small'
            variant='contained'
            onClick={() => setManualOpen(true)}
            startIcon={<Icon icon='tabler:link-plus' fontSize={16} />}
          >
            Vincular Comprobante
          </Button>
        </Box>
      </Box>

      {balance?.isTrackable && (
        <Paper variant='outlined' sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
              Resumen de Saldo del Comprobante
            </Typography>
            <StatusChip status={balance.derivedPaymentStatus} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 1.5 }}>
            <Box>
              <Typography variant='caption' color='text.secondary'>Total Original</Typography>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>{fmtMoney(balance.totalAmount, doc.currency)}</Typography>
            </Box>
            {balance.creditedAmount > 0 && (
              <Box>
                <Typography variant='caption' color='text.secondary'>Notas de Crédito</Typography>
                <Typography variant='body2' color='success.main' sx={{ fontWeight: 600 }}>-{fmtMoney(balance.creditedAmount, doc.currency)}</Typography>
              </Box>
            )}
            {balance.debitedAmount > 0 && (
              <Box>
                <Typography variant='caption' color='text.secondary'>Notas de Débito</Typography>
                <Typography variant='body2' color='warning.main' sx={{ fontWeight: 600 }}>+{fmtMoney(balance.debitedAmount, doc.currency)}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant='caption' color='text.secondary'>Pagado / Imputado</Typography>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>{fmtMoney(balance.paidAmount, doc.currency)}</Typography>
            </Box>
            <Box>
              <Typography variant='caption' color='text.secondary'>Saldo Pendiente</Typography>
              <Typography
                variant='body2'
                sx={{ fontWeight: 700, color: balance.remainingBalance > 0 ? 'error.main' : 'success.main' }}
              >
                {fmtMoney(balance.remainingBalance, doc.currency)}
              </Typography>
            </Box>
          </Box>
          {balance.overpaidAmount > 0 && (
            <Alert severity='warning' sx={{ mt: 1.5, py: 0.25 }}>
              Imputación excedida en {fmtMoney(balance.overpaidAmount, doc.currency)} sobre el total neto del comprobante.
            </Alert>
          )}
        </Paper>
      )}

      {loading ? (
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={26} />
        </Box>
      ) : (
        <>
          <Box>
            <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
              Comprobantes Vinculados ({links.length})
            </Typography>
            {links.length === 0 ? (
              <Alert severity='info'>
                Este comprobante todavía no tiene documentos asociados.
              </Alert>
            ) : (
              <Stack spacing={1}>
                {links.map(link => {
                  const rel = link.relatedDocument
                  const badge = MATCH_SOURCE_LABELS[link.matchSource] || MATCH_SOURCE_LABELS.MANUAL
                  const isEditing = editingLinkId === link.id
                  const isMoney =
                    link.linkType === 'PAYMENT_IMPUTATION' ||
                    link.linkType === 'CREDIT_NOTE_ADJUSTMENT' ||
                    link.linkType === 'DEBIT_NOTE_ADJUSTMENT'

                  return (
                    <Paper key={link.id} variant='outlined' sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <Typography variant='body2' sx={{ fontWeight: 700 }}>
                              {(rel?.documentType || 'DOC').replace(/_/g, ' ').toUpperCase()}{' '}
                              {rel?.documentNumber ? `N° ${rel.documentNumber}` : `#${rel?.id}`}
                            </Typography>
                            <Chip size='small' label={link.linkTypeLabel} variant='outlined' sx={{ height: 20 }} />
                            <Chip size='small' label={badge.label} color={badge.color} sx={{ height: 20 }} />
                          </Box>
                          <Typography variant='caption' color='text.secondary' display='block'>
                            {rel?.issuerName || '—'} · {rel?.documentDate || 'Sin fecha'}
                            {rel?.totalAmount !== null && rel?.totalAmount !== undefined
                              ? ` · Total: ${fmtMoney(rel.totalAmount, rel.currency)}`
                              : ''}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isMoney && !isEditing && (
                            <Chip
                              size='small'
                              color='primary'
                              variant='outlined'
                              label={`Imputado: ${fmtMoney(link.appliedAmount ?? 0, doc.currency)}`}
                              onClick={() => {
                                setEditingLinkId(link.id)
                                setEditingAmount(link.appliedAmount !== null ? String(link.appliedAmount) : '')
                              }}
                            />
                          )}
                          {isEditing && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TextField
                                size='small'
                                type='number'
                                value={editingAmount}
                                onChange={e => setEditingAmount(e.target.value)}
                                sx={{ width: 120 }}
                              />
                              <IconButton size='small' color='success' onClick={() => handleSaveAmount(link)}>
                                <Icon icon='tabler:check' fontSize={17} />
                              </IconButton>
                              <IconButton size='small' onClick={() => setEditingLinkId(null)}>
                                <Icon icon='tabler:x' fontSize={17} />
                              </IconButton>
                            </Box>
                          )}
                          <Tooltip title='Desvincular'>
                            <IconButton
                              size='small'
                              color='error'
                              disabled={busyId === `del-${link.id}`}
                              onClick={() => handleRemoveLink(link.id)}
                            >
                              <Icon icon='tabler:unlink' fontSize={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  )
                })}
              </Stack>
            )}
          </Box>

          {suggestions.length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
                  Posibles Coincidencias Detectadas ({suggestions.length})
                </Typography>
                <Stack spacing={1}>
                  {suggestions.map(sug => {
                    const rel = sug.relatedDocument
                    return (
                      <Paper key={sug.targetDocumentId} variant='outlined' sx={{ p: 1.5, borderColor: 'info.light' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                              <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                {(rel?.documentType || 'DOC').replace(/_/g, ' ').toUpperCase()}{' '}
                                {rel?.documentNumber ? `N° ${rel.documentNumber}` : `#${sug.targetDocumentId}`}
                              </Typography>
                              <Chip size='small' color='info' label={`${sug.score}% coincidencia`} sx={{ height: 20 }} />
                              {sug.suggestedAppliedAmount !== null && (
                                <Chip
                                  size='small'
                                  variant='outlined'
                                  label={`Imputar ${fmtMoney(sug.suggestedAppliedAmount, doc.currency)}`}
                                  sx={{ height: 20 }}
                                />
                              )}
                            </Box>
                            <Typography variant='caption' color='text.secondary' display='block'>
                              {sug.reasons.join(' · ')}
                            </Typography>
                          </Box>

                          <Button
                            size='small'
                            variant='outlined'
                            color='info'
                            disabled={busyId === `sug-${sug.targetDocumentId}`}
                            onClick={() => handleAcceptSuggestion(sug)}
                            startIcon={<Icon icon='tabler:check' fontSize={15} />}
                          >
                            Confirmar
                          </Button>
                        </Box>
                      </Paper>
                    )
                  })}
                </Stack>
              </Box>
            </>
          )}
        </>
      )}

      <ManualDocumentLinkDialog
        open={manualOpen}
        sourceDocument={doc}
        clientId={doc.clientId}
        alreadyLinkedIds={alreadyLinkedIds}
        onClose={() => setManualOpen(false)}
        onLinked={() => {
          loadLinks()
          onLinksChanged?.()
        }}
      />
    </Stack>
  )
}

export default DocumentLinksPanel
