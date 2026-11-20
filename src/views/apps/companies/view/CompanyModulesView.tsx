import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import apiConnector from 'src/services/api.service'
import { AVAILABLE_TENANT_MODULES } from '../list/CompanyModulesSelector'

interface CompanyModulesViewProps {
  company: any
  onCompanyUpdated?: () => void
}

const DEFAULT_FALLBACK_MODULES = ['documents', 'ai_queries', 'users', 'roles', 'audit']

const CompanyModulesView: React.FC<CompanyModulesViewProps> = ({ company, onCompanyUpdated }) => {
  const auth = useAuth()
  const isSuperAdmin = auth.user?.role === 'superadmin'

  const [selectedModules, setSelectedModules] = useState<string[]>(
    Array.isArray(company?.enabledModules) ? company.enabledModules : DEFAULT_FALLBACK_MODULES
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (Array.isArray(company?.enabledModules)) {
      setSelectedModules(company.enabledModules)
    }
  }, [company?.enabledModules, company?.id])

  const toggleModule = (modId: string) => {
    if (!isSuperAdmin) return

    setSelectedModules(prev => {
      if (prev.includes(modId)) {
        if (prev.length <= 1) {
          toast.error('La compañía debe tener al menos un módulo habilitado')

          return prev
        }

        return prev.filter(id => id !== modId)
      }

      return [...prev, modId]
    })
  }

  const handleApplyPlanModules = () => {
    const planModules: string[] | undefined = company?.plan?.includedModules
    if (!Array.isArray(planModules) || planModules.length === 0) {
      toast.error('El plan asignado no define módulos predeterminados')

      return
    }
    setSelectedModules(planModules)
    toast.success(`Módulos precargados desde el plan "${company.plan.name}". Recordá guardar los cambios.`)
  }

  const handleSave = async () => {
    if (!company?.id) return
    try {
      setSaving(true)
      await apiConnector.patch(`/companies/${company.id}`, {
        enabledModules: selectedModules
      })
      toast.success('Módulos de la compañía actualizados correctamente')
      onCompanyUpdated?.()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Error al actualizar los módulos')
    } finally {
      setSaving(false)
    }
  }

  const channelModules = AVAILABLE_TENANT_MODULES.filter(m => m.category === 'channel')
  const coreModules = AVAILABLE_TENANT_MODULES.filter(m => m.category !== 'channel')

  const renderModuleCard = (mod: (typeof AVAILABLE_TENANT_MODULES)[number]) => {
    const checked = selectedModules.includes(mod.id)

    return (
      <Grid item xs={12} sm={6} md={4} key={mod.id}>
        <Box
          onClick={() => toggleModule(mod.id)}
          sx={theme => ({
            p: 2,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: checked ? 'primary.main' : 'divider',
            bgcolor: checked ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
            cursor: isSuperAdmin ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          })}
        >
          <FormControlLabel
            sx={{ m: 0, flex: 1, pointerEvents: 'none' }}
            control={<Checkbox checked={checked} disabled={!isSuperAdmin} />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Icon icon={mod.icon} fontSize={20} />
                <Typography variant='body2' sx={{ fontWeight: checked ? 600 : 500 }}>
                  {mod.name}
                </Typography>
              </Box>
            }
          />
        </Box>
      </Grid>
    )
  }

  return (
    <Card>
      <CardHeader
        title='Módulos Habilitados para la Compañía'
        subheader={
          isSuperAdmin
            ? 'Activá o desactivá qué canales de ingesta y funcionalidades operativas verá esta empresa en su portal.'
            : 'Módulos actualmente contratados por tu empresa.'
        }
        action={
          isSuperAdmin && company?.plan?.includedModules ? (
            <Button
              size='small'
              variant='outlined'
              color='secondary'
              startIcon={<Icon icon='tabler:award' />}
              onClick={handleApplyPlanModules}
            >
              Copiar del Plan ({company.plan.name})
            </Button>
          ) : undefined
        }
      />
      <CardContent>
        <Alert severity='info' sx={{ mb: 4 }}>
          Las pantallas del menú lateral (<strong>Impresoras HP y FTP</strong>,{' '}
          <strong>Configuración de Canales</strong>, <strong>Correos Recibidos</strong> y{' '}
          <strong>Mensajes WhatsApp</strong>) y las pestañas dentro de Canales se mostrarán u ocultarán
          automáticamente según los módulos seleccionados aquí.
        </Alert>

        <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', color: 'text.secondary' }}>
          Canales de Ingesta de Documentos
        </Typography>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {channelModules.map(renderModuleCard)}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', color: 'text.secondary' }}>
          Módulos Base de Plataforma
        </Typography>
        <Grid container spacing={3}>
          {coreModules.map(renderModuleCard)}
        </Grid>

        {isSuperAdmin && (
          <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color='inherit' /> : <Icon icon='tabler:device-floppy' />}
            >
              {saving ? 'Guardando...' : 'Guardar Módulos'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default CompanyModulesView
