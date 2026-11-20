import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useNotificationSocket } from 'src/context/NotificationContext'
import { AppDispatch, RootState } from 'src/store'
import {
  applyWhatsappRealtimeStatus,
  connectWhatsappQr,
  disconnectWhatsappSession,
  fetchWhatsappChannelConfig,
  saveWhatsappChannelSettings
} from 'src/store/apps/channels'
import { WhatsappConnectionStatus, WhatsappRuntimeSnapshot, WhatsappSenderPolicy } from 'src/types/apps/channelTypes'

const STATUS_META: Record<
  WhatsappConnectionStatus,
  { label: string; color: 'success' | 'warning' | 'info' | 'secondary' | 'error' }
> = {
  CONNECTED: { label: 'Conectado', color: 'success' },
  QR_READY: { label: 'Esperando escaneo QR', color: 'info' },
  CONNECTING: { label: 'Conectando...', color: 'warning' },
  DISCONNECTED: { label: 'Desconectado', color: 'secondary' },
  ERROR: { label: 'Error de conexión', color: 'error' }
}

const WhatsappChannelTab: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { socket } = useNotificationSocket()
  const {
    whatsappChannel,
    whatsappRuntime,
    loadingWhatsappConfig,
    savingWhatsappConfig,
    connectingWhatsapp,
    disconnectingWhatsapp
  } = useSelector((state: RootState) => state.channels)

  const [senderPolicy, setSenderPolicy] = useState<WhatsappSenderPolicy>('ALL')
  const [allowedPhones, setAllowedPhones] = useState<string[]>([])
  const [phoneInput, setPhoneInput] = useState('')
  const [ignoreGroups, setIgnoreGroups] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [processImages, setProcessImages] = useState(true)
  const [autoReplyConfirmation, setAutoReplyConfirmation] = useState(true)

  useEffect(() => {
    dispatch(fetchWhatsappChannelConfig())
  }, [dispatch])

  useEffect(() => {
    if (whatsappChannel) {
      setSenderPolicy(whatsappChannel.senderPolicy || 'ALL')
      setAllowedPhones(Array.isArray(whatsappChannel.allowedPhones) ? whatsappChannel.allowedPhones : [])
      setIgnoreGroups(whatsappChannel.ignoreGroups !== false)
      setIsActive(whatsappChannel.isActive)
      setProcessImages(whatsappChannel.processImages)
      setAutoReplyConfirmation(whatsappChannel.autoReplyConfirmation)
    }
  }, [whatsappChannel])

  // Suscripción WebSocket en tiempo real para QR y estado de conexión
  useEffect(() => {
    if (!socket) return

    const handleRealtime = (snapshot: WhatsappRuntimeSnapshot) => {
      dispatch(applyWhatsappRealtimeStatus(snapshot))
      if (snapshot.connectionStatus === 'CONNECTED') {
        toast.success('¡WhatsApp conectado correctamente!')
      }
    }

    socket.on('whatsapp:status', handleRealtime)

    return () => {
      socket.off('whatsapp:status', handleRealtime)
    }
  }, [socket, dispatch])

  const currentStatus: WhatsappConnectionStatus =
    whatsappRuntime?.connectionStatus || whatsappChannel?.connectionStatus || 'DISCONNECTED'
  const qrDataUrl = whatsappRuntime?.qrDataUrl || null
  const connectedPhone = whatsappRuntime?.connectedPhone || whatsappChannel?.connectedPhone || null
  const connectedName = whatsappRuntime?.connectedName || whatsappChannel?.connectedName || null

  // Polling suave mientras espera QR o está conectando (respaldo por si el socket tarda)
  useEffect(() => {
    if (currentStatus !== 'QR_READY' && currentStatus !== 'CONNECTING') {
      return
    }

    const timer = setInterval(() => {
      dispatch(fetchWhatsappChannelConfig())
    }, 3000)

    return () => clearInterval(timer)
  }, [currentStatus, dispatch])

  const handleConnectQr = async () => {
    try {
      await dispatch(connectWhatsappQr()).unwrap()
      toast.success('Código QR solicitado. Escanealo desde tu WhatsApp.')
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo iniciar la sesión de WhatsApp')
    }
  }

  const handleDisconnect = async () => {
    try {
      await dispatch(disconnectWhatsappSession()).unwrap()
      toast.success('Sesión de WhatsApp desconectada')
    } catch (err: any) {
      toast.error(err?.message || 'Error al desconectar WhatsApp')
    }
  }

  const handleAddPhone = () => {
    const clean = phoneInput.replace(/\D+/g, '')
    if (clean.length < 7) {
      toast.error('Ingresá un número completo con código de país (ej: 5491155551234)')

      return
    }
    if (!allowedPhones.includes(clean)) {
      setAllowedPhones(prev => [...prev, clean])
    }
    setPhoneInput('')
  }

  const handleRemovePhone = (phone: string) => {
    setAllowedPhones(prev => prev.filter(p => p !== phone))
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await dispatch(
        saveWhatsappChannelSettings({
          senderPolicy,
          allowedPhones,
          ignoreGroups,
          isActive,
          processImages,
          autoReplyConfirmation
        })
      ).unwrap()
      toast.success('Preferencias de WhatsApp guardadas')
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar las preferencias')
    }
  }

  if (loadingWhatsappConfig && !whatsappChannel && !whatsappRuntime) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const statusMeta = STATUS_META[currentStatus] || STATUS_META.DISCONNECTED
  const lastMsgFormatted = whatsappChannel?.lastMessageAt
    ? new Date(whatsappChannel.lastMessageAt).toLocaleString('es-AR')
    : 'Aún no se recibieron comprobantes'

  return (
    <Grid container spacing={6}>
      {/* Tarjeta superior de Estado */}
      <Grid item xs={12}>
        <Card>
          <CardContent
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: currentStatus === 'CONNECTED' ? 'success.main' : 'secondary.main',
                  color: 'common.white'
                }}
              >
                <Icon icon='tabler:brand-whatsapp' fontSize={28} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                  <Typography variant='h6'>WhatsApp Directo (Conexión por QR)</Typography>
                  <Chip size='small' label={statusMeta.label} color={statusMeta.color} />
                  {connectedPhone && (
                    <Chip
                      size='small'
                      variant='outlined'
                      color='success'
                      label={`${connectedName ? `${connectedName} · ` : ''}+${connectedPhone}`}
                    />
                  )}
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  Último comprobante procesado: <strong>{lastMsgFormatted}</strong>
                  {whatsappChannel?.lastSyncMessage ? ` — ${whatsappChannel.lastSyncMessage}` : ''}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button
                component={Link}
                href='/whatsapp'
                variant='outlined'
                color='secondary'
                startIcon={<Icon icon='tabler:messages' />}
              >
                Ver Mensajes WhatsApp
              </Button>
              {currentStatus === 'CONNECTED' ? (
                <Button
                  variant='outlined'
                  color='error'
                  disabled={disconnectingWhatsapp}
                  onClick={handleDisconnect}
                  startIcon={
                    disconnectingWhatsapp ? (
                      <CircularProgress size={16} color='inherit' />
                    ) : (
                      <Icon icon='tabler:plug-off' />
                    )
                  }
                >
                  {disconnectingWhatsapp ? 'Desconectando...' : 'Desconectar WhatsApp'}
                </Button>
              ) : (
                <Button
                  variant='contained'
                  color='success'
                  disabled={connectingWhatsapp}
                  onClick={handleConnectQr}
                  startIcon={
                    connectingWhatsapp ? (
                      <CircularProgress size={16} color='inherit' />
                    ) : (
                      <Icon icon='tabler:qrcode' />
                    )
                  }
                >
                  {connectingWhatsapp
                    ? 'Generando QR...'
                    : currentStatus === 'QR_READY'
                      ? 'Actualizar QR'
                      : 'Conectar con QR'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Bloque QR / Estado de Conexión + Reglas */}
      <Grid item xs={12} md={5}>
        <Card sx={{ height: '100%' }}>
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              py: 6
            }}
          >
            {currentStatus === 'CONNECTED' ? (
              <>
                <Box
                  sx={theme => ({
                    width: 84,
                    height: 84,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.success.main, 0.14),
                    color: 'success.main',
                    mb: 3
                  })}
                >
                  <Icon icon='tabler:circle-check' fontSize={48} />
                </Box>
                <Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
                  ¡WhatsApp Vinculado y Escuchando!
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                  Todo PDF o fotografía enviada a{' '}
                  <strong>{connectedPhone ? `+${connectedPhone}` : 'tu línea'}</strong> ingresará automáticamente a tu bóveda cifrada y pasará por OCR + Gemini.
                </Typography>
                <Alert severity='success' sx={{ width: '100%', textAlign: 'left' }}>
                  Sesión activa{connectedName ? ` como "${connectedName}"` : ''}. Podés cerrar esta ventana y el servidor seguirá recibiendo archivos las 24 hs.
                </Alert>
              </>
            ) : currentStatus === 'QR_READY' && qrDataUrl ? (
              <>
                <Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
                  Escaneá este Código QR
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                  Abrí WhatsApp en tu celular → <strong>Menú / Ajustes → Dispositivos vinculados → Vincular un dispositivo</strong>
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'common.white',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 3
                  }}
                >
                  <img
                    src={qrDataUrl}
                    alt='Código QR WhatsApp'
                    style={{ width: 240, height: 240, display: 'block' }}
                  />
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  El código se actualiza automáticamente si caduca. Al escanearlo se conectará al instante.
                </Typography>
              </>
            ) : currentStatus === 'CONNECTING' ? (
              <>
                <CircularProgress size={48} sx={{ mb: 3 }} />
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 1 }}>
                  Preparando sesión WhatsApp...
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {whatsappRuntime?.lastError || 'Generando código QR seguro para tu compañía.'}
                </Typography>
              </>
            ) : (
              <>
                <Box
                  sx={theme => ({
                    width: 84,
                    height: 84,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    mb: 3
                  })}
                >
                  <Icon icon='tabler:qrcode' fontSize={44} />
                </Box>
                <Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
                  Conectá tu WhatsApp en 10 segundos
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
                  No necesitás tokens ni configuraciones técnicas. Hacé clic en el botón y escaneá el QR con tu teléfono.
                </Typography>
                {(whatsappRuntime?.lastError || currentStatus === 'ERROR') && (
                  <Alert severity='warning' sx={{ width: '100%', mb: 3, textAlign: 'left' }}>
                    {whatsappRuntime?.lastError || whatsappChannel?.lastSyncMessage || 'La sesión se desconectó.'}
                  </Alert>
                )}
                <Button
                  variant='contained'
                  color='success'
                  size='large'
                  disabled={connectingWhatsapp}
                  onClick={handleConnectQr}
                  startIcon={
                    connectingWhatsapp ? (
                      <CircularProgress size={18} color='inherit' />
                    ) : (
                      <Icon icon='tabler:qrcode' />
                    )
                  }
                >
                  {connectingWhatsapp ? 'Generando QR...' : 'Generar Código QR'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Formulario de Reglas de Recepción */}
      <Grid item xs={12} md={7}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 1 }}>
              Reglas de Recepción y OCR Automático
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
              Definí qué mensajes se procesan como comprobantes y si querés enviar confirmación automática por chat.
            </Typography>

            <form onSubmit={handleSaveSettings}>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label='¿Quiénes pueden enviar comprobantes?'
                    value={senderPolicy}
                    onChange={e => setSenderPolicy(e.target.value as WhatsappSenderPolicy)}
                  >
                    <MenuItem value='ALL'>Cualquier contacto que envíe un PDF o foto</MenuItem>
                    <MenuItem value='WHITELIST'>Solo números autorizados (Lista Blanca)</MenuItem>
                  </TextField>
                </Grid>

                {senderPolicy === 'WHITELIST' && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1.5 }}>
                        Números Autorizados (con código de país sin +, ej: 5491155551234)
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                        <TextField
                          size='small'
                          fullWidth
                          placeholder='5491155551234'
                          value={phoneInput}
                          onChange={e => setPhoneInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddPhone()
                            }
                          }}
                        />
                        <Button variant='outlined' onClick={handleAddPhone}>
                          Agregar
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {allowedPhones.length === 0 ? (
                          <Typography variant='caption' color='warning.main'>
                            Agregá al menos un número autorizado o cambiá a &quot;Cualquier contacto&quot;.
                          </Typography>
                        ) : (
                          allowedPhones.map(phone => (
                            <Chip
                              key={phone}
                              label={`+${phone}`}
                              onDelete={() => handleRemovePhone(phone)}
                              color='primary'
                              variant='outlined'
                            />
                          ))
                        )}
                      </Box>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Switch checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                      }
                      label='Canal activo (reconectar automáticamente al reiniciar el servidor)'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={ignoreGroups}
                          onChange={e => setIgnoreGroups(e.target.checked)}
                        />
                      }
                      label='Ignorar mensajes de grupos de WhatsApp (recomendado)'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={processImages}
                          onChange={e => setProcessImages(e.target.checked)}
                        />
                      }
                      label='Convertir fotos (JPG/PNG) de remitos o tickets a PDF automáticamente para OCR/IA'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoReplyConfirmation}
                          onChange={e => setAutoReplyConfirmation(e.target.checked)}
                        />
                      }
                      label='Responder confirmación automática por WhatsApp con los datos extraídos por IA'
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity='info'>
                    <strong>Tip:</strong> Para mayor orden, te recomendamos vincular una línea administrativa dedicada (ej. <em>WhatsApp Comprobantes</em>) aunque también podés usar cualquier línea WhatsApp Business o estándar.
                  </Alert>
                </Grid>

                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type='submit'
                    variant='contained'
                    color='primary'
                    disabled={savingWhatsappConfig}
                    startIcon={
                      savingWhatsappConfig ? (
                        <CircularProgress size={16} color='inherit' />
                      ) : (
                        <Icon icon='tabler:device-floppy' />
                      )
                    }
                  >
                    {savingWhatsappConfig ? 'Guardando...' : 'Guardar Preferencias'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default WhatsappChannelTab
