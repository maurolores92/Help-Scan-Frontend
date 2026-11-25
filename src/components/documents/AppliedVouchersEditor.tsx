import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { AppliedVoucherItem } from 'src/store/apps/documents'

const VOUCHER_TYPES = [
  'Factura A',
  'Factura B',
  'Factura C',
  'Nota de Débito',
  'Nota de Crédito',
  'Recibo',
  'Otro'
]

interface AppliedVouchersEditorProps {
  title?: string
  currencySymbol?: string
  vouchers: AppliedVoucherItem[]
  onChange: (nextVouchers: AppliedVoucherItem[]) => void
}

export const AppliedVouchersEditor: React.FC<AppliedVouchersEditorProps> = ({
  title = 'Comprobantes / Facturas Imputadas',
  currencySymbol = '$',
  vouchers,
  onChange
}) => {
  const totalApplied = vouchers.reduce((acc, v) => acc + (Number(v.appliedAmount) || 0), 0)

  const handleAdd = () => {
    onChange([
      ...vouchers,
      { voucherType: 'Factura A', voucherNumber: '', voucherDate: '', originalAmount: null, appliedAmount: null }
    ])
  }

  const handleUpdate = (idx: number, field: keyof AppliedVoucherItem, value: any) => {
    const next = [...vouchers]
    next[idx] = { ...next[idx], [field]: value }
    onChange(next)
  }

  const handleDelete = (idx: number) => {
    onChange(vouchers.filter((_, i) => i !== idx))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {title} ({vouchers.length})
          </Typography>
          {vouchers.length > 0 && (
            <Chip
              size='small'
              color='primary'
              variant='outlined'
              label={`Total imputado: ${currencySymbol} ${totalApplied.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
            />
          )}
        </Box>
        <Button size='small' variant='outlined' startIcon={<Icon icon='tabler:plus' />} onClick={handleAdd}>
          Agregar Comprobante
        </Button>
      </Box>

      {vouchers.length === 0 ? (
        <Box
          sx={{
            p: 2.5,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1.5,
            textAlign: 'center'
          }}
        >
          <Typography variant='body2' color='text.secondary'>
            No hay facturas o comprobantes imputados cargados todavía. Agregá uno o varios para registrar pagos totales o parciales.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {vouchers.map((row, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: 1,
                borderColor: 'divider',
                backgroundColor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                flexWrap: 'wrap'
              }}
            >
              <TextField
                select
                size='small'
                label='Tipo'
                value={row.voucherType || 'Factura A'}
                onChange={e => handleUpdate(idx, 'voucherType', e.target.value)}
                sx={{ width: { xs: '100%', sm: 135 } }}
              >
                {!VOUCHER_TYPES.includes(row.voucherType || 'Factura A') && (
                  <MenuItem value={row.voucherType}>{row.voucherType}</MenuItem>
                )}
                {VOUCHER_TYPES.map(t => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size='small'
                label='N° Comprobante *'
                placeholder='00004-00001234'
                value={row.voucherNumber || ''}
                onChange={e => handleUpdate(idx, 'voucherNumber', e.target.value)}
                sx={{ flex: 1, minWidth: 145 }}
              />
              <TextField
                size='small'
                type='date'
                label='Fecha'
                value={row.voucherDate || ''}
                onChange={e => handleUpdate(idx, 'voucherDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: '48%', sm: 135 } }}
              />
              <TextField
                size='small'
                type='number'
                label='Total Comp.'
                value={row.originalAmount ?? ''}
                onChange={e =>
                  handleUpdate(idx, 'originalAmount', e.target.value === '' ? null : Number(e.target.value))
                }
                sx={{ width: { xs: '48%', sm: 112 } }}
              />
              <TextField
                size='small'
                type='number'
                label='Imputado *'
                value={row.appliedAmount ?? ''}
                onChange={e =>
                  handleUpdate(idx, 'appliedAmount', e.target.value === '' ? null : Number(e.target.value))
                }
                sx={{ width: { xs: '100%', sm: 115 } }}
              />
              <IconButton size='small' color='error' onClick={() => handleDelete(idx)} sx={{ ml: 'auto' }}>
                <Icon icon='tabler:trash' fontSize={18} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default AppliedVouchersEditor
