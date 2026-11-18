import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiConnector from 'src/services/api.service'
import {
  CreateFtpDevicePayload,
  FtpCredentialsPayload,
  FtpDeviceItem,
  FtpServerInfo,
  UpdateFtpDevicePayload
} from 'src/types/apps/ftpDeviceTypes'

export interface FtpDevicesState {
  devices: FtpDeviceItem[]
  serverInfo: FtpServerInfo | null
  quotaSummary: any | null
  loading: boolean
  submitting: boolean
  error: string | null
}

const initialState: FtpDevicesState = {
  devices: [],
  serverInfo: null,
  quotaSummary: null,
  loading: false,
  submitting: false,
  error: null
}

export const fetchFtpDevices = createAsyncThunk(
  'ftpDevices/fetchAll',
  async (companyId?: number) => {
    const query = companyId ? `?companyId=${companyId}` : ''
    const response = await apiConnector.get(`/ftp-devices${query}`)
    
return response
  }
)

export const createFtpDevice = createAsyncThunk(
  'ftpDevices/create',
  async (payload: CreateFtpDevicePayload) => {
    const response = await apiConnector.post('/ftp-devices', payload)
    
return response as { device: FtpDeviceItem; credentials: FtpCredentialsPayload; syncResult: any }
  }
)

export const updateFtpDevice = createAsyncThunk(
  'ftpDevices/update',
  async ({ id, data }: { id: number; data: UpdateFtpDevicePayload }) => {
    const response = await apiConnector.patch(`/ftp-devices/${id}`, data)
    
return response as { device: FtpDeviceItem; rotatedPassword?: string; syncResult: any }
  }
)

export const deleteFtpDevice = createAsyncThunk(
  'ftpDevices/delete',
  async (id: number) => {
    const response = await apiConnector.remove(`/ftp-devices/${id}`)
    
return { id, response }
  }
)

export const syncFtpDevice = createAsyncThunk(
  'ftpDevices/sync',
  async (id: number) => {
    const response = await apiConnector.post(`/ftp-devices/${id}/sync`, {})
    
return response
  }
)

export const scanFtpDeviceInbox = createAsyncThunk(
  'ftpDevices/scanInbox',
  async (id: number) => {
    const response = await apiConnector.post(`/ftp-devices/${id}/scan-inbox`, {})
    
return response
  }
)

export const fetchFtpDeviceCredentials = createAsyncThunk(
  'ftpDevices/credentials',
  async (id: number) => {
    const response = await apiConnector.get(`/ftp-devices/${id}/credentials`)
    
return response as FtpCredentialsPayload
  }
)

const ftpDevicesSlice = createSlice({
  name: 'ftpDevices',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchFtpDevices.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFtpDevices.fulfilled, (state, action: any) => {
        state.loading = false
        state.devices = action.payload?.devices || []
        state.serverInfo = action.payload?.serverInfo || null
        state.quotaSummary = action.payload?.quotaSummary || null
      })
      .addCase(fetchFtpDevices.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar equipos FTP'
      })
      .addCase(createFtpDevice.pending, state => {
        state.submitting = true
      })
      .addCase(createFtpDevice.fulfilled, state => {
        state.submitting = false
      })
      .addCase(createFtpDevice.rejected, state => {
        state.submitting = false
      })
      .addCase(updateFtpDevice.pending, state => {
        state.submitting = true
      })
      .addCase(updateFtpDevice.fulfilled, state => {
        state.submitting = false
      })
      .addCase(updateFtpDevice.rejected, state => {
        state.submitting = false
      })
  }
})

export default ftpDevicesSlice.reducer
