export type DemoRequestStatus =
  | 'RECIBIDO'
  | 'CONTACTADO'
  | 'INTERESADO'
  | 'VENDIDO'
  | 'RECHAZADO'

export interface DemoRequestType {
  id: number
  fullName: string
  companyName: string
  email: string
  phone: string | null
  managementSystem: string | null
  selectedDemo: string | null
  message: string | null
  source: string
  status: DemoRequestStatus
  emailSent: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface DemoRequestCounts {
  ALL: number
  RECIBIDO: number
  CONTACTADO: number
  INTERESADO: number
  VENDIDO: number
  RECHAZADO: number
}

export const DEMO_STATUS_OPTIONS: Array<{
  value: DemoRequestStatus
  label: string
  color: 'info' | 'primary' | 'warning' | 'success' | 'error'
}> = [
  { value: 'RECIBIDO', label: 'Recibido', color: 'info' },
  { value: 'CONTACTADO', label: 'Contactado', color: 'primary' },
  { value: 'INTERESADO', label: 'Interesado', color: 'warning' },
  { value: 'VENDIDO', label: 'Vendido', color: 'success' },
  { value: 'RECHAZADO', label: 'Rechazado', color: 'error' }
]

export const DEMO_STATUS_MAP: Record<
  DemoRequestStatus,
  { label: string; color: 'info' | 'primary' | 'warning' | 'success' | 'error' }
> = {
  RECIBIDO: { label: 'Recibido', color: 'info' },
  CONTACTADO: { label: 'Contactado', color: 'primary' },
  INTERESADO: { label: 'Interesado', color: 'warning' },
  VENDIDO: { label: 'Vendido', color: 'success' },
  RECHAZADO: { label: 'Rechazado', color: 'error' }
}
