import React, { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { ClientFormPayload, ClientItem } from 'src/types/apps/clientTypes'

interface ClientFormDialogProps {
  open: boolean
  client: ClientItem | null
  saving?: boolean
  onClose: () => void
  onSubmit: (payload: ClientFormPayload, id?: number) => Promise<void>
}

const TAX_ID_TYPES = ['CUIT', 'CUIL', 'DNI', 'CDI', 'Pasaporte']

const TAX_CONDITIONS = [
  'Responsable Inscripto',
  'Monotributo',
  'Exento',
  'Consumidor Final',
  'No Responsable',
  'Sujeto No Categorizado'
]

const IIBB_CONDITIONS = [
  'Convenio Multilateral',
  'Contribuyente Local',
  'Exento',
  'No Inscripto',
  'Régimen Simplificado'
]

const ARG_PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán'
]

const PAYMENT_TERMS_OPTIONS = [
  'Contado',
  'Cuenta Corriente 15 días',
  'Cuenta Corriente 30 días',
  'Cuenta Corriente 60 días',
  'Transferencia Bancaria',
  'Cheque / E-Cheq',
  'Tarjeta / Mercado Pago'
]

export const ClientFormDialog: React.FC<ClientFormDialogProps> = ({
  open,
  client,
  saving = false,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [taxIdType, setTaxIdType] = useState('')
  const [taxId, setTaxId] = useState('')
  const [taxCondition, setTaxCondition] = useState('')
  const [iibbNumber, setIibbNumber] = useState('')
  const [iibbCondition, setIibbCondition] = useState('')
  const [erpCode, setErpCode] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [secondaryPhone, setSecondaryPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [cbu, setCbu] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFormError(null)
      if (client) {
        setName(client.name || '')
        setTradeName(client.tradeName || '')
        setTaxIdType(client.taxIdType || '')
        setTaxId(client.taxId || '')
        setTaxCondition(client.taxCondition || '')
        setIibbNumber(client.iibbNumber || '')
        setIibbCondition(client.iibbCondition || '')
        setErpCode(client.erpCode || '')
        setContactName(client.contactName || '')
        setEmail(client.email || '')
        setPhone(client.phone || '')
        setSecondaryPhone(client.secondaryPhone || '')
        setAddress(client.address || '')
        setCity(client.city || '')
        setProvince(client.province || '')
        setPostalCode(client.postalCode || '')
        setCountry(client.country || '')
        setPaymentTerms(client.paymentTerms || '')
        setCbu(client.cbu || '')
        setNotes(client.notes || '')
        setIsActive(client.isActive !== false)
      } else {
        setName('')
        setTradeName('')
        setTaxIdType('')
        setTaxId('')
        setTaxCondition('')
        setIibbNumber('')
        setIibbCondition('')
        setErpCode('')
        setContactName('')
        setEmail('')
        setPhone('')
        setSecondaryPhone('')
        setAddress('')
        setCity('')
        setProvince('')
        setPostalCode('')
        setCountry('')
        setPaymentTerms('')
        setCbu('')
        setNotes('')
        setIsActive(true)
      }
    }
  }, [open, client])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const cleanName = name.trim()
    const cleanTaxId = taxId.trim()
    const digits = cleanTaxId.replace(/\D+/g, '')
    if (!cleanName) {
      setFormError('La razón social o nombre del cliente es obligatorio.')
      return
    }
    if (cleanTaxId && (digits.length < 7 || digits.length > 15)) {
      setFormError('Si cargás un CUIT / CUIL, debe tener entre 7 y 15 dígitos (ej: 20-30405060-7).')
      return
    }

    const opt = (val: string) => {
      const clean = val.trim()

      return clean ? clean : null
    }

    await onSubmit(
      {
        name: cleanName,
        taxId: cleanTaxId || null,
        tradeName: opt(tradeName),
        taxIdType: opt(taxIdType),
        taxCondition: opt(taxCondition),
        iibbNumber: opt(iibbNumber),
        iibbCondition: opt(iibbCondition),
        erpCode: opt(erpCode),
        contactName: opt(contactName),
        email: opt(email),
        phone: opt(phone),
        secondaryPhone: opt(secondaryPhone),
        address: opt(address),
        city: opt(city),
        province: opt(province),
        postalCode: opt(postalCode),
        country: opt(country),
        paymentTerms: opt(paymentTerms),
        cbu: opt(cbu),
        notes: opt(notes),
        isActive
      },
      client?.id
    )
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <form onSubmit={handleSave}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Icon icon={client ? 'tabler:user-edit' : 'tabler:user-plus'} fontSize={22} />
          <span>{client ? `Editar Cliente #${client.id}` : 'Nuevo Cliente'}</span>
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity='info' sx={{ mb: 3 }}>
            Solo <strong>Razón Social / Nombre</strong> es obligatorio. Si cargás un <strong>CUIT / CUIL</strong>, se
            vincularán automáticamente sus facturas y recibos; si aún está pendiente, podés completarlo más tarde.
          </Alert>

          {formError && (
            <Alert severity='error' sx={{ mb: 3 }}>
              {formError}
            </Alert>
          )}

          <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
            1. Identificación Fiscal (AFIP / ARBA)
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                required
                size='small'
                label='Razón Social / Nombre Completo'
                placeholder='Ej: Aguerre María Mercedes / Ferretería Norte S.A.'
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size='small'
                label='Código ERP / Interno'
                placeholder='Ej: CLI-0045'
                value={erpCode}
                onChange={e => setErpCode(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                label='Nombre de Fantasía / Comercial'
                placeholder='Opcional'
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                select
                fullWidth
                size='small'
                label='Tipo Clave'
                value={taxIdType}
                onChange={e => setTaxIdType(e.target.value)}
              >
                <MenuItem value=''>Auto</MenuItem>
                {TAX_ID_TYPES.map(t => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size='small'
                label='CUIT / CUIL'
                placeholder='Ej: 27-30405060-7 (opcional si aún no figura)'
                value={taxId}
                onChange={e => setTaxId(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size='small'
                label='Condición frente al IVA'
                value={taxCondition}
                onChange={e => setTaxCondition(e.target.value)}
              >
                <MenuItem value=''>Sin especificar</MenuItem>
                {TAX_CONDITIONS.map(tc => (
                  <MenuItem key={tc} value={tc}>
                    {tc}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size='small'
                label='Condición IIBB'
                value={iibbCondition}
                onChange={e => setIibbCondition(e.target.value)}
              >
                <MenuItem value=''>Sin especificar</MenuItem>
                {IIBB_CONDITIONS.map(ic => (
                  <MenuItem key={ic} value={ic}>
                    {ic}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size='small'
                label='N° Ingresos Brutos (IIBB)'
                placeholder='Ej: 901-123456-7'
                value={iibbNumber}
                onChange={e => setIibbNumber(e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
            2. Domicilio y Contacto
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                label='Domicilio Fiscal / Calle y Altura'
                placeholder='Ej: Av. Colón 1234'
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size='small'
                label='Localidad / Ciudad'
                placeholder='Ej: Mar del Plata'
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size='small'
                label='Provincia'
                value={province}
                onChange={e => setProvince(e.target.value)}
              >
                <MenuItem value=''>Sin especificar</MenuItem>
                {ARG_PROVINCES.map(p => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size='small'
                label='Código Postal (CP/CPA)'
                placeholder='Ej: 7600'
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size='small'
                label='País'
                placeholder='Ej: Argentina'
                value={country}
                onChange={e => setCountry(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                label='Persona de Contacto / Responsable'
                placeholder='Ej: Marcela / Administración'
                value={contactName}
                onChange={e => setContactName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size='small'
                type='email'
                label='Correo Electrónico'
                placeholder='administracion@cliente.com.ar'
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size='small'
                label='Teléfono Principal'
                placeholder='Ej: +54 9 223 555-1234'
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size='small'
                label='WhatsApp / Tel. Alternativo'
                placeholder='Opcional'
                value={secondaryPhone}
                onChange={e => setSecondaryPhone(e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
            3. Condiciones Comerciales y Bancarias
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size='small'
                label='Condición de Venta Habitual'
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
              >
                <MenuItem value=''>Sin especificar</MenuItem>
                {PAYMENT_TERMS_OPTIONS.map(opt => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                label='CBU / Alias Bancario'
                placeholder='22 dígitos o alias'
                value={cbu}
                onChange={e => setCbu(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size='small'
                label='Observaciones internas'
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </Grid>

            {client && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={isActive} onChange={e => setIsActive(e.target.checked)} />}
                  label={isActive ? 'Cliente activo (asociación automática habilitada)' : 'Cliente inactivo'}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant='outlined' color='secondary' onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <Icon icon='tabler:device-floppy' />}
          >
            {saving ? 'Guardando...' : client ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default ClientFormDialog
