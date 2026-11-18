export type FtpProtocol = 'SFTP' | 'FTPS' | 'FTP'
export type FtpDeviceStatus = 'ACTIVE' | 'SUSPENDED'

export interface FtpDeviceCompanySummary {
  id: number
  name: string
  slug: string
  status: string
}

export interface FtpDeviceItem {
  id: number
  companyId: number
  company?: FtpDeviceCompanySummary
  deviceName: string
  deviceModel: string | null
  protocol: FtpProtocol
  username: string
  subFolder: string
  allowedIps: string[]
  allowedIpsRaw?: string | null
  status: FtpDeviceStatus
  sftpgoSynced: boolean
  lastSyncError?: string | null
  lastFileAt?: string | null
  scannedCount: number
  inboxRelativePath: string
  ftpVirtualPath: string
  connectionHost: string
  connectionPort: number
  hasPassword: boolean
  createdAt?: string
  updatedAt?: string
}

export interface FtpServerInfo {
  host: string
  sftpPort: number
  ftpsPort: number
  ftpPort: number
  passivePorts: string
  sftpgoConfigured: boolean
  sftpgoReachable: boolean
}

export interface FtpCredentialsPayload {
  deviceId: number
  deviceName: string
  deviceModel?: string | null
  protocol: FtpProtocol
  host: string
  port: number
  username: string
  password: string
  remotePath: string
  inboxRelativePath: string
}

export interface CreateFtpDevicePayload {
  companyId?: number
  deviceName: string
  deviceModel?: string
  protocol?: FtpProtocol
  subFolder?: string
  allowedIps?: string[]
  customPassword?: string
}

export interface UpdateFtpDevicePayload {
  deviceName?: string
  deviceModel?: string
  protocol?: FtpProtocol
  subFolder?: string
  allowedIps?: string[]
  status?: FtpDeviceStatus
  regeneratePassword?: boolean
}

