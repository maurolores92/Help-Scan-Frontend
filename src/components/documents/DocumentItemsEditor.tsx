import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { DocumentArticleItem } from 'src/store/apps/documents'

interface DocumentItemsEditorProps {
  title?: string
  items: DocumentArticleItem[]
  onAddItem: () => void
  onUpdateItem: (index: number, field: keyof DocumentArticleItem, value: any) => void
  onDeleteItem: (index: number) => void
}

export const DocumentItemsEditor: React.FC<DocumentItemsEditorProps> = ({
  title = 'Artículos / Ítems',
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {title} ({items.length})
        </Typography>
        <Button size='small' variant='outlined' startIcon={<Icon icon='tabler:plus' />} onClick={onAddItem}>
          Agregar Artículo
        </Button>
      </Box>

      {items.length === 0 ? (
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
            No se registraron artículos o renglones todavía.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {items.map((item, idx) => (
            <Box
              key={item.id || idx}
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
                size='small'
                label='Código'
                placeholder='ART01'
                value={item.codigo || ''}
                onChange={e => onUpdateItem(idx, 'codigo', e.target.value)}
                sx={{ width: { xs: '100%', sm: 100 } }}
              />
              <TextField
                size='small'
                label='Descripción *'
                placeholder='Descripción del ítem o servicio'
                value={item.nombre || ''}
                onChange={e => onUpdateItem(idx, 'nombre', e.target.value)}
                sx={{ flex: 1, minWidth: 160 }}
              />
              <TextField
                size='small'
                type='number'
                label='Cant.'
                value={item.cantidad ?? ''}
                onChange={e =>
                  onUpdateItem(idx, 'cantidad', e.target.value === '' ? null : Number(e.target.value))
                }
                sx={{ width: { xs: '48%', sm: 76 } }}
              />
              <TextField
                size='small'
                type='number'
                label='Precio s/IVA'
                value={item.precioSinIva ?? ''}
                onChange={e =>
                  onUpdateItem(idx, 'precioSinIva', e.target.value === '' ? null : Number(e.target.value))
                }
                sx={{ width: { xs: '48%', sm: 108 } }}
              />
              <TextField
                size='small'
                label='Desc. %/$'
                placeholder='0'
                value={item.bonificacion ?? ''}
                onChange={e =>
                  onUpdateItem(idx, 'bonificacion', e.target.value === '' ? null : e.target.value)
                }
                sx={{ width: { xs: '48%', sm: 84 } }}
              />
              <TextField
                size='small'
                type='number'
                label='Precio Final'
                value={item.precioFinal ?? ''}
                onChange={e =>
                  onUpdateItem(idx, 'precioFinal', e.target.value === '' ? null : Number(e.target.value))
                }
                sx={{ width: { xs: '100%', sm: 108 } }}
              />
              <IconButton size='small' color='error' onClick={() => onDeleteItem(idx)} sx={{ ml: 'auto' }}>
                <Icon icon='tabler:trash' fontSize={18} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default DocumentItemsEditor
