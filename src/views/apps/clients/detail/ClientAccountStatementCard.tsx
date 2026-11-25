import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { ClientAccountStatement } from 'src/types/apps/clientTypes'

interface ClientAccountStatementCardProps {
  statement?: ClientAccountStatement | null
  onFilterPendingInvoices: () => void
  onFilterUnlinkedPayments: () => void
  onFilterUnbilledRemitos: () => void
}

const fmtCurrency = (val: number) =>
  `$ ${Number(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

export const ClientAccountStatementCard: React.FC<ClientAccountStatementCardProps> = ({
  statement,
  onFilterPendingInvoices,
  onFilterUnlinkedPayments,
  onFilterUnbilledRemitos
}) => {
  if (!statement) return null

  const cards = [
    {
      label: 'Facturado Neto',
      value: fmtCurrency(statement.totalInvoicedNet),
      sub: `${statement.invoicesCount} comprobante(s) facturados`,
      icon: 'tabler:file-invoice',
      color: 'primary.main'
    },
    {
      label: 'Cobrado / Imputado',
      value: fmtCurrency(statement.totalPaidOrCollected),
      sub: `${statement.paidInvoicesCount} pagado(s) · ${statement.partialInvoicesCount} parcial(es)`,
      icon: 'tabler:circle-check',
      color: 'success.main'
    },
    {
      label: 'Saldo Pendiente',
      value: fmtCurrency(statement.totalRemainingBalance),
      sub: `${statement.pendingInvoicesCount + statement.partialInvoicesCount} por cancelar`,
      icon: 'tabler:alert-circle',
      color: statement.totalRemainingBalance > 1 ? 'error.main' : 'success.main'
    },
    {
      label: 'Pagos Sin Imputar',
      value: fmtCurrency(statement.totalUnappliedPayments),
      sub: `${statement.unlinkedReceiptsCount} pago(s)/recibo(s) disponibles`,
      icon: 'tabler:receipt-refund',
      color: statement.totalUnappliedPayments > 1 ? 'warning.main' : 'text.secondary'
    }
  ]

  const hasBothCircuits = statement.receivable.invoicesCount > 0 && statement.payable.invoicesCount > 0
  const pendingOrPartialTotal = statement.pendingInvoicesCount + statement.partialInvoicesCount
  const allBalanced =
    statement.invoicesCount > 0 &&
    statement.totalRemainingBalance <= 1 &&
    statement.unlinkedReceiptsCount === 0 &&
    statement.unbilledRemitosCount === 0

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon icon='tabler:scale' fontSize={21} />
            <Typography variant='h6' sx={{ fontWeight: 700 }}>
              Estado de Cuenta Corriente
            </Typography>
          </Box>

          {hasBothCircuits && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size='small'
                color='info'
                variant='outlined'
                label={`A cobrar (Ventas): ${fmtCurrency(statement.receivable.remainingBalance)}`}
              />
              <Chip
                size='small'
                color='warning'
                variant='outlined'
                label={`A pagar (Compras): ${fmtCurrency(statement.payable.remainingBalance)}`}
              />
            </Box>
          )}
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {cards.map(c => (
            <Grid item xs={12} sm={6} md={3} key={c.label}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                    {c.label.toUpperCase()}
                  </Typography>
                  <Box sx={{ color: c.color }}>
                    <Icon icon={c.icon} fontSize={20} />
                  </Box>
                </Box>
                <Typography variant='h5' sx={{ fontWeight: 700, my: 0.5, color: c.color }}>
                  {c.value}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {c.sub}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {allBalanced ? (
          <Alert severity='success' icon={<Icon icon='tabler:checks' />} sx={{ py: 0.5 }}>
            Cuenta corriente al día: todas las facturas, pagos y remitos están conciliados.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, mr: 0.5 }}>
              ¿Qué falta conciliar?:
            </Typography>
            {pendingOrPartialTotal > 0 && (
              <Chip
                size='small'
                color='error'
                variant='outlined'
                icon={<Icon icon='tabler:clock-dollar' fontSize={15} />}
                label={`${pendingOrPartialTotal} factura(s) con saldo (${fmtCurrency(statement.totalRemainingBalance)})`}
                onClick={onFilterPendingInvoices}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            )}
            {statement.unlinkedReceiptsCount > 0 && (
              <Chip
                size='small'
                color='warning'
                variant='outlined'
                icon={<Icon icon='tabler:receipt' fontSize={15} />}
                label={`${statement.unlinkedReceiptsCount} recibo(s)/pago(s) sin imputar totalmente`}
                onClick={onFilterUnlinkedPayments}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            )}
            {statement.unbilledRemitosCount > 0 && (
              <Chip
                size='small'
                color='info'
                variant='outlined'
                icon={<Icon icon='tabler:truck-delivery' fontSize={15} />}
                label={`${statement.unbilledRemitosCount} remito(s) sin facturar`}
                onClick={onFilterUnbilledRemitos}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            )}
            {pendingOrPartialTotal === 0 &&
              statement.unlinkedReceiptsCount === 0 &&
              statement.unbilledRemitosCount === 0 && (
                <Typography variant='caption' color='text.secondary'>
                  Sin comprobantes facturables o pagos pendientes detectados todavía.
                </Typography>
              )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ClientAccountStatementCard
