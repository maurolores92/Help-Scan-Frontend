import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { DataGrid } from '@mui/x-data-grid'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import ConfirmActionDialog from 'src/components/common/ConfirmActionDialog'
import { AppDispatch, RootState } from 'src/store'
import {
  deleteDemoRequest,
  fetchDemoRequests,
  updateDemoRequestStatus
} from 'src/store/apps/demoRequests'
import {
  DEMO_STATUS_OPTIONS,
  DemoRequestStatus,
  DemoRequestType
} from 'src/types/apps/demoRequestTypes'
import { buildDemosColumns } from './DemosListColumns'
import DemoDetailDialog from './DemoDetailDialog'

export const DemosListView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { data, counts, loading, updatingId } = useSelector(
    (state: RootState) => state.demoRequests
  )

  const [searchFilter, setSearchFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<DemoRequestStatus | ''>('')
  const [selectedDemo, setSelectedDemo] = useState<DemoRequestType | null>(null)
  const [detailOpen, setDetailOpen] = useState<boolean>(false)
  const [demoToDelete, setDemoToDelete] = useState<DemoRequestType | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)

  const loadDemos = useCallback(
    (search = searchFilter, status = statusFilter) => {
      dispatch(fetchDemoRequests({ search, status }))
    },
    [dispatch, searchFilter, statusFilter]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDemos(searchFilter, statusFilter)
    }, 220)
    return () => clearTimeout(timer)
  }, [searchFilter, statusFilter, loadDemos])

  const handleStatusChange = useCallback(
    async (row: DemoRequestType, newStatus: DemoRequestStatus) => {
      try {
        await dispatch(
          updateDemoRequestStatus({ id: row.id, status: newStatus })
        ).unwrap()
        toast.success(`Estado actualizado para ${row.companyName}`)
      } catch (err: any) {
        toast.error(err?.message || 'Error al actualizar el estado de la demo')
      }
    },
    [dispatch]
  )

  const handleSaveDetail = useCallback(
    async (id: number, status: DemoRequestStatus, notes: string) => {
      try {
        await dispatch(updateDemoRequestStatus({ id, status, notes })).unwrap()
        toast.success('Solicitud de demo actualizada correctamente')
      } catch (err: any) {
        toast.error(err?.message || 'No se pudieron guardar los cambios')
        throw err
      }
    },
    [dispatch]
  )

  const handleConfirmDelete = async () => {
    if (!demoToDelete) return
    setDeleting(true)
    try {
      await dispatch(deleteDemoRequest(demoToDelete.id)).unwrap()
      toast.success('Solicitud eliminada correctamente')
      setDemoToDelete(null)
    } catch {
      toast.error('Error al eliminar la solicitud')
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo(
    () =>
      buildDemosColumns({
        updatingId,
        onStatusChange: handleStatusChange,
        onViewDetail: row => {
          setSelectedDemo(row)
          setDetailOpen(true)
        },
        onDeleteClick: row => setDemoToDelete(row)
      }),
    [updatingId, handleStatusChange]
  )

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Solicitudes de Demostración (Demos)'
            subheader='Seguimiento comercial exclusivo de Super Administrador para prospectos interesados en HelpScan'
            action={
              <Button
                variant='outlined'
                size='small'
                startIcon={<Icon icon='tabler:refresh' />}
                onClick={() => loadDemos()}
              >
                Actualizar
              </Button>
            }
          />
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Filtros rápidos por estado */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                clickable
                label={`Todos (${counts.ALL ?? 0})`}
                color={statusFilter === '' ? 'primary' : 'default'}
                variant={statusFilter === '' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter('')}
              />
              {DEMO_STATUS_OPTIONS.map(opt => (
                <Chip
                  key={opt.value}
                  clickable
                  label={`${opt.label} (${counts[opt.value] ?? 0})`}
                  color={statusFilter === opt.value ? opt.color : 'default'}
                  variant={statusFilter === opt.value ? 'filled' : 'outlined'}
                  onClick={() =>
                    setStatusFilter(prev => (prev === opt.value ? '' : opt.value))
                  }
                />
              ))}
            </Box>

            {/* Buscador */}
            <TextField
              size='small'
              placeholder='Buscar por nombre, empresa, correo, teléfono, sistema de gestión o demo...'
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              sx={{ maxWidth: 480 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='tabler:search' fontSize={18} />
                  </InputAdornment>
                )
              }}
            />
          </CardContent>

          <DataGrid
            autoHeight
            rowHeight={68}
            rows={data}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } }
            }}
            localeText={{
              noRowsLabel: 'Aún no hay solicitudes de demostración registradas'
            }}
          />
        </Card>
      </Grid>

      <DemoDetailDialog
        open={detailOpen}
        demo={selectedDemo}
        saving={Boolean(selectedDemo && updatingId === selectedDemo.id)}
        onClose={() => {
          setDetailOpen(false)
          setSelectedDemo(null)
        }}
        onSave={handleSaveDetail}
      />

      <ConfirmActionDialog
        open={Boolean(demoToDelete)}
        loading={deleting}
        onCancel={() => setDemoToDelete(null)}
        onConfirm={handleConfirmDelete}
        title='¿Eliminar solicitud de demo?'
        content={`¿Estás seguro de eliminar la solicitud de "${demoToDelete?.fullName} - ${demoToDelete?.companyName}"?`}
        confirmText='Sí, eliminar'
        cancelText='Cancelar'
        color='error'
      />
    </Grid>
  )
}

export default DemosListView
