import React from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { GridColDef } from '@mui/x-data-grid'
import CustomAvatar from 'src/@core/components/mui/avatar'
import Icon from 'src/@core/components/icon'
import { getInitials } from 'src/@core/utils/get-initials'
import {
  DEMO_STATUS_MAP,
  DEMO_STATUS_OPTIONS,
  DemoRequestStatus,
  DemoRequestType
} from 'src/types/apps/demoRequestTypes'

interface BuildColumnsHandlers {
  updatingId: number | null
  onStatusChange: (row: DemoRequestType, newStatus: DemoRequestStatus) => void
  onViewDetail: (row: DemoRequestType) => void
  onDeleteClick: (row: DemoRequestType) => void
}

const formatDateTime = (isoDate?: string) => {
  if (!isoDate) return '-'
  try {
    return new Date(isoDate).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoDate
  }
}

export const buildDemosColumns = ({
  updatingId,
  onStatusChange,
  onViewDetail,
  onDeleteClick
}: BuildColumnsHandlers): GridColDef[] => [
  {
    field: 'createdAt',
    headerName: 'Fecha',
    minWidth: 145,
    flex: 0.12,
    renderCell: ({ row }: { row: DemoRequestType }) => (
      <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {formatDateTime(row.createdAt)}
      </Typography>
    )
  },
  {
    field: 'companyName',
    headerName: 'Solicitante / Empresa',
    minWidth: 230,
    flex: 0.22,
    renderCell: ({ row }: { row: DemoRequestType }) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
        <CustomAvatar
          skin='light'
          color='primary'
          sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}
        >
          {getInitials(row.companyName || row.fullName || 'D')}
        </CustomAvatar>
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography
            variant='body2'
            noWrap
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            {row.fullName}
          </Typography>
          <Typography variant='caption' noWrap sx={{ color: 'text.secondary' }}>
            {row.companyName}
          </Typography>
        </Box>
      </Box>
    )
  },
  {
    field: 'email',
    headerName: 'Correo / Teléfono',
    minWidth: 215,
    flex: 0.2,
    renderCell: ({ row }: { row: DemoRequestType }) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Typography variant='body2' noWrap sx={{ color: 'text.primary', fontWeight: 500 }}>
          {row.email}
        </Typography>
        <Typography variant='caption' noWrap sx={{ color: 'text.secondary' }}>
          {row.phone || 'Sin teléfono'}
        </Typography>
      </Box>
    )
  },
  {
    field: 'managementSystem',
    headerName: 'Sistema de Gestión',
    minWidth: 165,
    flex: 0.14,
    renderCell: ({ row }: { row: DemoRequestType }) => (
      <Chip
        size='small'
        variant='outlined'
        color='secondary'
        label={row.managementSystem || 'No especificado'}
        sx={{ maxWidth: '100%' }}
      />
    )
  },
  {
    field: 'selectedDemo',
    headerName: 'Demo / Origen',
    minWidth: 195,
    flex: 0.18,
    renderCell: ({ row }: { row: DemoRequestType }) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Typography variant='body2' noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
          {row.selectedDemo || 'Solicitud general'}
        </Typography>
        <Typography variant='caption' sx={{ color: row.emailSent ? 'success.main' : 'text.disabled' }}>
          {row.source === 'contact_section' ? 'Sección Contacto' : 'Modal Demo'} ·{' '}
          {row.emailSent ? 'Mail enviado' : 'Solo guardado DB'}
        </Typography>
      </Box>
    )
  },
  {
    field: 'message',
    headerName: 'Mensaje',
    minWidth: 185,
    flex: 0.18,
    renderCell: ({ row }: { row: DemoRequestType }) => (
      <Tooltip title={row.message || 'Sin mensaje'} arrow placement='top'>
        <Typography
          variant='caption'
          noWrap
          sx={{ color: 'text.secondary', display: 'block', width: '100%' }}
        >
          {row.message || 'Sin mensaje adicional'}
        </Typography>
      </Tooltip>
    )
  },
  {
    field: 'status',
    headerName: 'Estado',
    minWidth: 165,
    flex: 0.14,
    renderCell: ({ row }: { row: DemoRequestType }) => {
      const meta = DEMO_STATUS_MAP[row.status] || DEMO_STATUS_MAP.RECIBIDO
      return (
        <Select
          size='small'
          value={row.status || 'RECIBIDO'}
          disabled={updatingId === row.id}
          onClick={e => e.stopPropagation()}
          onChange={e => onStatusChange(row, e.target.value as DemoRequestStatus)}
          sx={{
            minWidth: 138,
            fontSize: '0.8rem',
            fontWeight: 600,
            '& .MuiSelect-select': { py: 0.6, display: 'flex', alignItems: 'center' }
          }}
          renderValue={val => {
            const selectedMeta = DEMO_STATUS_MAP[val as DemoRequestStatus] || meta
            return (
              <Chip
                size='small'
                label={selectedMeta.label}
                color={selectedMeta.color}
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
              />
            )
          }}
        >
          {DEMO_STATUS_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              <Chip
                size='small'
                label={opt.label}
                color={opt.color}
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
              />
            </MenuItem>
          ))}
        </Select>
      )
    }
  },
  {
    field: 'actions',
    headerName: 'Acciones',
    minWidth: 105,
    sortable: false,
    renderCell: ({ row }: { row: DemoRequestType }) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title='Ver detalle y notas'>
          <IconButton size='small' color='primary' onClick={() => onViewDetail(row)}>
            <Icon icon='tabler:eye' fontSize={19} />
          </IconButton>
        </Tooltip>
        <Tooltip title='Eliminar solicitud'>
          <IconButton size='small' color='error' onClick={() => onDeleteClick(row)}>
            <Icon icon='tabler:trash' fontSize={19} />
          </IconButton>
        </Tooltip>
      </Box>
    )
  }
]
