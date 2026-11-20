import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import LoadingButton from '@mui/lab/LoadingButton'
import Icon from 'src/@core/components/icon'
import {
  DEMO_STATUS_OPTIONS,
  DemoRequestStatus,
  DemoRequestType
} from 'src/types/apps/demoRequestTypes'

interface DemoStatusModalProps {
  open: boolean
  demo: DemoRequestType | null
  saving: boolean
  onClose: () => void
  onConfirm: (id: number, status: DemoRequestStatus, notes: string) => Promise<void>
}

const DemoStatusModal: React.FC<DemoStatusModalProps> = ({
  open,
  demo,
  saving,
  onClose,
  onConfirm
}) => {
  const [status, setStatus] = useState<DemoRequestStatus>('RECIBIDO')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    if (demo) {
      setStatus(demo.status || 'RECIBIDO')
      setNotes(demo.notes || '')
    }
  }, [demo])

  if (!demo) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onConfirm(demo.id, status, notes)
    onClose()
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth='xs' fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Icon icon='tabler:exchange' fontSize={22} />
          <span>Cambiar Estado de Demo</span>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant='body2' fontWeight={700} color='text.primary'>
              {demo.fullName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {demo.companyName} · {demo.email}
            </Typography>
          </Box>

          <FormControl fullWidth size='small'>
            <InputLabel id='demo-status-modal-select'>Nuevo Estado</InputLabel>
            <Select
              labelId='demo-status-modal-select'
              label='Nuevo Estado'
              value={status}
              onChange={e => setStatus(e.target.value as DemoRequestStatus)}
            >
              {DEMO_STATUS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip size='small' label={opt.label} color={opt.color} sx={{ height: 22 }} />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label='Notas de seguimiento (opcional)'
            placeholder='Ej: Contactado por WhatsApp, coordinamos demo para mañana...'
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving} color='secondary'>
            Cancelar
          </Button>
          <LoadingButton type='submit' variant='contained' loading={saving}>
            Guardar Estado
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default DemoStatusModal
