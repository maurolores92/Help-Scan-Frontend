import React, { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Icon from 'src/@core/components/icon'
import CustomAvatar from 'src/@core/components/mui/avatar'
import CustomChip from 'src/@core/components/mui/chip'
import { getInitials } from 'src/@core/utils/get-initials'
import { UsersType } from 'src/types/apps/userTypes'
import { getImageUrl } from 'src/utils/api-url'
import apiConnector from 'src/services/api.service'
import AddUserDrawer from 'src/views/apps/user/list/AddUserDrawer'

interface CompanyUsersViewProps {
  company: any
  onQuotaChanged?: () => void
}

const statusColors: Record<string, 'success' | 'secondary' | 'error' | 'warning'> = {
  active: 'success',
  inactive: 'secondary',
  suspended: 'error',
  pending: 'warning'
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  pending: 'Pendiente'
}

export const CompanyUsersView: React.FC<CompanyUsersViewProps> = ({ company, onQuotaChanged }) => {
  const [users, setUsers] = useState<UsersType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<UsersType | null>(null)
  const [isPasswordMode, setIsPasswordMode] = useState<boolean>(false)

  const fetchUsers = useCallback(async () => {
    if (!company?.id) return
    try {
      setLoading(true)
      const data = await apiConnector.get<UsersType[]>(`/companies/${company.id}/users`)
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar usuarios de la compañía', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [company?.id])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers, company?.status])

  const handleOpenCreate = () => {
    setSelectedUser(null)
    setIsPasswordMode(false)
    setDrawerOpen(true)
  }

  const handleOpenEdit = (user: UsersType) => {
    setSelectedUser(user)
    setIsPasswordMode(false)
    setDrawerOpen(true)
  }

  const handleOpenChangePassword = (user: UsersType) => {
    setSelectedUser(user)
    setIsPasswordMode(true)
    setDrawerOpen(true)
  }

  const handleToggleDrawer = () => {
    setDrawerOpen(prev => !prev)
  }

  const handleUserSaved = () => {
    fetchUsers()
    if (onQuotaChanged) onQuotaChanged()
  }

  return (
    <Card>
      <CardHeader
        title={`Usuarios de ${company.name}`}
        subheader='Gestione las cuentas y accesos asignados a esta empresa'
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`${users.length} usuarios`}
              color='primary'
              variant='outlined'
              size='small'
              sx={{ fontWeight: 600 }}
            />
            <Button
              variant='contained'
              startIcon={<Icon icon='tabler:user-plus' />}
              onClick={handleOpenCreate}
            >
              Nuevo Usuario
            </Button>
          </Box>
        }
      />

      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
            <Typography variant='h6' sx={{ mb: 1 }}>
              No hay usuarios asignados a esta empresa
            </Typography>
            <Typography variant='body2' sx={{ color: 'text.secondary', mb: 3 }}>
              Cree el primer usuario operativo o administrador de {company.name}.
            </Typography>
            <Button
              variant='outlined'
              startIcon={<Icon icon='tabler:user-plus' />}
              onClick={handleOpenCreate}
            >
              Crear Usuario para {company.name}
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align='right'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => {
                  const fullName = `${u.name || ''} ${u.lastName || ''}`.trim() || u.username
                  const avatarImg = (u as any).image ? getImageUrl(`users/${(u as any).image}`) : null
                  const roleName = typeof u.role === 'object' && u.role !== null ? (u.role as any).name : String(u.role || 'Usuario')
                  const userStatus = String(u.status || 'active').toLowerCase()

                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          {avatarImg ? (
                            <CustomAvatar src={avatarImg} sx={{ width: 36, height: 36 }} />
                          ) : (
                            <CustomAvatar skin='light' color='primary' sx={{ width: 36, height: 36, fontWeight: 600 }}>
                              {getInitials(fullName)}
                            </CustomAvatar>
                          )}
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {fullName}
                            </Typography>
                            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                              @{u.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{(u as any).phone || '-'}</TableCell>
                      <TableCell>
                        <CustomChip
                          skin='light'
                          size='small'
                          label={roleName}
                          color={roleName.toLowerCase().includes('admin') ? 'primary' : 'info'}
                          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <CustomChip
                          skin='light'
                          size='small'
                          label={statusLabels[userStatus] || userStatus}
                          color={statusColors[userStatus] || 'primary'}
                          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <Tooltip title='Editar usuario'>
                          <IconButton size='small' onClick={() => handleOpenEdit(u)}>
                            <Icon icon='tabler:edit' fontSize={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Cambiar contraseña'>
                          <IconButton size='small' color='secondary' onClick={() => handleOpenChangePassword(u)}>
                            <Icon icon='tabler:lock' fontSize={18} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      <AddUserDrawer
        open={drawerOpen}
        toggle={handleToggleDrawer}
        editData={selectedUser}
        isPasswordMode={isPasswordMode}
        defaultCompanyId={Number(company.id)}
        onUserCreated={handleUserSaved}
        onUserUpdated={handleUserSaved}
      />
    </Card>
  )
}

export default CompanyUsersView

