import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiConnector from 'src/services/api.service'
import {
  ClientDocumentItem,
  ClientDocumentsResponse,
  ClientDocumentsSummary,
  ClientFormPayload,
  ClientItem,
  FetchClientDocumentsParams,
  FetchClientsParams
} from 'src/types/apps/clientTypes'

export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (params: FetchClientsParams = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    )
    const response: any = await apiConnector.get('/clients', cleanParams)

    return response
  }
)

export const fetchClientById = createAsyncThunk(
  'clients/fetchClientById',
  async (id: number) => {
    const response: ClientItem = await apiConnector.get(`/clients/${id}`)

    return response
  }
)

export const fetchClientDocuments = createAsyncThunk(
  'clients/fetchClientDocuments',
  async ({ id, ...params }: FetchClientDocumentsParams) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    )
    const response: ClientDocumentsResponse = await apiConnector.get(`/clients/${id}/documents`, cleanParams)

    return response
  }
)

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (payload: ClientFormPayload) => {
    const response: any = await apiConnector.post('/clients', payload)

    return response
  }
)

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ id, data }: { id: number; data: Partial<ClientFormPayload> }) => {
    const response: any = await apiConnector.patch(`/clients/${id}`, data)

    return response
  }
)

export const syncClientDocuments = createAsyncThunk(
  'clients/syncClientDocuments',
  async (id: number) => {
    const response: any = await apiConnector.post(`/clients/${id}/sync-documents`, {})

    return response
  }
)

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (id: number) => {
    const response: any = await apiConnector.remove(`/clients/${id}`)

    return { id, ...response }
  }
)

export const appClientsSlice = createSlice({
  name: 'clients',
  initialState: {
    data: [] as ClientItem[],
    total: 0,
    selectedClient: null as ClientItem | null,
    clientDocuments: [] as ClientDocumentItem[],
    clientDocumentsTotal: 0,
    clientDocumentsSummary: null as ClientDocumentsSummary | null,
    loadingClientDocuments: false,
    loading: false,
    saving: false,
    loadingDetail: false,
    error: null as string | null
  },
  reducers: {
    clearSelectedClient: state => {
      state.selectedClient = null
      state.clientDocuments = []
      state.clientDocumentsTotal = 0
      state.clientDocumentsSummary = null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchClients.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchClients.fulfilled, (state, action: any) => {
        state.loading = false
        state.data = action.payload?.data || []
        state.total = action.payload?.meta?.totalItems || 0
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar clientes'
      })
      .addCase(fetchClientById.pending, state => {
        state.loadingDetail = true
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.loadingDetail = false
        state.selectedClient = action.payload
      })
      .addCase(fetchClientById.rejected, state => {
        state.loadingDetail = false
      })
      .addCase(fetchClientDocuments.pending, state => {
        state.loadingClientDocuments = true
      })
      .addCase(fetchClientDocuments.fulfilled, (state, action) => {
        state.loadingClientDocuments = false
        state.selectedClient = action.payload.client
        state.clientDocuments = action.payload.data || []
        state.clientDocumentsTotal = action.payload.meta?.totalItems || 0
        state.clientDocumentsSummary = action.payload.summary || null
      })
      .addCase(fetchClientDocuments.rejected, state => {
        state.loadingClientDocuments = false
      })
      .addCase(createClient.pending, state => {
        state.saving = true
      })
      .addCase(createClient.fulfilled, state => {
        state.saving = false
      })
      .addCase(createClient.rejected, state => {
        state.saving = false
      })
      .addCase(updateClient.pending, state => {
        state.saving = true
      })
      .addCase(updateClient.fulfilled, state => {
        state.saving = false
      })
      .addCase(updateClient.rejected, state => {
        state.saving = false
      })
  }
})

export const { clearSelectedClient } = appClientsSlice.actions

export default appClientsSlice.reducer
