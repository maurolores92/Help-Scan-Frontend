import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

interface TelegramSetupGuideModalProps {
  open: boolean
  onClose: () => void
}

const TelegramSetupGuideModal: React.FC<TelegramSetupGuideModalProps> = ({ open, onClose }) => {
  const steps = [
    {
      title: '1. Abrir @BotFather en Telegram',
      desc: 'Desde tu celular o Telegram Desktop, buscá el usuario oficial @BotFather (tiene el tilde azul de verificación) y presioná "Iniciar".'
    },
    {
      title: '2. Crear el bot exclusivo de tu empresa',
      desc: 'Escribí el comando /newbot y envialo. @BotFather te pedirá primero un nombre visible (ej: "Comprobantes MiEmpresa") y luego un username terminado en "bot" (ej: "miempresa_scan_bot").'
    },
    {
      title: '3. Copiar el HTTP API Token',
      desc: 'Al finalizar, @BotFather te responderá un mensaje con el token de acceso (tiene formato similar a 7123456789:AAH...xyz). Copiá ese código completo.'
    },
    {
      title: '4. Pegarlo en HC-SCAN y probar la conexión',
      desc: 'Pegá el Bot Token en el formulario de esta pantalla, presioná "Probar Conexión" para verificar el nombre de tu bot y luego hacé clic en "Guardar Configuración".'
    },
    {
      title: '5. (Opcional) Restringir quiénes pueden enviar PDFs',
      desc: 'Si querés que solo empleados o grupos autorizados envíen comprobantes, elegí "Solo chats/usuarios autorizados". Podés escribirle /id a tu bot en Telegram y el bot te responderá el número de Chat ID listo para pegar aquí.'
    }
  ]

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Icon icon='tabler:brand-telegram' fontSize={26} />
        <Box>
          <Typography variant='h6'>Guía Rápida: Crear Bot Propio en Telegram (@BotFather)</Typography>
          <Typography variant='caption' color='text.secondary'>
            En menos de 1 minuto tu compañía tendrá su propio bot privado sin costos ni aprobaciones externas
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity='info'>
            <strong>100% Oficial y Gratuito:</strong> Telegram no cobra por mensajes ni requiere servidores externos. Podés enviar archivos PDF sin comprimir o fotos directamente al bot (o agregar el bot a un grupo de trabajo de tu empresa).
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

export default TelegramSetupGuideModal
