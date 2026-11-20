import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import LoadingButton from '@mui/lab/LoadingButton'
import Icon from 'src/@core/components/icon'
import {
  DEMO_STATUS_MAP,
  DEMO_STATUS_OPTIONS,
  DemoRequestStatus,
  DemoRequestType
} from 'src/types/apps/demoRequestTypes'

interface DemoDetailDialogProps {
  open: boolean
  demo: DemoRequestType | null
  saving: boolean
  onClose: () => void
  onSave: (id: number, status: DemoRequestStatus, notes: string) => Promise<void>
}

const DemoDetailDialog: React.FC<DemoDetailDialogProps> = ({
  open,
  demo,
  saving,
  onClose,
  onSave
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

  const statusMeta = DEMO_STATUS_MAP[demo.status] || DEMO_STATUS_MAP.RECIBIDO

  const handleSave = async () => {
    await onSave(demo.id, status, notes)
    onClose()
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Icon icon='tabler:presentation-analytics' fontSize={22} />
          <span>Solicitud de Demo #{demo.id}</span>
        </Box>
        <Chip size='small' label={statusMeta.label} color={statusMeta.color} />
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Typography variant='caption' color='text.secondary'>
              Nombre y Apellido
            </Typography>
            <Typography variant='body1' fontWeight={700}>
              {demo.fullName}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant='caption' color='text.secondary'>
              Empresa / Razón Social
            </Typography>
            <Typography variant='body1' fontWeight={700}>
              {demo.companyName}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant='caption' color='text.secondary'>
              Correo Electrónico
            </Typography>
            <Typography variant='body2' fontWeight={600}>
              <a href={`mailto:${demo.email}`} style={{ color: 'inherit' }}>
                {demo.email}
              </a>
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant='caption' color='text.secondary'>
              Teléfono / WhatsApp
            </Typography>
            <Typography variant='body2'>{demo.phone || 'No especificado'}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant='caption' color='text.secondary'>
              Sistema de Gestión
            </Typography>
            <Typography variant='body2' fontWeight={600}>
              {demo.managementSystem || 'No especificado'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant='caption' color='text.secondary'>
              Demo / Origen
            </Typography>
            <Typography variant='body2'>
              {demo.selectedDemo || 'Solicitud general'} ({demo.source})
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant='caption' color='text.secondary'>
              Mensaje del Cliente
            </Typography>
            <Box
              sx={{
                mt: 0.75,
                p: 2,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                {demo.message || 'Sin mensaje adicional.'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 0.5 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth size='small'>
              <InputLabel id='demo-status-label'>Estado Comercial</InputLabel>
              <Select
                labelId='demo-status-label'
                label='Estado Comercial'
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
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label='Notas internas de seguimiento'
              placeholder='Ej: Llamado realizado el 20/11, coordinamos demo para el martes 15hs...'
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} color='secondary'>
          Cerrar
        </Button>
        <LoadingButton variant='contained' loading={saving} onClick={handleSave}>
          Guardar cambios
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}

export default DemoDetailDialog
