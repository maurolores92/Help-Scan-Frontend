import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import apiConnector from 'src/services/api.service'
import {
  CompanyEmailChannelItem,
  CompanyTelegramChannelItem,
  CompanyUserChannelOverviewItem,
  CompanyWhatsappChannelItem,
  CompanyWhatsappConfigResponse,
  EmailMessageItem,
  EmailMessagesStats,
  TelegramMessageItem,
  TelegramMessagesStats,
  TestEmailConnectionPayload,
  TestTelegramConnectionPayload,
  UpsertEmailChannelPayload,
  UpsertTelegramChannelPayload,
  UpsertWhatsappChannelPayload,
  WhatsappGroupItem,
  WhatsappMessageItem,
  WhatsappMessagesStats,
  WhatsappRuntimeSnapshot
} from 'src/types/apps/channelTypes'

const withUserQuery = (base: string, userId?: number) => {
  if (!userId) return base

  return `${base}${base.includes('?') ? '&' : '?'}userId=${userId}`
}

export interface ChannelsState {
  usersOverview: CompanyUserChannelOverviewItem[]
  loadingUsersOverview: boolean
  emailChannel: CompanyEmailChannelItem | null
  emailConfigured: boolean
  emails: EmailMessageItem[]
  emailsTotal: number
  emailsStats: EmailMessagesStats
  selectedEmail: EmailMessageItem | null
  loadingConfig: boolean
  savingConfig: boolean
  testingConnection: boolean
  syncing: boolean
  loadingEmails: boolean
  loadingEmailDetail: boolean
  rescuingEmail: boolean

  // WhatsApp QR Directo
  whatsappChannel: CompanyWhatsappChannelItem | null
  whatsappRuntime: WhatsappRuntimeSnapshot | null
  whatsappConfigured: boolean
  whatsappGroups: WhatsappGroupItem[]
  whatsappGroupsConnected: boolean
  loadingWhatsappGroups: boolean
  whatsappMessages: WhatsappMessageItem[]
  whatsappMessagesTotal: number
  whatsappMessagesStats: WhatsappMessagesStats
  loadingWhatsappConfig: boolean
  savingWhatsappConfig: boolean
  connectingWhatsapp: boolean
  disconnectingWhatsapp: boolean
  loadingWhatsappMessages: boolean

  // Telegram Bot Propio
  telegramChannel: CompanyTelegramChannelItem | null
  telegramConfigured: boolean
  telegramMessages: TelegramMessageItem[]
  telegramMessagesTotal: number
  telegramMessagesStats: TelegramMessagesStats
  loadingTelegramConfig: boolean
  savingTelegramConfig: boolean
  testingTelegramConnection: boolean
  loadingTelegramMessages: boolean
}

const initialState: ChannelsState = {
  usersOverview: [],
  loadingUsersOverview: false,
  emailChannel: null,
  emailConfigured: false,
  emails: [],
  emailsTotal: 0,
  emailsStats: { total: 0, processed: 0, skipped: 0, errors: 0 },
  selectedEmail: null,
  loadingConfig: false,
  savingConfig: false,
  testingConnection: false,
  syncing: false,
  loadingEmails: false,
  loadingEmailDetail: false,
  rescuingEmail: false,

  whatsappChannel: null,
  whatsappRuntime: null,
  whatsappConfigured: false,
  whatsappGroups: [],
  whatsappGroupsConnected: false,
  loadingWhatsappGroups: false,
  whatsappMessages: [],
  whatsappMessagesTotal: 0,
  whatsappMessagesStats: { total: 0, processed: 0, skipped: 0, errors: 0 },
  loadingWhatsappConfig: false,
  savingWhatsappConfig: false,
  connectingWhatsapp: false,
  disconnectingWhatsapp: false,
  loadingWhatsappMessages: false,

  telegramChannel: null,
  telegramConfigured: false,
  telegramMessages: [],
  telegramMessagesTotal: 0,
  telegramMessagesStats: { total: 0, processed: 0, skipped: 0, errors: 0 },
  loadingTelegramConfig: false,
  savingTelegramConfig: false,
  testingTelegramConnection: false,
  loadingTelegramMessages: false
}

