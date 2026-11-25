import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import toast from 'react-hot-toast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { AppDispatch, RootState } from 'src/store'
import {
  clearSelectedClient,
  fetchClientDocuments,
  syncClientDocuments,
  updateClient
} from 'src/store/apps/clients'
import {
  DocumentItem,
  fetchDocumentById,
  rejectDocument,
  reprocessDocument,
  validateDocument,
  ValidateDocumentPayload
} from 'src/store/apps/documents'
import { ClientDocumentItem, ClientFormPayload } from 'src/types/apps/clientTypes'
import PdfViewerModal from 'src/components/documents/PdfViewerModal'
import DocumentValidationModal from 'src/components/documents/DocumentValidationModal'
import ManualDocumentLinkDialog from 'src/components/documents/ManualDocumentLinkDialog'
import ClientFormDialog from '../ClientFormDialog'
import ClientDetailHeaderCard from './ClientDetailHeaderCard'
import ClientAccountStatementCard from './ClientAccountStatementCard'
import ClientDetailDocumentsPanel from './ClientDetailDocumentsPanel'

export const ClientDetailView = ({ clientId }: { clientId: number }) => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const ability = useContext(AbilityContext)

  const {
    selectedClient,
    clientDocuments,
    clientDocumentsTotal,
    clientDocumentsSummary,
    loadingClientDocuments,
    saving
  } = useSelector((state: RootState) => state.clients)
  const { validating, reprocessingId } = useSelector((state: RootState) => state.documents)

  const [activeType, setActiveType] = useState('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'issuer' | 'recipient' | 'linked'>('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [linkStateFilter, setLinkStateFilter] = useState<'all' | 'linked' | 'unlinked'>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(15)

  const [editOpen, setEditOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null)
  const [validatingDoc, setValidatingDoc] = useState<DocumentItem | null>(null)
  const [linkingDoc, setLinkingDoc] = useState<ClientDocumentItem | null>(null)

  const canUpdate = ability.can('update', 'clients')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(0)
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    return () => {
      dispatch(clearSelectedClient())
    }
  }, [dispatch])

  const loadClientDetail = useCallback(() => {
    if (!Number.isInteger(clientId) || clientId <= 0) return
    dispatch(
      fetchClientDocuments({
        id: clientId,
        documentType: activeType,
        role: roleFilter,
        paymentStatus: paymentFilter === 'all' ? undefined : paymentFilter,
        linkState: linkStateFilter === 'all' ? undefined : linkStateFilter,
        search: debouncedSearch,
        page: page + 1,
        limit: pageSize
      })
    )
  }, [dispatch, clientId, activeType, roleFilter, paymentFilter, linkStateFilter, debouncedSearch, page, pageSize])

  useEffect(() => {
    loadClientDetail()
  }, [loadClientDetail])

  const handleSync = async () => {
    try {
      setSyncing(true)
      const res: any = await dispatch(syncClientDocuments(clientId)).unwrap()
      toast.success(res?.message || 'Sincronización completada')
      loadClientDetail()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const handleEditSubmit = async (payload: ClientFormPayload) => {
    try {
      const res: any = await dispatch(updateClient({ id: clientId, data: payload })).unwrap()
      toast.success(res?.message || 'Cliente actualizado')
      setEditOpen(false)
      loadClientDetail()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al actualizar cliente')
    }
  }

  const openFullDocument = async (row: ClientDocumentItem, mode: 'preview' | 'validate') => {
    try {
      const fullDoc = await dispatch(fetchDocumentById(row.id)).unwrap()
      if (mode === 'preview') setPreviewDoc(fullDoc)
      else setValidatingDoc(fullDoc)
    } catch {
      toast.error('No se pudo cargar el detalle completo del comprobante')
    }
  }

  const handleValidate = async (payload: ValidateDocumentPayload) => {
    try {
      await dispatch(validateDocument(payload)).unwrap()
      toast.success('Documento validado correctamente')
      setValidatingDoc(null)
      loadClientDetail()
    } catch (err: any) {
      toast.error(err?.message || 'Error al validar el documento')
    }
  }

  const handleReject = async (id: number, reason: string) => {
    try {
      await dispatch(rejectDocument({ id, reason })).unwrap()
      toast.success('Documento rechazado')
      setValidatingDoc(null)
      loadClientDetail()
    } catch (err: any) {
      toast.error(err?.message || 'Error al rechazar el documento')
    }
  }

  const handleReprocess = async (doc: DocumentItem) => {
    try {
      await dispatch(reprocessDocument(doc.id)).unwrap()
      toast.success(`Reprocesamiento iniciado para '${doc.originalName}'`)
      const refreshed = await dispatch(fetchDocumentById(doc.id)).unwrap().catch(() => null)
      if (refreshed) setValidatingDoc(refreshed)
      loadClientDetail()
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo reprocesar el documento')
    }
  }

  if (loadingClientDocuments && !selectedClient) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!selectedClient) {
    return (
      <Alert
        severity='warning'
        action={
          <Button color='inherit' size='small' onClick={() => router.push('/clients')}>
            Volver a Clientes
          </Button>
        }
      >
        No se encontró el cliente solicitado en tu compañía.
      </Alert>
    )
  }

  return (
    <Box>
      <ClientDetailHeaderCard
        client={selectedClient}
        summary={clientDocumentsSummary}
        canUpdate={canUpdate}
        syncing={syncing}
        onBack={() => router.push('/clients')}
        onEdit={() => setEditOpen(true)}
        onSync={handleSync}
      />

      <ClientAccountStatementCard
        statement={clientDocumentsSummary?.accountStatement}
        onFilterPendingInvoices={() => {
          setActiveType('factura')
          setPaymentFilter('UNPAID_OR_PARTIAL')
          setLinkStateFilter('all')
          setPage(0)
        }}
        onFilterUnlinkedPayments={() => {
          setActiveType('recibo')
          setPaymentFilter('all')
          setLinkStateFilter('all')
          setPage(0)
        }}
        onFilterUnbilledRemitos={() => {
          setActiveType('remito')
          setPaymentFilter('all')
          setLinkStateFilter('unlinked')
          setPage(0)
        }}
      />

      <ClientDetailDocumentsPanel
        documents={clientDocuments}
        total={clientDocumentsTotal}
        summary={clientDocumentsSummary}
        loading={loadingClientDocuments}
        activeType={activeType}
        roleFilter={roleFilter}
        paymentFilter={paymentFilter}
        linkStateFilter={linkStateFilter}
        searchInput={searchInput}
        page={page}
        pageSize={pageSize}
        onTypeChange={nextType => {
          setActiveType(nextType)
          setPage(0)
        }}
        onRoleChange={nextRole => {
          setRoleFilter(nextRole)
          setPage(0)
        }}
        onPaymentFilterChange={nextPayment => {
          setPaymentFilter(nextPayment)
          setPage(0)
        }}
        onLinkStateChange={nextLink => {
          setLinkStateFilter(nextLink)
          setPage(0)
        }}
        onSearchChange={val => setSearchInput(val)}
        onPageChange={(nextPage, nextPageSize) => {
          setPage(nextPage)
          setPageSize(nextPageSize)
        }}
        onPreviewPdf={doc => openFullDocument(doc, 'preview')}
        onOpenValidation={doc => openFullDocument(doc, 'validate')}
        onOpenLinkDialog={doc => setLinkingDoc(doc)}
      />

      <ClientFormDialog
        open={editOpen}
        client={selectedClient}
        saving={saving}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <PdfViewerModal
        open={Boolean(previewDoc)}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onReprocess={handleReprocess}
        reprocessing={Boolean(previewDoc && reprocessingId === previewDoc.id)}
      />

      <DocumentValidationModal
        open={Boolean(validatingDoc)}
        document={validatingDoc}
        onClose={() => setValidatingDoc(null)}
        onValidate={handleValidate}
        onReject={handleReject}
        isValidating={validating}
        onReprocess={handleReprocess}
        reprocessing={Boolean(validatingDoc && reprocessingId === validatingDoc.id)}
        onLinksUpdated={loadClientDetail}
      />

      <ManualDocumentLinkDialog
        open={Boolean(linkingDoc)}
        sourceDocument={linkingDoc}
        clientId={clientId}
        onClose={() => setLinkingDoc(null)}
        onLinked={loadClientDetail}
      />
    </Box>
  )
}

export default ClientDetailView
