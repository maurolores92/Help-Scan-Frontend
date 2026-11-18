// ** React Imports
import React from 'react'
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import { alpha, useTheme } from '@mui/material/styles'

// ** Custom Components & Icons
import Icon from 'src/@core/components/icon'
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Types
import { UserDataType } from 'src/context/types'
import { CompanyQuotaSummaryType } from 'src/types/apps/planTypes'

interface WelcomeCardProps {
  user: UserDataType | null
  quota: CompanyQuotaSummaryType | null
  loading?: boolean
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ user, quota, loading = false }) => {
  const theme = useTheme()

  // Format today's date in Spanish (e.g. "Miércoles, 18 de noviembre de 2026")
  const rawDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date())

  const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)

  // User display name & company
  const displayName = user?.name || user?.fullName || user?.username || 'Usuario'
  const companyName =
    (typeof user?.company === 'object' ? user?.company?.name : user?.company) ||
    (user?.companyId ? `Compañía #${user.companyId}` : 'Mi Empresa')

  const planName = quota?.plan?.name || (typeof user?.company === 'object' && user?.company?.plan?.name) || 'Plan Activo'

  if (loading) {
    return (
      <Card sx={{ height: '100%', borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 4, sm: 6 } }}>
          <Skeleton variant='text' width='40%' height={42} />
          <Skeleton variant='text' width='60%' height={24} sx={{ my: 1 }} />
          <Skeleton variant='rectangular' width={140} height={40} sx={{ mt: 3, borderRadius: 1 }} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'common.white',
        boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.35)}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -60,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -40,
          left: '30%',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }
      }}
    >
      <CardContent sx={{ p: { xs: 4, sm: 6 }, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems='center'>
          {/* Columna de Texto y Saludo */}
          <Grid item xs={12} md={8}>
            {/* Badges superiores: Empresa + Fecha */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
              <Chip
                icon={<Icon icon='tabler:building' fontSize={16} style={{ color: 'inherit' }} />}
                label={companyName}
                size='small'
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'common.white',
                  fontWeight: 600,
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
              />
              <Chip
                icon={<Icon icon='tabler:award' fontSize={16} style={{ color: 'inherit' }} />}
                label={planName}
                size='small'
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'common.white',
                  fontWeight: 500,
                  backdropFilter: 'blur(6px)'
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'rgba(255, 255, 255, 0.85)' }}>
                <Icon icon='tabler:calendar' fontSize={16} />
                <Typography variant='caption' sx={{ color: 'inherit', fontWeight: 500 }}>
                  {formattedDate}
                </Typography>
              </Box>
            </Box>

            {/* Saludo Personalizado */}
            <Typography
              variant='h4'
              sx={{
                color: 'common.white',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                mb: 1
              }}
            >
              ¡Bienvenido de vuelta, {displayName}! 👋
            </Typography>

            {/* Subtítulo / Misión */}
            <Typography
              variant='body1'
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                maxWidth: 620,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                lineHeight: 1.5,
                mb: 3
              }}
            >
              Panel central de digitalización, escaneo por red FTP y consulta inteligente de documentos indexados.
            </Typography>

            {/* Botones de Acción Rápida */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button
                component={Link}
                href='/documents'
                variant='contained'
                startIcon={<Icon icon='tabler:files' />}
                sx={{
                  backgroundColor: 'common.white',
                  color: 'primary.main',
                  fontWeight: 600,
                  px: 3,
                  py: 1.2,
                  boxShadow: '0 4px 14px 0 rgba(0,0,0,0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    boxShadow: '0 6px 18px 0 rgba(0,0,0,0.2)'
                  }
                }}
              >
                Ver Documentos
              </Button>
              <Button
                component={Link}
                href='/documents?action=upload'
                variant='outlined'
                startIcon={<Icon icon='tabler:cloud-upload' />}
                sx={{
                  color: 'common.white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: 600,
                  px: 3,
                  py: 1.2,
                  '&:hover': {
                    borderColor: 'common.white',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)'
                  }
                }}
              >
                Subir Archivo
              </Button>
            </Box>
          </Grid>

          {/* Columna Derecha: Composición Visual de Estado de Servicios */}
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                width: '100%',
                maxWidth: 280,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CustomAvatar
                  skin='light'
                  variant='rounded'
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'common.white',
                    width: 44,
                    height: 44
                  }}
                >
                  <Icon icon='tabler:scan' fontSize={26} />
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' sx={{ color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Motor de Ingesta
                  </Typography>
                  <Typography variant='subtitle2' sx={{ color: 'common.white', fontWeight: 700 }}>
                    HC-SCAN Enterprise
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant='caption' sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Icon icon='tabler:check' fontSize={15} style={{ color: '#4ade80' }} />
                    OCR Híbrido (300 DPI)
                  </Typography>
                  <CustomChip
                    rounded
                    size='small'
                    skin='light'
                    label='Activo'
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(74, 222, 128, 0.2)',
                      color: '#bbf7d0'
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant='caption' sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Icon icon='tabler:check' fontSize={15} style={{ color: '#4ade80' }} />
                    Servidor FTP / SFTPGo
                  </Typography>
                  <CustomChip
                    rounded
                    size='small'
                    skin='light'
                    label='En línea'
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(74, 222, 128, 0.2)',
                      color: '#bbf7d0'
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default WelcomeCard
