import { Box, Card, CardContent, Chip, Grid, Skeleton, Stack, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { SecurityOverviewResponse } from 'src/types/apps/securityTypes'

interface SecurityKpiCardsProps {
  overview: SecurityOverviewResponse | null
  loading: boolean
}

export const SecurityKpiCards = ({ overview, loading }: SecurityKpiCardsProps) => {
  const kpis = overview?.kpis

  const cards = [
    {
      title: 'IPs Monitoreadas',
      value: kpis?.totalIpsTracked ?? 0,
      subtitle: `${kpis?.activeIps24h ?? 0} activas en las últimas 24h`,
      icon: 'tabler:world-search',
      color: 'info' as const,
    },
    {
      title: 'IPs Bloqueadas',
      value: kpis?.blockedIpsCount ?? 0,
      subtitle: 'Bloqueo activo en middleware HTTP',
      icon: 'tabler:shield-off',
      color: 'error' as const,
    },
    {
      title: 'Logins Fallidos / Bloq.',
      value: (kpis?.loginsFailedPeriod ?? 0) + (kpis?.loginsBlockedPeriod ?? 0),
      subtitle: `${kpis?.loginsSuccessPeriod ?? 0} exitosos · ${kpis?.loginsFailedPeriod ?? 0} fallidos`,
      icon: 'tabler:user-exclamation',
      color: 'warning' as const,
    },
    {
      title: 'Errores 4xx / 5xx',
      value: (kpis?.errors4xxPeriod ?? 0) + (kpis?.errors5xxPeriod ?? 0),
      subtitle: `4xx: ${kpis?.errors4xxPeriod ?? 0} · 5xx: ${kpis?.errors5xxPeriod ?? 0} · UI: ${kpis?.frontendErrorsPeriod ?? 0}`,
      icon: 'tabler:bug',
      color: (kpis?.errors5xxPeriod ?? 0) > 0 ? ('error' as const) : ('primary' as const),
    },
  ]

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        {cards.map(item => (
          <Grid item xs={12} sm={6} lg={3} key={item.title}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                  <Box>
                    <Typography variant='body2' color='text.secondary' fontWeight={500}>
                      {item.title}
                    </Typography>
                    {loading && !overview ? (
                      <Skeleton width={70} height={42} />
                    ) : (
                      <Typography variant='h4' fontWeight={700} sx={{ my: 0.75 }}>
                        {item.value.toLocaleString('es-AR')}
                      </Typography>
                    )}
                    <Typography variant='caption' color='text.secondary'>
                      {item.subtitle}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${item.color}.lighter`,
                      color: `${item.color}.main`,
                    }}
                  >
                    <Icon icon={item.icon} fontSize={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {overview?.topCountries && overview.topCountries.length > 0 && (
        <Card sx={{ mt: 3, borderRadius: 2 }}>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction='row' flexWrap='wrap' alignItems='center' gap={1.5}>
              <Typography variant='body2' fontWeight={600} color='text.secondary'>
                Orígenes frecuentes:
              </Typography>
              {overview.topCountries.map(country => (
                <Chip
                  key={country.countryCode}
                  size='small'
                  variant='outlined'
                  label={`${country.countryCode} · ${country.countryName}: ${country.ipsCount} IP${country.ipsCount === 1 ? '' : 's'}`}
                />
              ))}
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                size='small'
                color='default'
                icon={<Icon icon='tabler:clock-hour-4' fontSize={15} />}
                label={`Retención de logs: ${overview.retentionDays} días`}
              />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
