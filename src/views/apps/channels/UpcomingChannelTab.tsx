import React from 'react'
import { Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

interface UpcomingChannelTabProps {
  title: string
  subtitle: string
  icon: string
  color: 'success' | 'info'
  features: string[]
}

const UpcomingChannelTab: React.FC<UpcomingChannelTabProps> = ({
  title,
  subtitle,
  icon,
  color,
  features
}) => {
  return (
    <Card>
      <CardContent sx={{ py: 8, px: { xs: 4, md: 8 } }}>
        <Grid container spacing={6} alignItems='center'>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: `${color}.main`,
                  color: 'common.white'
                }}
              >
                <Icon icon={icon} fontSize={28} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant='h5'>{title}</Typography>
                  <Chip label='Próximamente' color='warning' size='small' />
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {subtitle}
                </Typography>
              </Box>
            </Box>

            <Typography variant='body1' color='text.secondary' sx={{ mt: 3, mb: 3 }}>
              Estamos preparando este canal de captura directa para ampliar las vías de ingreso de comprobantes de tu empresa:
            </Typography>

            <Box component='ul' sx={{ pl: 4, m: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {features.map((feat, idx) => (
                <Typography key={idx} component='li' variant='body2' color='text.primary'>
                  {feat}
                </Typography>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={5} sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                p: 6,
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'action.hover'
              }}
            >
              <Icon icon={icon} fontSize={64} />
              <Typography variant='subtitle1' sx={{ mt: 2, fontWeight: 600 }}>
                Integración en Desarrollo
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                Una vez habilitado, podrás vincular tu número o bot desde esta misma pestaña en cuestión de segundos.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default UpcomingChannelTab