export const fetchUsersChannelsOverview = createAsyncThunk(
  'channels/fetchUsersOverview',
  async () => {
    const res = await apiConnector.get('/channels/users-overview')

    return res as { isCompanyAdmin?: boolean; users: CompanyUserChannelOverviewItem[] }
  }
)

export const fetchEmailChannelConfig = createAsyncThunk(
  'channels/fetchEmailConfig',
  async (targetUserId?: number) => {
    const res = await apiConnector.get(withUserQuery('/channels/email', targetUserId))

    return res as { configured: boolean; channel: CompanyEmailChannelItem | null }
  }
)

export const saveEmailChannelConfig = createAsyncThunk(
  'channels/saveEmailConfig',
  async (payload: UpsertEmailChannelPayload & { targetUserId?: number }) => {
    const { targetUserId, ...body } = payload
    const res = await apiConnector.post(withUserQuery('/channels/email', targetUserId), body)

    return res as { message: string; channel: CompanyEmailChannelItem }
  }
)

export const testEmailChannelConnection = createAsyncThunk(
  'channels/testEmailConnection',
  async (payload: TestEmailConnectionPayload & { targetUserId?: number }) => {
    const { targetUserId, ...body } = payload
    const res = await apiConnector.post(withUserQuery('/channels/email/test', targetUserId), body)

    return res as { ok: boolean; message: string; totalMessages: number; unreadCount: number }
  }
)

export const syncEmailChannelNow = createAsyncThunk(
  'channels/syncEmailNow',
  async (targetUserId?: number) => {
    const res = await apiConnector.post(withUserQuery('/channels/email/sync', targetUserId), {})

    return res as {
      ok: boolean
      processedEmails?: number
      createdDocuments?: number
      skippedCount?: number
      message: string
    }
  }
)

export const regenerateEmailWebhookSecret = createAsyncThunk(
  'channels/regenerateEmailWebhookSecret',
  async (targetUserId?: number) => {
    const res = await apiConnector.post(
      withUserQuery('/channels/email/webhook-secret', targetUserId),
      {}
    )

    return res as { message: string; channel: CompanyEmailChannelItem }
  }
)

export const fetchEmailMessages = createAsyncThunk(
  'channels/fetchEmailMessages',
  async (params?: {
    search?: string
    status?: string
    userId?: number
    page?: number
    limit?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)
    if (params?.userId) query.set('userId', String(params.userId))
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))

    const qs = query.toString()
    const res = await apiConnector.get(`/channels/emails${qs ? `?${qs}` : ''}`)

    return res as {
      items: EmailMessageItem[]
      total: number
      page: number
      limit: number
      stats: EmailMessagesStats
    }
  }
)

export const fetchEmailMessageDetail = createAsyncThunk(
  'channels/fetchEmailDetail',
  async (id: number) => {
    const res = await apiConnector.get(`/channels/emails/${id}`)

    return res as EmailMessageItem
  }
)

export const rescueEmailToDocument = createAsyncThunk(
  'channels/rescueEmailToDocument',
  async (id: number) => {
    const res = await apiConnector.post(`/channels/emails/${id}/rescue`, {})

    return res as { message: string; emailMessage: EmailMessageItem; document: any }
  }
)

// =========================================================================
// THUNKS WHATSAPP QR DIRECTO
// =========================================================================

export const fetchWhatsappChannelConfig = createAsyncThunk(
  'channels/fetchWhatsappConfig',
  async (targetUserId?: number) => {
    const res = await apiConnector.get(withUserQuery('/channels/whatsapp', targetUserId))

    return res as CompanyWhatsappConfigResponse
  }
)

export const connectWhatsappQr = createAsyncThunk(
  'channels/connectWhatsappQr',
  async (targetUserId?: number) => {
    const res = await apiConnector.post(withUserQuery('/channels/whatsapp/connect', targetUserId), {})

    return res as CompanyWhatsappConfigResponse & { message: string }
  }
)

