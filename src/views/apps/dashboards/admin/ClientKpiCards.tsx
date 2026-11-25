// ** React Imports
import React from 'react'
import Link from 'next/link'

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
import { formatStorageMb } from 'src/components/common/QuotaProgressBar'

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
  const totalProcessed =
    quota?.totalDocumentsProcessed ?? quota?.processingBilling?.processedCount ?? 0
  const processedThisMonth =
    quota?.processingBilling?.processedCount ?? quota?.aiQueries?.aiDocumentsProcessed ?? 0
  const unitPriceArs = Number(quota?.processingBilling?.unitPriceArs ?? 0)
  const additionalCostArs = Number(quota?.processingBilling?.additionalCostArs ?? 0)

  const usersCurrent = quota?.users?.current ?? 0
  const usersMax = quota?.users?.max

  const storedFilesCount = quota?.activeDocumentsCount ?? quota?.documents?.current ?? 0
  const storedFilesMax = quota?.documents?.max ?? null
  const storageMbCurrent = Number(quota?.storageMb?.current ?? 0)
  const storageMbMax = quota?.storageMb?.max ?? null
  const storagePercentage = Math.min(100, Math.max(0, quota?.storageMb?.percentage ?? 0))

  const ftpPrintersCount = quota?.activeFtpDevicesCount ?? 0
  const ftpActive = ftpPrintersCount > 0

  const processedSubtitle =
    unitPriceArs > 0
      ? `Ciclo actual: ${processedThisMonth.toLocaleString('es-AR')} docs (+ $${additionalCostArs.toLocaleString('es-AR')} ARS)`
      : `Ciclo actual: ${processedThisMonth.toLocaleString('es-AR')} docs • No baja al eliminar`

  const kpis = [
    {
      title: 'Documentos Procesados',
      value: totalProcessed.toLocaleString('es-AR'),
      subtitle: processedSubtitle,
      helperText:
        'Contador permanente de documentos procesados por el sistema. Nunca disminuye al eliminar archivos.',
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
      helperText: 'Cantidad de usuarios de tu empresa con sesión única por cuenta.',
      icon: 'tabler:users',
      color: 'info' as const,
      badge: usersMax ? `${Math.round((usersCurrent / usersMax) * 100)}%` : 'Activos',
      badgeColor: 'info' as const,
      showProgress: false
    },
    {
      title: 'Espacio en Servidor',
      value: formatStorageMb(storageMbCurrent),
      subtitle: `Archivos guardados: ${storedFilesCount.toLocaleString('es-AR')}${
        storedFilesMax ? ` / ${storedFilesMax.toLocaleString('es-AR')}` : ''
      } • ${storageMbMax ? `Máx. ${formatStorageMb(storageMbMax)}` : 'Ilimitado'}`,
      helperText:
        'Almacenamiento binario y cantidad de archivos guardados actualmente en la bóveda (se libera al eliminar).',
      icon: 'tabler:database',
      color: 'warning' as const,
      badge: storageMbMax ? `${storagePercentage}%` : `${storedFilesCount} arch.`,
      badgeColor: storagePercentage > 85 ? ('error' as const) : ('warning' as const),
      showProgress: true,
      progressValue: storagePercentage
    },
    {
      title: 'Impresoras FTP',
      value: ftpPrintersCount.toLocaleString('es-AR'),
      subtitle:
        ftpPrintersCount === 1
          ? '1 equipo conectado por red'
          : `${ftpPrintersCount} equipos conectados por red`,
      helperText: 'Equipos multifunción e impresoras HP sincronizadas y operativas vía SFTPGo.',
      icon: 'tabler:printer',
      color: ftpActive ? ('success' as const) : ('secondary' as const),
      badge: ftpActive ? 'Activo' : 'Inactivo',
      badgeColor: ftpActive ? ('success' as const) : ('secondary' as const),
      showProgress: false,
      isStatusDot: true,
      isActiveStatus: ftpActive
    }
  ]

  const channelTools = [
    {
      key: 'whatsapp',
      title: 'WhatsApp',
      icon: 'tabler:brand-whatsapp',
      color: 'success' as const,
      info: quota?.channels?.whatsapp
    },
    {
      key: 'email',
      title: 'Email / Correo',
      icon: 'tabler:mail',
      color: 'info' as const,
      info: quota?.channels?.email
    },
    {
      key: 'telegram',
      title: 'Telegram',
      icon: 'tabler:brand-telegram',
      color: 'primary' as const,
      info: quota?.channels?.telegram
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
            <CardContent
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'space-between'
              }}
            >
              <Box>
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

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
                  <Typography variant='h3' sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary' }}>
                    {kpi.value}
                  </Typography>
                  {kpi.isStatusDot ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: kpi.isActiveStatus ? 'success.main' : 'text.disabled',
                          boxShadow: kpi.isActiveStatus
                            ? `0 0 0 3px ${alpha(theme.palette.success.main, 0.25)}`
                            : 'none'
                        }}
                      />
                      <Typography
                        variant='caption'
                        sx={{
                          color: kpi.isActiveStatus ? 'success.main' : 'text.secondary',
                          fontWeight: 600
                        }}
                      >
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

      {/* Canales automáticos disponibles / integraciones de la compañía */}
      {channelTools.map(tool => {
        const enabledInPlan = Boolean(tool.info?.enabledInPlan)
        const isActive = Boolean(tool.info?.active)

        const description = isActive
          ? 'Canal conectado y recibiendo comprobantes automáticamente.'
          : enabledInPlan
            ? 'Incluido en tu plan • Pendiente de activar o vincular.'
            : 'No incluido en tu plan actual • Disponible como módulo adicional.'

        return (
          <Grid item xs={12} sm={6} md={4} key={tool.key}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                opacity: enabledInPlan ? 1 : 0.85,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[3]
                }
              }}
            >
              <CardContent sx={{ p: 3.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                  <CustomAvatar
                    skin='light'
                    color={isActive ? tool.color : 'secondary'}
                    variant='rounded'
                    sx={{ width: 42, height: 42, flexShrink: 0 }}
                  >
                    <Icon icon={tool.icon} fontSize={22} />
                  </CustomAvatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                        {tool.title}
                      </Typography>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: isActive ? 'success.main' : 'text.disabled',
                            boxShadow: isActive
                              ? `0 0 0 3px ${alpha(theme.palette.success.main, 0.22)}`
                              : 'none'
                          }}
                        />
                        <Typography
                          variant='caption'
                          sx={{
                            fontWeight: 700,
                            color: isActive ? 'success.main' : 'text.secondary'
                          }}
                        >
                          {isActive ? 'Activo' : 'Inactivo'}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.35, mt: 0.25 }}>
                      {description}
                    </Typography>
                  </Box>
                </Box>

                {enabledInPlan && (
                  <Link href='/channels' style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <CustomChip
                      clickable
                      rounded
                      size='small'
                      skin='light'
                      color={isActive ? tool.color : 'warning'}
                      label={isActive ? 'Gestionar' : 'Configurar'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Link>
                )}
              </CardContent>
            </Card>
          </Grid>
        )
      })}
    </>
  )
}

export default ClientKpiCards
