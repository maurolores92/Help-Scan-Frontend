import React, { useState } from 'react'
import { Box, Card, Chip, Grid, Tab, Tabs, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import EmailChannelTab from './EmailChannelTab'
import UpcomingChannelTab from './UpcomingChannelTab'

type ChannelTabKey = 'email' | 'whatsapp' | 'telegram'

const ChannelsConfigView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ChannelTabKey>('email')

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ mb: 1 }}>
          <Typography variant='h4' sx={{ fontWeight: 600 }}>
            Configuración de Canales de Ingesta
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Conecta tus cuentas de correo electrónico y futuros canales de mensajería para recibir e indexar comprobantes automáticamente.
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_e, val) => setActiveTab(val)}
            variant='scrollable'
            scrollButtons='auto'
            sx={{ px: 3 }}
          >
            <Tab
              value='email'
              label='Correo Electrónico (IMAP)'
              icon={<Icon icon='tabler:mail' fontSize={20} />}
              iconPosition='start'
            />
            <Tab
              value='whatsapp'
              icon={<Icon icon='tabler:brand-whatsapp' fontSize={20} />}
              iconPosition='start'
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <span>WhatsApp Business</span>
                  <Chip label='Pronto' size='small' color='warning' sx={{ height: 20, fontSize: '0.7rem' }} />
                </Box>
              }
            />
            <Tab
              value='telegram'
              icon={<Icon icon='tabler:brand-telegram' fontSize={20} />}
              iconPosition='start'
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <span>Telegram Bot</span>
                  <Chip label='Pronto' size='small' color='warning' sx={{ height: 20, fontSize: '0.7rem' }} />
                </Box>
              }
            />
          </Tabs>
        </Card>
      </Grid>

      <Grid item xs={12}>
        {activeTab === 'email' && <EmailChannelTab />}

        {activeTab === 'whatsapp' && (
          <UpcomingChannelTab
            title='WhatsApp Business'
            subtitle='Recepción de remitos, tickets y facturas desde el celular en ruta o depósito'
            icon='tabler:brand-whatsapp'
            color='success'
            features={[
              'Envío de fotos de remitos firmados y tickets de viáticos desde cualquier celular autorizado.',
              'Conversión automática de fotografías a PDF con corrección de perspectiva y OCR.',
              'Confirmación instantánea al chofer o empleado indicando el número de comprobante registrado.',
              'Almacenamiento cifrado AES-256 directo en la bóveda de tu compañía.'
            ]}
          />
        )}

        {activeTab === 'telegram' && (
          <UpcomingChannelTab
            title='Telegram Bot Corporativo'
            subtitle='Bot privado para carga instantánea de documentos por sucursal o sector'
            icon='tabler:brand-telegram'
            color='info'
            features={[
              'Bot dedicado con validación de usuarios y permisos internos por sucursal.',
              'Envío directo de PDFs e imágenes sin compresión ni límites de tamaño.',
              'Consultas rápidas por chat sobre facturas pendientes de aprobación o vencimientos.'
            ]}
          />
        )}
      </Grid>
    </Grid>
  )
}

export default ChannelsConfigView
