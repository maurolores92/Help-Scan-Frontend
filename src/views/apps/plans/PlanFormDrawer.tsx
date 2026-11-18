import React, { useState, useEffect } from 'react'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import { Controller } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import apiConnector from 'src/services/api.service'
import { PlanExchangeConfigType, PlanType } from 'src/types/apps/planTypes'
import CompanyModulesSelector from 'src/views/apps/companies/list/CompanyModulesSelector'
import PlanQuotaLimitField from './components/PlanQuotaLimitField'
import ExchangeRateModal from './components/ExchangeRateModal'
import { usePlanForm } from './hooks/usePlanForm'

interface PlanFormDrawerProps {
  open: boolean
  onClose: () => void
  editPlan: PlanType | null
}

export const PlanFormDrawer: React.FC<PlanFormDrawerProps> = ({ open, onClose, editPlan }) => {
  const {
    isEdit,
    control,
    handleSubmit,
    handleNameChange,
    onSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = usePlanForm(open, editPlan, onClose)

  const [exchangeModalOpen, setExchangeModalOpen] = useState(false)
  const [exchangeConfig, setExchangeConfig] = useState<PlanExchangeConfigType | null>(null)

  useEffect(() => {
    if (open) {
      apiConnector
        .get<PlanExchangeConfigType>('/plans/exchange-rate')
        .then(res => setExchangeConfig(res))
        .catch(err => console.error(err))
    }
  }, [open])

  const watchedPrice = Number(watch('priceMonthly') || 0)
  const convertedPrice = exchangeConfig
    ? exchangeConfig.roundPrices
      ? Math.ceil(watchedPrice * Number(exchangeConfig.usdRate))
      : Number((watchedPrice * Number(exchangeConfig.usdRate)).toFixed(2))
    : 0

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 520 } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 5 }}>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          {isEdit ? `Editar Plan: ${editPlan?.name}` : 'Nuevo Plan de Suscripción'}
        </Typography>
        <IconButton onClick={onClose}>
          <Icon icon='tabler:x' />
        </IconButton>
      </Box>
      <Divider />

      <Box component='form' onSubmit={handleSubmit(onSubmit)} sx={{ p: 5 }}>
        <Grid container spacing={3.5}>
          <Grid item xs={12} sm={6}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Nombre del Plan'
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  onChange={e => handleNameChange(e.target.value, field.onChange)}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='slug'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  disabled={isEdit}
                  label='Identificador (Slug)'
                  error={Boolean(errors.slug)}
                  helperText={errors.slug?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='priceMonthly'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type='number'
                  label='Precio Mensual Ref. (USD)'
                  error={Boolean(errors.priceMonthly)}
                  helperText={errors.priceMonthly?.message}
                />
              )}
            />
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant='caption' sx={{ color: 'primary.main', fontWeight: 600 }}>
                ≈ ${convertedPrice.toLocaleString('es-AR')} ARS
              </Typography>
              <Button
                size='small'
                variant='text'
                color='primary'
                onClick={() => setExchangeModalOpen(true)}
                sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                startIcon={<Icon icon='tabler:currency-dollar' fontSize={14} />}
              >
                Modificar precio del dólar
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='badgeColor'
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth label='Color Distintivo'>
                  <MenuItem value='primary'>Verde Principal (Help Scan)</MenuItem>
                  <MenuItem value='info'>Celeste Info</MenuItem>
                  <MenuItem value='success'>Verde Corporativo</MenuItem>
                  <MenuItem value='warning'>Ámbar Destacado</MenuItem>
                  <MenuItem value='secondary'>Gris Secundario</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name='description'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth multiline rows={2} label='Descripción Comercial' />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mt: 1 }}>
              Límites Operativos del Plan
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <PlanQuotaLimitField
              name='maxUsers'
              label='Máx. Usuarios'
              defaultNumericValue={10}
              control={control}
              errorMessage={errors.maxUsers?.message}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <PlanQuotaLimitField
              name='maxDocuments'
              label='Máx. Hojas / Páginas'
              helperText='Límite mensual acumulativo de hojas subidas'
              defaultNumericValue={1000}
              control={control}
              errorMessage={errors.maxDocuments?.message}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <PlanQuotaLimitField
              name='maxStorageMb'
              label='Storage en Disco (MB)'
              helperText='Ej: 2048 MB = 2 GB'
              defaultNumericValue={5120}
              control={control}
              errorMessage={errors.maxStorageMb?.message}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <PlanQuotaLimitField
              name='maxAiQueriesMonthly'
              label='Extracción OCR / Mes'
              helperText='0 deshabilita procesamiento OCR'
              defaultNumericValue={500}
              allowZero
              control={control}
              errorMessage={errors.maxAiQueriesMonthly?.message}
            />
          </Grid>

          <CompanyModulesSelector
            control={control}
            fieldName='includedModules'
            title='Módulos Incluidos en el Plan'
            subtitle='Se asignarán por defecto al asociar este plan a una compañía:'
          />

          <Grid item xs={12} sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Controller
              name='isDefault'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                  label='Plan predeterminado para altas'
                />
              )}
            />
            <Controller
              name='isActive'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                  label='Plan activo'
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant='outlined' color='secondary' onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type='submit' variant='contained' disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={22} color='inherit' /> : 'Guardar Plan'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <ExchangeRateModal
        open={exchangeModalOpen}
        onClose={() => setExchangeModalOpen(false)}
        onSuccess={config => setExchangeConfig(config)}
      />
    </Drawer>
  )
}

export default PlanFormDrawer
