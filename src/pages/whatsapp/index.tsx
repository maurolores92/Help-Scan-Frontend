import React from 'react'
import WhatsappInboxView from 'src/views/apps/whatsapp/WhatsappInboxView'

const WhatsappPage = () => {
  return <WhatsappInboxView />
}

WhatsappPage.acl = {
  action: 'read',
  subject: 'whatsapp_inbox'
}

export default WhatsappPage
