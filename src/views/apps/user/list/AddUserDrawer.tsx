// ** React Imports
import { useState, useEffect, useMemo } from 'react'

// ** MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box, { BoxProps } from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Third Party Imports
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getImageUrl } from 'src/utils/api-url'

// ** Store Imports
import { useDispatch } from 'react-redux'
import { addUser, updateUser, changeUserPassword } from 'src/store/apps/user'
import { AppDispatch } from 'src/store'
import { UsersType } from 'src/types/apps/userTypes'
import apiConnector from 'src/services/api.service'
import { useAuth } from 'src/hooks/useAuth'

interface SidebarAddUserType {
  open: boolean
  toggle: () => void
  editData?: UsersType | null
  isPasswordMode?: boolean
  defaultCompanyId?: number
  onUserUpdated?: (user: UsersType) => void
  onUserCreated?: (user: any) => void
}

interface UserData {
  name: string
  lastName: string
  username: string
  email: string
  phone: string
  roleId: number | string
  password?: string
  confirmPassword?: string
}

const ImgStyled = styled('img')(({ theme }) => ({
  width: 90,
  height: 90,
  borderRadius: '50%',
  objectFit: 'cover',
  border: `2px solid ${theme.palette.divider}`
}))

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const isSuperAdminUser = (data?: UsersType | null, auth?: any): boolean => {
  if (!data) return false
  if (data.username?.toLowerCase() === 'superadmin') return true
  if (typeof data.role === 'string') {
    const r = data.role.toLowerCase()
    if (r === 'superadmin' || r === 'super admin' || r === 'super_admin') return true
  }
  if (typeof data.role === 'object' && data.role !== null) {
    const slug = (((data.role as any).slug || (data.role as any).name || '') as string).toLowerCase()
    if (slug === 'superadmin' || slug === 'super admin' || slug === 'super_admin') return true
  }
  if (auth && auth.id === data.id) {
    const authRole = typeof auth.role === 'string' ? auth.role : (auth.role?.slug || auth.role?.name || '')
    if (authRole?.toLowerCase() === 'superadmin') return true
  }

  return false
}

const getSchema = (isEdit: boolean, isPasswordMode: boolean, isSuperAdmin = false) => {
  if (isPasswordMode) {
    return yup.object().shape({
      password: yup.string().required('La contraseña es obligatoria').min(5, 'Debe tener al menos 5 caracteres'),
      confirmPassword: yup
        .string()
        .required('Confirmar contraseña es obligatorio')
        .oneOf([yup.ref('password'), ''], 'Las contraseñas deben coincidir')
    })
  }

  return yup.object().shape({
    name: yup.string().required('El nombre es obligatorio'),
    lastName: yup.string().required('El apellido es obligatorio'),
    username: yup.string().required('El nombre de usuario es obligatorio'),
    email: yup.string().email('Ingrese un correo electrónico válido').required('El correo es obligatorio'),
    phone: yup.string(),
    roleId: isSuperAdmin
      ? yup.mixed().notRequired()
      : yup
          .mixed()
          .test('role-is-required', 'El rol es obligatorio', function (value) {
            if (isSuperAdmin) return true
            if (value === undefined || value === null || value === '') return false

            return !isNaN(Number(value))
          }),
    password: isEdit
      ? yup.string()
      : yup.string().required('La contraseña es obligatoria').min(6, 'Debe tener al menos 6 caracteres'),
    confirmPassword: isEdit
      ? yup.string()
      : yup
          .string()
          .required('Confirmar contraseña es obligatorio')
          .oneOf([yup.ref('password'), ''], 'Las contraseñas deben coincidir')
  })
}

const defaultValues = {
  name: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  roleId: '',
  password: '',
  confirmPassword: ''
}

