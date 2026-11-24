import React, { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from 'src/@core/components/icon'
import { DocumentItem, DocumentPaymentStatus } from 'src/store/apps/documents'

interface DocumentPaymentStatusModalProps {
  open: boolean
  document: DocumentItem | null
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: {
    id: number
    paymentStatus: DocumentPaymentStatus
    paidAt?: string | null
    paymentReference?: string | null
  }) => Promise<void>
}

const PAYMENT_OPTIONS: Array<{ value: DocumentPaymentStatus; label: string }> = [
  { value: 'PENDING', label: 'Pendiente de pago' },
  { value: 'SCHEDULED', label: 'Programado' },
  { value: 'PAID', label: 'Pagado' },
  { value: 'NOT_APPLICABLE', label: 'No aplica (Remito / Legajo)' }
]

export const DocumentPaymentStatusModal: React.FC<DocumentPaymentStatusModalProps> = ({
  open,
  document: doc,
  loading = false,
  onClose,
  onSubmit
}) => {
  const [paymentStatus, setPaymentStatus] = useState<DocumentPaymentStatus>('PENDING')
  const [paidAt, setPaidAt] = useState<string>('')
  const [paymentReference, setPaymentReference] = useState<string>('')

  useEffect(() => {
    if (doc) {
      setPaymentStatus(doc.paymentStatus || 'PENDING')
      setPaidAt(doc.paidAt || new Date().toISOString().slice(0, 10))
      setPaymentReference(doc.paymentReference || '')
    }
  }, [doc])

  if (!doc) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      id: doc.id,
      paymentStatus,
      paidAt: paymentStatus === 'PAID' || paymentStatus === 'SCHEDULED' ? paidAt || null : null,
      paymentReference: paymentReference.trim() || null
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <form onSubmit={handleSave}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Icon icon='tabler:cash' fontSize={22} />
          <span>Estado de Pago del Comprobante</span>
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            <strong>{doc.issuerName || doc.originalName}</strong>
            {doc.documentNumber ? ` · N° ${doc.documentNumber}` : ''}
            {doc.dueDate ? ` · Vto: ${doc.dueDate}` : ''}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size='small'
                label='Estado Administrativo de Pago'
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as DocumentPaymentStatus)}
              >
                {PAYMENT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {(paymentStatus === 'PAID' || paymentStatus === 'SCHEDULED') && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size='small'
                  type='date'
                  label={paymentStatus === 'PAID' ? 'Fecha de Pago' : 'Fecha Programada'}
                  value={paidAt}
                  onChange={e => setPaidAt(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={paymentStatus === 'PAID' || paymentStatus === 'SCHEDULED' ? 6 : 12}>
              <TextField
                fullWidth
                size='small'
                label='Referencia / N° Transferencia o Recibo'
                placeholder='Ej: Transf. Banco Galicia #8842'
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant='outlined' color='secondary' onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color='inherit' /> : <Icon icon='tabler:check' />}
          >
            {loading ? 'Guardando...' : 'Guardar Estado'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default DocumentPaymentStatusModal
