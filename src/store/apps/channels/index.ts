import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import apiConnector from 'src/services/api.service'
import {
  CompanyEmailChannelItem,
  CompanyWhatsappChannelItem,
  CompanyWhatsappConfigResponse,
  EmailMessageItem,
  EmailMessagesStats,
  TestEmailConnectionPayload,
  UpsertEmailChannelPayload,
  UpsertWhatsappChannelPayload,
  WhatsappMessageItem,
  WhatsappMessagesStats,
  WhatsappRuntimeSnapshot
} from 'src/types/apps/channelTypes'

export interface ChannelsState {
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
  whatsappMessages: WhatsappMessageItem[]
  whatsappMessagesTotal: number
  whatsappMessagesStats: WhatsappMessagesStats
  loadingWhatsappConfig: boolean
  savingWhatsappConfig: boolean
  connectingWhatsapp: boolean
  disconnectingWhatsapp: boolean
  loadingWhatsappMessages: boolean
}

const initialState: ChannelsState = {
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
  whatsappMessages: [],
  whatsappMessagesTotal: 0,
  whatsappMessagesStats: { total: 0, processed: 0, skipped: 0, errors: 0 },
  loadingWhatsappConfig: false,
  savingWhatsappConfig: false,
  connectingWhatsapp: false,
  disconnectingWhatsapp: false,
  loadingWhatsappMessages: false
}

export const fetchEmailChannelConfig = createAsyncThunk('channels/fetchEmailConfig', async () => {
  const res = await apiConnector.get('/channels/email')

  return res as { configured: boolean; channel: CompanyEmailChannelItem | null }
})

export const saveEmailChannelConfig = createAsyncThunk(
  'channels/saveEmailConfig',
  async (payload: UpsertEmailChannelPayload) => {
    const res = await apiConnector.post('/channels/email', payload)

    return res as { message: string; channel: CompanyEmailChannelItem }
  }
)

export const testEmailChannelConnection = createAsyncThunk(
  'channels/testEmailConnection',
  async (payload: TestEmailConnectionPayload) => {
    const res = await apiConnector.post('/channels/email/test', payload)

    return res as { ok: boolean; message: string; totalMessages: number; unreadCount: number }
  }
)

export const syncEmailChannelNow = createAsyncThunk('channels/syncEmailNow', async () => {
  const res = await apiConnector.post('/channels/email/sync', {})

  return res as {
    ok: boolean
    processedEmails?: number
    createdDocuments?: number
    skippedCount?: number
    message: string
  }
})

export const fetchEmailMessages = createAsyncThunk(
  'channels/fetchEmailMessages',
  async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)
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
  async () => {
    const res = await apiConnector.get('/channels/whatsapp')

    return res as CompanyWhatsappConfigResponse
  }
)

export const connectWhatsappQr = createAsyncThunk('channels/connectWhatsappQr', async () => {
  const res = await apiConnector.post('/channels/whatsapp/connect', {})

  return res as CompanyWhatsappConfigResponse & { message: string }
})

export const disconnectWhatsappSession = createAsyncThunk(
  'channels/disconnectWhatsappSession',
  async () => {
    const res = await apiConnector.post('/channels/whatsapp/disconnect', {})

    return res as CompanyWhatsappConfigResponse & { message: string }
  }
)

export const saveWhatsappChannelSettings = createAsyncThunk(
  'channels/saveWhatsappSettings',
  async (payload: UpsertWhatsappChannelPayload) => {
    const res = await apiConnector.patch('/channels/whatsapp/settings', payload)

    return res as CompanyWhatsappConfigResponse & { message: string }
  }
)

export const fetchWhatsappMessages = createAsyncThunk(
  'channels/fetchWhatsappMessages',
  async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)
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
  }
})

export const { clearSelectedEmail, applyWhatsappRealtimeStatus } = channelsSlice.actions

export default channelsSlice.reducer
