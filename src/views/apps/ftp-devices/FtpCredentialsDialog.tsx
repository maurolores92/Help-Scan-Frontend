import React, { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { FtpCredentialsPayload } from 'src/types/apps/ftpDeviceTypes'

interface FtpCredentialsDialogProps {
  open: boolean
  onClose: () => void
  credentials: FtpCredentialsPayload | null
  isNewOrRotated?: boolean
}

const FtpCredentialsDialog: React.FC<FtpCredentialsDialogProps> = ({
  open,
  onClose,
  credentials,
  isNewOrRotated = false
}) => {
  const [showPassword, setShowPassword] = useState(isNewOrRotated)

  if (!credentials) return null

  const copyField = async (label: string, value: string | number) => {
    try {
      await navigator.clipboard.writeText(String(value))
      toast.success(`${label} copiado al portapapeles`)
    } catch {
      toast.error('No se pudo copiar al portapapeles')
    }
  }

  const rows = [
    { label: 'Protocolo recomendado', value: credentials.protocol, secret: false },
    { label: 'Servidor / Host', value: credentials.host, secret: false },
    { label: 'Puerto', value: String(credentials.port), secret: false },
    { label: 'Usuario virtual aislado', value: credentials.username, secret: false },
    { label: 'Contraseña de equipo', value: credentials.password, secret: true },
    { label: 'Ruta / Carpeta remota en EWS', value: credentials.remotePath || '/', secret: false }
  ]

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Icon icon='tabler:key' fontSize={22} />
          <Box>
            <Typography variant='h6'>Credenciales de Conexión HP</Typography>
            <Typography variant='caption' color='text.secondary'>
              {credentials.deviceName} • {credentials.deviceModel || 'HP LaserJet Managed E52645'}
            </Typography>
          </Box>
        </Box>
        <Chip label={credentials.protocol} color='primary' size='small' variant='outlined' />
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity={isNewOrRotated ? 'success' : 'info'}>
            Este usuario virtual queda confinado (chroot) exclusivamente a{' '}
            <strong>{credentials.inboxRelativePath}</strong>. No puede listar, descargar ni borrar archivos en la bóveda
            cifrada.
          </Alert>

          {rows.map(row => (
            <Box
              key={row.label}
              sx={theme => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.25,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.primary.main, 0.03)
              })}
            >
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                  {row.label}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}
                >
                  {row.secret && !showPassword ? '••••••••••••••••••••' : row.value}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                {row.secret && (
                  <Tooltip title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    <IconButton size='small' onClick={() => setShowPassword(prev => !prev)}>
                      <Icon icon={showPassword ? 'tabler:eye-off' : 'tabler:eye'} fontSize={18} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={`Copiar ${row.label}`}>
                  <IconButton size='small' onClick={() => copyField(row.label, row.value)}>
                    <Icon icon='tabler:copy' fontSize={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant='contained' onClick={onClose}>
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FtpCredentialsDialog

