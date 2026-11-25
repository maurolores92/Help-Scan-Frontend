// ** Toolkit imports
import { configureStore } from '@reduxjs/toolkit'

// ** Reducers
import user from 'src/store/apps/user'
import calendar from 'src/store/apps/calendar'
import permissions from 'src/store/apps/permissions'
import notifications from 'src/store/apps/notifications'
import documents from 'src/store/apps/documents'
import ftpDevices from 'src/store/apps/ftpDevices'
import plans from 'src/store/apps/plans'
import channels from 'src/store/apps/channels'
import clients from 'src/store/apps/clients'
import demoRequests from 'src/store/apps/demoRequests'

export const store = configureStore({
  reducer: {
    user,
    calendar,
    permissions,
    notifications,
    documents,
    ftpDevices,
    plans,
    channels,
    clients,
    demoRequests
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