export const disconnectWhatsappSession = createAsyncThunk(
  'channels/disconnectWhatsappSession',
  async (targetUserId?: number) => {
    const res = await apiConnector.post(
      withUserQuery('/channels/whatsapp/disconnect', targetUserId),
      {}
    )

    return res as CompanyWhatsappConfigResponse & { message: string }
  }
)

export const saveWhatsappChannelSettings = createAsyncThunk(
  'channels/saveWhatsappSettings',
  async (payload: UpsertWhatsappChannelPayload & { targetUserId?: number }) => {
    const { targetUserId, ...body } = payload
    const res = await apiConnector.patch(
      withUserQuery('/channels/whatsapp/settings', targetUserId),
      body
    )

    return res as CompanyWhatsappConfigResponse & { message: string }
  }
)

export const fetchWhatsappGroups = createAsyncThunk(
  'channels/fetchWhatsappGroups',
  async (targetUserId?: number) => {
    const res = await apiConnector.get(withUserQuery('/channels/whatsapp/groups', targetUserId))

    return res as { connected: boolean; groups: WhatsappGroupItem[] }
  }
)

export const fetchWhatsappMessages = createAsyncThunk(
  'channels/fetchWhatsappMessages',
  async (params?: {
    search?: string
    status?: string
    userId?: number
    page?: number
    limit?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)
    if (params?.userId) query.set('userId', String(params.userId))
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))

    const qs = query.toString()
    const res = await apiConnector.get(`/channels/whatsapp/messages${qs ? `?${qs}` : ''}`)

    return res as {
      items: WhatsappMessageItem[]
      total: number
      page: number
      limit: number
      stats: WhatsappMessagesStats
    }
  }
)

// =========================================================================
// THUNKS TELEGRAM BOT PROPIO
// =========================================================================

export const fetchTelegramChannelConfig = createAsyncThunk(
  'channels/fetchTelegramConfig',
  async (targetUserId?: number) => {
    const res = await apiConnector.get(withUserQuery('/channels/telegram', targetUserId))

    return res as { configured: boolean; channel: CompanyTelegramChannelItem | null }
  }
)

export const saveTelegramChannelConfig = createAsyncThunk(
  'channels/saveTelegramConfig',
  async (payload: UpsertTelegramChannelPayload & { targetUserId?: number }) => {
    const { targetUserId, ...body } = payload
    const res = await apiConnector.post(withUserQuery('/channels/telegram', targetUserId), body)

    return res as {
      message: string
      configured: boolean
      channel: CompanyTelegramChannelItem | null
    }
  }
)

export const testTelegramChannelConnection = createAsyncThunk(
  'channels/testTelegramConnection',
  async (payload: TestTelegramConnectionPayload & { targetUserId?: number }) => {
    const { targetUserId, ...body } = payload
    const res = await apiConnector.post(withUserQuery('/channels/telegram/test', targetUserId), body)

    return res as {
      ok: boolean
      botId: number
      botUsername: string
      botDisplayName: string
      message: string
    }
  }
)

export const fetchTelegramMessages = createAsyncThunk(
  'channels/fetchTelegramMessages',
  async (params?: {
    search?: string
    status?: string
    userId?: number
    page?: number
    limit?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)
    if (params?.userId) query.set('userId', String(params.userId))
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))

    const qs = query.toString()
    const res = await apiConnector.get(`/channels/telegram/messages${qs ? `?${qs}` : ''}`)

    return res as {
      items: TelegramMessageItem[]
      total: number
      page: number
      limit: number
      stats: TelegramMessagesStats
    }
  }
)

