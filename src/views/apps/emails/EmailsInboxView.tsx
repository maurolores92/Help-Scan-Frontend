import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import { AppDispatch, RootState } from 'src/store'
import {
  fetchEmailMessages,
  syncEmailChannelNow
} from 'src/store/apps/channels'
import { EmailMessageItem, EmailMessageStatus } from 'src/types/apps/channelTypes'
import EmailViewerDialog from './EmailViewerDialog'

const STATUS_BADGE: Record<
  EmailMessageStatus,
  { label: string; color: 'success' | 'info' | 'secondary' | 'error' }
> = {
  PROCESSED: { label: 'Adjunto Procesado', color: 'success' },
  SYNTHESIZED_BODY: { label: 'PDF Generado', color: 'info' },
  SKIPPED: { label: 'Omitido', color: 'secondary' },
  ERROR: { label: 'Error', color: 'error' }
}

const EmailsInboxView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { emails, emailsTotal, emailsStats, loadingEmails, syncing } = useSelector(
    (state: RootState) => state.channels
  )

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [viewerEmailId, setViewerEmailId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(0)
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput])

  const loadEmails = useCallback(() => {
    dispatch(
      fetchEmailMessages({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page: page + 1,
        limit: pageSize
      })
    )
  }, [dispatch, debouncedSearch, statusFilter, page, pageSize])

  useEffect(() => {
    loadEmails()
  }, [loadEmails])

  const handleSyncNow = async () => {
    try {
      const res = await dispatch(syncEmailChannelNow()).unwrap()
      toast.success(res.message || 'Sincronización finalizada')
      loadEmails()
    } catch (err: any) {
      toast.error(err?.message || 'Error al sincronizar el buzón')
    }
  }

  const columns: GridColDef<EmailMessageItem>[] = [
    {
      field: 'receivedAt',
      headerName: 'Recibido',
      minWidth: 160,
      renderCell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {new Date(row.receivedAt).toLocaleString('es-AR', {
            dateStyle: 'short',
            timeStyle: 'short'
          })}
        </Typography>
      )
    },
    {
      field: 'senderEmail',
      headerName: 'Remitente',
      flex: 1,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant='body2' sx={{ fontWeight: 600 }} noWrap>
            {row.senderName || row.senderEmail}
          </Typography>
          {row.senderName && (
            <Typography variant='caption' color='text.secondary' noWrap display='block'>
              {row.senderEmail}
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'subject',
      headerName: 'Asunto',
      flex: 1.4,
      minWidth: 260,
      renderCell: ({ row }) => (
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant='body2' noWrap>
            {row.subject}
          </Typography>
          {row.statusReason && (
            <Typography variant='caption' color='text.secondary' noWrap display='block'>
              {row.statusReason}
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'attachmentsCount',
      headerName: 'Adjuntos',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) =>
        row.attachmentsCount > 0 ? (
          <Chip
            size='small'
            variant='outlined'
            icon={<Icon icon='tabler:paperclip' fontSize={14} />}
            label={row.attachmentsCount}
          />
        ) : (
          <Typography variant='caption' color='text.disabled'>
            Solo texto
          </Typography>
        )
    },
    {
      field: 'status',
      headerName: 'Estado',
      minWidth: 165,
      renderCell: ({ row }) => {
        const meta = STATUS_BADGE[row.status] || {
          label: row.status,
          color: 'secondary' as const
        }

        return <Chip size='small' label={meta.label} color={meta.color} />
      }
    },
    {
      field: 'document',
      headerName: 'Documento PDF',
      minWidth: 190,
      renderCell: ({ row }) =>
        row.document ? (
          <Button
            component={Link}
            href={`/documents?highlight=${row.document.id}`}
            size='small'
            variant='text'
            color='primary'
            startIcon={<Icon icon='tabler:file-text' fontSize={16} />}
            sx={{ textTransform: 'none', maxWidth: '100%' }}
          >
            <Typography variant='caption' noWrap>
              {row.document.originalName}
            </Typography>
          </Button>
        ) : (
          <Typography variant='caption' color='text.disabled'>
            Sin documento
          </Typography>
        )
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 110,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <Tooltip title='Ver contenido del correo'>
          <IconButton color='primary' onClick={() => setViewerEmailId(row.id)}>
            <Icon icon='tabler:eye' />
          </IconButton>
        </Tooltip>
      )
    }
  ]

  return (
    <Grid container spacing={6}>
      {/* Encabezado */}
      <Grid item xs={12}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 600 }}>
              Correos Recibidos
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Auditoría de correos inspeccionados, notas de proveedores y rescate manual de comprobantes.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button
              component={Link}
              href='/channels'
              variant='outlined'
              color='secondary'
              startIcon={<Icon icon='tabler:settings' />}
            >
              Configurar Correo
            </Button>
            <Button
              variant='contained'
              color='primary'
              disabled={syncing}
              onClick={handleSyncNow}
              startIcon={
                syncing ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <Icon icon='tabler:refresh' />
                )
              }
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar Buzón'}
            </Button>
          </Box>
        </Box>
      </Grid>

      {/* Tarjetas KPI */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                {emailsStats.total}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Correos Leídos
              </Typography>
            </Box>
            <Icon icon='tabler:mail' fontSize={32} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h5' sx={{ fontWeight: 600 }} color='success.main'>
                {emailsStats.processed}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Documentos Generados
              </Typography>
            </Box>
            <Icon icon='tabler:file-check' fontSize={32} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h5' sx={{ fontWeight: 600 }} color='text.secondary'>
                {emailsStats.skipped}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Omitidos (Sin Comprobante)
              </Typography>
            </Box>
            <Icon icon='tabler:mail-off' fontSize={32} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h5' sx={{ fontWeight: 600 }} color='error.main'>
                {emailsStats.errors}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Con Error
              </Typography>
            </Box>
            <Icon icon='tabler:alert-circle' fontSize={32} />
          </CardContent>
        </Card>
      </Grid>

      {/* Tabla y filtros */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 3,
                mb: 4
              }}
            >
              <TextField
                size='small'
                sx={{ minWidth: 280, flexGrow: 1, maxWidth: 420 }}
                placeholder='Buscar por remitente o asunto...'
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='tabler:search' fontSize={18} />
                    </InputAdornment>
                  )
                }}
              />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {[
                  { value: '', label: 'Todos' },
                  { value: 'PROCESSED', label: 'Adjunto Procesado' },
                  { value: 'SYNTHESIZED_BODY', label: 'PDF desde Texto' },
                  { value: 'SKIPPED', label: 'Omitidos' },
                  { value: 'ERROR', label: 'Con Error' }
                ].map(opt => (
                  <Button
                    key={opt.value || 'all'}
                    size='small'
                    variant={statusFilter === opt.value ? 'contained' : 'outlined'}
                    color={statusFilter === opt.value ? 'primary' : 'secondary'}
                    onClick={() => {
                      setStatusFilter(opt.value)
                      setPage(0)
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </Box>
            </Box>

            <DataGrid
              autoHeight
              rowHeight={68}
              rows={emails}
              rowCount={emailsTotal}
              columns={columns}
              loading={loadingEmails}
              paginationMode='server'
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={model => {
                setPage(model.page)
                setPageSize(model.pageSize)
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
            />
          </CardContent>
        </Card>
      </Grid>

      <EmailViewerDialog
        open={Boolean(viewerEmailId)}
        emailId={viewerEmailId}
        onClose={() => setViewerEmailId(null)}
        onRescued={() => loadEmails()}
      />
    </Grid>
  )
}

export default EmailsInboxView
