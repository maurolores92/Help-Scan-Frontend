import React from 'react'
import TelegramInboxView from 'src/views/apps/telegram/TelegramInboxView'

const TelegramPage = () => {
  return <TelegramInboxView />
}

TelegramPage.acl = {
  action: 'read',
  subject: 'telegram_inbox'
}

export default TelegramPage
