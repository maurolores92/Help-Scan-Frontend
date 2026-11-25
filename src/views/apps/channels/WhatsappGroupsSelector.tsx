import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { AllowedWhatsappGroup, WhatsappGroupItem } from 'src/types/apps/channelTypes'

interface WhatsappGroupsSelectorProps {
  connected: boolean
  loading: boolean
  availableGroups: WhatsappGroupItem[]
  selectedGroups: AllowedWhatsappGroup[]
  onRefreshGroups: () => void
  onChange: (nextGroups: AllowedWhatsappGroup[]) => void
}

export const WhatsappGroupsSelector: React.FC<WhatsappGroupsSelectorProps> = ({
  connected,
  loading,
  availableGroups,
  selectedGroups,
  onRefreshGroups,
  onChange
}) => {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedSet = useMemo(() => new Set(selectedGroups.map(g => g.jid)), [selectedGroups])

  const unselectedGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return availableGroups
      .filter(g => !selectedSet.has(g.jid))
      .filter(g => !q || g.name.toLowerCase().includes(q) || g.jid.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [availableGroups, selectedSet, search])

  const handleOpenPicker = () => {
    setSearch('')
    setPickerOpen(true)
    if (connected && availableGroups.length === 0) {
      onRefreshGroups()
    }
  }

  const handleSelectGroup = (group: { jid: string; name: string }) => {
    if (!selectedSet.has(group.jid)) {
      onChange([...selectedGroups, { jid: group.jid, name: group.name }])
    }
    setSearch('')
    setPickerOpen(false)
  }

  return (
    <Box sx={{ p: 2.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
            Grupos Autorizados ({selectedGroups.length})
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Se procesarán PDFs e imágenes enviados por cualquier integrante dentro de estos grupos (recordá guardar preferencias).
          </Typography>
        </Box>

        <Button
          size='small'
          variant={pickerOpen ? 'outlined' : 'contained'}
          color={pickerOpen ? 'secondary' : 'primary'}
          onClick={() => (pickerOpen ? setPickerOpen(false) : handleOpenPicker())}
          startIcon={<Icon icon={pickerOpen ? 'tabler:x' : 'tabler:plus'} fontSize={16} />}
        >
          {pickerOpen
            ? 'Cerrar'
            : selectedGroups.length > 0
              ? 'Agregar otro grupo'
              : 'Agregar grupo'}
        </Button>
      </Box>

      {selectedGroups.length === 0 ? (
        <Alert severity='info' sx={{ py: 0.25 }}>
          Todavía no seleccionaste ningún grupo autorizado. Hacé clic en &quot;Agregar grupo&quot; para elegir uno.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {selectedGroups.map(g => (
            <Chip
              key={g.jid}
              size='small'
              color='primary'
              variant='outlined'
              icon={<Icon icon='tabler:users-group' fontSize={14} />}
              label={g.name || g.jid}
              onDelete={() => onChange(selectedGroups.filter(item => item.jid !== g.jid))}
            />
          ))}
        </Box>
      )}

      <Collapse in={pickerOpen}>
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {!connected && (
            <Alert severity='warning' sx={{ mb: 1.5, py: 0.5 }}>
              Conectá tu WhatsApp escaneando el QR para sincronizar y elegir tus grupos en vivo.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <TextField
              size='small'
              fullWidth
              placeholder='Buscar grupo por nombre...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='tabler:search' fontSize={16} />
                  </InputAdornment>
                )
              }}
            />
            <Button
              size='small'
              variant='outlined'
              onClick={onRefreshGroups}
              disabled={loading || !connected}
              startIcon={
                loading ? <CircularProgress size={14} color='inherit' /> : <Icon icon='tabler:refresh' fontSize={16} />
              }
              sx={{ whiteSpace: 'nowrap' }}
            >
              Actualizar
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : unselectedGroups.length === 0 ? (
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', py: 1 }}>
              {connected
                ? 'No hay más grupos disponibles con ese filtro.'
                : 'Conectá WhatsApp para listar tus grupos.'}
            </Typography>
          ) : (
            <Box sx={{ maxHeight: 220, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              {unselectedGroups.map((group, idx) => (
                <React.Fragment key={group.jid}>
                  {idx > 0 && <Divider />}
                  <Box
                    onClick={() => handleSelectGroup(group)}
                    sx={{
                      px: 1.5,
                      py: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Icon icon='tabler:plus' fontSize={16} />
                      <Typography variant='body2' noWrap>
                        {group.name}
                      </Typography>
                    </Box>
                    <Chip
                      size='small'
                      label={`${group.participantsCount} part.`}
                      sx={{ height: 20, fontSize: '0.68rem' }}
                    />
                  </Box>
                </React.Fragment>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

export default WhatsappGroupsSelector
