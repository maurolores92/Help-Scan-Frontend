export type EmailProviderType = 'GMAIL' | 'OUTLOOK' | 'CUSTOM'

export type EmailSenderPolicy = 'ALL' | 'WHITELIST'

export type EmailSyncStatus = 'IDLE' | 'OK' | 'ERROR'

export type EmailMessageStatus = 'PROCESSED' | 'SYNTHESIZED_BODY' | 'SKIPPED' | 'ERROR'

export interface ChannelUserRef {
  id: number
  name?: string | null
  lastName?: string | null
  username?: string | null
  email?: string | null
  status?: string
  isAdmin?: boolean
}

export interface CompanyUserChannelOverviewItem extends ChannelUserRef {
  channels: {
    email: {
      id: number
      userId: number
      emailUser: string
      provider: EmailProviderType
      isActive: boolean
      lastSyncStatus: EmailSyncStatus
    } | null
    whatsapp: {
      id: number
      userId: number
      connectionStatus: WhatsappConnectionStatus
      connectedPhone: string | null
      isActive: boolean
    } | null
    telegram: {
      id: number
      userId: number
      botUsername: string | null
      isActive: boolean
      lastSyncStatus: TelegramSyncStatus
    } | null
  }
}

export interface CompanyEmailChannelItem {
  id: number
  companyId: number
  userId?: number | null
  user?: ChannelUserRef | null
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
  senderPolicy?: EmailSenderPolicy
  allowedSenders?: string[]
  lastSyncAt: string | null
  lastSyncStatus: EmailSyncStatus
  lastSyncMessage: string | null
  webhookSecret?: string | null
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
  senderPolicy?: EmailSenderPolicy
  allowedSenders?: string[]
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
  userId?: number | null
  user?: ChannelUserRef | null
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

export type WhatsappGroupPolicy = 'IGNORE' | 'WHITELIST' | 'ALL'

export interface AllowedWhatsappGroup {
  jid: string
  name: string
}

export interface WhatsappGroupItem {
  jid: string
  name: string
  participantsCount: number
}

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
  userId?: number | null
  user?: ChannelUserRef | null
  sessionKey: string
  connectionStatus: WhatsappConnectionStatus
  connectedPhone: string | null
  connectedName: string | null
  senderPolicy: WhatsappSenderPolicy
  allowedPhones: string[]
  ignoreGroups: boolean
  groupPolicy?: WhatsappGroupPolicy
  allowedGroups?: AllowedWhatsappGroup[]
  isActive: boolean
  processImages: boolean
  autoReplyConfirmation: boolean
  notifyOnReceive?: boolean
  notifyOnIndexed?: boolean
  lastQrAt: string | null
  lastMessageAt: string | null
  lastSyncStatus: WhatsappSyncStatus
  lastSyncMessage: string | null
  createdAt?: string
  updatedAt?: string
}

export interface WhatsappRuntimeSnapshot {
  companyId: number
  channelId?: number
  userId?: number | null
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
  groupPolicy?: WhatsappGroupPolicy
  allowedGroups?: AllowedWhatsappGroup[]
  isActive: boolean
  processImages: boolean
  autoReplyConfirmation: boolean
  notifyOnReceive?: boolean
  notifyOnIndexed?: boolean
}

export interface WhatsappMessageItem {
  id: number
  companyId: number
  channelId: number | null
  userId?: number | null
  user?: ChannelUserRef | null
  externalMessageId: string
  senderPhone: string
  senderName: string | null
  groupJid?: string | null
  groupName?: string | null
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

// =========================================================================
// TELEGRAM BOT PROPIO POR COMPAÑÍA (@BotFather)
// =========================================================================

export type TelegramSenderPolicy = 'ALL' | 'WHITELIST'

export type TelegramSyncStatus = 'IDLE' | 'OK' | 'ERROR'

export type TelegramMessageStatus = 'PROCESSED' | 'SKIPPED' | 'REJECTED_SENDER' | 'ERROR'

export interface CompanyTelegramChannelItem {
  id: number
  companyId: number
  userId?: number | null
  user?: ChannelUserRef | null
  botUsername: string | null
  botDisplayName: string | null
  hasBotToken: boolean
  isPollingActive?: boolean
  senderPolicy: TelegramSenderPolicy
  allowedChatIds: string[]
  ignoreGroups: boolean
  isActive: boolean
  processImages: boolean
  autoReplyConfirmation: boolean
  lastMessageAt: string | null
  lastSyncStatus: TelegramSyncStatus
  lastSyncMessage: string | null
  createdAt?: string
  updatedAt?: string
}

export interface UpsertTelegramChannelPayload {
  botToken?: string
  senderPolicy: TelegramSenderPolicy
  allowedChatIds: string[]
  ignoreGroups: boolean
  isActive: boolean
  processImages: boolean
  autoReplyConfirmation: boolean
  notifyOnReceive?: boolean
  notifyOnIndexed?: boolean
}

export interface TestTelegramConnectionPayload {
  botToken?: string
}

export interface TelegramMessageItem {
  id: number
  companyId: number
  channelId: number | null
  userId?: number | null
  user?: ChannelUserRef | null
  externalMessageId: string
  chatId: string
  senderUsername: string | null
  senderName: string | null
  messageType: string
  fileName: string | null
  mimeType: string | null
  caption: string | null
  receivedAt: string
  status: TelegramMessageStatus
  statusReason: string | null
  documentId: number | null
  document?: EmailMessageDocumentRef | null
  createdAt?: string
}

export interface TelegramMessagesStats {
  total: number
  processed: number
  skipped: number
  errors: number
}
