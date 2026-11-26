import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import apiConnector from 'src/services/api.service'
import {
  LiveSecurityEvent,
  SecurityErrorLogRow,
  SecurityIpIntelligenceRow,
  SecurityLoginEventRow,
  SecurityOverviewResponse,
  SecurityPaginatedResult,
} from 'src/types/apps/securityTypes'

export type SecurityState = {
  overview: SecurityOverviewResponse | null
  overviewLoading: boolean
  ips: SecurityIpIntelligenceRow[]
  ipsTotal: number
  ipsLoading: boolean
  logins: SecurityLoginEventRow[]
  loginsTotal: number
  loginsLoading: boolean
  errors: SecurityErrorLogRow[]
  errorsTotal: number
  errorsLoading: boolean
  liveEvents: LiveSecurityEvent[]
  actionLoadingIp: string | null
}

const initialState: SecurityState = {
  overview: null,
  overviewLoading: false,
  ips: [],
  ipsTotal: 0,
  ipsLoading: false,
  logins: [],
  loginsTotal: 0,
  loginsLoading: false,
  errors: [],
  errorsTotal: 0,
  errorsLoading: false,
  liveEvents: [],
  actionLoadingIp: null,
}

export const fetchSecurityOverview = createAsyncThunk(
  'security/fetchOverview',
  async (days: number = 7) => {
    return await apiConnector.get<SecurityOverviewResponse>('/security/overview', { days })
  }
)

export const fetchSecurityIps = createAsyncThunk(
  'security/fetchIps',
  async (params: {
    search?: string
    countryCode?: string
    blockedOnly?: string
    hasErrors?: string
    page?: number
    limit?: number
  }) => {
    return await apiConnector.get<SecurityPaginatedResult<SecurityIpIntelligenceRow>>(
      '/security/ips',
      params
    )
  }
)

export const refreshSecurityIp = createAsyncThunk(
  'security/refreshIp',
  async (ip: string) => {
    return await apiConnector.post<SecurityIpIntelligenceRow>(
      `/security/ips/${encodeURIComponent(ip)}/refresh`,
      {}
    )
  }
)

export const toggleSecurityIpBlock = createAsyncThunk(
  'security/toggleIpBlock',
  async (payload: { ip: string; blocked: boolean; reason?: string }) => {
    return await apiConnector.patch<SecurityIpIntelligenceRow>(
      `/security/ips/${encodeURIComponent(payload.ip)}/block`,
      { blocked: payload.blocked, reason: payload.reason }
    )
  }
)

export const fetchSecurityLogins = createAsyncThunk(
  'security/fetchLogins',
  async (params: {
    search?: string
    eventType?: string
    page?: number
    limit?: number
  }) => {
    return await apiConnector.get<SecurityPaginatedResult<SecurityLoginEventRow>>(
      '/security/logins',
      params
    )
  }
)

export const fetchSecurityErrors = createAsyncThunk(
  'security/fetchErrors',
  async (params: {
    search?: string
    source?: string
    statusFamily?: string
    page?: number
    limit?: number
  }) => {
    return await apiConnector.get<SecurityPaginatedResult<SecurityErrorLogRow>>(
      '/security/errors',
      params
    )
  }
)

export const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    pushLiveSecurityEvent: (state, action: PayloadAction<LiveSecurityEvent>) => {
      state.liveEvents = [action.payload, ...state.liveEvents].slice(0, 100)
    },
    clearLiveSecurityEvents: state => {
      state.liveEvents = []
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSecurityOverview.pending, state => {
        state.overviewLoading = true
      })
      .addCase(fetchSecurityOverview.fulfilled, (state, action) => {
        state.overviewLoading = false
        state.overview = action.payload
      })
      .addCase(fetchSecurityOverview.rejected, state => {
        state.overviewLoading = false
      })
      .addCase(fetchSecurityIps.pending, state => {
        state.ipsLoading = true
      })
      .addCase(fetchSecurityIps.fulfilled, (state, action) => {
        state.ipsLoading = false
        state.ips = action.payload.items
        state.ipsTotal = action.payload.total
      })
      .addCase(fetchSecurityIps.rejected, state => {
        state.ipsLoading = false
      })
      .addCase(refreshSecurityIp.pending, (state, action) => {
        state.actionLoadingIp = action.meta.arg
      })
      .addCase(refreshSecurityIp.fulfilled, (state, action) => {
        state.actionLoadingIp = null
        if (action.payload) {
          const idx = state.ips.findIndex(item => item.ipAddress === action.payload.ipAddress)
          if (idx >= 0) {
            state.ips[idx] = action.payload
          }
        }
      })
      .addCase(refreshSecurityIp.rejected, state => {
        state.actionLoadingIp = null
      })
      .addCase(toggleSecurityIpBlock.pending, (state, action) => {
        state.actionLoadingIp = action.meta.arg.ip
      })
      .addCase(toggleSecurityIpBlock.fulfilled, (state, action) => {
        state.actionLoadingIp = null
        if (action.payload) {
          const idx = state.ips.findIndex(item => item.ipAddress === action.payload.ipAddress)
          if (idx >= 0) {
            state.ips[idx] = action.payload
          }
        }
      })
      .addCase(toggleSecurityIpBlock.rejected, state => {
        state.actionLoadingIp = null
      })
      .addCase(fetchSecurityLogins.pending, state => {
        state.loginsLoading = true
      })
      .addCase(fetchSecurityLogins.fulfilled, (state, action) => {
        state.loginsLoading = false
        state.logins = action.payload.items
        state.loginsTotal = action.payload.total
      })
      .addCase(fetchSecurityLogins.rejected, state => {
        state.loginsLoading = false
      })
      .addCase(fetchSecurityErrors.pending, state => {
        state.errorsLoading = true
      })
      .addCase(fetchSecurityErrors.fulfilled, (state, action) => {
        state.errorsLoading = false
        state.errors = action.payload.items
        state.errorsTotal = action.payload.total
      })
      .addCase(fetchSecurityErrors.rejected, state => {
        state.errorsLoading = false
      })
  },
})

export const { pushLiveSecurityEvent, clearLiveSecurityEvents } = securitySlice.actions

export default securitySlice.reducer
