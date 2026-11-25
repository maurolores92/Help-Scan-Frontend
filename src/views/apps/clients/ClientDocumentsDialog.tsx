import React from 'react'
import { useRouter } from 'next/router'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import StatusChip from 'src/components/common/StatusChip'
import { ClientItem } from 'src/types/apps/clientTypes'

interface ClientDocumentsDialogProps {
  open: boolean
  client: ClientItem | null
  loading?: boolean
  syncing?: boolean
  onClose: () => void
  onSyncDocuments: (clientId: number) => Promise<void>
}

export const ClientDocumentsDialog: React.FC<ClientDocumentsDialogProps> = ({
  open,
  client,
  loading = false,
  syncing = false,
  onClose,
  onSyncDocuments
}) => {
  const router = useRouter()

  if (!client) return null

  const docs = client.documents || []

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Icon icon='tabler:files' fontSize={22} />
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant='h6' noWrap>
              Documentos Asociados — {client.name}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              CUIT / CUIL: {client.taxId || 'Pendiente de completar'} · Total vinculados:{' '}
              {client.documentsCount ?? docs.length}
            </Typography>
          </Box>
        </Box>

        <Button
          size='small'
          variant='outlined'
          color='info'
          disabled={syncing || loading}
          startIcon={syncing ? <CircularProgress size={14} color='inherit' /> : <Icon icon='tabler:refresh' />}
          onClick={() => onSyncDocuments(client.id)}
        >
          {syncing ? 'Buscando...' : 'Buscar por CUIL'}
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ px: 3, py: 2, bgcolor: 'action.hover', display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {client.taxCondition && <Chip size='small' variant='outlined' label={`IVA: ${client.taxCondition}`} />}
          {client.iibbNumber && <Chip size='small' variant='outlined' label={`IIBB: ${client.iibbNumber}`} />}
          {client.paymentTerms && <Chip size='small' variant='outlined' label={`Condición: ${client.paymentTerms}`} />}
          {client.contactName && <Chip size='small' variant='outlined' label={`Contacto: ${client.contactName}`} />}
          {(client.address || client.city || client.province) && (
            <Chip
              size='small'
              variant='outlined'
              label={[client.address, client.city, client.province].filter(Boolean).join(', ')}
            />
          )}
          {client.email && <Chip size='small' variant='outlined' label={client.email} />}
          {client.phone && <Chip size='small' variant='outlined' label={client.phone} />}
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : docs.length === 0 ? (
          <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Todavía no hay comprobantes vinculados al CUIT/CUIL {client.taxId}.
            </Typography>
          </Box>
        ) : (
          <Box>
            {docs.map((doc, idx) => (
              <React.Fragment key={doc.id}>
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap'
                  }}
                >
                  <Box sx={{ overflow: 'hidden', flex: 1, minWidth: 220 }}>
                    <Typography variant='body2' noWrap sx={{ fontWeight: 600 }}>
                      {(doc.documentType || 'DOCUMENTO').replace(/_/g, ' ').toUpperCase()}
                      {doc.documentNumber ? ` · N° ${doc.documentNumber}` : ''}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' noWrap display='block'>
                      {doc.originalName} · Fecha: {doc.documentDate || doc.createdAt.slice(0, 10)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {doc.totalAmount !== null && doc.totalAmount !== undefined && (
                      <Chip
                        size='small'
                        variant='outlined'
                        label={`${doc.currency || '$'} ${Number(doc.totalAmount).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`}
                      />
                    )}
                    <StatusChip status={doc.source} sx={{ height: 20, fontSize: '0.68rem' }} />
                  </Box>
                </Box>
                {idx < docs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          variant='outlined'
          color='primary'
          startIcon={<Icon icon='tabler:external-link' />}
          onClick={() => {
            onClose()
            router.push(`/documents?clientId=${client.id}`)
          }}
        >
          Ver todos en Documentos PDF
        </Button>
        <Button variant='contained' color='secondary' onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ClientDocumentsDialog
