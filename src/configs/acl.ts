import { AbilityBuilder, Ability } from '@casl/ability'

export type Subjects = string
export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | string

export type AppAbility = Ability<[Actions, Subjects]> | undefined

export const AppAbility = Ability as any
export type ACLObj = {
  action: Actions
  subject: string
}

/**
 * Subjects exclusivos del Super Administrador de la plataforma.
 * Ningún usuario ni administrador de compañía puede acceder a sus páginas ni administrar estos módulos.
 */
const PLATFORM_ONLY_SUBJECTS = ['companies', 'plans', 'permissions', 'notifications', 'demos', 'security']

/**
 * Subjects operativos exclusivos de las Compañías (Tenants).
 * El Super Administrador NO es una compañía: no sube documentos ni gestiona usuarios o roles internos.
 */
const TENANT_ONLY_SUBJECTS = [
  'documents',
  'clients',
  'channels_section',
  'ftp_devices',
  'channels',
  'email_inbox',
  'whatsapp_inbox',
  'telegram_inbox',
  'users',
  'users_menu',
  'roles',
  'admin_section',
  'ai_queries'
]

const restrictSubjects = (cannot: any, subjects: string[]) => {
  subjects.forEach(subj => {
    cannot('manage', subj)
    cannot('read', subj)
    cannot('create', subj)
    cannot('update', subj)
    cannot('delete', subj)
  })
}

const isPlatformOnlyPermission = (upperPerm: string): boolean => {
  return (
    upperPerm.includes('COMPAN') ||
    upperPerm.includes('_PLAN') ||
    upperPerm.includes('PERMISSION') ||
    upperPerm.includes('NOTIFICATION') ||
    upperPerm.includes('DEMO') ||
    upperPerm.includes('SECURITY')
  )
}

const normalizeRoleSlug = (role: unknown): string => {
  if (typeof role === 'string') return role.trim().toLowerCase()
  if (role && typeof role === 'object' && typeof (role as any).slug === 'string') {
    return (role as any).slug.trim().toLowerCase()
  }

  return ''
}

/**
 * Define reglas CASL separando estrictamente al Super Admin de Plataforma de las Compañías (Tenants),
 * y aplicando restricciones según los módulos habilitados para la compañía (`enabledModules`).
 */
