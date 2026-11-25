import React, { useState } from 'react'
import { Box, Button, Chip, TextField, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

const EXACT_EMAIL_REGEX = /^[^\s@]+@[^\s@.]+\.[^\s@.]+(?:\.[^\s@.]+)*$/
const DOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/

export function normalizeSenderRuleInput(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed || /\s/.test(trimmed)) return null

  const bracketMatch = trimmed.match(/<([^<>]+)>/)
  const value = (bracketMatch ? bracketMatch[1] : trimmed).trim()

  if (value.startsWith('*.')) {
    const dom = value.slice(2)

    return DOMAIN_REGEX.test(dom) ? `@${dom}` : null
  }
  if (value.startsWith('@')) {
    const dom = value.slice(1)

    return DOMAIN_REGEX.test(dom) ? `@${dom}` : null
  }
  if (value.includes('@')) {
    return EXACT_EMAIL_REGEX.test(value) ? value : null
  }

  return DOMAIN_REGEX.test(value) ? `@${value}` : null
}

interface EmailSendersWhitelistBoxProps {
  allowedSenders: string[]
  onChange: (nextSenders: string[]) => void
}

const EmailSendersWhitelistBox: React.FC<EmailSendersWhitelistBoxProps> = ({
  allowedSenders,
  onChange
}) => {
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const handleAdd = () => {
    const rawParts = inputValue
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean)

    if (rawParts.length === 0) return

    const next = [...allowedSenders]
    const invalid: string[] = []

    for (const part of rawParts) {
      const normalized = normalizeSenderRuleInput(part)
      if (!normalized) {
        invalid.push(part)
        continue
      }
      if (!next.includes(normalized)) {
        next.push(normalized)
      }
    }

    if (invalid.length > 0) {
      setInputError(
        `Formato inválido: ${invalid[0]}. Usá correo exacto (ej: facturas@proveedor.com) o dominio (ej: @proveedor.com).`
      )

      return
    }

    setInputError(null)
    setInputValue('')
    onChange(next)
  }

  const handleRemove = (rule: string) => {
    onChange(allowedSenders.filter(item => item !== rule))
  }

  return (
    <Box sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
        Correos y dominios autorizados
      </Typography>
      <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 2 }}>
        Podés agregar direcciones exactas (ej: <strong>facturas@proveedor.com</strong>) o dominios completos (ej: <strong>@proveedor.com</strong>). Los correos de otros remitentes se ignorarán sin guardarse y permanecerán <strong>sin leer</strong> en tu casilla IMAP.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'flex-start' }}>
        <TextField
          size='small'
          fullWidth
          placeholder='facturas@proveedor.com o @proveedor.com'
          value={inputValue}
          error={Boolean(inputError)}
          helperText={inputError || undefined}
          onChange={e => {
            setInputValue(e.target.value)
            if (inputError) setInputError(null)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button variant='outlined' onClick={handleAdd} sx={{ whiteSpace: 'nowrap', mt: 0.25 }}>
          Agregar
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {allowedSenders.length === 0 ? (
          <Typography variant='caption' color='warning.main'>
            Agregá al menos un correo o dominio autorizado o cambiá la regla a &quot;Todos los correos entrantes&quot;.
          </Typography>
        ) : (
          allowedSenders.map(rule => {
            const isDomain = rule.startsWith('@')

            return (
              <Chip
                key={rule}
                icon={<Icon icon={isDomain ? 'tabler:world' : 'tabler:mail'} fontSize={16} />}
                label={isDomain ? `Dominio ${rule}` : rule}
                onDelete={() => handleRemove(rule)}
                color={isDomain ? 'info' : 'primary'}
                variant='outlined'
              />
            )
          })
        )}
      </Box>
    </Box>
  )
}

export default EmailSendersWhitelistBox
