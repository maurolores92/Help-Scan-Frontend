import React, { useMemo } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Collapse from '@mui/material/Collapse'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { DataGrid } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import ConfirmActionDialog from 'src/components/common/ConfirmActionDialog'
import DocumentDropzone from 'src/components/documents/DocumentDropzone'
import PdfViewerModal from 'src/components/documents/PdfViewerModal'
import DocumentValidationModal from 'src/components/documents/DocumentValidationModal'
import DocumentStatsHeader from './DocumentStatsHeader'
import DocumentFilterToolbar from './DocumentFilterToolbar'
import DocumentQuotaBanner from './DocumentQuotaBanner'
import { buildDocumentsColumns } from './DocumentsListColumns'
import { useDocumentsManager } from './hooks/useDocumentsManager'

export const DocumentsListView = () => {
  const {
    data,
    facets,
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
    handleReject
  } = useDocumentsManager()

  const columns = useMemo(
    () =>
      buildDocumentsColumns({
        onPreview: doc => setPreviewDoc(doc),
        onValidate: doc => setValidatingDoc(doc),
        onReprocess: doc => handleReprocess(doc),
        onDelete: doc => setDocToDelete(doc),
        reprocessingId
      }),
    [handleReprocess, reprocessingId, setDocToDelete, setPreviewDoc, setValidatingDoc]
  )

  return (
    <Box>
      <DocumentStatsHeader documents={data} total={total} />
      <DocumentQuotaBanner quota={myQuota} />

      <Card>
        <CardHeader
          title='Bóveda de Documentos PDF'
          subheader='Detección automática en carpeta / SFTP, extracción OCR y búsqueda universal por cualquier dato'
        />

        <Collapse in={showUpload}>
          <Box sx={{ px: 4, pb: 4 }}>
            <DocumentDropzone onUpload={handleUpload} isUploading={uploading} />
          </Box>
        </Collapse>

        <DocumentFilterToolbar
          search={searchInput}
          onSearchChange={setSearchInput}
          documentType={documentType}
          onDocumentTypeChange={val => {
            setDocumentType(val)
            setPage(0)
            setSelectedRowIds([])
          }}
          facets={facets}
          purchaseOrderNumber={purchaseOrderNumber}
          onPurchaseOrderNumberChange={val => {
            setPurchaseOrderNumber(val)
            setPage(0)
            setSelectedRowIds([])
          }}
          dateFrom={dateFrom}
          onDateFromChange={val => {
            setDateFrom(val)
            setPage(0)
            setSelectedRowIds([])
          }}
          dateTo={dateTo}
          onDateToChange={val => {
            setDateTo(val)
            setPage(0)
            setSelectedRowIds([])
          }}
          source={source}
          onSourceChange={val => {
            setSource(val)
            setPage(0)
            setSelectedRowIds([])
          }}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          onToggleUpload={() => setShowUpload(prev => !prev)}
          showUpload={showUpload}
          onSyncFtp={handleSyncFtp}
          isSyncing={syncingFtp}
        />

        {/* Barra de acción cuando hay documentos seleccionados */}
        {selectedRowIds.length > 0 && (
          <Box
            sx={{
              mx: 4,
              mb: 3,
              p: 2,
              px: 3,
              borderRadius: 1,
              bgcolor: theme =>
                theme.palette.mode === 'light' ? 'rgba(234, 84, 85, 0.08)' : 'rgba(234, 84, 85, 0.16)',
              border: 1,
              borderColor: 'error.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={selectedRowIds.length}
                color='error'
                size='small'
                sx={{ fontWeight: 700 }}
              />
              <Typography variant='body2' sx={{ fontWeight: 600, color: 'error.main' }}>
                {selectedRowIds.length === 1
                  ? 'documento seleccionado para acción masiva'
                  : 'documentos seleccionados para acción masiva'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                size='small'
                variant='outlined'
                color='secondary'
                onClick={() => setSelectedRowIds([])}
              >
                Deseleccionar
              </Button>
              <Button
                size='small'
                variant='contained'
                color='error'
                startIcon={<Icon icon='tabler:trash' />}
                onClick={() => setIsBulkDeleteOpen(true)}
                sx={{ fontWeight: 600 }}
              >
                Eliminar Seleccionados ({selectedRowIds.length})
              </Button>
            </Box>
          </Box>
        )}

        <DataGrid
          autoHeight
          rowHeight={72}
          rows={data}
          rowCount={total}
          columns={columns}
          loading={loading}
          paginationMode='server'
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={model => {
            setPage(model.page)
            setPageSize(model.pageSize)
            setSelectedRowIds([])
          }}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          rowSelectionModel={selectedRowIds}
          onRowSelectionModelChange={newSelection => {
            setSelectedRowIds(newSelection as number[])
          }}
          disableRowSelectionOnClick
        />
      </Card>

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
      />

      {/* Diálogo de confirmación para eliminación individual */}
      <ConfirmActionDialog
        open={Boolean(docToDelete)}
        title='¿Eliminar documento PDF?'
        content={`¿Estás seguro de que deseas eliminar permanentemente el documento "${docToDelete?.originalName}"? Esta acción borrará el archivo físico de la bóveda del servidor y liberará espacio en su plan.`}
        confirmText='Sí, eliminar'
        cancelText='Cancelar'
        color='error'
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDocToDelete(null)}
      />

      {/* Diálogo de confirmación para eliminación masiva / múltiple */}
      <ConfirmActionDialog
        open={isBulkDeleteOpen}
        title={`¿Eliminar ${selectedRowIds.length} documentos PDF seleccionados?`}
        content={`¿Estás seguro de que deseas eliminar permanentemente los ${selectedRowIds.length} documentos seleccionados? Esta acción borrará los archivos físicos de la bóveda del servidor y liberará el almacenamiento correspondiente en su plan. Esta operación no se puede deshacer.`}
        confirmText={`Sí, eliminar ${selectedRowIds.length} documentos`}
        cancelText='Cancelar'
        color='error'
        loading={isBulkDeleting}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />
    </Box>
  )
}

export default DocumentsListView
