import { SecurityMonitoringView } from 'src/views/apps/security/SecurityMonitoringView'

const SecurityPage = () => {
  return <SecurityMonitoringView />
}

SecurityPage.acl = {
  action: 'manage',
  subject: 'security',
}

export default SecurityPage
