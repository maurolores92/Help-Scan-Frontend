import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Alert, Box, Card, Grid, Tab, Tabs, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { useAuth } from 'src/hooks/useAuth'
import { isChannelCompanyAdmin } from 'src/components/channels/InboxUserFilterSelect'
import ChannelUserSelectorBar from './ChannelUserSelectorBar'
import EmailChannelTab from './EmailChannelTab'
import WhatsappChannelTab from './WhatsappChannelTab'
import TelegramChannelTab from './TelegramChannelTab'

type ChannelTabKey = 'email' | 'whatsapp' | 'telegram'

const ChannelsConfigView: React.FC = () => {
  const { user } = useAuth()
  const ability = useContext(AbilityContext)
  const isAdmin = isChannelCompanyAdmin(user)

  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(() =>
    user?.id ? Number(user.id) : undefined
  )

  useEffect(() => {
    if (!selectedUserId && user?.id) {
      setSelectedUserId(Number(user.id))
    }
  }, [selectedUserId, user?.id])

  const enabledModules = useMemo<string[] | null>(() => {
    const comp = user?.company
    if (comp && typeof comp === 'object' && Array.isArray(comp.enabledModules)) {
      return comp.enabledModules
    }

    return null
  }, [user])

  const canManageGlobal = isAdmin || Boolean(ability?.can('manage', 'channels'))
  const canViewGlobal = canManageGlobal || Boolean(ability?.can('read', 'channels'))

  const permissionsMap = useMemo(
    () => ({
      emailView:
        (!enabledModules || enabledModules.includes('email')) &&
        (canViewGlobal ||
          Boolean(ability?.can('manage', 'own_email_channel')) ||
          Boolean(ability?.can('read', 'email_inbox'))),
      whatsappView:
        (!enabledModules || enabledModules.includes('whatsapp')) &&
        (canViewGlobal ||
          Boolean(ability?.can('manage', 'own_whatsapp_channel')) ||
          Boolean(ability?.can('read', 'whatsapp_inbox'))),
      telegramView:
        (!enabledModules || enabledModules.includes('telegram')) &&
        (canViewGlobal ||
          Boolean(ability?.can('manage', 'own_telegram_channel')) ||
          Boolean(ability?.can('read', 'telegram_inbox'))),
      emailManage: canManageGlobal || Boolean(ability?.can('manage', 'own_email_channel')),
      whatsappManage: canManageGlobal || Boolean(ability?.can('manage', 'own_whatsapp_channel')),
      telegramManage: canManageGlobal || Boolean(ability?.can('manage', 'own_telegram_channel'))
    }),
    [enabledModules, canManageGlobal, canViewGlobal, ability]
  )

  const availableTabs = useMemo<ChannelTabKey[]>(() => {
    const tabs: ChannelTabKey[] = []
    if (permissionsMap.emailView) tabs.push('email')
    if (permissionsMap.whatsappView) tabs.push('whatsapp')
    if (permissionsMap.telegramView) tabs.push('telegram')

    return tabs
  }, [permissionsMap])

  const [activeTab, setActiveTab] = useState<ChannelTabKey>('email')

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0])
    }
  }, [availableTabs, activeTab])

  const effectiveTargetUserId = isAdmin ? selectedUserId : undefined

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ mb: 1 }}>
          <Typography variant='h4' sx={{ fontWeight: 600 }}>
            Configuración de Canales de Ingesta
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Conecta tu cuenta personal de correo electrónico, WhatsApp o Telegram para recibir comprobantes directo en la bóveda de documentos.
          </Typography>
        </Box>
      </Grid>

      {isAdmin && availableTabs.length > 0 && (
        <Grid item xs={12}>
          <ChannelUserSelectorBar
            selectedUserId={selectedUserId}
            onSelectUser={userId => setSelectedUserId(userId)}
          />
        </Grid>
      )}

      {availableTabs.length === 0 ? (
        <Grid item xs={12}>
          <Alert severity='info'>
            No tenés canales externos (Email, WhatsApp o Telegram) habilitados o permitidos actualmente para tu rol.
          </Alert>
        </Grid>
      ) : (
        <>
          <Grid item xs={12}>
            <Card sx={{ mb: 2 }}>
              <Tabs
                value={availableTabs.includes(activeTab) ? activeTab : availableTabs[0]}
                onChange={(_e, val) => setActiveTab(val)}
                variant='scrollable'
                scrollButtons='auto'
                sx={{ px: 3 }}
              >
                {availableTabs.includes('email') && (
                  <Tab
                    value='email'
                    label='Correo Electrónico (IMAP)'
                    icon={<Icon icon='tabler:mail' fontSize={20} />}
                    iconPosition='start'
                  />
                )}
                {availableTabs.includes('whatsapp') && (
                  <Tab
                    value='whatsapp'
                    label='WhatsApp Business'
                    icon={<Icon icon='tabler:brand-whatsapp' fontSize={20} />}
                    iconPosition='start'
                  />
                )}
                {availableTabs.includes('telegram') && (
                  <Tab
                    value='telegram'
                    label='Telegram Bot'
                    icon={<Icon icon='tabler:brand-telegram' fontSize={20} />}
                    iconPosition='start'
                  />
                )}
              </Tabs>
            </Card>
          </Grid>

          <Grid item xs={12}>
            {activeTab === 'email' && availableTabs.includes('email') && (
              <EmailChannelTab
                targetUserId={effectiveTargetUserId}
                readOnly={!permissionsMap.emailManage}
              />
            )}

            {activeTab === 'whatsapp' && availableTabs.includes('whatsapp') && (
              <WhatsappChannelTab
                targetUserId={effectiveTargetUserId}
                readOnly={!permissionsMap.whatsappManage}
              />
            )}

            {activeTab === 'telegram' && availableTabs.includes('telegram') && (
              <TelegramChannelTab
                targetUserId={effectiveTargetUserId}
                readOnly={!permissionsMap.telegramManage}
              />
            )}
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default ChannelsConfigView
