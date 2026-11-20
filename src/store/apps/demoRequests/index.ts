import { Dispatch } from 'redux'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiConnector from 'src/services/api.service'
import {
  DemoRequestCounts,
  DemoRequestStatus,
  DemoRequestType
} from 'src/types/apps/demoRequestTypes'

interface ReduxContext {
  getState: any
  dispatch: Dispatch<any>
}

export const fetchDemoRequests = createAsyncThunk(
  'appDemoRequests/fetchAll',
  async (params: { search?: string; status?: DemoRequestStatus | '' } = {}) => {
    const queryParams: Record<string, string> = {}
    if (params.search?.trim()) queryParams.search = params.search.trim()
    if (params.status) queryParams.status = params.status

    const response: any = await apiConnector.get('/demo-requests', queryParams)
    const list: DemoRequestType[] = Array.isArray(response) ? response : response?.data || []

    return {
      data: list,
      total: response?.total ?? list.length,
      counts: response?.counts || {
        ALL: list.length,
        RECIBIDO: 0,
        CONTACTADO: 0,
        INTERESADO: 0,
        VENDIDO: 0,
        RECHAZADO: 0
      },
      params
    }
  }
)

export const updateDemoRequestStatus = createAsyncThunk(
  'appDemoRequests/updateStatus',
  async (
    { id, status, notes }: { id: number; status: DemoRequestStatus; notes?: string },
    { getState, dispatch }: ReduxContext
  ) => {
    const payload: Record<string, any> = { status }
    if (notes !== undefined) payload.notes = notes

    const response = await apiConnector.patch<DemoRequestType>(
      `/demo-requests/${id}/status`,
      payload
    )
    await dispatch(fetchDemoRequests(getState().demoRequests.params))

    return response
  }
)

export const deleteDemoRequest = createAsyncThunk(
  'appDemoRequests/delete',
  async (id: number, { getState, dispatch }: ReduxContext) => {
    const response = await apiConnector.remove(`/demo-requests/${id}`)
    await dispatch(fetchDemoRequests(getState().demoRequests.params))

    return response
  }
)

interface DemoRequestsState {
  data: DemoRequestType[]
  total: number
  counts: DemoRequestCounts
  loading: boolean
  updatingId: number | null
  params: { search?: string; status?: DemoRequestStatus | '' }
}

const initialState: DemoRequestsState = {
  data: [],
  total: 0,
  counts: {
    ALL: 0,
    RECIBIDO: 0,
    CONTACTADO: 0,
    INTERESADO: 0,
    VENDIDO: 0,
    RECHAZADO: 0
  },
  loading: false,
  updatingId: null,
  params: {}
}

export const appDemoRequestsSlice = createSlice({
  name: 'appDemoRequests',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchDemoRequests.pending, state => {
        state.loading = true
      })
      .addCase(fetchDemoRequests.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload.data
        state.total = action.payload.total
        state.counts = action.payload.counts
        state.params = action.payload.params
      })
      .addCase(fetchDemoRequests.rejected, state => {
        state.loading = false
      })
      .addCase(updateDemoRequestStatus.pending, (state, action) => {
        state.updatingId = action.meta.arg.id
      })
      .addCase(updateDemoRequestStatus.fulfilled, state => {
        state.updatingId = null
      })
      .addCase(updateDemoRequestStatus.rejected, state => {
        state.updatingId = null
      })
  }
})

export default appDemoRequestsSlice.reducer