const SidebarAddUser = (props: SidebarAddUserType) => {
  const { open, toggle, editData, isPasswordMode, defaultCompanyId } = props
  const [roles, setRoles] = useState<any[]>([])
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [imgSrc, setImgSrc] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { user: authUser, setUser: setAuthUser } = useAuth()
  const dispatch = useDispatch<AppDispatch>()

  const isSuperAdmin = useMemo(() => {
    return isSuperAdminUser(editData, authUser)
  }, [editData, authUser])

  useEffect(() => {
    if (open && !isPasswordMode) {
      const rolesEndpoint = defaultCompanyId
        ? `/role?includeSuperAdmin=true&companyId=${defaultCompanyId}`
        : '/role?includeSuperAdmin=true'
      apiConnector
        .get(rolesEndpoint)
        .then((res: any) => {
          setRoles(res || [])
        })
        .catch(err => console.error(err))
    }
  }, [open, isPasswordMode, defaultCompanyId])

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(getSchema(!!editData, !!isPasswordMode, isSuperAdmin))
  })

  useEffect(() => {
    if (editData && open) {
      setValue('name', editData.name || '')
      setValue('lastName', editData.lastName || '')
      setValue('username', (editData as any).username || '')
      setValue('email', editData.email || '')
      setValue('phone', editData.phone || '')

      let rId = '';
      if (editData.roleId) {
        rId = String(editData.roleId);
      } else if (typeof editData.role === 'object' && editData.role !== null) {
        rId = String((editData.role as any).id || '');
      } else if (typeof editData.role === 'string' && roles.length > 0) {
        const matching = roles.find(
          (r: any) =>
            (r.slug && r.slug.toLowerCase() === editData.role.toLowerCase()) ||
            (r.name && r.name.toLowerCase() === editData.role.toLowerCase())
        );
        if (matching) {
          rId = String(matching.id);
        }
      }
      setValue('roleId', rId || '')
      if (isSuperAdmin) {
        clearErrors('roleId')
      }

      setValue('password', '')
      setValue('confirmPassword', '')

      if (editData.image) {
        setImgSrc(
          getImageUrl(`users/${editData.image}`)
        )
      } else {
        setImgSrc('')
      }
      setSelectedFile(null)
    } else if (!open) {
      reset(defaultValues)
      setImgSrc('')
      setSelectedFile(null)
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [editData, open, setValue, reset, isPasswordMode, isSuperAdmin, roles, clearErrors])

  const handleInputImageChange = (file: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      const fileToUpload = files[0]
      if (fileToUpload.size > 2 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 2MB')

        return
      }
      setSelectedFile(fileToUpload)
      reader.onload = () => setImgSrc(reader.result as string)
      reader.readAsDataURL(fileToUpload)
    }
  }

  const handleResetImage = () => {
    setImgSrc('')
    setSelectedFile(null)
  }

  const uploadProfileImage = async (initialImage: string | null): Promise<{ aborted: boolean; fileName: string | null }> => {
    if (!selectedFile) {
      return { aborted: false, fileName: imgSrc === '' ? null : initialImage }
    }
    const formData = new FormData()
    formData.append('file', selectedFile)
    try {
      const uploadRes: any = await apiConnector.sendFile('/uploads/users', formData)

      return { aborted: false, fileName: uploadRes.fileName }
    } catch (err: any) {
      toast.error(err?.message || 'Error al subir la imagen de perfil')

      return { aborted: true, fileName: initialImage }
    }
  }

  const onSubmit = async (data: UserData) => {
    try {
      if (isPasswordMode && editData) {
        await dispatch(changeUserPassword({ id: editData.id, data: { password: data.password } })).unwrap()
        toast.success('Contraseña actualizada correctamente')
      } else if (editData) {
        const upload = await uploadProfileImage(editData.image || null)
        if (upload.aborted) return

        const payload: any = {
          name: data.name,
          lastName: data.lastName,
          username: data.username,
          email: data.email,
          phone: data.phone || '',
          image: upload.fileName
        }

        if (!isSuperAdmin && data.roleId && !isNaN(Number(data.roleId))) {
          payload.roleId = Number(data.roleId)
        }

        await dispatch(updateUser({ id: editData.id, data: payload })).unwrap()

        if (authUser && authUser.id === editData.id) {
          setAuthUser({
            ...authUser,
            name: data.name,
            lastName: data.lastName,
            email: data.email,
            username: data.username,
            phone: data.phone,
            image: upload.fileName
          })
        }

        if (props.onUserUpdated) {
          props.onUserUpdated({ ...(editData as any), ...payload, image: upload.fileName })
        }

        toast.success('Usuario actualizado correctamente')
      } else {
        const upload = await uploadProfileImage(null)
        if (upload.aborted) return

        const createPayload: any = {
          name: data.name,
          lastName: data.lastName,
          username: data.username,
          email: data.email,
          phone: data.phone || '',
          password: data.password,
          roleId: Number(data.roleId),
          image: upload.fileName,
          ...(defaultCompanyId ? { companyId: defaultCompanyId } : {})
        }

        const createdUser: any = await dispatch(addUser(createPayload)).unwrap()
        if (props.onUserCreated) {
          props.onUserCreated(createdUser)
        }
        toast.success('Usuario creado correctamente')
      }
      handleClose()
    } catch (error: any) {
      const msg = error?.response?.data?.message
      const errMessage =
        typeof error === 'string'
          ? error
          : Array.isArray(msg)
            ? msg.join(', ')
            : msg || error?.message || 'Error procesando la solicitud'
      toast.error(errMessage)
    }
  }

  const handleClose = () => {
    toggle()
    reset(defaultValues)
    setImgSrc('')
    setSelectedFile(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const getTitle = () => {
    if (isPasswordMode) return 'Cambiar Contraseña'

    return editData ? 'Editar Usuario' : 'Agregar Usuario'
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth='sm'
      scroll='body'
    >
      <Header>
        <Typography variant='h5'>{getTitle()}</Typography>
        <IconButton
          size='small'
          onClick={handleClose}
          sx={{
            p: '0.438rem',
            borderRadius: 1,
            color: 'text.primary',
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.16)`
            }
          }}
        >
          <Icon icon='tabler:x' fontSize='1.125rem' />
        </IconButton>
      </Header>
      <DialogContent sx={{ p: theme => `${theme.spacing(0, 6, 6)} !important` }}>
        <form onSubmit={handleSubmit(onSubmit)}>

          {!isPasswordMode && (
            <>
              {/* Subida de Imagen de Perfil */}
              <Box sx={{ mb: 6, display: 'flex', alignItems: 'center' }}>
                {imgSrc ? (
                  <ImgStyled src={imgSrc} alt='Foto de perfil' />
                ) : (
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      backgroundColor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: theme => `1px dashed ${theme.palette.divider}`
                    }}
                  >
                    <Icon icon='tabler:user' fontSize='2.5rem' color='action.active' />
                  </Box>
                )}
                <Box sx={{ ml: 4 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Button component='label' variant='contained' size='small' htmlFor='user-upload-image'>
                      Subir Foto
                      <input
                        hidden
                        type='file'
                        accept='image/png, image/jpeg, image/webp'
                        onChange={handleInputImageChange}
                        id='user-upload-image'
                      />
                    </Button>
                    <Button color='secondary' variant='tonal' size='small' onClick={handleResetImage}>
                      Quitar
                    </Button>
                  </Box>
                  <Typography variant='caption' sx={{ mt: 1.5, display: 'block', color: 'text.secondary' }}>
                    Permitido JPG, PNG o WEBP. Máx 2 MB.
                  </Typography>
                </Box>
              </Box>
              <Controller
                name='name'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomTextField
                    fullWidth
                    value={value}
                    sx={{ mb: 4 }}
                    label='Nombre'
                    onChange={onChange}
                    error={Boolean(errors.name)}
                    {...(errors.name && { helperText: errors.name?.message })}
                  />
                )}
              />
              <Controller
                name='lastName'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomTextField
                    fullWidth
                    value={value}
                    sx={{ mb: 4 }}
                    label='Apellido'
                    onChange={onChange}
                    error={Boolean(errors.lastName)}
                    {...(errors.lastName && { helperText: errors.lastName?.message })}
                  />
                )}
              />
              <Controller
                name='username'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomTextField
                    fullWidth
                    value={value}
                    sx={{ mb: 4 }}
                    label='Nombre de Usuario'
                    onChange={onChange}
                    error={Boolean(errors.username)}
                    {...(errors.username && { helperText: errors.username?.message })}
                  />
                )}
              />
              <Controller
                name='email'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomTextField
                    fullWidth
                    type='email'
                    label='Correo electronico'
                    value={value}
                    sx={{ mb: 4 }}
                    onChange={onChange}
                    error={Boolean(errors.email)}
                    {...(errors.email && { helperText: errors.email?.message })}
                  />
                )}
              />
              <Controller
                name='phone'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomTextField
                    fullWidth
                    value={value}
                    sx={{ mb: 4 }}
                    label='Telefono'
                    onChange={onChange}
                    error={Boolean(errors.phone)}
                    {...(errors.phone && { helperText: errors.phone?.message })}
                  />
                )}
              />
              {!isSuperAdmin && (
                <Controller
                  name='roleId'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <CustomTextField
                      select
                      fullWidth
                      value={value}
                      sx={{ mb: editData ? 6 : 4 }}
                      label='Rol'
                      onChange={onChange}
                      error={Boolean(errors.roleId)}
                      {...(errors.roleId && { helperText: errors.roleId?.message })}
                      SelectProps={{ value: value, onChange: e => onChange(e) }}
                    >
                      <MenuItem value=''>Seleccione un rol</MenuItem>
                      {roles
                        .filter((r: any) => r.slug !== 'superadmin' && r.name?.toLowerCase() !== 'superadmin')
                        .map((r: any) => (
                          <MenuItem key={r.id} value={String(r.id)}>
                            {r.name}
                          </MenuItem>
                        ))}
                    </CustomTextField>
                  )}
                />
              )}
            </>
          )}

          {(!editData || isPasswordMode) && (
            <>
              <Controller
                name='password'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomTextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    value={value}
                    sx={{ mb: 4 }}
                    label='Contraseña'
                    onChange={onChange}
                    error={Boolean(errors.password)}
                    {...(errors.password && { helperText: errors.password?.message })}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton edge='end' onClick={() => setShowPassword(!showPassword)}>
                            <Icon fontSize='1.25rem' icon={showPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
              <Controller
                name='confirmPassword'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomTextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={value}
                    sx={{ mb: 6 }}
                    label='Confirmar Contraseña'
                    onChange={onChange}
                    error={Boolean(errors.confirmPassword)}
                    {...(errors.confirmPassword && { helperText: errors.confirmPassword?.message })}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton edge='end' onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Icon fontSize='1.25rem' icon={showConfirmPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button type='submit' variant='contained' sx={{ mr: 3 }}>
              {isPasswordMode || editData ? 'Editar' : 'Crear'}
            </Button>
            <Button variant='tonal' color='secondary' onClick={handleClose}>
              Cancelar
            </Button>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SidebarAddUser
