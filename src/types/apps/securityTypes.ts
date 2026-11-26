export type SecurityOverviewKpis = {
  totalIpsTracked: number
  activeIps24h: number
  blockedIpsCount: number
  loginsSuccessPeriod: number
  loginsFailedPeriod: number
  loginsBlockedPeriod: number
  errors4xxPeriod: number
  errors5xxPeriod: number
  frontendErrorsPeriod: number
  backendErrorsPeriod: number
}

export type SecurityTopCountry = {
  countryCode: string
  countryName: string
  ipsCount: number
}

export type SecurityOverviewResponse = {
  periodDays: number
  retentionDays: number
  kpis: SecurityOverviewKpis
  topCountries: SecurityTopCountry[]
}

export type SecurityIpIntelligenceRow = {
  id: number
  ipAddress: string
  countryCode?: string | null
  countryName?: string | null
  region?: string | null
  city?: string | null
  isp?: string | null
  organization?: string | null
  asn?: string | null
  lookupProvider?: string | null
  isBlocked: boolean
  blockReason?: string | null
  blockedByUserId?: number | null
  blockedAt?: string | null
  firstSeenAt: string
  lastSeenAt: string
  totalRequests: number
  failedLoginsCount: number
  errorCount: number
  lastPath?: string | null
  lastUserAgent?: string | null
  lastUserId?: number | null
  lastCompanyId?: number | null
}

export type SecurityLoginEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_BLOCKED_ACTIVE_SESSION'
  | 'SESSION_FORCED_TAKEOVER'
  | 'SESSION_REVOKED'
  | 'LOGOUT'

export type SecurityLoginEventRow = {
  id: number
  eventType: SecurityLoginEventType
  usernameAttempted?: string | null
  userId?: number | null
  companyId?: number | null
  userRole?: string | null
  ipAddress: string
  countryCode?: string | null
  countryName?: string | null
  ispOwner?: string | null
  userAgent?: string | null
  browser?: string | null
  os?: string | null
  deviceType?: string | null
  failureReason?: string | null
  sessionId?: string | null
  createdAt: string
}

export type SecurityErrorSource = 'BACKEND' | 'FRONTEND'

export type SecurityErrorLogRow = {
  id: number
  source: SecurityErrorSource
  severity: 'WARN' | 'ERROR' | 'CRITICAL'
  statusCode: number
  method?: string | null
  path: string
  frontendRoute?: string | null
  errorCode?: string | null
  message: string
  stackTrace?: string | null
  sanitizedPayload?: Record<string, any> | null
  userId?: number | null
  username?: string | null
  companyId?: number | null
  ipAddress?: string | null
  countryCode?: string | null
  countryName?: string | null
  ispOwner?: string | null
  userAgent?: string | null
  createdAt: string
}

export type SecurityPaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export type LiveSecurityEvent = {
  kind: 'LOGIN' | 'ERROR' | 'IP_BLOCK' | 'THREAT'
  id?: number
  eventType?: string
  severity?: string
  statusCode?: number
  source?: string
  method?: string
  path?: string
  message?: string
  username?: string | null
  ipAddress?: string
  countryCode?: string | null
  countryName?: string | null
  ispOwner?: string | null
  browser?: string | null
  os?: string | null
  failureReason?: string | null
  isBlocked?: boolean
  reason?: string | null
  failedAttempts?: number
  createdAt: string
}
