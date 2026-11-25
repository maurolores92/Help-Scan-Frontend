import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { ClientDocumentsSummary, ClientItem } from 'src/types/apps/clientTypes'

interface ClientDetailHeaderCardProps {
  client: ClientItem
  summary: ClientDocumentsSummary | null
  canUpdate: boolean
  syncing: boolean
  onBack: () => void
  onEdit: () => void
  onSync: () => void
}

const InfoBadge = ({ icon, label, value }: { icon: string; label: string; value?: string | null }) => {
  if (!value) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 180 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>
        <Icon icon={icon} fontSize={16} />
      </Box>
      <Box>
        <Typography variant='caption' color='text.secondary' display='block' lineHeight={1.1}>
          {label}
        </Typography>
        <Typography variant='body2' sx={{ fontWeight: 500 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  )
}

export const ClientDetailHeaderCard: React.FC<ClientDetailHeaderCardProps> = ({
  client,
  summary,
  canUpdate,
  syncing,
  onBack,
  onEdit,
  onSync
}) => {
  const fullAddress = [client.address, client.city, client.province, client.postalCode]
    .filter(Boolean)
    .join(', ')

  const kpis = [
    {
      label: 'Total Asociados',
      value: summary?.total ?? 0,
      icon: 'tabler:files',
      color: 'primary.main'
    },
    {
      label: 'Como Destinatario',
      value: summary?.byRole?.recipient ?? 0,
      icon: 'tabler:arrow-down-left',
      color: 'info.main'
    },
    {
      label: 'Emitidos por Cliente',
      value: summary?.byRole?.issuer ?? 0,
      icon: 'tabler:arrow-up-right',
      color: 'success.main'
    },
    {
      label: 'Pendientes Revisión',
      value: summary?.byStatus?.pendingApproval ?? 0,
      icon: 'tabler:clock-exclamation',
      color: 'warning.main'
    }
  ]

  return (
    <Box sx={{ mb: 4 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon icon='tabler:building' fontSize={28} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                  <Typography variant='h5' sx={{ fontWeight: 700 }}>
                    {client.name}
                  </Typography>
                  {client.taxId ? (
                    <Chip
                      size='small'
                      color='primary'
                      variant='outlined'
                      label={`${client.taxIdType || 'CUIT/CUIL'}: ${client.taxId}`}
                      sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                  ) : (
                    <Chip size='small' color='warning' variant='outlined' label='CUIT/CUIL pendiente' />
                  )}
                  <Chip
                    size='small'
                    color={client.isActive ? 'success' : 'secondary'}
                    label={client.isActive ? 'Activo' : 'Inactivo'}
                  />
                </Box>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                  {[client.tradeName, client.taxCondition, client.erpCode ? `Cód. ERP: ${client.erpCode}` : '']
                    .filter(Boolean)
                    .join(' · ') || 'Cliente administrativo'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant='outlined' color='secondary' startIcon={<Icon icon='tabler:arrow-left' />} onClick={onBack}>
                Volver
              </Button>
              {canUpdate && (
                <>
                  <Button
                    variant='outlined'
                    color='info'
                    disabled={syncing}
                    startIcon={syncing ? <CircularProgress size={16} color='inherit' /> : <Icon icon='tabler:link' />}
                    onClick={onSync}
                  >
                    {syncing ? 'Sincronizando...' : 'Asociar Pendientes'}
                  </Button>
                  <Button variant='contained' color='primary' startIcon={<Icon icon='tabler:edit' />} onClick={onEdit}>
                    Editar Ficha
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <InfoBadge icon='tabler:receipt-tax' label='IIBB' value={client.iibbNumber || client.iibbCondition} />
            <InfoBadge icon='tabler:user' label='Contacto' value={client.contactName} />
            <InfoBadge icon='tabler:mail' label='Email' value={client.email} />
            <InfoBadge
              icon='tabler:phone'
              label='Teléfono'
              value={[client.phone, client.secondaryPhone].filter(Boolean).join(' / ') || null}
            />
            <InfoBadge icon='tabler:map-pin' label='Domicilio' value={fullAddress || null} />
            <InfoBadge icon='tabler:cash' label='Condición de Venta' value={client.paymentTerms} />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        {kpis.map(kpi => (
          <Grid item xs={6} sm={3} key={kpi.label}>
            <Card>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      {kpi.label}
                    </Typography>
                    <Typography variant='h5' sx={{ fontWeight: 700, mt: 0.25 }}>
                      {kpi.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: kpi.color }}>
                    <Icon icon={kpi.icon} fontSize={26} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default ClientDetailHeaderCard
