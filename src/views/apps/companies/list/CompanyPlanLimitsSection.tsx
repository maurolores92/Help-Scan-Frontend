import React from 'react'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Chip from '@mui/material/Chip'
import { Control, Controller, UseFormSetValue, useWatch } from 'react-hook-form'
import { PlanType } from 'src/types/apps/planTypes'
import {
  calcBinaryStorageMbFromFiles,
  formatStorageMb
} from 'src/components/common/QuotaProgressBar'
import PlanQuotaLimitField from 'src/views/apps/plans/components/PlanQuotaLimitField'

interface CompanyPlanLimitsSectionProps {
  control: Control<any>
  errors: any
  plans: PlanType[]
  selectedPlanId: number | '' | null
  useCustomLimits: boolean
  setValue: UseFormSetValue<any>
}

export const CompanyPlanLimitsSection: React.FC<CompanyPlanLimitsSectionProps> = ({
  control,
  errors,
  plans,
  selectedPlanId,
  useCustomLimits,
  setValue
}) => {
  const activePlan = plans.find(p => p.id === Number(selectedPlanId)) || null
  const watchedCustomDocs = useWatch({ control, name: 'maxDocuments' })
  const customAutoStorageMb = calcBinaryStorageMbFromFiles(watchedCustomDocs)

  const handlePlanSelect = (newPlanId: number, onChange: (val: number) => void) => {
    onChange(newPlanId)
    const found = plans.find(p => p.id === Number(newPlanId))
    if (found) {
      setValue('enabledModules', found.includedModules)
      if (!useCustomLimits) {
        const docsLimit = found.maxDocuments ?? found.maxPages ?? null
        setValue('maxUsers', found.maxUsers)
        setValue('maxDocuments', docsLimit)
        setValue('maxStorageMb', calcBinaryStorageMbFromFiles(docsLimit) ?? found.maxStorageMb)
      }
    }
  }

  return (
    <Grid item xs={12}>
      <Box
        sx={{
          p: 3.5,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          backgroundColor: 'action.hover'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3
          }}
        >
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Plan de Suscripción y Límites
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              Asigne un plan estándar o personalice excepciones de uso para esta compañía
            </Typography>
          </Box>

          <Controller
            name='useCustomLimits'
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(field.value)}
                    onChange={e => field.onChange(e.target.checked)}
                    color='warning'
                  />
                }
                label='Personalizar límites para esta compañía'
              />
            )}
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={useCustomLimits ? 12 : 5}>
            <Controller
              name='planId'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label='Plan Asociado'
                  value={field.value ?? ''}
                  onChange={e => handlePlanSelect(Number(e.target.value), field.onChange)}
                  sx={{ backgroundColor: 'background.paper' }}
                >
                  {plans.map(plan => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name} {plan.isDefault ? '(Predeterminado)' : ''}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {!useCustomLimits && activePlan && (
            <Grid item xs={12} md={7} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  size='small'
                  color='primary'
                  variant='outlined'
                  label={`Usuarios: ${activePlan.maxUsers ?? 'Ilimitado'}`}
                />
                <Chip
                  size='small'
                  color='primary'
                  variant='outlined'
                  label={`Archivos: ${activePlan.maxDocuments ?? activePlan.maxPages ?? 'Ilimitado'}`}
                />
                <Chip
                  size='small'
                  color='primary'
                  variant='outlined'
                  label={`Storage: ${
                    (calcBinaryStorageMbFromFiles(activePlan.maxDocuments ?? activePlan.maxPages) ??
                      activePlan.maxStorageMb)
                      ? formatStorageMb(
                          (calcBinaryStorageMbFromFiles(
                            activePlan.maxDocuments ?? activePlan.maxPages
                          ) ?? activePlan.maxStorageMb)!
                        )
                      : 'Ilimitado'
                  }`}
                />
                {Number(activePlan.pricePerProcessedDocumentArs || 0) > 0 && (
                  <Chip
                    size='small'
                    color='info'
                    variant='outlined'
                    label={`+$${Number(activePlan.pricePerProcessedDocumentArs).toLocaleString('es-AR')} ARS / doc`}
                  />
                )}
              </Box>
            </Grid>
          )}

          {useCustomLimits && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <PlanQuotaLimitField
                  name='maxUsers'
                  label='Máx. Usuarios'
                  defaultNumericValue={activePlan?.maxUsers ?? 10}
                  control={control}
                  errorMessage={errors?.maxUsers?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <PlanQuotaLimitField
                  name='maxDocuments'
                  label='Máx. Archivos Almacenados'
                  helperText='Libera cupo al eliminar'
                  defaultNumericValue={activePlan?.maxDocuments ?? activePlan?.maxPages ?? 1000}
                  control={control}
                  errorMessage={errors?.maxDocuments?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label='Storage en Disco (Solo Lectura)'
                  value={
                    customAutoStorageMb === null
                      ? 'Ilimitado'
                      : `${formatStorageMb(customAutoStorageMb)} (${customAutoStorageMb.toLocaleString('es-AR')} MB)`
                  }
                  helperText='Base binaria (1.024 MB = 1 GB)'
                  InputProps={{ readOnly: true }}
                  sx={{ backgroundColor: 'background.paper' }}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Grid>
  )
}

export default CompanyPlanLimitsSection

