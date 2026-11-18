import React, { useCallback, useContext, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { AppDispatch, RootState } from 'src/store'
import {
  createFtpDevice,
  deleteFtpDevice,
  fetchFtpDeviceCredentials,
  fetchFtpDevices,
  scanFtpDeviceInbox,
  syncFtpDevice,
  updateFtpDevice
} from 'src/store/apps/ftpDevices'
import {
  CreateFtpDevicePayload,
  FtpCredentialsPayload,
  FtpDeviceItem,
  UpdateFtpDevicePayload
} from 'src/types/apps/ftpDeviceTypes'
import FtpCredentialsDialog from './FtpCredentialsDialog'
import FtpDeviceFormModal from './FtpDeviceFormModal'
import HpSetupGuideModal from './HpSetupGuideModal'

interface FtpDevicesViewProps {
  companyId?: number
  isSuperAdminView?: boolean
}

const getErrorMsg = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback

const FtpDevicesView: React.FC<FtpDevicesViewProps> = ({ companyId, isSuperAdminView = false }) => {
  const dispatch = useDispatch<AppDispatch>()
  const ability = useContext(AbilityContext)
  const { devices, serverInfo, quotaSummary, loading, submitting } = useSelector(
    (state: RootState) => state.ftpDevices
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<FtpDeviceItem | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const [credentials, setCredentials] = useState<FtpCredentialsPayload | null>(null)
  const [isNewCred, setIsNewCred] = useState(false)
  const [deletingDevice, setDeletingDevice] = useState<FtpDeviceItem | null>(null)

  // Solo el Super Administrador en la vista administrativa puede crear, editar, borrar o ver credenciales.
  // En la pantalla del cliente (/printers-ftp), la vista es 100% de sólo lectura / monitoreo.
  const canManage = isSuperAdminView

  const reloadDevices = useCallback(() => {
    dispatch(fetchFtpDevices(companyId))
  }, [dispatch, companyId])

  useEffect(() => {
    reloadDevices()
  }, [reloadDevices])

  const handleCreate = async (payload: CreateFtpDevicePayload) => {
    try {
      const res = await dispatch(createFtpDevice(payload)).unwrap()
      setFormOpen(false)
      setEditingDevice(null)
      setCredentials(res.credentials)
      setIsNewCred(true)
      toast.success('Equipo HP conectado correctamente')
      reloadDevices()
    } catch (err) {
      toast.error(getErrorMsg(err, 'No se pudo registrar el equipo HP'))
    }
  }

  const handleUpdate = async (id: number, data: UpdateFtpDevicePayload) => {
    try {
      const res = await dispatch(updateFtpDevice({ id, data })).unwrap()
      setFormOpen(false)
      setEditingDevice(null)
      toast.success('Equipo actualizado correctamente')
      if (res.rotatedPassword) {
        const freshCreds = await dispatch(fetchFtpDeviceCredentials(id)).unwrap()
        setCredentials(freshCreds)
        setIsNewCred(true)
      }
      reloadDevices()
    } catch (err) {
      toast.error(getErrorMsg(err, 'No se pudo actualizar el equipo'))
    }
  }

  const handleViewCredentials = async (device: FtpDeviceItem) => {
    try {
      const res = await dispatch(fetchFtpDeviceCredentials(device.id)).unwrap()
      setCredentials(res)
      setIsNewCred(false)
    } catch (err) {
      toast.error(getErrorMsg(err, 'No se pudieron obtener las credenciales'))
    }
  }

  const handleSync = async (device: FtpDeviceItem) => {
    try {
      const res: any = await dispatch(syncFtpDevice(device.id)).unwrap()
      if (res?.syncResult?.synced) {
        toast.success(`Usuario virtual '${device.username}' sincronizado en SFTPGo`)
      } else {
        toast.error(res?.syncResult?.error || 'SFTPGo no respondió en este momento')
      }
      reloadDevices()
    } catch (err) {
      toast.error(getErrorMsg(err, 'Error sincronizando SFTPGo'))
    }
  }

  const handleScanInbox = async (device: FtpDeviceItem) => {
    try {
      const res: any = await dispatch(scanFtpDeviceInbox(device.id)).unwrap()
      toast.success(`Escaneo completado: ${res?.imported || 0} archivo(s) nuevos importados`)
      reloadDevices()
    } catch (err) {
      toast.error(getErrorMsg(err, 'No se pudo escanear la bandeja'))
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingDevice) return
    try {
      await dispatch(deleteFtpDevice(deletingDevice.id)).unwrap()
      toast.success('Equipo HP desvinculado correctamente')
      setDeletingDevice(null)
      reloadDevices()
    } catch (err) {
      toast.error(getErrorMsg(err, 'No se pudo eliminar el acceso FTP'))
    }
  }

  const storagePercent = quotaSummary?.storageMb?.percentage ?? 0

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={7}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Icon icon='tabler:server-bolt' fontSize={22} />
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                  Servidor de Recepción Aislado (SFTPGo)
                </Typography>
              </Box>
              <Chip
                size='small'
                color={serverInfo?.sftpgoReachable ? 'success' : 'warning'}
                label={serverInfo?.sftpgoReachable ? 'SFTPGo Activo' : 'Modo Carpeta Local / Sin SFTPGo'}
              />
            </Box>
            {serverInfo && !serverInfo.sftpgoReachable && serverInfo.error && (
              <Alert severity='warning' sx={{ py: 0.5, px: 1.5, fontSize: '0.8125rem' }}>
                <strong>Diagnóstico de conexión FTP:</strong> {serverInfo.error}
              </Alert>
            )}
            <Typography variant='caption' color='text.secondary'>
              Cada impresora HP escribe únicamente en su propia subcarpeta de <code>inbox/</code> mediante usuario
              chrooted sin permisos de lectura o borrado en la bóveda.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon icon='tabler:shield-lock' fontSize={22} />
                <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                  Bóveda Cifrada AES-256-GCM
                </Typography>
              </Box>
              <Chip size='small' color='success' variant='outlined' label='Protección Activa' />
            </Box>
            {quotaSummary?.storageMb ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Espacio usado por la compañía
                  </Typography>
                  <Typography variant='caption' sx={{ fontWeight: 600 }}>
                    {quotaSummary.storageMb.current} MB /{' '}
                    {quotaSummary.storageMb.unlimited ? 'Ilimitado' : `${quotaSummary.storageMb.max} MB`}
                  </Typography>
                </Box>
                {!quotaSummary.storageMb.unlimited && (
                  <LinearProgress
                    variant='determinate'
                    value={Math.min(100, storagePercent)}
                    color={storagePercent > 85 ? 'warning' : 'primary'}
                    sx={{ height: 7, borderRadius: 4 }}
                  />
                )}
              </Box>
            ) : (
              <Typography variant='caption' color='text.secondary'>
                Los archivos recibidos se cifran automáticamente al ingresar en <code>vault/YYYY/MM</code>.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title={isSuperAdminView ? 'Impresoras HP y Accesos FTP' : 'Impresoras Multifunción Conectadas'}
            subheader={
              isSuperAdminView
                ? 'Conectá equipos HP LaserJet Managed E52645 u otros multifunción con almacenamiento aislado por empresa'
                : 'Equipos asignados a su empresa para digitalización directa hacia la bóveda'
            }
            action={
              canManage ? (
                <Stack direction='row' spacing={1.5} flexWrap='wrap'>
                  <Button
                    variant='outlined'
                    startIcon={<Icon icon='tabler:book' />}
                    onClick={() => setGuideOpen(true)}
                  >
                    Guía HP E52645
                  </Button>
                  <Button
                    variant='contained'
                    startIcon={<Icon icon='tabler:plus' />}
                    onClick={() => {
                      setEditingDevice(null)
                      setFormOpen(true)
                    }}
                  >
                    Conectar Equipo HP
                  </Button>
                </Stack>
              ) : null
            }
          />
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress />
              </Box>
            ) : devices.length === 0 ? (
              <Box
                sx={theme => ({
                  m: 3,
                  p: 5,
                  textAlign: 'center',
                  borderRadius: 1.5,
                  border: `1px dashed ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.02)
                })}
              >
                <Icon icon='tabler:printer-off' fontSize={36} />
                <Typography variant='subtitle1' sx={{ mt: 1, fontWeight: 600 }}>
                  Todavía no hay impresoras configuradas
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, mb: 2 }}>
                  {canManage
                    ? 'Generá un usuario virtual aislado para recibir PDFs escaneados directo en la bóveda de esta compañía.'
                    : 'Su empresa aún no tiene equipos vinculados. El administrador de HelpCopies se encargará de la configuración inicial.'}
                </Typography>
                {canManage && (
                  <Button variant='contained' onClick={() => setFormOpen(true)}>
                    Crear Primer Acceso FTP / SFTP
                  </Button>
                )}
              </Box>
            ) : (
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Equipo / Modelo</TableCell>
                      <TableCell>Protocolo</TableCell>
                      <TableCell>Bandeja / Subcarpeta</TableCell>
                      <TableCell align='center'>Escaneos</TableCell>
                      <TableCell align='center'>Sync SFTPGo</TableCell>
                      <TableCell align='center'>Estado</TableCell>
                      {canManage && <TableCell align='right'>Acciones</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {devices.map(dev => (
                      <TableRow key={dev.id} hover>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {dev.deviceName}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {dev.deviceModel || 'HP LaserJet'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size='small' label={`${dev.protocol} :${dev.connectionPort}`} variant='outlined' />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            inbox/{dev.subFolder}
                          </Typography>
                          {canManage && (
                            <Typography variant='caption' color='text.secondary' display='block'>
                              {dev.username}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align='center'>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {dev.scannedCount || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Tooltip title={dev.lastSyncError || (dev.sftpgoSynced ? 'Sincronizado' : 'Pendiente de sync')}>
                            <Chip
                              size='small'
                              color={dev.sftpgoSynced ? 'success' : 'warning'}
                              label={dev.sftpgoSynced ? 'OK' : 'Pendiente'}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            size='small'
                            color={dev.status === 'ACTIVE' ? 'success' : 'error'}
                            label={dev.status === 'ACTIVE' ? 'Activo' : 'Pausado'}
                          />
                        </TableCell>
                        {canManage && (
                          <TableCell align='right'>
                            <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                              <Tooltip title='Ver credenciales FTP / SFTP'>
                                <IconButton size='small' color='primary' onClick={() => handleViewCredentials(dev)}>
                                  <Icon icon='tabler:key' fontSize={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Re-sincronizar usuario en SFTPGo'>
                                <IconButton size='small' onClick={() => handleSync(dev)}>
                                  <Icon icon='tabler:refresh' fontSize={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Escanear bandeja inbox ahora'>
                                <IconButton size='small' onClick={() => handleScanInbox(dev)}>
                                  <Icon icon='tabler:folder-search' fontSize={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Editar configuración'>
                                <IconButton
                                  size='small'
                                  onClick={() => {
                                    setEditingDevice(dev)
                                    setFormOpen(true)
                                  }}
                                >
                                  <Icon icon='tabler:edit' fontSize={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Eliminar acceso'>
                                <IconButton size='small' color='error' onClick={() => setDeletingDevice(dev)}>
                                  <Icon icon='tabler:trash' fontSize={18} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      <FtpDeviceFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingDevice(null)
        }}
        editingDevice={editingDevice}
        companyId={companyId}
        submitting={submitting}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <FtpCredentialsDialog
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        credentials={credentials}
        isNewOrRotated={isNewCred}
      />

      <HpSetupGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} serverInfo={serverInfo} />

      <Dialog open={Boolean(deletingDevice)} onClose={() => setDeletingDevice(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Desvincular Equipo HP</DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            ¿Confirmás eliminar el acceso FTP/SFTP de <strong>{deletingDevice?.deviceName}</strong> (usuario{' '}
            <code>{deletingDevice?.username}</code>)? Los PDFs ya ingresados en la bóveda no se eliminan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' color='secondary' onClick={() => setDeletingDevice(null)}>
            Cancelar
          </Button>
          <Button variant='contained' color='error' onClick={handleConfirmDelete}>
            Eliminar Acceso
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default FtpDevicesView

