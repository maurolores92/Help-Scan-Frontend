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
