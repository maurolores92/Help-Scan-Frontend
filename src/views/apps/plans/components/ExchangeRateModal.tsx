import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import apiConnector from 'src/services/api.service'
import { PlanExchangeConfigType } from 'src/types/apps/planTypes'

interface ExchangeRateModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (config: PlanExchangeConfigType) => void
}

export const ExchangeRateModal: React.FC<ExchangeRateModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [usdRate, setUsdRate] = useState<string>('1250')
  const [roundPrices, setRoundPrices] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      apiConnector
        .get<PlanExchangeConfigType>('/plans/exchange-rate')
        .then(res => {
          if (res) {
            setUsdRate(String(res.usdRate || 1250))
            setRoundPrices(res.roundPrices !== false)
          }
        })
        .catch(err => {
          console.error(err)
          toast.error('No se pudo cargar la cotización actual')
        })
        .finally(() => setLoading(false))
    }
  }, [open])

  const numericRate = parseFloat(usdRate) || 0
  const sampleUsd = 10
  const sampleConverted = roundPrices
    ? Math.ceil(sampleUsd * numericRate)
    : Number((sampleUsd * numericRate).toFixed(2))

  const handleSave = async () => {
    if (numericRate <= 0) {
      toast.error('Ingrese un valor de cotización válido y mayor a 0')

      return
    }

    try {
      setSaving(true)
      const updated = await apiConnector.patch<PlanExchangeConfigType>('/plans/exchange-rate', {
        usdRate: numericRate,
        roundPrices
      })
      toast.success('Cotización del dólar actualizada correctamente')
      if (onSuccess) {
        onSuccess(updated)
      }
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al guardar la cotización')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon icon='tabler:currency-dollar' fontSize={24} />
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Cotización del Dólar
          </Typography>
        </Box>
        <IconButton onClick={onClose} size='small'>
          <Icon icon='tabler:x' />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Alert severity='info' icon={<Icon icon='tabler:info-circle' />}>
              Configure la cotización de referencia (USD a ARS). Los planes expresados en dólares se convertirán a pesos argentinos usando este valor sin consultar APIs externas.
            </Alert>

            <TextField
              label='Cotización 1 USD en ARS'
              type='number'
              fullWidth
              value={usdRate}
              onChange={e => setUsdRate(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 600 }}>
                    $
                  </Typography>
                ),
                endAdornment: (
                  <Typography sx={{ ml: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                    ARS
                  </Typography>
                )
              }}
              helperText='Valor del dólar para calcular la facturación en pesos'
            />

            <FormControlLabel
              control={
                <Switch
                  checked={roundPrices}
                  onChange={e => setRoundPrices(e.target.checked)}
                  color='primary'
                />
              }
              label={
                <Box>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    Redondear precios finales
                  </Typography>
                  <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                    Redondea los montos en ARS hacia el número entero superior
                  </Typography>
                </Box>
              }
            />

            <Box
              sx={{
                p: 3,
                borderRadius: 1,
                bgcolor: 'background.default',
                border: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}>
                SIMULACIÓN DE CONVERSIÓN
              </Typography>
              <Typography variant='body2'>
                Plan de <strong>US$ {sampleUsd}.00</strong> × <strong>${numericRate.toLocaleString('es-AR')} ARS</strong> =
              </Typography>
              <Typography variant='h6' sx={{ color: 'primary.main', fontWeight: 700, mt: 0.5 }}>
                $ {sampleConverted.toLocaleString('es-AR')} ARS
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 5, py: 3 }}>
        <Button variant='outlined' color='secondary' onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={loading || saving}
          startIcon={saving ? <CircularProgress size={18} /> : <Icon icon='tabler:device-floppy' />}
        >
          Guardar Cotización
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ExchangeRateModal
