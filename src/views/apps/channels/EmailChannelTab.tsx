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
  IconButton,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { AppDispatch, RootState } from 'src/store'
import {
  fetchEmailChannelConfig,
  regenerateEmailWebhookSecret,
  saveEmailChannelConfig,
  syncEmailChannelNow,
  testEmailChannelConnection
} from 'src/store/apps/channels'
import { EmailProviderType } from 'src/types/apps/channelTypes'
import { getApiBaseUrl } from 'src/utils/api-url'

const PROVIDER_PRESETS: Record<
  EmailProviderType,
  { label: string; host: string; port: number; secure: boolean; icon: string }
> = {
  GMAIL: {
    label: 'Gmail / Google Workspace',
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    icon: 'tabler:brand-google'
  },
  OUTLOOK: {
    label: 'Outlook / Microsoft 365',
    host: 'outlook.office365.com',
    port: 993,
    secure: true,
    icon: 'tabler:brand-windows'
  },
  CUSTOM: {
    label: 'Servidor Propio / cPanel',
    host: '',
    port: 993,
    secure: true,
    icon: 'tabler:server'
  }
}

const EmailChannelTab: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const {
    emailChannel,
    emailConfigured,
    loadingConfig,
    savingConfig,
    testingConnection,
    syncing
  } = useSelector((state: RootState) => state.channels)

  const [provider, setProvider] = useState<EmailProviderType>('GMAIL')
  const [host, setHost] = useState('imap.gmail.com')
  const [port, setPort] = useState<number>(993)
  const [secure, setSecure] = useState(true)
  const [emailUser, setEmailUser] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [folder, setFolder] = useState('INBOX')
  const [isActive, setIsActive] = useState(true)
  const [processBodyWithoutAttachments, setProcessBodyWithoutAttachments] = useState(true)
  const [markAsRead, setMarkAsRead] = useState(true)
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState<number>(5)
  const [testFeedback, setTestFeedback] = useState<{
    severity: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    dispatch(fetchEmailChannelConfig())
  }, [dispatch])

  useEffect(() => {
    if (emailChannel) {
      setProvider(emailChannel.provider || 'CUSTOM')
      setHost(emailChannel.host || '')
      setPort(emailChannel.port || 993)
      setSecure(emailChannel.secure !== false)
      setEmailUser(emailChannel.emailUser || '')
      setFolder(emailChannel.folder || 'INBOX')
      setIsActive(emailChannel.isActive)
      setProcessBodyWithoutAttachments(emailChannel.processBodyWithoutAttachments)
      setMarkAsRead(emailChannel.markAsRead)
      setSyncIntervalMinutes(emailChannel.syncIntervalMinutes || 5)
    }
  }, [emailChannel])

  const handleSelectProvider = (selected: EmailProviderType) => {
    setProvider(selected)
    const preset = PROVIDER_PRESETS[selected]
    if (preset.host) {
      setHost(preset.host)
    }
    setPort(preset.port)
    setSecure(preset.secure)
    setTestFeedback(null)
  }

  const webhookUrl =
    emailChannel?.companyId && emailChannel?.webhookSecret
      ? `${getApiBaseUrl()}/channels/email/webhook/${emailChannel.companyId}?token=${emailChannel.webhookSecret}`
      : ''

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copiado al portapapeles`)
    } catch {
      toast.error('No se pudo copiar automáticamente')
    }
  }

  const handleRegenerateSecret = async () => {
    try {
      await dispatch(regenerateEmailWebhookSecret()).unwrap()
      toast.success('Token del webhook regenerado correctamente')
    } catch (err: any) {
      toast.error(err?.message || 'Error al regenerar el token del webhook')
    }
  }

  const handleTestConnection = async () => {
    setTestFeedback(null)
    if (!host.trim() || !emailUser.trim()) {
      setTestFeedback({
        severity: 'error',
        text: 'Completa el servidor IMAP y el correo electrónico antes de probar.'
      })

      return
    }

    try {
      const result = await dispatch(
        testEmailChannelConnection({
          host: host.trim(),
          port: Number(port) || 993,
          secure,
          emailUser: emailUser.trim(),
          password: password || undefined,
          folder: folder.trim() || 'INBOX'
        })
      ).unwrap()

      setTestFeedback({
        severity: 'success',
        text: result.message
      })
      toast.success('Conexión IMAP verificada correctamente')
    } catch (err: any) {
      const msg = err?.message || 'No se pudo conectar al servidor IMAP'
      setTestFeedback({
        severity: 'error',
        text: msg
      })
      toast.error(msg)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setTestFeedback(null)

    try {
      await dispatch(
        saveEmailChannelConfig({
          provider,
          host: host.trim(),
          port: Number(port) || 993,
          secure,
          emailUser: emailUser.trim(),
          password: password.trim() || undefined,
          folder: folder.trim() || 'INBOX',
          isActive,
          processBodyWithoutAttachments,
          markAsRead,
          syncIntervalMinutes: Number(syncIntervalMinutes) || 5
        })
      ).unwrap()

      setPassword('')
      toast.success('Configuración de correo electrónico guardada')
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar configuración de correo')
    }
  }

  const handleSyncNow = async () => {
    try {
      const res = await dispatch(syncEmailChannelNow()).unwrap()
      toast.success(res.message || 'Sincronización finalizada')
      dispatch(fetchEmailChannelConfig())
    } catch (err: any) {
      toast.error(err?.message || 'Error al sincronizar el buzón de correo')
      dispatch(fetchEmailChannelConfig())
    }
  }

  if (loadingConfig && !emailChannel) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const lastSyncFormatted = emailChannel?.lastSyncAt
    ? new Date(emailChannel.lastSyncAt).toLocaleString('es-AR')
    : 'Nunca sincronizado'

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
                  bgcolor: 'primary.main',
                  color: 'common.white'
                }}
              >
                <Icon icon='tabler:mail-fast' fontSize={26} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                  <Typography variant='h6'>Buzón de Ingesta Automática (IMAP)</Typography>
                  {emailConfigured ? (
                    <Chip
                      size='small'
                      label={emailChannel?.isActive ? 'Activo' : 'Pausado'}
                      color={emailChannel?.isActive ? 'success' : 'secondary'}
                    />
                  ) : (
                    <Chip size='small' label='Sin configurar' color='warning' />
                  )}
                  {emailChannel?.lastSyncStatus === 'ERROR' && (
                    <Chip size='small' label='Error de última sincronización' color='error' />
                  )}
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  Última revisión: <strong>{lastSyncFormatted}</strong>
                  {emailChannel?.lastSyncMessage ? ` — ${emailChannel.lastSyncMessage}` : ''}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button
                component={Link}
                href='/emails'
                variant='outlined'
                color='secondary'
                startIcon={<Icon icon='tabler:mail-opened' />}
              >
                Ver Correos Recibidos
              </Button>
              <Button
                variant='contained'
                color='primary'
                disabled={!emailConfigured || syncing}
                onClick={handleSyncNow}
                startIcon={
                  syncing ? (
                    <CircularProgress size={16} color='inherit' />
                  ) : (
                    <Icon icon='tabler:refresh' />
                  )
                }
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Formulario principal */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 1 }}>
              Conectar Casilla de Correo
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
              Selecciona tu proveedor de correo electrónico o ingresa tus parámetros IMAP seguros.
            </Typography>

            {/* Botones rápidos de proveedor */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 5 }}>
              {(Object.keys(PROVIDER_PRESETS) as EmailProviderType[]).map(key => {
                const preset = PROVIDER_PRESETS[key]
                const isSelected = provider === key

                return (
                  <Button
                    key={key}
                    variant={isSelected ? 'contained' : 'outlined'}
                    color={isSelected ? 'primary' : 'secondary'}
                    startIcon={<Icon icon={preset.icon} />}
                    onClick={() => handleSelectProvider(key)}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </Box>

            {testFeedback && (
              <Alert severity={testFeedback.severity} sx={{ mb: 4 }}>
                {testFeedback.text}
              </Alert>
            )}

            <form onSubmit={handleSave}>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    required
                    label='Servidor IMAP (Host)'
                    placeholder='imap.gmail.com o mail.tuempresa.com'
                    value={host}
                    onChange={e => setHost(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    required
                    type='number'
                    label='Puerto IMAP'
                    value={port}
                    onChange={e => setPort(Number(e.target.value))}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type='email'
                    label='Correo Electrónico'
                    placeholder='facturas@miempresa.com'
                    value={emailUser}
                    onChange={e => setEmailUser(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required={!emailChannel?.hasPassword}
                    type={showPassword ? 'text' : 'password'}
                    label={
                      emailChannel?.hasPassword
                        ? 'Contraseña / App Password (dejar vacío para mantener)'
                        : 'Contraseña / Contraseña de Aplicación'
                    }
                    placeholder={emailChannel?.hasPassword ? '••••••••••••••••' : 'Ingresa tu clave'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={() => setShowPassword(prev => !prev)}
                            aria-label='Mostrar u ocultar contraseña'
                          >
                            <Icon icon={showPassword ? 'tabler:eye-off' : 'tabler:eye'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Carpeta a Monitorear'
                    value={folder}
                    onChange={e => setFolder(e.target.value)}
                    helperText='Por defecto: INBOX'
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label='Frecuencia de Revisión Automática'
                    value={syncIntervalMinutes}
                    onChange={e => setSyncIntervalMinutes(Number(e.target.value))}
                  >
                    <MenuItem value={2}>Cada 2 minutos</MenuItem>
                    <MenuItem value={5}>Cada 5 minutos (Recomendado)</MenuItem>
                    <MenuItem value={10}>Cada 10 minutos</MenuItem>
                    <MenuItem value={15}>Cada 15 minutos</MenuItem>
                    <MenuItem value={30}>Cada 30 minutos</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isActive}
                          onChange={e => setIsActive(e.target.checked)}
                        />
                      }
                      label='Activar sincronización automática en segundo plano'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={secure}
                          onChange={e => setSecure(e.target.checked)}
                        />
                      }
                      label='Usar conexión cifrada SSL/TLS (Recomendado puerto 993)'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={processBodyWithoutAttachments}
                          onChange={e => setProcessBodyWithoutAttachments(e.target.checked)}
                        />
                      }
                      label='Generar comprobante PDF automáticamente si el texto del correo es un recibo/transferencia (sin adjunto)'
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={markAsRead}
                          onChange={e => setMarkAsRead(e.target.checked)}
                        />
                      }
                      label='Marcar correos procesados como leídos en la casilla (sin eliminar ningún correo)'
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  <Button
                    type='button'
                    variant='outlined'
                    color='info'
                    disabled={testingConnection || savingConfig}
                    onClick={handleTestConnection}
                    startIcon={
                      testingConnection ? (
                        <CircularProgress size={16} color='inherit' />
                      ) : (
                        <Icon icon='tabler:plug-connected' />
                      )
                    }
                  >
                    {testingConnection ? 'Probando...' : 'Probar Conexión'}
                  </Button>

                  <Button
                    type='submit'
                    variant='contained'
                    color='primary'
                    disabled={savingConfig || testingConnection}
                    startIcon={
                      savingConfig ? (
                        <CircularProgress size={16} color='inherit' />
                      ) : (
                        <Icon icon='tabler:device-floppy' />
                      )
                    }
                  >
                    {savingConfig ? 'Guardando...' : 'Guardar Configuración'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Panel lateral de Webhook en vivo, ayuda y seguridad */}
      <Grid item xs={12} md={4}>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Icon icon='tabler:webhook' fontSize={22} color='#32A048' />
              <Typography variant='h6'>Webhook & Tiempo Real</Typography>
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Además de la escucha automática por <strong>IMAP IDLE</strong> (sin apretar Sincronizar), podés enviar correos al instante mediante Webhook HTTP y recibir notificaciones WebSocket en vivo.
            </Typography>

            {webhookUrl ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Endpoint Webhook (POST JSON)'
                  value={webhookUrl}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          size='small'
                          onClick={() => handleCopyText(webhookUrl, 'URL de Webhook')}
                          aria-label='Copiar URL de Webhook'
                        >
                          <Icon icon='tabler:copy' fontSize={17} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size='small'
                    variant='outlined'
                    startIcon={<Icon icon='tabler:key' />}
                    onClick={() =>
                      handleCopyText(emailChannel?.webhookSecret || '', 'Header x-webhook-secret')
                    }
                  >
                    Copiar Token
                  </Button>
                  <Button
                    size='small'
                    variant='text'
                    color='secondary'
                    startIcon={<Icon icon='tabler:refresh' />}
                    onClick={handleRegenerateSecret}
                  >
                    Regenerar
                  </Button>
                </Box>
              </Box>
            ) : (
              <Alert severity='info'>
                Guardá primero la configuración de correo para generar la URL y token de Webhook de tu compañía.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Icon icon='tabler:shield-lock' fontSize={22} />
              <Typography variant='h6'>Seguridad y Cifrado</Typography>
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Tu contraseña IMAP se cifra con algoritmo militar <strong>AES-256-GCM</strong> antes de guardarse.
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Los archivos PDF recibidos se almacenan directamente en la bóveda cifrada de tu compañía dentro del servidor VPS y pasan al instante por OCR e IA.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Icon icon='tabler:help-circle' fontSize={22} />
              <Typography variant='h6'>¿Usas Gmail o Outlook?</Typography>
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Si tienes activada la verificación en 2 pasos, no uses tu contraseña habitual:
            </Typography>
            <Typography variant='body2' color='text.secondary' component='div'>
              <ol style={{ paddingLeft: 18, margin: 0 }}>
                <li style={{ marginBottom: 6 }}>
                  Ingresa a la seguridad de tu cuenta de Google o Microsoft.
                </li>
                <li style={{ marginBottom: 6 }}>
                  Busca <strong>Contraseñas de aplicaciones (App Passwords)</strong>.
                </li>
                <li>
                  Genera una clave para <em>HC-Scan</em> (16 caracteres) y pégala en el campo contraseña.
                </li>
              </ol>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default EmailChannelTab
