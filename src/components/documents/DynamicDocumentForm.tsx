import React from 'react'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import {
  DocumentArticleItem,
  DocumentFormFieldSchema,
  DocumentTypeFormDefinition
} from 'src/store/apps/documents'
import DocumentItemsEditor from './DocumentItemsEditor'

interface DynamicDocumentFormProps {
  schema: DocumentTypeFormDefinition
  coreValues: Record<string, any>
  customValues: Record<string, any>
  items: DocumentArticleItem[]
  onCoreChange: (key: string, value: any) => void
  onCustomChange: (key: string, value: any) => void
  onAddItem: () => void
  onUpdateItem: (index: number, field: keyof DocumentArticleItem, value: any) => void
  onDeleteItem: (index: number) => void
}

export const DynamicDocumentForm: React.FC<DynamicDocumentFormProps> = ({
  schema,
  coreValues,
  customValues,
  items,
  onCoreChange,
  onCustomChange,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const currencySymbol =
    coreValues.currency === 'USD' ? 'u$s' : coreValues.currency === 'EUR' ? '€' : '$'

  const renderField = (field: DocumentFormFieldSchema) => {
    if (field.fieldType === 'items_table') {
      return (
        <DocumentItemsEditor
          title={field.label}
          items={items}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
        />
      )
    }

    const rawValue =
      field.target === 'core' ? coreValues[field.key] : customValues[field.key]
    const setValue = (val: any) =>
      field.target === 'core' ? onCoreChange(field.key, val) : onCustomChange(field.key, val)

    if (field.fieldType === 'switch') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <FormControlLabel
            control={<Switch checked={Boolean(rawValue)} onChange={e => setValue(e.target.checked)} />}
            label={field.label}
          />
        </Box>
      )
    }

    if (field.fieldType === 'select') {
      const normalizedOptions = (field.options || []).map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
      )
      const currentValue = rawValue ?? ''
      const hasExactMatch =
        currentValue === '' || normalizedOptions.some(opt => opt.value === String(currentValue))

      return (
        <TextField
          select
          fullWidth
          size='small'
          label={field.required ? `${field.label} *` : field.label}
          value={currentValue}
          onChange={e => setValue(e.target.value)}
        >
          <MenuItem value=''>Sin especificar</MenuItem>
          {!hasExactMatch && (
            <MenuItem value={String(currentValue)}>{String(currentValue)}</MenuItem>
          )}
          {normalizedOptions.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    const inputType =
      field.fieldType === 'date'
        ? 'date'
        : field.fieldType === 'number' || field.fieldType === 'currency'
          ? 'number'
          : 'text'

    return (
      <TextField
        fullWidth
        size='small'
        type={inputType}
        multiline={field.fieldType === 'textarea'}
        rows={field.fieldType === 'textarea' ? 2 : undefined}
        label={field.required ? `${field.label} *` : field.label}
        placeholder={field.placeholder}
        helperText={field.helperText}
        value={rawValue ?? ''}
        onChange={e => {
          const val = field.uppercase ? e.target.value.toUpperCase() : e.target.value
          setValue(val)
        }}
        InputLabelProps={field.fieldType === 'date' ? { shrink: true } : undefined}
        InputProps={
          field.fieldType === 'currency'
            ? {
                startAdornment: <InputAdornment position='start'>{currencySymbol}</InputAdornment>
              }
            : undefined
        }
      />
    )
  }

  return (
    <Box>
      {(schema.sectionsSchema || []).map((section, sIdx) => (
        <React.Fragment key={section.id}>
          {sIdx > 0 && <Divider sx={{ my: 2.5 }} />}
          <Typography
            variant='subtitle2'
            sx={{ fontWeight: 700, color: 'primary.main', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {section.icon && <Icon icon={section.icon} fontSize={18} />}
            {section.title}
          </Typography>
          <Grid container spacing={2}>
            {(section.fields || []).map(field => (
              <Grid item xs={12} sm={field.colSpan || 6} key={`${section.id}-${field.target}-${field.key}`}>
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
        </React.Fragment>
      ))}
    </Box>
  )
}

export default DynamicDocumentForm
