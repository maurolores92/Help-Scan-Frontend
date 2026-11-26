import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { useNotificationSocket } from 'src/context/NotificationContext'
import { AppDispatch, RootState } from 'src/store'
import {
  deleteDocument,
  deleteMultipleDocuments,
  DocumentExportFormat,
  DocumentItem,
  exportFilteredDocuments,
  fetchDocumentById,
  fetchDocumentFacets,
  fetchDocuments,
  fetchDocumentUploaders,
  reprocessDocument,
  syncFtpDocuments,
  uploadMultipleDocuments,
  validateDocument,
  rejectDocument,
  ValidateDocumentPayload
} from 'src/store/apps/documents'
import { fetchMyCompanyQuota } from 'src/store/apps/plans'

export const useDocumentsManager = () => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const {
    data,
    facets,
    statusFacets,
    departmentFacets,
    uploaders,
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
  const { socket } = useNotificationSocket()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [userIdFilter, setUserIdFilter] = useState<number | ''>('')
  const [clientIdFilter, setClientIdFilter] = useState<number | undefined>(() => {
    const raw = Number(router.query.clientId)

    return Number.isInteger(raw) && raw > 0 ? raw : undefined
  })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [showUpload, setShowUpload] = useState(false)

  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null)
  const [validatingDoc, setValidatingDoc] = useState<DocumentItem | null>(null)
  const [exportingFormat, setExportingFormat] = useState<DocumentExportFormat | null>(null)
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const lastHandledNotifId = useRef<number | null>(latestNotification?.id ?? null)

  useEffect(() => {
    const raw = Number(router.query.clientId)
    const nextClientId = Number.isInteger(raw) && raw > 0 ? raw : undefined
    setClientIdFilter(prev => {
      if (prev === nextClientId) return prev
      setPage(0)

      return nextClientId
    })
  }, [router.query.clientId])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(0)
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    dispatch(fetchDocumentUploaders())
  }, [dispatch])

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
        source,
        userId: userIdFilter || undefined,
        clientId: clientIdFilter
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
    source,
    userIdFilter,
    clientIdFilter
  ])

  useEffect(() => {
    loadData()
  }, [loadData])

  const realtimeRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshOpenDocumentModal = useCallback(
    (eventDocId?: number) => {
      const notifDocId = Number(eventDocId || 0)
      const targetId =
        validatingDoc?.id && (!notifDocId || notifDocId === validatingDoc.id)
          ? validatingDoc.id
          : previewDoc?.id && (!notifDocId || notifDocId === previewDoc.id)
            ? previewDoc.id
            : 0

      if (targetId > 0) {
        dispatch(fetchDocumentById(targetId))
          .unwrap()
          .then(refreshed => {
            if (!refreshed) return
            if (validatingDoc?.id === targetId) setValidatingDoc(refreshed)
            if (previewDoc?.id === targetId) setPreviewDoc(refreshed)
          })
          .catch(() => null)
      }
    },
    [dispatch, validatingDoc?.id, previewDoc?.id]
  )

  const scheduleRealtimeRefresh = useCallback(
    (eventDocId?: number) => {
      if (realtimeRefreshTimerRef.current) {
        clearTimeout(realtimeRefreshTimerRef.current)
      }
      realtimeRefreshTimerRef.current = setTimeout(() => {
        realtimeRefreshTimerRef.current = null
        loadData()
        refreshOpenDocumentModal(eventDocId)
      }, 150)
    },
    [loadData, refreshOpenDocumentModal]
  )

  useEffect(() => {
    return () => {
      if (realtimeRefreshTimerRef.current) {
        clearTimeout(realtimeRefreshTimerRef.current)
      }
    }
  }, [])

  // Refresco automático directo por WebSocket para escaneos FTP y cambios de cola OCR
  useEffect(() => {
    if (!socket) return

    const handleRealtimeDocumentEvent = (payload: { documentId?: number }) => {
      scheduleRealtimeRefresh(payload?.documentId)
    }

    socket.on('documents:ftp-uploaded', handleRealtimeDocumentEvent)
    socket.on('documents:updated', handleRealtimeDocumentEvent)

    return () => {
      socket.off('documents:ftp-uploaded', handleRealtimeDocumentEvent)
      socket.off('documents:updated', handleRealtimeDocumentEvent)
    }
  }, [socket, scheduleRealtimeRefresh])

  // Auto-refresco en vivo vía WebSocket al recibir notificaciones document.uploaded / document.processed / document.error
  useEffect(() => {
    if (!latestNotification || latestNotification.id === lastHandledNotifId.current) return
    lastHandledNotifId.current = latestNotification.id

    if (latestNotification.type?.startsWith('document.')) {
      scheduleRealtimeRefresh(Number(latestNotification.data?.documentId || 0))
    }
  }, [latestNotification, scheduleRealtimeRefresh])

  // Sincronizar datos de los modales si el documento abierto se actualiza en el listado
  useEffect(() => {
    if (previewDoc) {
      const updatedPreview = data.find(item => item.id === previewDoc.id)
      if (
        updatedPreview &&
        (updatedPreview.status !== previewDoc.status ||
          updatedPreview.processedAt !== previewDoc.processedAt ||
          updatedPreview.updatedAt !== previewDoc.updatedAt)
      ) {
        setPreviewDoc(prev => (prev ? { ...prev, ...updatedPreview } : null))
      }
    }

    if (validatingDoc) {
      const updatedValidating = data.find(item => item.id === validatingDoc.id)
      if (
        updatedValidating &&
        (updatedValidating.status !== validatingDoc.status ||
          updatedValidating.processedAt !== validatingDoc.processedAt ||
          updatedValidating.updatedAt !== validatingDoc.updatedAt)
      ) {
        setValidatingDoc(prev => (prev ? { ...prev, ...updatedValidating } : null))
      }
    }
  }, [data, previewDoc, validatingDoc])

  const clearClientFilter = useCallback(() => {
    setClientIdFilter(undefined)
    setPage(0)
    if (router.query.clientId) {
      const nextQuery = { ...router.query }
      delete nextQuery.clientId
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true })
    }
  }, [router])

  const handleResetFilters = () => {
    setSearchInput('')
    setDebouncedSearch('')
    setDocumentType('')
    setPurchaseOrderNumber('')
    setDateFrom('')
    setDateTo('')
    setStatus('')
    setSource('')
    setUserIdFilter('')
    clearClientFilter()
    setPage(0)
    setSelectedRowIds([])
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
        source,
        userId: userIdFilter || undefined,
        clientId: clientIdFilter,
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
    searchInput ||
      documentType ||
      purchaseOrderNumber ||
      dateFrom ||
      dateTo ||
      source ||
      userIdFilter ||
      clientIdFilter
  )

  return {
    data,
    facets,
    statusFacets,
    departmentFacets,
    uploaders,
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
    source,
    setSource,
    userIdFilter,
    setUserIdFilter,
    clientIdFilter,
    clearClientFilter,
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
    loadData,
    handleResetFilters,
    handleUpload,
    handleSyncFtp,
    handleReprocess,
    handleDeleteConfirm,
    handleBulkDeleteConfirm,
    handleValidate,
    handleReject,
    handleExport
  }
}

