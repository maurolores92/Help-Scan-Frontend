import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import { AppDispatch, RootState } from 'src/store'
import { fetchTelegramMessages } from 'src/store/apps/channels'
import { TelegramMessageItem, TelegramMessageStatus } from 'src/types/apps/channelTypes'

const STATUS_BADGE: Record<
  TelegramMessageStatus,
  { label: string; color: 'success' | 'warning' | 'secondary' | 'error' }
> = {
  PROCESSED: { label: 'Procesado en Bóveda', color: 'success' },
  REJECTED_SENDER: { label: 'Chat No Autorizado', color: 'warning' },
  SKIPPED: { label: 'Omitido', color: 'secondary' },
  ERROR: { label: 'Error', color: 'error' }
}

const TelegramInboxView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const {
    telegramMessages,
    telegramMessagesTotal,
    telegramMessagesStats,
    loadingTelegramMessages
  } = useSelector((state: RootState) => state.channels)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(0)
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput])

  const loadMessages = useCallback(() => {
    dispatch(
      fetchTelegramMessages({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page: page + 1,
        limit: pageSize
      })
    )
  }, [dispatch, debouncedSearch, statusFilter, page, pageSize])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const columns: GridColDef<TelegramMessageItem>[] = [
    {
      field: 'receivedAt',
      headerName: 'Recibido',
      minWidth: 155,
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
      field: 'senderName',
      headerName: 'Remitente / Chat',
      flex: 1,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant='body2' sx={{ fontWeight: 600 }} noWrap>
            {row.senderName || (row.senderUsername ? `@${row.senderUsername}` : `Chat ${row.chatId}`)}
          </Typography>
          <Typography variant='caption' color='text.secondary' noWrap display='block'>
            {row.senderUsername ? `@${row.senderUsername} · ` : ''}ID: {row.chatId}
          </Typography>
        </Box>
      )
    },
    {
      field: 'fileName',
      headerName: 'Archivo / Mensaje',
      flex: 1.4,
      minWidth: 250,
      renderCell: ({ row }) => (
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant='body2' noWrap>
            {row.fileName || row.caption || `Mensaje (${row.messageType})`}
          </Typography>
          {(row.statusReason || row.caption) && (
            <Tooltip title={row.statusReason || row.caption || ''}>
              <Typography variant='caption' color='text.secondary' noWrap display='block'>
                {row.statusReason || row.caption}
              </Typography>
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      field: 'messageType',
      headerName: 'Tipo',
      width: 115,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <Chip
          size='small'
          variant='outlined'
          icon={
            <Icon
              icon={
                row.messageType === 'photo'
                  ? 'tabler:photo'
                  : row.messageType === 'document'
                    ? 'tabler:file-type-pdf'
                    : 'tabler:message'
              }
              fontSize={14}
            />
          }
          label={row.messageType === 'photo' ? 'Foto' : row.messageType === 'document' ? 'PDF' : row.messageType}
        />
      )
    },
    {
      field: 'status',
      headerName: 'Estado',
      minWidth: 185,
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
      minWidth: 200,
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
    }
  ]

  return (
    <Grid container spacing={6}>
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
              Mensajes Telegram Recibidos
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Auditoría de PDFs, fotos de comprobantes y mensajes entrantes recibidos en el bot de Telegram de tu empresa.
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
              Configurar Telegram
            </Button>
            <Button
              variant='contained'
              color='primary'
              onClick={loadMessages}
              startIcon={<Icon icon='tabler:refresh' />}
            >
              Actualizar
            </Button>
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                {telegramMessagesStats.total}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Mensajes Recibidos
              </Typography>
            </Box>
            <Icon icon='tabler:brand-telegram' fontSize={32} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h5' sx={{ fontWeight: 600 }} color='success.main'>
                {telegramMessagesStats.processed}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Documentos Procesados
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
                {telegramMessagesStats.skipped}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Omitidos / No Autorizados
              </Typography>
            </Box>
            <Icon icon='tabler:shield-off' fontSize={32} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h5' sx={{ fontWeight: 600 }} color='error.main'>
                {telegramMessagesStats.errors}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Con Error
              </Typography>
            </Box>
            <Icon icon='tabler:alert-circle' fontSize={32} />
          </CardContent>
        </Card>
      </Grid>

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
                placeholder='Buscar por chat ID, @usuario, nombre o archivo...'
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
                  { value: 'PROCESSED', label: 'Procesados' },
                  { value: 'REJECTED_SENDER', label: 'No Autorizados' },
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
              rows={telegramMessages}
              rowCount={telegramMessagesTotal}
              columns={columns}
              loading={loadingTelegramMessages}
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
    </Grid>
  )
}

export default TelegramInboxView
