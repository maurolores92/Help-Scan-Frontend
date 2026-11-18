import React, { useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  CreateFtpDevicePayload,
  FtpDeviceItem,
  FtpDeviceStatus,
  FtpProtocol,
  UpdateFtpDevicePayload
} from 'src/types/apps/ftpDeviceTypes'

interface FtpDeviceFormValues {
  deviceName: string
  deviceModel: string
  protocol: FtpProtocol
  subFolder: string
  allowedIpsText: string
  customPassword: string
  status: FtpDeviceStatus
  regeneratePassword: boolean
}

interface FtpDeviceFormModalProps {
  open: boolean
  onClose: () => void
  editingDevice: FtpDeviceItem | null
  companyId?: number
  submitting: boolean
  onCreate: (payload: CreateFtpDevicePayload) => Promise<void>
  onUpdate: (id: number, data: UpdateFtpDevicePayload) => Promise<void>
}

const schema = yup.object().shape({
  deviceName: yup.string().trim().required('El nombre del equipo es obligatorio').max(120),
  deviceModel: yup.string().trim().max(120),
  protocol: yup.mixed<FtpProtocol>().oneOf(['SFTP', 'FTPS', 'FTP']).required(),
  subFolder: yup.string().trim().max(80),
  allowedIpsText: yup.string().trim().max(450),
  customPassword: yup
    .string()
    .test('min-len-if-set', 'Mínimo 10 caracteres si ingresás clave manual', val => !val || val.trim().length >= 10),
  status: yup.mixed<FtpDeviceStatus>().oneOf(['ACTIVE', 'SUSPENDED']).required(),
  regeneratePassword: yup.boolean().required()
})

const FtpDeviceFormModal: React.FC<FtpDeviceFormModalProps> = ({
  open,
  onClose,
  editingDevice,
  companyId,
  submitting,
  onCreate,
  onUpdate
}) => {
  const isEditing = Boolean(editingDevice)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<FtpDeviceFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      deviceName: '',
      deviceModel: 'HP LaserJet Managed E52645',
      protocol: 'SFTP',
      subFolder: '',
      allowedIpsText: '',
      customPassword: '',
      status: 'ACTIVE',
      regeneratePassword: false
    }
  })

  useEffect(() => {
    if (!open) return
    if (editingDevice) {
      reset({
        deviceName: editingDevice.deviceName || '',
        deviceModel: editingDevice.deviceModel || 'HP LaserJet Managed E52645',
        protocol: editingDevice.protocol || 'SFTP',
        subFolder: editingDevice.subFolder || '',
        allowedIpsText: Array.isArray(editingDevice.allowedIps) ? editingDevice.allowedIps.join(', ') : '',
        customPassword: '',
        status: editingDevice.status || 'ACTIVE',
        regeneratePassword: false
      })
    } else {
      reset({
        deviceName: '',
        deviceModel: 'HP LaserJet Managed E52645',
        protocol: 'SFTP',
        subFolder: '',
        allowedIpsText: '',
        customPassword: '',
        status: 'ACTIVE',
        regeneratePassword: false
      })
    }
  }, [open, editingDevice, reset])

  const subFolderWatch = watch('subFolder')

  const handleFormSubmit = async (values: FtpDeviceFormValues) => {
    const allowedIps = values.allowedIpsText
      .split(/[\s,;]+/)
      .map(s => s.trim())
      .filter(Boolean)

    if (editingDevice) {
      await onUpdate(editingDevice.id, {
        deviceName: values.deviceName.trim(),
        deviceModel: values.deviceModel.trim() || undefined,
        protocol: values.protocol,
        subFolder: values.subFolder.trim() || undefined,
        allowedIps,
        status: values.status,
        regeneratePassword: values.regeneratePassword
      })
    } else {
      await onCreate({
        ...(companyId ? { companyId } : {}),
        deviceName: values.deviceName.trim(),
        deviceModel: values.deviceModel.trim() || 'HP LaserJet Managed E52645',
        protocol: values.protocol,
        subFolder: values.subFolder.trim() || undefined,
        allowedIps,
        customPassword: values.customPassword.trim() || undefined
      })
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{isEditing ? 'Editar Equipo HP / Acceso FTP' : 'Conectar Nueva Impresora HP'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Controller
                name='deviceName'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Nombre identificador del equipo *'
                    placeholder='Ej. HP E52645 Recepción Planta Baja'
                    error={Boolean(errors.deviceName)}
                    helperText={errors.deviceName?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={7}>
              <Controller
                name='deviceModel'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Modelo de impresora HP'
                    placeholder='HP LaserJet Managed E52645'
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={5}>
              <Controller
                name='protocol'
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label='Protocolo'>
                    <MenuItem value='SFTP'>SFTP (Recomendado / SSH)</MenuItem>
                    <MenuItem value='FTPS'>FTPS (FTP + TLS)</MenuItem>
                    <MenuItem value='FTP'>FTP estándar</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name='subFolder'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Subcarpeta aislada (opcional)'
                    placeholder='Se autogenera desde el nombre si se deja vacío'
                    helperText={`Ruta física protegida: inbox/${subFolderWatch || '<auto-slug>'}`}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name='allowedIpsText'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='IPs públicas autorizadas (opcional, separadas por coma)'
                    placeholder='Ej. 190.12.34.56, 181.20.10.5'
                    helperText='Si se deja vacío permite conexiones desde cualquier IP con el usuario y clave.'
                  />
                )}
              />
            </Grid>

            {!isEditing && (
              <Grid item xs={12}>
                <Controller
                  name='customPassword'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Contraseña personalizada (opcional)'
                      placeholder='Dejar vacío para generar clave aleatoria de 20 caracteres'
                      error={Boolean(errors.customPassword)}
                      helperText={errors.customPassword?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {isEditing && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name='status'
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} select fullWidth label='Estado del acceso'>
                        <MenuItem value='ACTIVE'>ACTIVE (Habilitado)</MenuItem>
                        <MenuItem value='SUSPENDED'>SUSPENDED (Pausado)</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box>
                    <Controller
                      name='regeneratePassword'
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                          label='Rotar contraseña aleatoria'
                        />
                      )}
                    />
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                      Genera una clave nueva y la sincroniza en SFTPGo.
                    </Typography>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant='outlined' color='secondary' onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type='submit' variant='contained' disabled={submitting}>
            {submitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Acceso HP'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default FtpDeviceFormModal

