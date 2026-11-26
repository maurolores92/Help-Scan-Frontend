import React, { useEffect } from 'react'
import { InputAdornment, MenuItem, TextField } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import { AppDispatch, RootState } from 'src/store'
import { fetchUsersChannelsOverview } from 'src/store/apps/channels'
import { ChannelUserRef } from 'src/types/apps/channelTypes'

export const formatChannelUserName = (u?: ChannelUserRef | null): string => {
  if (!u) return 'Sistema / Sin usuario'
  const fullName = `${u.name || ''} ${u.lastName || ''}`.trim()
  if (fullName) return fullName
  if (u.username) return `@${u.username}`

  return u.email || `Usuario #${u.id}`
}

export const isChannelCompanyAdmin = (user: any): boolean => {
  const roleSlug =
    typeof user?.role === 'string'
      ? user.role.toLowerCase()
      : String(user?.role?.slug || '').toLowerCase()

  return Boolean(user?.isAdmin === true || roleSlug === 'company_admin' || roleSlug === 'admin')
}

interface InboxUserFilterSelectProps {
  value: number | ''
  onChange: (userId: number | '') => void
  label?: string
  usersList?: ChannelUserRef[]
  adminOnly?: boolean
  fullWidth?: boolean
  minWidth?: number
}

const InboxUserFilterSelect: React.FC<InboxUserFilterSelectProps> = ({
  value,
  onChange,
  label = 'Usuario',
  usersList,
  adminOnly = true,
  fullWidth = false,
  minWidth = 220
}) => {
  const { user } = useAuth()
  const dispatch = useDispatch<AppDispatch>()
  const { usersOverview, loadingUsersOverview } = useSelector((state: RootState) => state.channels)

  const isAdmin = isChannelCompanyAdmin(user)
  const shouldFetchOverview = !usersList && (!adminOnly || isAdmin)

  useEffect(() => {
    if (shouldFetchOverview && usersOverview.length === 0 && !loadingUsersOverview) {
      dispatch(fetchUsersChannelsOverview())
    }
  }, [shouldFetchOverview, usersOverview.length, loadingUsersOverview, dispatch])

  if (adminOnly && !isAdmin) {
    return null
  }

  const options = usersList || usersOverview

  return (
    <TextField
      select
      size='small'
      fullWidth={fullWidth}
      label={label}
      value={value}
      onChange={e => {
        const raw = e.target.value

        onChange(raw === '' ? '' : Number(raw))
      }}
      sx={fullWidth ? undefined : { minWidth }}
      InputProps={{
        startAdornment: (
          <InputAdornment position='start'>
            <Icon icon='tabler:user' fontSize={16} />
          </InputAdornment>
        )
      }}
    >
      <MenuItem value=''>Todos los usuarios</MenuItem>
      {options.map(u => (
        <MenuItem key={u.id} value={u.id}>
          {formatChannelUserName(u)}
          {u.username ? ` (@${u.username})` : ''}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default InboxUserFilterSelect
