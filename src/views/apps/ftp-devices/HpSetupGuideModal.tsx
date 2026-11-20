import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { FtpServerInfo } from 'src/types/apps/ftpDeviceTypes'

interface HpSetupGuideModalProps {
  open: boolean
  onClose: () => void
  serverInfo: FtpServerInfo | null
}

const HpSetupGuideModal: React.FC<HpSetupGuideModalProps> = ({ open, onClose, serverInfo }) => {
  const host = serverInfo?.host || 'ftp.tudominio.com'
  const sftpPort = serverInfo?.sftpPort || 2222
  const ftpsPort = serverInfo?.ftpsPort || 21

  const steps = [
    {
      title: '1. Ingresar al panel web (EWS) de la impresora HP',
      desc: 'Desde una PC en la misma red que la HP LaserJet Managed E52645, abrí https://IP-DE-LA-IMPRESORA en el navegador e iniciá sesión como Administrador.'
    },
    {
      title: '2. Abrir Configuración de Escaneado a Carpeta de Red / FTP',
      desc: 'Navegá a la pestaña "Escaneado / Envío digital" -> "Configuración rápida" (Quick Sets) o "Escaneado a carpeta de red" y agregá un nuevo perfil llamado "HelpScan Nube".'
    },
    {
      title: '3. Cargar los datos de conexión segura SFTP (Recomendado)',
      desc: `Seleccioná protocolo SFTP (o FTP con TLS si tu red corporativa solo permite puerto ${ftpsPort}). Host: ${host} • Puerto SFTP: ${sftpPort} • Ruta remota: / (dejar raíz / sin subcarpetas extra).`
    },
    {
      title: '4. Ingresar usuario virtual y contraseña generada',
      desc: 'Usá el botón "Ver Credenciales" del equipo creado en esta pantalla y copiá exactamente el usuario y la contraseña aleatoria.'
    },
    {
      title: '5. Configurar formato PDF y probar acceso',
      desc: 'Configurá Tipo de archivo: PDF (200-300 ppp) y nombre único automático por fecha/hora. Presioná "Verificar acceso". Al escanear, el PDF se cifrará con AES-256 en tu bóveda en menos de 2 segundos.'
    }
  ]

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Icon icon='tabler:printer' fontSize={24} />
        <Box>
          <Typography variant='h6'>Guía Rápida: HP LaserJet Managed E52645 (FutureSmart)</Typography>
          <Typography variant='caption' color='text.secondary'>
            Configuración paso a paso desde el Embedded Web Server (EWS) de HP
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity='info'>
            <strong>Recomendación Helpcopies:</strong> Utilizá <strong>SFTP (Puerto {sftpPort})</strong> siempre que el
            firewall de la oficina lo permita. Viaja completamente cifrado sobre SSH, atraviesa NAT sin puertos pasivos
            y no requiere instalar certificados SSL en la impresora.
          </Alert>

          {steps.map(step => (
            <Box
              key={step.title}
              sx={theme => ({
                p: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.default, 0.45)
              })}
            >
              <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 0.5 }}>
                {step.title}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {step.desc}
              </Typography>
            </Box>
          ))}

          <Divider />

          <Typography variant='caption' color='text.secondary'>
            Firewall saliente requerido en la red del cliente: TCP puerto {sftpPort} (SFTP) hacia {host}
            {ftpsPort ? `, o TCP ${ftpsPort} + puertos pasivos ${serverInfo?.passivePorts || '50000-50100'} si usa FTPS/FTP` : ''}.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant='contained' onClick={onClose}>
          Cerrar Guía
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default HpSetupGuideModal

