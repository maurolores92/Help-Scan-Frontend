// ** Redux Imports
import { Dispatch } from 'redux'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** API Connector
import apiConnector from 'src/services/api.service'

interface DataParams {
  q: string
  role: string
  status: string
  currentPlan: string
  companyId?: number
}

interface Redux {
  getState: any
  dispatch: Dispatch<any>
}

// ** Fetch Users
export const fetchData = createAsyncThunk('appUsers/fetchData', async (params: DataParams) => {
  // El backend en /users procesa paginación: { page, pageSize, search, roleId }
  const apiParams: any = {
    page: 0,
    pageSize: 100, // Ajustar según paginación
  }
  
  if (params.q) apiParams.search = params.q
  if (params.role) apiParams.roleId = params.role
  if (params.status) apiParams.status = params.status
  if (params.companyId) apiParams.companyId = params.companyId

  const response = await apiConnector.get<any>('/users', apiParams)
  
  const usersData = response?.data || []

  return {
    users: usersData,
    total: response?.total || 0,
    params,
    allData: usersData
  }
})

const extractApiErrorMessage = (err: any, fallback: string): string => {
  const msg = err?.response?.data?.message
  if (Array.isArray(msg) && msg.length > 0) {
    return msg.join(', ')
  }

  return (typeof msg === 'string' && msg) || err?.message || fallback
}

const refreshUsersIfLoaded = (getState: () => any, dispatch: Dispatch<any>) => {
  const userState = getState()?.user
  if (userState && Array.isArray(userState.data) && userState.data.length > 0 && userState.params) {
    try {
      dispatch(fetchData(userState.params))
    } catch (e) {}
  }
}

// ** Add User
export const addUser = createAsyncThunk(
  'appUsers/addUser',
  async (data: any, { getState, dispatch, rejectWithValue }: Redux & { rejectWithValue: any }) => {
    try {
      const response = await apiConnector.post('/users', data)
      refreshUsersIfLoaded(getState, dispatch)

      return response
    } catch (err: any) {
      return rejectWithValue(extractApiErrorMessage(err, 'Error al crear el usuario'))
    }
  }
)

// ** Update User
export const updateUser = createAsyncThunk(
  'appUsers/updateUser',
  async (
    { id, data }: { id: number | string; data: any },
    { getState, dispatch, rejectWithValue }: Redux & { rejectWithValue: any }
  ) => {
    try {
      const response = await apiConnector.put(`/users/${id}`, data)
      refreshUsersIfLoaded(getState, dispatch)

      return response
    } catch (err: any) {
      return rejectWithValue(extractApiErrorMessage(err, 'Error al actualizar el usuario'))
    }
  }
)

// ** Change User Password
export const changeUserPassword = createAsyncThunk(
  'appUsers/changeUserPassword',
  async (
    { id, data }: { id: number | string; data: any },
    { getState, dispatch, rejectWithValue }: Redux & { rejectWithValue: any }
  ) => {
    try {
      const response = await apiConnector.put(`/users/${id}/change-password`, data)
      refreshUsersIfLoaded(getState, dispatch)

      return response
    } catch (err: any) {
      return rejectWithValue(extractApiErrorMessage(err, 'Error al cambiar la contraseña'))
    }
  }
)

// ** Update User Signature
export const updateUserSignature = createAsyncThunk(
  'appUsers/updateUserSignature',
  async ({ id, data }: { id: number | string; data: { signature: string | null } }, { getState, dispatch }: Redux) => {
    const response = await apiConnector.put(`/users/${id}/signature`, data)
    refreshUsersIfLoaded(getState, dispatch)

    return response
  }
)

// ** Delete User
export const deleteUser = createAsyncThunk(
  'appUsers/deleteUser',
  async (id: number | string, { getState, dispatch }: Redux) => {
    const response = await apiConnector.remove(`/users/${id}`)
    refreshUsersIfLoaded(getState, dispatch)

    return response
  }
)

export const appUsersSlice = createSlice({
  name: 'appUsers',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: []
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchData.fulfilled, (state, action) => {
      state.data = action.payload.users
      state.total = action.payload.total
      state.params = action.payload.params
      state.allData = action.payload.allData
    })
  }
})

export default appUsersSlice.reducer
