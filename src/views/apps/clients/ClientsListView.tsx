import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import ConfirmActionDialog from 'src/components/common/ConfirmActionDialog'
import { AppDispatch, RootState } from 'src/store'
import {
  clearSelectedClient,
  createClient,
  deleteClient,
  fetchClientById,
  fetchClients,
  syncClientDocuments,
  updateClient
} from 'src/store/apps/clients'
import { ClientFormPayload, ClientItem } from 'src/types/apps/clientTypes'
import ClientFormDialog from './ClientFormDialog'
import ClientDocumentsDialog from './ClientDocumentsDialog'

export const ClientsListView = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const ability = useContext(AbilityContext)

  const { data, total, selectedClient, loading, saving, loadingDetail } = useSelector(
    (state: RootState) => state.clients
  )

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null)
  const [docsOpen, setDocsOpen] = useState(false)
  const [syncingClientId, setSyncingClientId] = useState<number | null>(null)
  const [clientToDelete, setClientToDelete] = useState<ClientItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const canCreate = ability.can('create', 'clients')
  const canUpdate = ability.can('update', 'clients')
  const canDelete = ability.can('delete', 'clients')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(0)
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput])

  const loadClients = useCallback(() => {
    dispatch(
      fetchClients({
        page: page + 1,
        limit: pageSize,
        search: debouncedSearch,
        isActive: statusFilter
      })
    )
  }, [dispatch, page, pageSize, debouncedSearch, statusFilter])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  const handleOpenCreate = () => {
    setEditingClient(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (client: ClientItem) => {
    setEditingClient(client)
    setFormOpen(true)
  }

  const handleFormSubmit = async (payload: ClientFormPayload, id?: number) => {
    try {
      if (id) {
        const res: any = await dispatch(updateClient({ id, data: payload })).unwrap()
        const linked = res?.linkedDocumentsCount || 0
        toast.success(
          linked > 0
            ? `Cliente actualizado y ${linked} documento(s) asociado(s) por CUIL`
            : 'Cliente actualizado correctamente'
        )
      } else {
        const res: any = await dispatch(createClient(payload)).unwrap()
        const linked = res?.linkedDocumentsCount || 0
        toast.success(
          linked > 0
            ? `Cliente creado y ${linked} documento(s) asociado(s) automáticamente por CUIL`
            : 'Cliente creado correctamente'
        )
      }
      setFormOpen(false)
      loadClients()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al guardar cliente')
    }
  }

  const handleViewDocuments = (client: ClientItem) => {
    setDocsOpen(true)
    dispatch(fetchClientById(client.id))
  }

  const handleSyncDocuments = async (clientId: number) => {
    try {
      setSyncingClientId(clientId)
      const res: any = await dispatch(syncClientDocuments(clientId)).unwrap()
      toast.success(res?.message || 'Sincronización finalizada')
      loadClients()
      if (docsOpen) {
        dispatch(fetchClientById(clientId))
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al asociar documentos')
    } finally {
      setSyncingClientId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return
    try {
      setIsDeleting(true)
      await dispatch(deleteClient(clientToDelete.id)).unwrap()
      toast.success(`Cliente '${clientToDelete.name}' eliminado`)
      setClientToDelete(null)
      loadClients()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'No se pudo eliminar el cliente')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Cliente / Razón Social',
        flex: 0.25,
        minWidth: 220,
        renderCell: ({ row }: { row: ClientItem }) => (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant='body2' noWrap sx={{ fontWeight: 600 }}>
              {row.name}
            </Typography>
            <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
              {[row.tradeName, row.taxCondition, row.erpCode ? `Cód: ${row.erpCode}` : '']
                .filter(Boolean)
                .join(' · ') || 'Sin categoría fiscal'}
            </Typography>
          </Box>
        )
      },
      {
        field: 'taxId',
        headerName: 'Identificación Fiscal',
        flex: 0.16,
        minWidth: 165,
        renderCell: ({ row }: { row: ClientItem }) => (
          <Box sx={{ overflow: 'hidden' }}>
            {row.taxId ? (
              <Typography variant='body2' noWrap sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                {row.taxIdType ? `${row.taxIdType}: ` : ''}
                {row.taxId}
              </Typography>
            ) : (
              <Chip
                size='small'
                color='warning'
                variant='outlined'
                label='CUIT/CUIL pendiente'
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
              />
            )}
            {row.iibbNumber && (
              <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
                IIBB: {row.iibbNumber}
              </Typography>
            )}
          </Box>
        )
      },
      {
        field: 'email',
        headerName: 'Contacto / Domicilio',
        flex: 0.24,
        minWidth: 205,
        renderCell: ({ row }: { row: ClientItem }) => {
          const contactLine = row.email || row.contactName || row.phone || '—'
          const locationLine = [row.city, row.province].filter(Boolean).join(', ')
          const subLine = [row.phone && row.email ? row.phone : '', locationLine].filter(Boolean).join(' · ')

          return (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant='body2' noWrap>
                {contactLine}
              </Typography>
              {subLine && (
                <Typography variant='caption' noWrap sx={{ display: 'block', color: 'text.secondary' }}>
                  {subLine}
                </Typography>
              )}
            </Box>
          )
        }
      },
      {
        field: 'documentsCount',
        headerName: 'Documentos',
        flex: 0.12,
        minWidth: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }: { row: ClientItem }) => {
          const count = row.documentsCount ?? 0

          return (
            <Chip
              size='small'
              color={count > 0 ? 'primary' : 'default'}
              variant='outlined'
              label={`${count} PDF${count === 1 ? '' : 's'}`}
              onClick={() => handleViewDocuments(row)}
              sx={{ cursor: 'pointer', fontWeight: 600 }}
            />
          )
        }
      },
      {
        field: 'isActive',
        headerName: 'Estado',
        width: 110,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }: { row: ClientItem }) => (
          <Chip
            size='small'
            color={row.isActive ? 'success' : 'secondary'}
            label={row.isActive ? 'Activo' : 'Inactivo'}
          />
        )
      },
      {
        field: 'actions',
        headerName: 'Acciones',
        width: 195,
        sortable: false,
        renderCell: ({ row }: { row: ClientItem }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <Tooltip title='Ver detalle del cliente'>
              <IconButton size='small' color='primary' onClick={() => router.push(`/clients/${row.id}`)}>
                <Icon icon='tabler:eye' fontSize={19} />
              </IconButton>
            </Tooltip>
            {canUpdate && (
              <Tooltip title='Asociar documentos pendientes por CUIL'>
                <IconButton
                  size='small'
                  color='info'
                  disabled={syncingClientId === row.id}
                  onClick={() => handleSyncDocuments(row.id)}
                >
                  <Icon icon='tabler:link' fontSize={19} />
                </IconButton>
              </Tooltip>
            )}
            {canUpdate && (
              <Tooltip title='Editar cliente'>
                <IconButton size='small' color='secondary' onClick={() => handleOpenEdit(row)}>
                  <Icon icon='tabler:edit' fontSize={19} />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title='Eliminar cliente'>
                <IconButton size='small' color='error' onClick={() => setClientToDelete(row)}>
                  <Icon icon='tabler:trash' fontSize={19} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canUpdate, canDelete, syncingClientId]
  )

  return (
    <Box>
      <Card>
        <CardHeader
          title='Clientes'
          subheader='Cartera de clientes por CUIT / CUIL con asociación automática de comprobantes'
          action={
            canCreate ? (
              <Button
                variant='contained'
                color='primary'
                startIcon={<Icon icon='tabler:user-plus' />}
                onClick={handleOpenCreate}
              >
                Nuevo Cliente
              </Button>
            ) : undefined
          }
        />

        <Box sx={{ px: 4, pb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size='small'
            sx={{ flex: 1, minWidth: 260 }}
            placeholder='Buscar por razón social, CUIT/CUIL, email o teléfono...'
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='tabler:search' fontSize={18} />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={() => setSearchInput('')}>
                    <Icon icon='tabler:x' fontSize={16} />
                  </IconButton>
                </InputAdornment>
              ) : undefined
            }}
          />

          <TextField
            select
            size='small'
            sx={{ minWidth: 160 }}
            label='Estado'
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
          >
            <MenuItem value=''>Todos</MenuItem>
            <MenuItem value='true'>Activos</MenuItem>
            <MenuItem value='false'>Inactivos</MenuItem>
          </TextField>
        </Box>

        <DataGrid
          autoHeight
          rowHeight={56}
          columnHeaderHeight={44}
          rows={data}
          rowCount={total}
          columns={columns}
          loading={loading}
          paginationMode='server'
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={model => {
            setPage(model.page)
            setPageSize(model.pageSize)
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Card>

      <ClientFormDialog
        open={formOpen}
        client={editingClient}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ClientDocumentsDialog
        open={docsOpen}
        client={selectedClient}
        loading={loadingDetail}
        syncing={Boolean(selectedClient && syncingClientId === selectedClient.id)}
        onClose={() => {
          setDocsOpen(false)
          dispatch(clearSelectedClient())
        }}
        onSyncDocuments={handleSyncDocuments}
      />

      <ConfirmActionDialog
        open={Boolean(clientToDelete)}
        title='¿Eliminar cliente?'
        content={`¿Estás seguro de eliminar a "${clientToDelete?.name}" (${clientToDelete?.taxId})? Los comprobantes asociados no se eliminarán, únicamente quedarán sin cliente asignado.`}
        confirmText='Sí, eliminar'
        cancelText='Cancelar'
        color='error'
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setClientToDelete(null)}
      />
    </Box>
  )
}

export default ClientsListView
