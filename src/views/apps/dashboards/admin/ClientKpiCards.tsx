// ** React Imports
import React from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import { alpha, useTheme } from '@mui/material/styles'

// ** Custom Components & Icons
import Icon from 'src/@core/components/icon'
import CustomAvatar from 'src/@core/components/mui/avatar'
import CustomChip from 'src/@core/components/mui/chip'

// ** Types
import { CompanyQuotaSummaryType } from 'src/types/apps/planTypes'

interface ClientKpiCardsProps {
  quota: CompanyQuotaSummaryType | null
  loading?: boolean
}

export const ClientKpiCards: React.FC<ClientKpiCardsProps> = ({ quota, loading = false }) => {
  const theme = useTheme()

  if (loading) {
    return (
      <>
        {[1, 2, 3, 4].map(idx => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Skeleton variant='text' width='60%' height={24} />
                  <Skeleton variant='circular' width={44} height={44} />
                </Box>
                <Skeleton variant='text' width='45%' height={42} sx={{ mb: 1 }} />
                <Skeleton variant='text' width='80%' height={18} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </>
    )
  }

  // Métricas calculadas
  const totalPages = quota?.totalPagesUploaded ?? 0
  const usersCurrent = quota?.users?.current ?? 0
  const usersMax = quota?.users?.max
  const storageMbCurrent = Number(quota?.storageMb?.current ?? 0)
  const storageMbMax = quota?.storageMb?.max
  const storagePercentage = Math.min(100, Math.max(0, quota?.storageMb?.percentage ?? 0))
  const ftpPrintersCount = quota?.activeFtpDevicesCount ?? 0

  const kpis = [
    {
      title: 'Hojas Escaneadas',
      value: totalPages.toLocaleString('es-AR'),
      subtitle: 'Odómetro acumulado histórico',
      helperText: 'Contador permanente que registra todas las hojas procesadas por el sistema. No disminuye al eliminar archivos.',
      icon: 'tabler:files',
      color: 'primary' as const,
      badge: 'Permanente',
      badgeColor: 'primary' as const,
      showProgress: false
    },
    {
      title: 'Usuarios Creados',
      value: usersCurrent.toLocaleString('es-AR'),
      subtitle: usersMax ? `${usersCurrent} de ${usersMax} cuentas del plan` : 'Cuentas activas en la empresa',
      helperText: 'Cantidad de usuarios de tu empresa con acceso a la plataforma HC-SCAN.',
      icon: 'tabler:users',
      color: 'info' as const,
      badge: usersMax ? `${Math.round((usersCurrent / usersMax) * 100)}%` : 'Activos',
      badgeColor: 'info' as const,
      showProgress: false
    },
    {
      title: 'Espacio en Servidor',
      value: `${storageMbCurrent.toFixed(1)} MB`,
      subtitle: storageMbMax ? `${storagePercentage}% de ${storageMbMax} MB máx.` : 'Almacenamiento Ilimitado',
      helperText: 'Consumo real de almacenamiento físico en los servidores seguros de HC-SCAN.',
      icon: 'tabler:database',
      color: 'warning' as const,
      badge: storageMbMax ? `${storagePercentage}%` : 'Ilimitado',
      badgeColor: storagePercentage > 85 ? ('error' as const) : ('warning' as const),
      showProgress: true,
      progressValue: storagePercentage
    },
    {
      title: 'Impresoras FTP',
      value: ftpPrintersCount.toLocaleString('es-AR'),
      subtitle: ftpPrintersCount === 1 ? '1 equipo conectado por red' : `${ftpPrintersCount} equipos conectados por red`,
      helperText: 'Equipos multifunción e impresoras HP sincronizadas y operativas vía SFTPGo.',
      icon: 'tabler:printer',
      color: 'success' as const,
      badge: 'En línea',
      badgeColor: 'success' as const,
      showProgress: false,
      isLiveDot: true
    }
  ]

  return (
    <>
      {kpis.map(kpi => (
        <Grid item xs={12} sm={6} md={3} key={kpi.title}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 2,
              position: 'relative',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: theme.shadows[4],
                borderColor: alpha(theme.palette[kpi.color].main, 0.4)
              }
            }}
          >
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box>
                {/* Cabecera del Card: Título + Icono */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography
                      variant='body2'
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontSize: '0.75rem'
                      }}
                    >
                      {kpi.title}
                    </Typography>
                    <Tooltip title={kpi.helperText} arrow placement='top'>
                      <Box component='span' sx={{ display: 'inline-flex', cursor: 'help', color: 'text.disabled' }}>
                        <Icon icon='tabler:info-circle' fontSize={15} />
                      </Box>
                    </Tooltip>
                  </Box>

                  <CustomAvatar
                    skin='light'
                    color={kpi.color}
                    variant='rounded'
                    sx={{
                      width: 44,
                      height: 44,
                      boxShadow: `0 2px 8px 0 ${alpha(theme.palette[kpi.color].main, 0.2)}`
                    }}
                  >
                    <Icon icon={kpi.icon} fontSize={24} />
                  </CustomAvatar>
                </Box>

                {/* Valor Principal Grande */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
                  <Typography variant='h3' sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary' }}>
                    {kpi.value}
                  </Typography>
                  {kpi.isLiveDot ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'success.main',
                          boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.25)}`
                        }}
                      />
                      <Typography variant='caption' sx={{ color: 'success.main', fontWeight: 600 }}>
                        {kpi.badge}
                      </Typography>
                    </Box>
                  ) : (
                    <CustomChip
                      rounded
                      size='small'
                      skin='light'
                      color={kpi.badgeColor}
                      label={kpi.badge}
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                    />
                  )}
                </Box>
              </Box>

              {/* Pie del Card: Subtítulo y Barra Opcional */}
              <Box sx={{ mt: 1 }}>
                {kpi.showProgress && (
                  <Box sx={{ mb: 1 }}>
                    <LinearProgress
                      variant='determinate'
                      value={kpi.progressValue || 0}
                      color={kpi.color}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette[kpi.color].main, 0.12)
                      }}
                    />
                  </Box>
                )}
                <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3 }}>
                  {kpi.subtitle}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </>
  )
}

export default ClientKpiCards
