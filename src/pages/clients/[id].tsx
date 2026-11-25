import { useRouter } from 'next/router'
import ClientDetailView from 'src/views/apps/clients/detail/ClientDetailView'

const ClientDetailPage = () => {
  const router = useRouter()
  const rawId = Number(router.query.id)

  if (!router.isReady || !Number.isInteger(rawId) || rawId <= 0) {
    return null
  }

  return <ClientDetailView clientId={rawId} />
}

ClientDetailPage.acl = {
  action: 'read',
  subject: 'clients'
}

export default ClientDetailPage