export const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    clearSelectedEmail: state => {
      state.selectedEmail = null
    },
    applyWhatsappRealtimeStatus: (state, action: PayloadAction<WhatsappRuntimeSnapshot>) => {
      state.whatsappRuntime = action.payload
      if (state.whatsappChannel) {
        state.whatsappChannel = {
          ...state.whatsappChannel,
          connectionStatus: action.payload.connectionStatus,
          connectedPhone: action.payload.connectedPhone ?? state.whatsappChannel.connectedPhone,
          connectedName: action.payload.connectedName ?? state.whatsappChannel.connectedName
        }
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUsersChannelsOverview.pending, state => {
        state.loadingUsersOverview = true
      })
      .addCase(fetchUsersChannelsOverview.fulfilled, (state, action) => {
        state.loadingUsersOverview = false
        state.usersOverview = action.payload?.users || []
      })
      .addCase(fetchUsersChannelsOverview.rejected, state => {
        state.loadingUsersOverview = false
      })
      .addCase(fetchEmailChannelConfig.pending, state => {
        state.loadingConfig = true
      })
      .addCase(fetchEmailChannelConfig.fulfilled, (state, action) => {
        state.loadingConfig = false
        state.emailConfigured = action.payload.configured
        state.emailChannel = action.payload.channel
      })
      .addCase(fetchEmailChannelConfig.rejected, state => {
        state.loadingConfig = false
      })
      .addCase(saveEmailChannelConfig.pending, state => {
        state.savingConfig = true
      })
      .addCase(saveEmailChannelConfig.fulfilled, (state, action) => {
        state.savingConfig = false
        state.emailConfigured = true
        state.emailChannel = action.payload.channel
      })
      .addCase(saveEmailChannelConfig.rejected, state => {
        state.savingConfig = false
      })
      .addCase(testEmailChannelConnection.pending, state => {
        state.testingConnection = true
      })
      .addCase(testEmailChannelConnection.fulfilled, state => {
        state.testingConnection = false
      })
      .addCase(testEmailChannelConnection.rejected, state => {
        state.testingConnection = false
      })
      .addCase(syncEmailChannelNow.pending, state => {
        state.syncing = true
      })
      .addCase(syncEmailChannelNow.fulfilled, state => {
        state.syncing = false
      })
      .addCase(syncEmailChannelNow.rejected, state => {
        state.syncing = false
      })
      .addCase(regenerateEmailWebhookSecret.fulfilled, (state, action) => {
        state.emailChannel = action.payload.channel
      })
      .addCase(fetchEmailMessages.pending, state => {
        state.loadingEmails = true
      })
      .addCase(fetchEmailMessages.fulfilled, (state, action) => {
        state.loadingEmails = false
        state.emails = action.payload.items
        state.emailsTotal = action.payload.total
        state.emailsStats = action.payload.stats
      })
      .addCase(fetchEmailMessages.rejected, state => {
        state.loadingEmails = false
      })
      .addCase(fetchEmailMessageDetail.pending, state => {
        state.loadingEmailDetail = true
      })
      .addCase(fetchEmailMessageDetail.fulfilled, (state, action) => {
        state.loadingEmailDetail = false
        state.selectedEmail = action.payload
      })
      .addCase(fetchEmailMessageDetail.rejected, state => {
        state.loadingEmailDetail = false
      })
      .addCase(rescueEmailToDocument.pending, state => {
        state.rescuingEmail = true
      })
      .addCase(rescueEmailToDocument.fulfilled, (state, action) => {
        state.rescuingEmail = false
        const updated = action.payload.emailMessage
        state.selectedEmail = {
          ...(state.selectedEmail || updated),
          ...updated,
          document: action.payload.document
        }
        state.emails = state.emails.map(e =>
          e.id === updated.id ? { ...e, ...updated, document: action.payload.document } : e
        )
      })
      .addCase(rescueEmailToDocument.rejected, state => {
        state.rescuingEmail = false
      })

      // WhatsApp reducers
      .addCase(fetchWhatsappChannelConfig.pending, state => {
        state.loadingWhatsappConfig = true
      })
      .addCase(fetchWhatsappChannelConfig.fulfilled, (state, action) => {
        state.loadingWhatsappConfig = false
        state.whatsappConfigured = action.payload.configured
        state.whatsappChannel = action.payload.channel
        state.whatsappRuntime = action.payload.runtime
      })
      .addCase(fetchWhatsappChannelConfig.rejected, state => {
        state.loadingWhatsappConfig = false
      })
      .addCase(connectWhatsappQr.pending, state => {
        state.connectingWhatsapp = true
      })
      .addCase(connectWhatsappQr.fulfilled, (state, action) => {
        state.connectingWhatsapp = false
        state.whatsappConfigured = action.payload.configured
        state.whatsappChannel = action.payload.channel
        state.whatsappRuntime = action.payload.runtime
      })
      .addCase(connectWhatsappQr.rejected, state => {
        state.connectingWhatsapp = false
      })
      .addCase(disconnectWhatsappSession.pending, state => {
        state.disconnectingWhatsapp = true
      })
      .addCase(disconnectWhatsappSession.fulfilled, (state, action) => {
        state.disconnectingWhatsapp = false
        state.whatsappConfigured = action.payload.configured
        state.whatsappChannel = action.payload.channel
        state.whatsappRuntime = action.payload.runtime
      })
      .addCase(disconnectWhatsappSession.rejected, state => {
        state.disconnectingWhatsapp = false
      })
      .addCase(saveWhatsappChannelSettings.pending, state => {
        state.savingWhatsappConfig = true
      })
      .addCase(saveWhatsappChannelSettings.fulfilled, (state, action) => {
        state.savingWhatsappConfig = false
        state.whatsappConfigured = action.payload.configured
        state.whatsappChannel = action.payload.channel
        state.whatsappRuntime = action.payload.runtime
      })
      .addCase(saveWhatsappChannelSettings.rejected, state => {
        state.savingWhatsappConfig = false
      })
      .addCase(fetchWhatsappMessages.pending, state => {
        state.loadingWhatsappMessages = true
      })
      .addCase(fetchWhatsappMessages.fulfilled, (state, action) => {
        state.loadingWhatsappMessages = false
        state.whatsappMessages = action.payload.items
        state.whatsappMessagesTotal = action.payload.total
        state.whatsappMessagesStats = action.payload.stats
      })
      .addCase(fetchWhatsappMessages.rejected, state => {
        state.loadingWhatsappMessages = false
      })
      .addCase(fetchWhatsappGroups.pending, state => {
        state.loadingWhatsappGroups = true
      })
      .addCase(fetchWhatsappGroups.fulfilled, (state, action) => {
        state.loadingWhatsappGroups = false
        state.whatsappGroupsConnected = action.payload.connected
        state.whatsappGroups = action.payload.groups || []
      })
      .addCase(fetchWhatsappGroups.rejected, state => {
        state.loadingWhatsappGroups = false
      })

      // Telegram reducers
      .addCase(fetchTelegramChannelConfig.pending, state => {
        state.loadingTelegramConfig = true
      })
      .addCase(fetchTelegramChannelConfig.fulfilled, (state, action) => {
        state.loadingTelegramConfig = false
        state.telegramConfigured = action.payload.configured
        state.telegramChannel = action.payload.channel
      })
      .addCase(fetchTelegramChannelConfig.rejected, state => {
        state.loadingTelegramConfig = false
      })
      .addCase(saveTelegramChannelConfig.pending, state => {
        state.savingTelegramConfig = true
      })
      .addCase(saveTelegramChannelConfig.fulfilled, (state, action) => {
        state.savingTelegramConfig = false
        state.telegramConfigured = action.payload.configured
        state.telegramChannel = action.payload.channel
      })
      .addCase(saveTelegramChannelConfig.rejected, state => {
        state.savingTelegramConfig = false
      })
      .addCase(testTelegramChannelConnection.pending, state => {
        state.testingTelegramConnection = true
      })
      .addCase(testTelegramChannelConnection.fulfilled, state => {
        state.testingTelegramConnection = false
      })
      .addCase(testTelegramChannelConnection.rejected, state => {
        state.testingTelegramConnection = false
      })
      .addCase(fetchTelegramMessages.pending, state => {
        state.loadingTelegramMessages = true
      })
      .addCase(fetchTelegramMessages.fulfilled, (state, action) => {
        state.loadingTelegramMessages = false
        state.telegramMessages = action.payload.items
        state.telegramMessagesTotal = action.payload.total
        state.telegramMessagesStats = action.payload.stats
      })
      .addCase(fetchTelegramMessages.rejected, state => {
        state.loadingTelegramMessages = false
      })
  }
})

export const { clearSelectedEmail, applyWhatsappRealtimeStatus } = channelsSlice.actions

export default channelsSlice.reducer