const defineRulesFor = (
  role: string,
  _subject: string,
  permissions: string[] = [],
  enabledModules?: string[]
) => {
  const { can, cannot, rules } = new AbilityBuilder(AppAbility)
  const normalizedRole = normalizeRoleSlug(role)

  if (normalizedRole === 'superadmin' || normalizedRole === 'super_admin' || normalizedRole === 'super admin') {
    can('read', 'dashboard')
    can('read', 'dashboards')
    can('manage', 'companies')
    can('manage', 'plans')
    can('manage', 'permissions')
    can('manage', 'notifications')
    can('manage', 'demos')
    can('manage', 'security')
    can('read', 'audits')
    can('manage', 'audits')
    can('read', 'myprofile')
    restrictSubjects(cannot, TENANT_ONLY_SUBJECTS)

    return rules
  }

  restrictSubjects(cannot, PLATFORM_ONLY_SUBJECTS)

  if (normalizedRole === 'admin' || normalizedRole === 'company_admin') {
    can('manage', 'all')
    can('read', 'admin_section')
    can('read', 'channels_section')
    restrictSubjects(cannot, PLATFORM_ONLY_SUBJECTS)
  }

  permissions.forEach(permission => {
    const upperPerm = permission.toUpperCase()
    if (isPlatformOnlyPermission(upperPerm)) {
      return
    }

    can(permission, 'all')

    const [actionMatch, ...subjectParts] = permission.toLowerCase().split('_')
    let action = actionMatch
    if (action === 'view') action = 'read'

    let subjectName = subjectParts.join('_')
    if (subjectName && !subjectName.endsWith('s') && subjectName !== 'dashboard') {
      subjectName += 's'
    }

    if (action && subjectName) {
      can(action, subjectName)

      if (action === 'read' && subjectName === 'users') {
        can('read', 'users_menu')
      }
      if (action === 'read' && ['users', 'roles', 'audits'].includes(subjectName)) {
        can('read', 'admin_section')
      }
    }

    if (permission === 'VIEW_DASHBOARD') {
      can('read', 'dashboard')
      can('read', 'dashboards')
    }
    if (permission === 'VIEW_DOCUMENTS' || permission === 'READ_DOCUMENTS') {
      can('read', 'documents')
    }
    if (permission === 'VIEW_CLIENTS') {
      can('read', 'clients')
    }
    if (permission === 'CREATE_CLIENT') {
      can('create', 'clients')
    }
    if (permission === 'UPDATE_CLIENT') {
      can('update', 'clients')
    }
    if (permission === 'DELETE_CLIENT') {
      can('delete', 'clients')
    }
    if (permission === 'QUERY_AI_DOCUMENTS') {
      can('read', 'ai_queries')
    }
    if (permission === 'VIEW_CHANNELS') {
      can('read', 'channels')
      can('read', 'channels_section')
    }
    if (permission === 'MANAGE_CHANNELS') {
      can('manage', 'channels')
      can('read', 'channels')
      can('read', 'channels_section')
    }
    if (permission === 'MANAGE_OWN_EMAIL') {
      can('read', 'channels')
      can('manage', 'own_email_channel')
      can('read', 'channels_section')
    }
    if (permission === 'MANAGE_OWN_WHATSAPP') {
      can('read', 'channels')
      can('manage', 'own_whatsapp_channel')
      can('read', 'channels_section')
    }
    if (permission === 'MANAGE_OWN_TELEGRAM') {
      can('read', 'channels')
      can('manage', 'own_telegram_channel')
      can('read', 'channels_section')
    }
    if (permission === 'VIEW_FTP_DEVICES') {
      can('read', 'ftp_devices')
      can('read', 'channels_section')
    }
    if (permission === 'VIEW_EMAIL_INBOX') {
      can('read', 'email_inbox')
      can('manage', 'email_inbox')
      can('read', 'channels_section')
    }
    if (permission === 'VIEW_WHATSAPP_INBOX') {
      can('read', 'whatsapp_inbox')
      can('manage', 'whatsapp_inbox')
      can('read', 'channels_section')
    }
    if (permission === 'VIEW_TELEGRAM_INBOX') {
      can('read', 'telegram_inbox')
      can('manage', 'telegram_inbox')
      can('read', 'channels_section')
    }
  })

  // Aplicar restricciones según los módulos habilitados para la compañía
  if (Array.isArray(enabledModules)) {
    const hasMod = (modId: string) => enabledModules.includes(modId)

    if (!hasMod('documents')) {
      restrictSubjects(cannot, ['documents', 'clients'])
    }
    if (!hasMod('sftp')) {
      restrictSubjects(cannot, ['ftp_devices'])
    }
    if (!hasMod('email')) {
      restrictSubjects(cannot, ['email_inbox'])
    }
    if (!hasMod('whatsapp')) {
      restrictSubjects(cannot, ['whatsapp_inbox'])
    }
    if (!hasMod('telegram')) {
      restrictSubjects(cannot, ['telegram_inbox'])
    }
    if (!hasMod('email') && !hasMod('whatsapp') && !hasMod('telegram')) {
      restrictSubjects(cannot, ['channels'])
      if (!hasMod('sftp')) {
        restrictSubjects(cannot, ['channels_section'])
      }
    }
  }

  restrictSubjects(cannot, PLATFORM_ONLY_SUBJECTS)
  can('read', 'myprofile')

  return rules
}

export const buildAbilityFor = (
  role: string,
  subject: string,
  permissions: string[] = [],
  enabledModules?: string[]
): AppAbility => {
  return new AppAbility(defineRulesFor(role, subject, permissions, enabledModules), {
    // @ts-ignore
    detectSubjectType: object => object!.type
  })
}

export const defaultACLObj: ACLObj = {
  action: 'manage',
  subject: 'all'
}

export default defineRulesFor
