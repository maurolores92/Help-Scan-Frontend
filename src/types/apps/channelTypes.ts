export type EmailProviderType = 'GMAIL' | 'OUTLOOK' | 'CUSTOM'

export type EmailSyncStatus = 'IDLE' | 'OK' | 'ERROR'

export type EmailMessageStatus = 'PROCESSED' | 'SYNTHESIZED_BODY' | 'SKIPPED' | 'ERROR'

export interface CompanyEmailChannelItem {
  id: number
  companyId: number
  provider: EmailProviderType
  host: string
  port: number
  secure: boolean
  emailUser: string
  hasPassword: boolean
  folder: string
  isActive: boolean
  processBodyWithoutAttachments: boolean
  markAsRead: boolean
  syncIntervalMinutes: number
  lastSyncAt: string | null
  lastSyncStatus: EmailSyncStatus
  lastSyncMessage: string | null
  createdAt?: string
  updatedAt?: string
}

export interface UpsertEmailChannelPayload {
  provider: EmailProviderType
  host: string
  port: number
  secure: boolean
  emailUser: string
  password?: string
  folder: string
  isActive: boolean
  processBodyWithoutAttachments: boolean
  markAsRead: boolean
  syncIntervalMinutes: number
}

export interface TestEmailConnectionPayload {
  host: string
  port: number
  secure: boolean
  emailUser: string
  password?: string
  folder?: string
}

export interface EmailMessageDocumentRef {
  id: number
  originalName: string
  documentType?: string | null
  totalAmount?: number | null
  status?: string
  issuerName?: string | null
}

export interface EmailMessageItem {
  id: number
  companyId: number
  channelId: number | null
  messageId: string
  senderName: string | null
  senderEmail: string
  subject: string
  receivedAt: string
  bodyText?: string | null
  bodyHtmlSanitized?: string | null
  attachmentsCount: number
  attachmentNames: string[]
  status: EmailMessageStatus
  statusReason: string | null
  documentId: number | null
  generatedDocumentIds: number[]
  document?: EmailMessageDocumentRef | null
  createdAt?: string
}

export interface EmailMessagesStats {
  total: number
  processed: number
  skipped: number
  errors: number
}

// =========================================================================
// WHATSAPP QR DIRECTO (BAILEYS MULTITENANT)
// =========================================================================

export type WhatsappSenderPolicy = 'ALL' | 'WHITELIST'

export type WhatsappConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'QR_READY'
  | 'CONNECTED'
  | 'ERROR'

export type WhatsappSyncStatus = 'IDLE' | 'OK' | 'ERROR'

export type WhatsappMessageStatus = 'PROCESSED' | 'SKIPPED' | 'REJECTED_SENDER' | 'ERROR'

export interface CompanyWhatsappChannelItem {
  id: number
  companyId: number
  sessionKey: string
  connectionStatus: WhatsappConnectionStatus
  connectedPhone: string | null
  connectedName: string | null
  senderPolicy: WhatsappSenderPolicy
  allowedPhones: string[]
  ignoreGroups: boolean
  isActive: boolean
  processImages: boolean
  autoReplyConfirmation: boolean
  lastQrAt: string | null
  lastMessageAt: string | null
  lastSyncStatus: WhatsappSyncStatus
  lastSyncMessage: string | null
  createdAt?: string
  updatedAt?: string
}

export interface WhatsappRuntimeSnapshot {
  companyId: number
  connectionStatus: WhatsappConnectionStatus
  qrDataUrl: string | null
  connectedPhone: string | null
  connectedName: string | null
  lastError: string | null
}

export interface CompanyWhatsappConfigResponse {
  configured: boolean
  channel: CompanyWhatsappChannelItem | null
  runtime: WhatsappRuntimeSnapshot
}

export interface UpsertWhatsappChannelPayload {
  senderPolicy: WhatsappSenderPolicy
  allowedPhones: string[]
  ignoreGroups: boolean
  isActive: boolean
  processImages: boolean
  autoReplyConfirmation: boolean
}

export interface WhatsappMessageItem {
  id: number
  companyId: number
  channelId: number | null
  externalMessageId: string
  senderPhone: string
  senderName: string | null
  messageType: string
  fileName: string | null
  mimeType: string | null
  caption: string | null
  receivedAt: string
  status: WhatsappMessageStatus
  statusReason: string | null
  documentId: number | null
  document?: EmailMessageDocumentRef | null
  createdAt?: string
}

export interface WhatsappMessagesStats {
  total: number
  processed: number
  skipped: number
  errors: number
}
