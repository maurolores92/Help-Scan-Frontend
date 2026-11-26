import { CompanyQuotaSummaryType } from 'src/types/apps/planTypes'

const formatCompactNumber = (value: number): string => {
  const num = Number(value || 0)
  if (Number.isInteger(num)) return String(num)

  return Number(num.toFixed(1)).toString()
}

export const formatArsCurrency = (amount: number | null | undefined): string => {
  const safe = Number(amount || 0)

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: Number.isInteger(safe) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(safe)
}

export const formatUsersQuotaRatio = (
  quota?: CompanyQuotaSummaryType | null,
  fallbackCurrent = 0,
  fallbackMax?: number | null
): string => {
  const current = quota?.users?.current ?? fallbackCurrent
  const max = quota?.users ? quota.users.max : fallbackMax ?? null
  if (max === null || max === undefined) {
    return `${current} / Sin límite`
  }

  return `${current}/${max}`
}

export const formatFilesQuotaRatio = (
  quota?: CompanyQuotaSummaryType | null
): string => {
  const docs = quota?.documents
  const current = docs?.current ?? quota?.activeDocumentsCount ?? 0
  const max = docs?.max ?? null
  if (max === null || max === undefined) {
    return `${current} / Sin límite`
  }

  return `${current}/${max}`
}

export const formatStorageQuotaMbRatio = (
  quota?: CompanyQuotaSummaryType | null
): string => {
  const storage = quota?.storageMb
  const current = formatCompactNumber(storage?.current ?? 0)
  const max = storage?.max
  if (max === null || max === undefined) {
    return `${current} MB / Sin límite`
  }

  return `${current} MB/${formatCompactNumber(max)} MB`
}

export const resolveCompanyBillingDisplay = (company: any) => {
  const billing = company?.quotaSummary?.processingBilling
  const unitPriceArs = Number(
    billing?.unitPriceArs ?? company?.plan?.pricePerProcessedDocumentArs ?? 0
  )
  const processedCount = Number(billing?.processedCount ?? 0)
  const additionalCostArs = Number(
    billing?.additionalCostArs ?? (processedCount * unitPriceArs).toFixed(2)
  )
  const planBasePriceArs = Number(billing?.planBasePriceArs ?? 0)
  const totalToChargeArs = Number(
    billing?.totalToChargeArs ?? (planBasePriceArs + additionalCostArs).toFixed(2)
  )

  return {
    unitPriceArs,
    processedCount,
    additionalCostArs,
    planBasePriceArs,
    totalToChargeArs
  }
}
