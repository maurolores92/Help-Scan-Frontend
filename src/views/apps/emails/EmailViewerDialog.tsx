import React, { useEffect } from 'react'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { AppDispatch, RootState } from 'src/store'
import {
  clearSelectedEmail,
  fetchEmailMessageDetail,
  rescueEmailToDocument
} from 'src/store/apps/channels'
import { EmailMessageStatus } from 'src/types/apps/channelTypes'

interface EmailViewerDialogProps {
  open: boolean
  emailId: number | null
  onClose: () => void
  onRescued?: (documentId: number) => void
}

const STATUS_META: Record<
  EmailMessageStatus,
  { label: string; color: 'success' | 'info' | 'secondary' | 'error' }
> = {
  PROCESSED: { label: 'Adjunto Procesado', color: 'success' },
  SYNTHESIZED_BODY: { label: 'Generado desde Texto', color: 'info' },
  SKIPPED: { label: 'Omitido (Sin comprobante)', color: 'secondary' },
  ERROR: { label: 'Error de Procesamiento', color: 'error' }
}

const EmailViewerDialog: React.FC<EmailViewerDialogProps> = ({
  open,
  emailId,
  onClose,
  onRescued
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { selectedEmail, loadingEmailDetail, rescuingEmail } = useSelector(
    (state: RootState) => state.channels
  )

  useEffect(() => {
    if (open && emailId) {
      dispatch(fetchEmailMessageDetail(emailId))
    }

    return () => {
      if (!open) {
        dispatch(clearSelectedEmail())
      }
    }
  }, [dispatch, open, emailId])

  const handleRescue = async () => {
    if (!selectedEmail) return
    try {
      const res = await dispatch(rescueEmailToDocument(selectedEmail.id)).unwrap()
      toast.success(res.message || 'Documento generado exitosamente')
      if (onRescued && res.document?.id) {
        onRescued(res.document.id)
      }
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo convertir el correo en documento')
    }
  }

  const meta = selectedEmail ? STATUS_META[selectedEmail.status] : null

  const wrappedHtml = selectedEmail?.bodyHtmlSanitized
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1f2937;margin:16px;word-break:break-word;}img{max-width:100%;}table{border-collapse:collapse;max-width:100%;}a{color:#4f46e5;}</style></head><body>${selectedEmail.bodyHtmlSanitized}</body></html>`
    : null

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='paper'>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 2 }}>
          <Icon icon='tabler:mail-opened' fontSize={22} />
          <Typography variant='h6' noWrap>
            {selectedEmail?.subject || 'Cargando correo...'}
          </Typography>
        </Box>
        <IconButton size='small' onClick={onClose}>
          <Icon icon='tabler:x' />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {loadingEmailDetail || !selectedEmail ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Metadatos del correo */}
            <Paper variant='outlined' sx={{ p: 3, bgcolor: 'background.default' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant='body2'>
                    <strong>De:</strong>{' '}
                    {selectedEmail.senderName
                      ? `${selectedEmail.senderName} <${selectedEmail.senderEmail}>`
                      : selectedEmail.senderEmail}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                    <strong>Recibido:</strong>{' '}
                    {new Date(selectedEmail.receivedAt).toLocaleString('es-AR')}
                  </Typography>
                </Box>

                {meta && <Chip size='small' label={meta.label} color={meta.color} />}
              </Box>

              {selectedEmail.attachmentNames && selectedEmail.attachmentNames.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Adjuntos:
                  </Typography>
                  {selectedEmail.attachmentNames.map((att, i) => (
                    <Chip
                      key={i}
                      size='small'
                      variant='outlined'
                      icon={<Icon icon='tabler:paperclip' fontSize={14} />}
                      label={att}
                    />
                  ))}
                </Box>
              )}
            </Paper>

            {selectedEmail.statusReason && (
              <Alert
                severity={
                  selectedEmail.status === 'ERROR'
                    ? 'error'
                    : selectedEmail.status === 'SKIPPED'
                    ? 'info'
                    : 'success'
                }
              >
                {selectedEmail.statusReason}
              </Alert>
            )}

            {/* Documento vinculado en Bóveda */}
            {selectedEmail.document && (
              <Paper
                variant='outlined'
                sx={{
                  p: 2.5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  borderColor: 'success.main'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Icon icon='tabler:file-check' fontSize={22} />
                  <Box>
                    <Typography variant='subtitle2'>
                      Documento generado en Bóveda: {selectedEmail.document.originalName}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {selectedEmail.document.documentType
                        ? `Tipo: ${selectedEmail.document.documentType.toUpperCase()}`
                        : 'En procesamiento IA'}
                      {selectedEmail.document.totalAmount != null
                        ? ` | Total: $${Number(selectedEmail.document.totalAmount).toLocaleString('es-AR')}`
                        : ''}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  component={Link}
                  href={`/documents?highlight=${selectedEmail.document.id}`}
                  variant='contained'
                  size='small'
                  color='primary'
                  startIcon={<Icon icon='tabler:external-link' />}
                >
                  Ir al Documento PDF
                </Button>
              </Paper>
            )}

            {/* Cuerpo del mensaje */}
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 1.5 }}>
                Contenido del Mensaje
              </Typography>
              {wrappedHtml ? (
                <Paper
                  variant='outlined'
                  sx={{ overflow: 'hidden', bgcolor: '#ffffff', borderRadius: 1 }}
                >
                  <iframe
                    title='email-safe-viewer'
                    sandbox='allow-popups allow-popups-to-escape-sandbox'
                    srcDoc={wrappedHtml}
                    style={{
                      width: '100%',
                      minHeight: 340,
                      border: 'none',
                      display: 'block'
                    }}
                  />
                </Paper>
              ) : (
                <Paper
                  variant='outlined'
                  sx={{
                    p: 3,
                    bgcolor: 'background.default',
                    maxHeight: 360,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem'
                  }}
                >
                  {selectedEmail.bodyText || '(El correo no contiene cuerpo de texto)'}
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 4, py: 2.5, justifyContent: 'space-between' }}>
        <Box>
          {selectedEmail && !selectedEmail.documentId && (
            <Button
              variant='contained'
              color='warning'
              disabled={rescuingEmail}
              onClick={handleRescue}
              startIcon={
                rescuingEmail ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <Icon icon='tabler:file-plus' />
                )
              }
            >
              {rescuingEmail ? 'Generando PDF...' : 'Generar Documento desde este Correo'}
            </Button>
          )}
        </Box>
        <Button variant='outlined' color='secondary' onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EmailViewerDialog
