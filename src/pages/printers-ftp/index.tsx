// ** React Imports
import React from 'react'

// ** Custom Views
import FtpDevicesView from 'src/views/apps/ftp-devices/FtpDevicesView'

const PrintersFtpPage = () => {
  return <FtpDevicesView />
}

PrintersFtpPage.acl = {
  action: 'read',
  subject: 'ftp_devices'
}

export default PrintersFtpPage

