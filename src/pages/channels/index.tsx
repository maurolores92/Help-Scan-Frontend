import React from 'react'
import ChannelsConfigView from 'src/views/apps/channels/ChannelsConfigView'

const ChannelsPage = () => {
  return <ChannelsConfigView />
}

ChannelsPage.acl = {
  action: 'read',
  subject: 'channels'
}

export default ChannelsPage
