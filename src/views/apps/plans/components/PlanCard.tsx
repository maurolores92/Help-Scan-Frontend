import React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import Icon from 'src/@core/components/icon'
import { PlanType } from 'src/types/apps/planTypes'
import { calcBinaryStorageMbFromFiles, formatStorageMb } from 'src/components/common/QuotaProgressBar'

interface PlanCardProps {
  plan: PlanType
  onEdit: (plan: PlanType) => void
  onDelete: (plan: PlanType) => void
}

const renderLimitText = (value: number | null, suffix: string, formatter?: (n: number) => string) => {
  if (value === null || value === undefined) return 'Ilimitado'
  if (formatter) return formatter(value)

  return `${value.toLocaleString('es-AR')} ${suffix}`
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onEdit, onDelete }) => {
  const chipColor = (plan.badgeColor || 'primary') as
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'error'

  const companiesCount = plan.companiesCount ?? 0

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: plan.isDefault ? 'primary.main' : 'divider',
        opacity: plan.isActive ? 1 : 0.72
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={plan.name} color={chipColor} size='small' sx={{ fontWeight: 700 }} />
            {plan.isDefault && (
              <Chip label='Predeterminado' color='primary' variant='outlined' size='small' />
            )}
            {!plan.isActive && <Chip label='Inactivo' color='error' size='small' />}
          </Box>
          <Typography variant='caption' sx={{ color: 'text.disabled' }}>
            /{plan.slug}
          </Typography>
        </Box>

        <Box sx={{ my: 2 }}>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>
            USD {Number(plan.priceMonthly || 0).toLocaleString('es-AR')}
            <Typography component='span' variant='body2' sx={{ color: 'text.secondary', ml: 1 }}>
              / mes
            </Typography>
          </Typography>
          {plan.priceInPesos !== undefined && Number(plan.priceMonthly || 0) > 0 ? (
            <Typography variant='body2' sx={{ color: 'primary.main', fontWeight: 600, mt: 0.5 }}>
              ≈ $ {Number(plan.priceInPesos).toLocaleString('es-AR')} ARS {plan.exchangeRateApplied ? `(Cotiz: $${Number(plan.exchangeRateApplied).toLocaleString('es-AR')} ARS)` : ''}
            </Typography>
          ) : Number(plan.priceMonthly || 0) === 0 ? (
            <Typography variant='body2' sx={{ color: 'success.main', fontWeight: 600, mt: 0.5 }}>
              Plan Gratuito / $0 ARS
            </Typography>
          ) : null}
          <Typography variant='body2' sx={{ color: 'text.secondary', mt: 1, minHeight: 40 }}>
            {plan.description || 'Sin descripción comercial configurada.'}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Icon icon='tabler:users' fontSize={19} />
              <Typography variant='body2'>Usuarios activos</Typography>
            </Box>
            <Typography variant='body2' sx={{ fontWeight: 600 }}>
              {renderLimitText(plan.maxUsers, 'usuarios')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Icon icon='tabler:files' fontSize={19} />
              <Typography variant='body2'>Archivos almacenados en nube</Typography>
            </Box>
            <Typography variant='body2' sx={{ fontWeight: 600 }}>
              {renderLimitText(plan.maxDocuments ?? plan.maxPages ?? null, 'archivos')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Icon icon='tabler:database' fontSize={19} />
              <Typography variant='body2'>Espacio en la nube</Typography>
            </Box>
            <Typography variant='body2' sx={{ fontWeight: 600 }}>
              {renderLimitText(
                calcBinaryStorageMbFromFiles(plan.maxDocuments ?? plan.maxPages) ?? plan.maxStorageMb,
                'MB',
                formatStorageMb
              )}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Icon icon='tabler:file-dollar' fontSize={19} />
              <Typography variant='body2'>Valor por documento procesado</Typography>
            </Box>
            <Typography variant='body2' sx={{ fontWeight: 600, color: Number(plan.pricePerProcessedDocumentArs || 0) > 0 ? 'primary.main' : 'text.secondary' }}>
              {Number(plan.pricePerProcessedDocumentArs || 0) > 0
                ? `+ $ ${Number(plan.pricePerProcessedDocumentArs).toLocaleString('es-AR')} ARS / doc`
                : 'Sin adicional'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Icon icon='energy-icons:scanner-20-bold' fontSize={19} />
              <Typography variant='body2'>Equipo HP Scanjet</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
              Canales habilitados:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {[
                { id: 'sftp', label: 'SFTP' },
                { id: 'email', label: 'Email' },
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'telegram', label: 'Telegram' }
              ].map(ch => {
                const included = Array.isArray(plan.includedModules) && plan.includedModules.includes(ch.id)

                return (
                  <Chip
                    key={ch.id}
                    size='small'
                    label={ch.label}
                    color={included ? 'primary' : 'default'}
                    variant={included ? 'outlined' : 'outlined'}
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      opacity: included ? 1 : 0.45,
                      textDecoration: included ? 'none' : 'line-through'
                    }}
                  />
                )
              })}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            icon={<Icon icon='tabler:building-community' fontSize={16} />}
            label={`${companiesCount} compañía(s)`}
            size='small'
            variant='outlined'
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size='small'
              variant='outlined'
              startIcon={<Icon icon='tabler:edit' fontSize={16} />}
              onClick={() => onEdit(plan)}
            >
              Editar
            </Button>
            <Tooltip
              title={
                companiesCount > 0
                  ? 'Reasigne las compañías asociadas antes de eliminar'
                  : 'Eliminar plan'
              }
            >
              <span>
                <IconButton
                  size='small'
                  color='error'
                  disabled={companiesCount > 0}
                  onClick={() => onDelete(plan)}
                >
                  <Icon icon='tabler:trash' fontSize={18} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default PlanCard

