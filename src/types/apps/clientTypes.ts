import { DocumentBalanceSummary, SourceImputationSummary } from 'src/store/apps/documents'

export interface ClientLinkedDocumentSummary {
  id: number
  originalName: string
  documentType?: string | null
  documentNumber?: string | null
  documentDate?: string | null
  totalAmount?: number | string | null
  currency?: string | null
  status: string
  source: string
  createdAt: string
}

export interface ClientItem {
  id: number
  companyId: number
  name: string
  tradeName?: string | null
  taxIdType?: string | null
  taxId?: string | null
  normalizedTaxId?: string | null
  taxCondition?: string | null
  iibbNumber?: string | null
  iibbCondition?: string | null
  erpCode?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
  secondaryPhone?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  country?: string | null
  paymentTerms?: string | null
  cbu?: string | null
  notes?: string | null
  isActive: boolean
  documentsCount?: number
  documents?: ClientLinkedDocumentSummary[]
  createdAt: string
  updatedAt: string
}

export interface ClientFormPayload {
  name: string
  tradeName?: string | null
  taxIdType?: string | null
  taxId?: string | null
  taxCondition?: string | null
  iibbNumber?: string | null
  iibbCondition?: string | null
  erpCode?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
  secondaryPhone?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  country?: string | null
  paymentTerms?: string | null
  cbu?: string | null
  notes?: string | null
  isActive?: boolean
}

export interface FetchClientsParams {
  page?: number
  limit?: number
  search?: string
  isActive?: string
}

export type ClientDocumentRole = 'issuer' | 'recipient' | 'both' | 'linked'

export interface ClientDocumentItem {
  id: number
  clientId?: number | null
  originalName: string
  documentType?: string | null
  normalizedDocumentType?: string
  documentLetter?: string | null
  pointOfSale?: string | null
  documentNumber?: string | null
  documentDate?: string | null
  dueDate?: string | null
  issuerName?: string | null
  issuerTaxId?: string | null
  recipientName?: string | null
  recipientTaxId?: string | null
  recipientEmail?: string | null
  purchaseOrderNumber?: string | null
  referenceNumber?: string | null
  currency?: string | null
  netAmount?: number | string | null
  taxAmount?: number | string | null
  totalAmount?: number | string | null
  status: string
  source: string
  paymentStatus?: string
  summary?: string | null
  clientRole: ClientDocumentRole
  linkedCount?: number
  balanceSummary?: DocumentBalanceSummary
  imputationSummary?: SourceImputationSummary
  createdAt: string
  updatedAt: string
}

export interface AccountStatementBreakdown {
  invoicedNet: number
  paidOrCredited: number
  remainingBalance: number
  invoicesCount: number
  paidCount: number
  partialCount: number
  pendingCount: number
}

export interface ClientAccountStatement {
  totalInvoicedNet: number
  totalPaidOrCollected: number
  totalRemainingBalance: number
  totalPaymentsAmount: number
  totalUnappliedPayments: number
  invoicesCount: number
  paidInvoicesCount: number
  partialInvoicesCount: number
  pendingInvoicesCount: number
  unlinkedReceiptsCount: number
  unbilledRemitosCount: number
  receivable: AccountStatementBreakdown
  payable: AccountStatementBreakdown
}

export interface ClientDocumentsSummary {
  total: number
  byRole: {
    all: number
    issuer: number
    recipient: number
    linked: number
  }
  byStatus: {
    pendingApproval: number
    validated: number
    error: number
  }
  byType: Record<string, number>
  typeCounts: Array<{ documentType: string; count: number }>
  accountStatement?: ClientAccountStatement
}

export interface FetchClientDocumentsParams {
  id: number
  documentType?: string
  role?: 'all' | 'issuer' | 'recipient' | 'linked'
  status?: string
  paymentStatus?: string
  linkState?: 'all' | 'linked' | 'unlinked'
  search?: string
  page?: number
  limit?: number
}

export interface ClientDocumentsResponse {
  client: ClientItem
  data: ClientDocumentItem[]
  summary: ClientDocumentsSummary
  meta: {
    totalItems: number
    totalPages: number
    currentPage: number
    itemsPerPage: number
  }
}
