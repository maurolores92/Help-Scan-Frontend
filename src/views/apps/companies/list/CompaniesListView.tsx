import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import { DataGrid } from '@mui/x-data-grid'
import TextField from '@mui/material/TextField'
import Link from 'next/link'
import Icon from 'src/@core/components/icon'
import useApi from 'src/hooks/useApi'
import apiConnector from 'src/services/api.service'
import toast from 'react-hot-toast'
import CompanyModal from './CompanyModal'
import ConfirmActionDialog from 'src/components/common/ConfirmActionDialog'
import { buildCompaniesColumns } from './CompaniesListColumns'

export const CompaniesListView = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchFilter, setSearchFilter] = useState<string>('')

  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [companyToDelete, setCompanyToDelete] = useState<any | null>(null)

  const api = useApi('companies')

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const response: any = await api.getAll()
      const list = Array.isArray(response) ? response : response?.data || []

      let filteredData = list
      if (searchFilter) {
        const query = searchFilter.toLowerCase()
        filteredData = list.filter(
          (c: any) =>
            c.name?.toLowerCase().includes(query) ||
            c.slug?.toLowerCase().includes(query) ||
            c.taxId?.toLowerCase().includes(query) ||
            c.plan?.name?.toLowerCase().includes(query)
        )
      }

      setData(filteredData)
    } catch (error) {
      toast.error('Error al cargar compañías')
    } finally {
      setLoading(false)
    }
  }, [api, searchFilter])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  const handleStatusToggle = useCallback(
    async (company: any) => {
      try {
        const newStatus = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
        await apiConnector.patch(`/companies/${company.id}/status`, { status: newStatus })
        toast.success(
          newStatus === 'ACTIVE'
            ? `Compañía '${company.name}' activada y usuario administrador habilitado`
            : `Compañía '${company.name}' suspendida correctamente`
        )
        fetchCompanies()
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Error al cambiar el estado de la compañía')
      }
    },
    [fetchCompanies]
  )

  const confirmDelete = async () => {
    if (!companyToDelete) return
    try {
      await api.remove(companyToDelete.id)
      toast.success('Compañía eliminada correctamente')
      fetchCompanies()
    } catch {
      toast.error('Error al eliminar la compañía')
    } finally {
      setDeleteDialogOpen(false)
      setCompanyToDelete(null)
    }
  }

  const columns = useMemo(
    () =>
      buildCompaniesColumns({
        onEditClick: r => {
          setSelectedCompany(r)
          setModalOpen(true)
        },
        onStatusToggle: handleStatusToggle,
        onDeleteClick: r => {
          setCompanyToDelete(r)
          setDeleteDialogOpen(true)
        }
      }),
    [handleStatusToggle]
  )

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Compañías Clientes (Tenants)'
            subheader='Gestión centralizada de organizaciones, planes asociados, almacenamiento y procesamiento de comprobantes'
          />
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <TextField
                size='small'
                placeholder='Buscar compañía por nombre, slug, CUIT o plan...'
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                sx={{ minWidth: 320 }}
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  href='/plans'
                  variant='outlined'
                  startIcon={<Icon icon='tabler:award' />}
                >
                  Configurar Planes
                </Button>
                <Button
                  variant='contained'
                  onClick={() => {
                    setSelectedCompany(null)
                    setModalOpen(true)
                  }}
                  startIcon={<Icon icon='tabler:plus' />}
                >
                  Nueva Compañía
                </Button>
              </Box>
            </Box>
          </CardContent>

          <DataGrid
            autoHeight
            rowHeight={66}
            rows={data}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
          />
        </Card>
      </Grid>

      <CompanyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCompanies}
        companyData={selectedCompany}
      />

      <ConfirmActionDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title='¿Eliminar compañía definitivamente?'
        content={`¿Estás seguro de que deseas eliminar permanentemente "${companyToDelete?.name}"? Esta acción desactivará a sus usuarios y registros asociados.`}
        confirmText='Sí, eliminar compañía'
        cancelText='Cancelar'
        color='error'
      />
    </Grid>
  )
}

export default CompaniesListView
