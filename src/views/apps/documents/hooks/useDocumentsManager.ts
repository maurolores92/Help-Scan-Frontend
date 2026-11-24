import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { AppDispatch, RootState } from 'src/store'
import {
  deleteDocument,
  deleteMultipleDocuments,
  DocumentExportFormat,
  DocumentItem,
  DocumentPaymentStatus,
  exportFilteredDocuments,
  fetchDocumentById,
  fetchDocumentFacets,
  fetchDocuments,
  reprocessDocument,
  syncFtpDocuments,
  updateDocumentPaymentStatus,
  uploadMultipleDocuments,
  validateDocument,
  rejectDocument,
  ValidateDocumentPayload
} from 'src/store/apps/documents'
import { fetchMyCompanyQuota } from 'src/store/apps/plans'

export const useDocumentsManager = () => {
  const dispatch = useDispatch<AppDispatch>()
  const {
    data,
    facets,
    statusFacets,
    departmentFacets,
    total,
    loading,
    uploading,
    syncingFtp,
    validating,
    reprocessingId
  } = useSelector((state: RootState) => state.documents)
  const { myQuota } = useSelector((state: RootState) => state.plans)
  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[0]
  )

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [showUpload, setShowUpload] = useState(false)

  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null)
  const [validatingDoc, setValidatingDoc] = useState<DocumentItem | null>(null)
  const [paymentDoc, setPaymentDoc] = useState<DocumentItem | null>(null)
  const [updatingPayment, setUpdatingPayment] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<DocumentExportFormat | null>(null)
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const lastHandledNotifId = useRef<number | null>(latestNotification?.id ?? null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(0)
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput])

  const resolvedPaymentParams =
    paymentFilter === 'OVERDUE' || paymentFilter === 'DUE_SOON'
      ? { paymentStatus: '', dueFilter: paymentFilter }
      : { paymentStatus: paymentFilter, dueFilter: '' }

  const loadData = useCallback(() => {
    dispatch(
      fetchDocuments({
        page: page + 1,
        limit: pageSize,
        search: debouncedSearch,
        documentType,
        purchaseOrderNumber,
        dateFrom,
        dateTo,
        status,
        paymentStatus: resolvedPaymentParams.paymentStatus,
        dueFilter: resolvedPaymentParams.dueFilter,
        source
      })
    )
    dispatch(fetchDocumentFacets(undefined))
    dispatch(fetchMyCompanyQuota())
  }, [
    dispatch,
    page,
    pageSize,
    debouncedSearch,
    documentType,
    purchaseOrderNumber,
    dateFrom,
    dateTo,
    status,
    resolvedPaymentParams.paymentStatus,
    resolvedPaymentParams.dueFilter,
    source
  ])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresco en vivo vía WebSocket al recibir eventos document.uploaded / document.processed / document.error
  useEffect(() => {
    if (!latestNotification || latestNotification.id === lastHandledNotifId.current) return
    lastHandledNotifId.current = latestNotification.id

    if (latestNotification.type?.startsWith('document.')) {
      loadData()
    }
  }, [latestNotification, loadData])

  // Sincronizar datos del modal si el documento abierto termina de procesarse
  useEffect(() => {
    if (!previewDoc) return
    const updatedInList = data.find(item => item.id === previewDoc.id)
    if (updatedInList && updatedInList.status !== previewDoc.status) {
      setPreviewDoc(prev => (prev ? { ...prev, ...updatedInList } : null))
    }
  }, [data, previewDoc])

  const handleResetFilters = () => {
    setSearchInput('')
    setDebouncedSearch('')
    setDocumentType('')
    setPurchaseOrderNumber('')
    setDateFrom('')
    setDateTo('')
    setStatus('')
    setPaymentFilter('')
    setSource('')
    setPage(0)
    setSelectedRowIds([])
  }

  const handleUpdatePaymentStatus = async (payload: {
    id: number
    paymentStatus: DocumentPaymentStatus
    paidAt?: string | null
    paymentReference?: string | null
  }) => {
    try {
      setUpdatingPayment(true)
      await dispatch(updateDocumentPaymentStatus(payload)).unwrap()
      toast.success('Estado de pago actualizado')
      setPaymentDoc(null)
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar estado de pago')
    } finally {
      setUpdatingPayment(false)
    }
  }

  const handleExport = async (format: DocumentExportFormat) => {
    try {
      setExportingFormat(format)
      await exportFilteredDocuments({
        format,
        search: debouncedSearch,
        documentType,
        purchaseOrderNumber,
        dateFrom,
        dateTo,
        status,
        paymentStatus: resolvedPaymentParams.paymentStatus,
        dueFilter: resolvedPaymentParams.dueFilter,
        source,
        ids: selectedRowIds.length > 0 ? selectedRowIds : undefined
      })
      toast.success(`Exportación ${format.toUpperCase()} generada correctamente`)
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo generar la exportación')
    } finally {
      setExportingFormat(null)
    }
  }

  const handleValidate = async (payload: ValidateDocumentPayload) => {
    try {
      await dispatch(validateDocument(payload)).unwrap()
      toast.success('Documento validado y confirmado exitosamente')
      setValidatingDoc(null)
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Error al validar el documento')
    }
  }

  const handleReject = async (id: number, reason: string) => {
    try {
      await dispatch(rejectDocument({ id, reason })).unwrap()
      toast.success('Documento marcado como rechazado')
      setValidatingDoc(null)
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Error al rechazar el documento')
    }
  }

  const handleUpload = async (files: File[] | File) => {
    const fileList = Array.isArray(files) ? files : [files]
    if (fileList.length === 0) return

    try {
      const formData = new FormData()
      fileList.forEach(f => {
        formData.append('files', f)
      })

      const res: any = await dispatch(uploadMultipleDocuments(formData)).unwrap()

      if (res?.failedCount > 0 && res?.successCount > 0) {
        toast.success(`Se subieron ${res.successCount} de ${res.total} documento(s) correctamente`)
        const errorDetails = res.errors?.map((e: any) => `${e.fileName}: ${e.reason}`).join(' | ')
        toast.error(`${res.failedCount} archivo(s) omitido(s): ${errorDetails}`, { duration: 6000 })
      } else if (res?.failedCount > 0 && res?.successCount === 0) {
        const errorMsg = res.errors?.[0]?.reason || 'Error al procesar los archivos'
        toast.error(`No se pudo subir ningún archivo: ${errorMsg}`)
      } else {
        const count = res?.successCount ?? fileList.length
        toast.success(
          count === 1
            ? 'PDF subido e ingresado a la cola de extracción OCR'
            : `Se subieron ${count} documentos PDF e ingresaron a la cola de extracción OCR`
        )
      }

      setShowUpload(false)
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Error al subir los archivos PDF')
    }
  }

  const handleSyncFtp = async () => {
    try {
      const res: any = await dispatch(syncFtpDocuments(undefined)).unwrap()
      if (res?.quotaReached) {
        toast.error(
          `Bandeja sincronizó ${res?.syncedCount || 0} archivo(s), pero ${res?.skippedByQuotaCount || 0} pasaron a cuarentena por límite de plan.`
        )
      } else {
        const count = res?.syncedCount ?? res?.imported ?? 0
        toast.success(`Bandeja sincronizada: ${count} nuevo(s) PDF(s) en procesamiento IA`)
      }
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Error al sincronizar bandeja SFTP / local')
    }
  }

  const handleReprocess = async (doc: DocumentItem) => {
    try {
      await dispatch(reprocessDocument(doc.id)).unwrap()
      toast.success(`Reprocesando '${doc.originalName}' con motor OCR...`)
      loadData()
      setTimeout(async () => {
        try {
          const refreshed = await dispatch(fetchDocumentById(doc.id)).unwrap()
          if (refreshed) {
            if (validatingDoc?.id === doc.id) {
              setValidatingDoc(refreshed)
            }
            if (previewDoc?.id === doc.id) {
              setPreviewDoc(refreshed)
            }
          }
        } catch {}
      }, 1500)
    } catch (err: any) {
      toast.error(err?.message || 'Error al reprocesar el documento')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return
    try {
      setIsDeleting(true)
      await dispatch(deleteDocument(docToDelete.id)).unwrap()
      toast.success('Documento eliminado correctamente')
      setDocToDelete(null)
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar el documento')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    if (selectedRowIds.length === 0) return
    try {
      setIsBulkDeleting(true)
      const res: any = await dispatch(deleteMultipleDocuments(selectedRowIds)).unwrap()
      const count = res?.count ?? selectedRowIds.length
      toast.success(
        count === 1
          ? '1 documento eliminado correctamente'
          : `${count} documentos eliminados correctamente`
      )
      setSelectedRowIds([])
      setIsBulkDeleteOpen(false)
      loadData()
    } catch (err: any) {
      try {
        await Promise.all(selectedRowIds.map(id => dispatch(deleteDocument(id)).unwrap()))
        toast.success(`${selectedRowIds.length} documentos eliminados correctamente`)
        setSelectedRowIds([])
        setIsBulkDeleteOpen(false)
        loadData()
      } catch (fallbackErr: any) {
        toast.error(err?.message || fallbackErr?.message || 'Error al eliminar los documentos seleccionados')
      }
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const hasActiveFilters = Boolean(
    searchInput || documentType || purchaseOrderNumber || dateFrom || dateTo || source || paymentFilter
  )

  return {
    data,
    facets,
    statusFacets,
    departmentFacets,
    total,
    loading,
    uploading,
    syncingFtp,
    validating,
    reprocessingId,
    myQuota,
    searchInput,
    setSearchInput,
    documentType,
    setDocumentType,
    purchaseOrderNumber,
    setPurchaseOrderNumber,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    status,
    setStatus,
    paymentFilter,
    setPaymentFilter,
    source,
    setSource,
    page,
    setPage,
    pageSize,
    setPageSize,
    showUpload,
    setShowUpload,
    previewDoc,
    setPreviewDoc,
    validatingDoc,
    setValidatingDoc,
    paymentDoc,
    setPaymentDoc,
    updatingPayment,
    exportingFormat,
    docToDelete,
    setDocToDelete,
    isDeleting,
    selectedRowIds,
    setSelectedRowIds,
    isBulkDeleting,
    isBulkDeleteOpen,
    setIsBulkDeleteOpen,
    hasActiveFilters,
    handleResetFilters,
    handleUpload,
    handleSyncFtp,
    handleReprocess,
    handleDeleteConfirm,
    handleBulkDeleteConfirm,
    handleValidate,
    handleReject,
    handleUpdatePaymentStatus,
    handleExport
  }
}

