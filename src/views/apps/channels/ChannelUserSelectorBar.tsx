import React, { useEffect } from 'react'
import { Box, Card, CardContent, Chip, MenuItem, TextField, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import { AppDispatch, RootState } from 'src/store'
import { fetchUsersChannelsOverview } from 'src/store/apps/channels'
import { formatChannelUserName, isChannelCompanyAdmin } from 'src/components/channels/InboxUserFilterSelect'

interface ChannelUserSelectorBarProps {
  selectedUserId?: number
  onSelectUser: (userId: number) => void
}

const ChannelUserSelectorBar: React.FC<ChannelUserSelectorBarProps> = ({
  selectedUserId,
  onSelectUser
}) => {
  const { user } = useAuth()
  const dispatch = useDispatch<AppDispatch>()
  const { usersOverview, loadingUsersOverview } = useSelector((state: RootState) => state.channels)

  const isAdmin = isChannelCompanyAdmin(user)

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchUsersChannelsOverview())
    }
  }, [isAdmin, dispatch])

  if (!isAdmin) {
    return null
  }

  const effectiveUserId = selectedUserId || Number(user?.id) || 0
  const selectedUserObj = usersOverview.find(u => Number(u.id) === Number(effectiveUserId))

  const emailCount = usersOverview.filter(u => u.channels?.email).length
  const whatsappCount = usersOverview.filter(
    u => u.channels?.whatsapp?.connectionStatus === 'CONNECTED'
  ).length
  const telegramCount = usersOverview.filter(u => u.channels?.telegram).length

  return (
    <Card sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
      <CardContent
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
          py: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <Icon icon='tabler:users-group' fontSize={22} />
          <Box>
            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
              Canales por Usuario de la Compañía
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {selectedUserObj
                ? `Visualizando y configurando los canales propios de ${formatChannelUserName(selectedUserObj)}.`
                : 'Seleccioná un usuario para configurar o supervisar su Email, WhatsApp o Telegram.'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip size='small' variant='outlined' color='info' label={`Emails: ${emailCount}`} />
          <Chip
            size='small'
            variant='outlined'
            color='success'
            label={`WhatsApp activos: ${whatsappCount}`}
          />
          <Chip size='small' variant='outlined' color='primary' label={`Telegram: ${telegramCount}`} />

          <TextField
            select
            size='small'
            label='Usuario a configurar'
            value={effectiveUserId || ''}
            disabled={loadingUsersOverview && usersOverview.length === 0}
            onChange={e => onSelectUser(Number(e.target.value))}
            sx={{ minWidth: 260 }}
          >
            {usersOverview.length === 0 && user?.id ? (
              <MenuItem value={Number(user.id)}>{formatChannelUserName(user)}</MenuItem>
            ) : (
              usersOverview.map(u => {
                const activeTags = [
                  u.channels?.email ? 'Email' : null,
                  u.channels?.whatsapp ? 'WA' : null,
                  u.channels?.telegram ? 'TG' : null
                ]
                  .filter(Boolean)
                  .join(' · ')

                return (
                  <MenuItem key={u.id} value={u.id}>
                    {formatChannelUserName(u)}
                    {Number(u.id) === Number(user?.id) ? ' (Vos)' : ''}
                    {activeTags ? ` — [${activeTags}]` : ''}
                  </MenuItem>
                )
              })
            )}
          </TextField>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ChannelUserSelectorBar
