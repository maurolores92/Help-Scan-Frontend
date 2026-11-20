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
  fetchTelegramChannelConfig,
  saveTelegramChannelConfig,
  testTelegramChannelConnection
} from 'src/store/apps/channels'
import { TelegramSenderPolicy } from 'src/types/apps/channelTypes'
import TelegramSetupGuideModal from './TelegramSetupGuideModal'

const TelegramChannelTab: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const {
    telegramChannel,
    telegramConfigured,
    loadingTelegramConfig,
    savingTelegramConfig,
    testingTelegramConnection
  } = useSelector((state: RootState) => state.channels)

  const [botToken, setBotToken] = useState('')
  const [showBotToken, setShowBotToken] = useState(false)
  const [senderPolicy, setSenderPolicy] = useState<TelegramSenderPolicy>('ALL')
  const [allowedChatIds, setAllowedChatIds] = useState<string[]>([])
  const [chatIdInput, setChatIdInput] = useState('')
  const [ignoreGroups, setIgnoreGroups] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [processImages, setProcessImages] = useState(true)
  const [autoReplyConfirmation, setAutoReplyConfirmation] = useState(true)
  const [guideOpen, setGuideOpen] = useState(false)
  const [testFeedback, setTestFeedback] = useState<{
    severity: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    dispatch(fetchTelegramChannelConfig())
  }, [dispatch])

  useEffect(() => {
    if (telegramChannel) {
      setSenderPolicy(telegramChannel.senderPolicy || 'ALL')
      setAllowedChatIds(
        Array.isArray(telegramChannel.allowedChatIds) ? telegramChannel.allowedChatIds : []
      )
      setIgnoreGroups(Boolean(telegramChannel.ignoreGroups))
      setIsActive(telegramChannel.isActive)
      setProcessImages(telegramChannel.processImages)
      setAutoReplyConfirmation(telegramChannel.autoReplyConfirmation)
    }
  }, [telegramChannel])

  const handleAddChatId = () => {
    const clean = chatIdInput.trim().replace(/^@/, '').toLowerCase()
    if (!clean) {
      toast.error('Ingresá un Chat ID numérico (ej: 847291034) o un @usuario')

      return
    }
    if (!allowedChatIds.includes(clean)) {
      setAllowedChatIds(prev => [...prev, clean])
    }
    setChatIdInput('')
  }

  const handleRemoveChatId = (val: string) => {
    setAllowedChatIds(prev => prev.filter(item => item !== val))
  }

  const handleTestConnection = async () => {
    setTestFeedback(null)

    try {
      const res = await dispatch(
        testTelegramChannelConnection({
          botToken: botToken.trim() || undefined
        })
      ).unwrap()
      setTestFeedback({ severity: 'success', text: res.message })
      toast.success('Bot de Telegram verificado correctamente')
    } catch (err: any) {
      const msg = err?.message || 'No se pudo conectar con Telegram Bot API'
      setTestFeedback({ severity: 'error', text: msg })
      toast.error(msg)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setTestFeedback(null)

    try {
      await dispatch(
        saveTelegramChannelConfig({
          botToken: botToken.trim() || undefined,
          senderPolicy,
          allowedChatIds,
          ignoreGroups,
          isActive,
          processImages,
          autoReplyConfirmation
        })
      ).unwrap()

      setBotToken('')
      toast.success('Bot de Telegram guardado y conectado correctamente')
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar la configuración de Telegram')
    }
  }

  if (loadingTelegramConfig && !telegramChannel) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const lastMsgFormatted = telegramChannel?.lastMessageAt
    ? new Date(telegramChannel.lastMessageAt).toLocaleString('es-AR')
    : 'Aún no se recibieron comprobantes'

  return (
    <>
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
                    bgcolor: 'info.main',
                    color: 'common.white'
                  }}
                >
                  <Icon icon='tabler:brand-telegram' fontSize={28} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant='h6'>Telegram Bot Corporativo (@BotFather)</Typography>
                    {telegramConfigured ? (
                      <Chip
                        size='small'
                        label={telegramChannel?.isActive ? 'Activo' : 'Pausado'}
                        color={telegramChannel?.isActive ? 'success' : 'secondary'}
                      />
                    ) : (
                      <Chip size='small' label='Sin configurar' color='warning' />
                    )}
                    {telegramChannel?.botUsername && (
                      <Chip
                        size='small'
                        variant='outlined'
                        color='info'
                        label={`@${telegramChannel.botUsername}`}
                      />
                    )}
                    {telegramChannel?.lastSyncStatus === 'ERROR' && (
                      <Chip size='small' label='Error de conexión' color='error' />
                    )}
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    Último comprobante recibido: <strong>{lastMsgFormatted}</strong>
                    {telegramChannel?.lastSyncMessage ? ` — ${telegramChannel.lastSyncMessage}` : ''}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Button
                  variant='outlined'
                  color='info'
                  startIcon={<Icon icon='tabler:book' />}
                  onClick={() => setGuideOpen(true)}
                >
                  Guía Paso a Paso
                </Button>
                {telegramChannel?.botUsername && (
                  <Button
                    component='a'
                    href={`https://t.me/${telegramChannel.botUsername}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    variant='outlined'
                    color='primary'
                    startIcon={<Icon icon='tabler:external-link' />}
                  >
                    Abrir Bot
                  </Button>
                )}
                <Button
                  component={Link}
                  href='/telegram'
                  variant='outlined'
                  color='secondary'
                  startIcon={<Icon icon='tabler:messages' />}
                >
                  Ver Mensajes Telegram
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
                Conectar Bot Propio de Telegram
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
                Pegá el Token generado con <strong>@BotFather</strong> para que todo PDF o foto enviada a ese bot ingrese directo a tu bóveda y pase por OCR + Gemini.
              </Typography>

              {testFeedback && (
                <Alert severity={testFeedback.severity} sx={{ mb: 4 }}>
                  {testFeedback.text}
                </Alert>
              )}

              <form onSubmit={handleSave}>
                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required={!telegramChannel?.hasBotToken}
                      type={showBotToken ? 'text' : 'password'}
                      label={
                        telegramChannel?.hasBotToken
                          ? 'Bot Token de @BotFather (dejar vacío para mantener)'
                          : 'Bot Token de @BotFather'
                      }
                      placeholder={
                        telegramChannel?.hasBotToken
                          ? '••••••••••••••••••••••••••••••••'
                          : '7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                      }
                      value={botToken}
                      onChange={e => setBotToken(e.target.value)}
                      helperText='El token se cifra con AES-256-GCM en la base de datos.'
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setShowBotToken(prev => !prev)}
                            >
                              <Icon icon={showBotToken ? 'tabler:eye-off' : 'tabler:eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label='¿Quiénes pueden enviar comprobantes a este bot?'
                      value={senderPolicy}
                      onChange={e => setSenderPolicy(e.target.value as TelegramSenderPolicy)}
                    >
                      <MenuItem value='ALL'>Cualquier chat o grupo donde esté el bot</MenuItem>
                      <MenuItem value='WHITELIST'>Solo Chat IDs o @usuarios autorizados (Recomendado)</MenuItem>
                    </TextField>
                  </Grid>

                  {senderPolicy === 'WHITELIST' && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
                          Chats / Usuarios Autorizados (Chat ID numérico o @usuario)
                        </Typography>
                        <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 2 }}>
                          Tip: Escribí <code>/id</code> en el chat o grupo con tu bot y te responderá su Chat ID exacto.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                          <TextField
                            size='small'
                            fullWidth
                            placeholder='Ej: 847291034, -100192837465 o @juan_admin'
                            value={chatIdInput}
                            onChange={e => setChatIdInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddChatId()
                              }
                            }}
                          />
                          <Button variant='outlined' onClick={handleAddChatId}>
                            Agregar
                          </Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {allowedChatIds.length === 0 ? (
                            <Typography variant='caption' color='warning.main'>
                              Agregá al menos un Chat ID o @usuario autorizado, o cambiá a modo abierto.
                            </Typography>
                          ) : (
                            allowedChatIds.map(item => (
                              <Chip
                                key={item}
                                label={item}
                                onDelete={() => handleRemoveChatId(item)}
                                color='info'
                                variant='outlined'
                              />
                            ))
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <FormControlLabel
                        control={
                          <Switch checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                        }
                        label='Activar escucha automática del bot en segundo plano'
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={ignoreGroups}
                            onChange={e => setIgnoreGroups(e.target.checked)}
                          />
                        }
                        label='Ignorar mensajes enviados desde grupos (permitir solo chats privados)'
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={processImages}
                            onChange={e => setProcessImages(e.target.checked)}
                          />
                        }
                        label='Convertir fotos (JPG/PNG) de tickets o remitos a PDF automáticamente para OCR/IA'
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={autoReplyConfirmation}
                            onChange={e => setAutoReplyConfirmation(e.target.checked)}
                          />
                        }
                        label='Enviar acuse de recibo inmediato ("esperando validación") y resumen al finalizar OCR'
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                    <Button
                      type='button'
                      variant='outlined'
                      color='info'
                      disabled={testingTelegramConnection || savingTelegramConfig}
                      onClick={handleTestConnection}
                      startIcon={
                        testingTelegramConnection ? (
                          <CircularProgress size={16} color='inherit' />
                        ) : (
                          <Icon icon='tabler:plug-connected' />
                        )
                      }
                    >
                      {testingTelegramConnection ? 'Probando...' : 'Probar Conexión'}
                    </Button>

                    <Button
                      type='submit'
                      variant='contained'
                      color='primary'
                      disabled={savingTelegramConfig || testingTelegramConnection}
                      startIcon={
                        savingTelegramConfig ? (
                          <CircularProgress size={16} color='inherit' />
                        ) : (
                          <Icon icon='tabler:device-floppy' />
                        )
                      }
                    >
                      {savingTelegramConfig ? 'Guardando...' : 'Guardar Configuración'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel lateral de ayuda y guía */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Icon icon='tabler:shield-lock' fontSize={22} />
                <Typography variant='h6'>Seguridad y Cifrado</Typography>
              </Box>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Tu Bot Token se cifra con algoritmo <strong>AES-256-GCM</strong> antes de guardarse en PostgreSQL.
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Como los bots de Telegram son buscables públicamente por nombre, te recomendamos activar la <strong>Lista Blanca</strong> de Chat IDs si no querés recibir archivos de desconocidos.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Icon icon='tabler:help-circle' fontSize={22} />
                <Typography variant='h6'>¿Cómo creo mi Bot?</Typography>
              </Box>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                En Telegram buscá a <strong>@BotFather</strong>, enviá el comando <code>/newbot</code>, elegí un nombre y copiá el token que te entrega.
              </Typography>
              <Button
                fullWidth
                variant='outlined'
                color='primary'
                startIcon={<Icon icon='tabler:list-check' />}
                onClick={() => setGuideOpen(true)}
              >
                Abrir Guía Paso a Paso
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TelegramSetupGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}

export default TelegramChannelTab
