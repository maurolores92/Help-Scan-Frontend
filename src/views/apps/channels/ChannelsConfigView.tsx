import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Card, Grid, Tab, Tabs, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import EmailChannelTab from './EmailChannelTab'
import WhatsappChannelTab from './WhatsappChannelTab'
import TelegramChannelTab from './TelegramChannelTab'

type ChannelTabKey = 'email' | 'whatsapp' | 'telegram'

const ChannelsConfigView: React.FC = () => {
  const { user } = useAuth()

  const enabledModules = useMemo<string[] | null>(() => {
    const comp = user?.company
    if (comp && typeof comp === 'object' && Array.isArray(comp.enabledModules)) {
      return comp.enabledModules
    }

    return null
  }, [user])

  const availableTabs = useMemo<ChannelTabKey[]>(() => {
    if (!enabledModules) {
      return ['email', 'whatsapp', 'telegram']
    }

    const tabs: ChannelTabKey[] = []
    if (enabledModules.includes('email')) tabs.push('email')
    if (enabledModules.includes('whatsapp')) tabs.push('whatsapp')
    if (enabledModules.includes('telegram')) tabs.push('telegram')

    return tabs
  }, [enabledModules])

  const [activeTab, setActiveTab] = useState<ChannelTabKey>('email')

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0])
    }
  }, [availableTabs, activeTab])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ mb: 1 }}>
          <Typography variant='h4' sx={{ fontWeight: 600 }}>
            Configuración de Canales de Ingesta
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Conecta tus cuentas de correo electrónico y mensajería habilitadas para recibir e indexar comprobantes automáticamente.
          </Typography>
        </Box>
      </Grid>

      {availableTabs.length === 0 ? (
        <Grid item xs={12}>
          <Alert severity='info'>
            Tu empresa no tiene canales externos (Email, WhatsApp o Telegram) habilitados actualmente en su plan.
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
            {activeTab === 'email' && availableTabs.includes('email') && <EmailChannelTab />}

            {activeTab === 'whatsapp' && availableTabs.includes('whatsapp') && <WhatsappChannelTab />}

            {activeTab === 'telegram' && availableTabs.includes('telegram') && <TelegramChannelTab />}
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default ChannelsConfigView
