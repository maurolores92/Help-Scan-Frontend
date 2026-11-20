// ** React Imports
import React from 'react'

// ** Custom Views
import DemosListView from 'src/views/apps/demos/list/DemosListView'

const DemosPage = () => {
  return <DemosListView />
}

DemosPage.acl = {
  action: 'manage',
  subject: 'demos'
}

export default DemosPage
