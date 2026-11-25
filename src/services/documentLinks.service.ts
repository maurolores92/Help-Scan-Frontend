import apiConnector from 'src/services/api.service'
import {
  DocumentBalanceSummary,
  DocumentItem,
  DocumentLinkItem,
  DocumentLinksResponse
} from 'src/store/apps/documents'

export interface CreateLinkPayload {
  targetDocumentId: number
  linkType?: string
  appliedAmount?: number | null
  matchSource?: 'AUTO_EXACT' | 'SUGGESTED_ACCEPTED' | 'MANUAL'
  notes?: string | null
  swapDirection?: boolean
}

export interface BatchLinkEntry {
  sourceDocumentId: number
  targetDocumentId: number
  linkType?: string
  appliedAmount?: number | null
  notes?: string | null
}

export const documentLinksApi = {
  async getDocumentLinks(documentId: number): Promise<DocumentLinksResponse> {
    return apiConnector.get<DocumentLinksResponse>(`/documents/${documentId}/links`)
  },

  async createLink(
    documentId: number,
    payload: CreateLinkPayload
  ): Promise<{
    message: string
    link: DocumentLinkItem
    warnings: string[]
    targetBalanceSummary: DocumentBalanceSummary
  }> {
    return apiConnector.post(`/documents/${documentId}/links`, payload)
  },

  async createBatchLinks(links: BatchLinkEntry[]): Promise<{
    createdCount: number
    warnings: string[]
    skipped: Array<{ sourceDocumentId: number; targetDocumentId: number; reason: string }>
  }> {
    return apiConnector.post('/documents/links/batch', { links })
  },

  async updateLink(
    documentId: number,
    linkId: number,
    payload: { appliedAmount?: number | null; linkType?: string; notes?: string | null }
  ) {
    return apiConnector.patch(`/documents/${documentId}/links/${linkId}`, payload)
  },

  async removeLink(documentId: number, linkId: number) {
    return apiConnector.remove(`/documents/${documentId}/links/${linkId}`)
  },

  async runAutoMatch(documentId: number): Promise<{ autoMatchedCount: number }> {
    return apiConnector.post(`/documents/${documentId}/links/auto-match`, {})
  },

  async searchCompanyDocuments(search: string, limit = 30): Promise<DocumentItem[]> {
    const res = await apiConnector.get('/documents', {
      search: search.trim() || undefined,
      limit,
      page: 1
    })

    return Array.isArray(res?.data) ? res.data : []
  }
}
