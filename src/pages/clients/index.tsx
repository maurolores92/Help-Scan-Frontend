import ClientsListView from 'src/views/apps/clients/ClientsListView'

const ClientsPage = () => <ClientsListView />

ClientsPage.acl = {
  action: 'read',
  subject: 'clients'
}

export default ClientsPage
