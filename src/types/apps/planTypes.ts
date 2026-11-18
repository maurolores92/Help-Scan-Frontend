export interface QuotaMetricType {
  current: number
  max: number | null
  unlimited: boolean
  percentage: number
}

export interface StorageQuotaMetricType extends QuotaMetricType {
  currentBytes: number
}

export interface AiQuotaMetricType extends QuotaMetricType {
  period: string
  tokensUsed: number
  aiDocumentsProcessed?: number
}

export interface CompanyQuotaSummaryType {
  isSuperAdmin?: boolean
  companyId: number | null
  plan: {
    id: number
    name: string
    slug: string
    badgeColor: string
  } | null
  useCustomLimits: boolean
  users: QuotaMetricType
  pages?: QuotaMetricType
  documents: QuotaMetricType
  storageMb: StorageQuotaMetricType
  aiQueries: AiQuotaMetricType
  totalPagesUploaded?: number
  activeDocumentsCount?: number
  activeFtpDevicesCount?: number
}

export interface PlanType {
  id: number
  name: string
  slug: string
  description?: string | null
  priceMonthly: number
  currency?: 'ARS' | 'USD'
  priceInPesos?: number
  exchangeRateApplied?: number
  roundPricesApplied?: boolean
  maxUsers: number | null
  maxPages?: number | null
  maxDocuments: number | null
  maxStorageMb: number | null
  maxAiQueriesMonthly: number | null
  includedModules: string[]
  badgeColor: string
  isDefault: boolean
  isActive: boolean
  companiesCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface PlanExchangeConfigType {
  id: number
  usdRate: number
  roundPrices: boolean
  updatedBy: number | null
  updatedAt?: string
}


