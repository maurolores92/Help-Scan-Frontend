import React from 'react'
import EmailsInboxView from 'src/views/apps/emails/EmailsInboxView'

const EmailsPage = () => {
  return <EmailsInboxView />
}

EmailsPage.acl = {
  action: 'read',
  subject: 'email_inbox'
}

export default EmailsPage
