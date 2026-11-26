// ** Type import
import { HorizontalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): HorizontalNavItemsType => {
  return [
    {
      title: 'Dashboard',
      icon: 'tabler:layout-dashboard',
      path: '/dashboards',
      action: 'read',
      subject: 'dashboard'
    },
    {
      title: 'Documentos PDF',
      icon: 'tabler:file-text',
      path: '/documents',
      action: 'read',
      subject: 'documents'
    },
    {
      title: 'Clientes',
      icon: 'tabler:address-book',
      path: '/clients',
      action: 'read',
      subject: 'clients'
    },
    {
      title: 'Canales de Ingreso',
      icon: 'tabler:plug-connected',
      action: 'read',
      subject: 'channels_section',
      children: [
        {
          title: 'Impresoras HP y FTP',
          icon: 'tabler:printer',
          path: '/printers-ftp',
          action: 'read',
          subject: 'ftp_devices'
        },
        {
          title: 'Correos Recibidos',
          icon: 'tabler:mail-opened',
          path: '/emails',
          action: 'read',
          subject: 'email_inbox'
        },
        {
          title: 'Mensajes WhatsApp',
          icon: 'tabler:brand-whatsapp',
          path: '/whatsapp',
          action: 'read',
          subject: 'whatsapp_inbox'
        },
        {
          title: 'Mensajes Telegram',
          icon: 'tabler:brand-telegram',
          path: '/telegram',
          action: 'read',
          subject: 'telegram_inbox'
        }
      ]
    },
    {
      title: 'Plataforma',
      icon: 'tabler:building-community',
      action: 'manage',
      subject: 'companies',
      children: [
        {
          title: 'Compañías',
          icon: 'tabler:building-community',
          path: '/companies',
          action: 'manage',
          subject: 'companies'
        },
        {
          title: 'Planes y Cupos',
          icon: 'tabler:award',
          path: '/plans',
          action: 'manage',
          subject: 'plans'
        },
        {
          title: 'Permisos Globales',
          icon: 'tabler:lock',
          path: '/permissions',
          action: 'manage',
          subject: 'permissions'
        },
        {
          title: 'Notificaciones',
          icon: 'tabler:bell',
          path: '/notifications',
          action: 'manage',
          subject: 'notifications'
        },
        {
          title: 'Auditoría Global',
          icon: 'tabler:clipboard-list',
          path: '/audit',
          action: 'manage',
          subject: 'companies'
        },
        {
          title: 'Seguridad y Monitoreo',
          icon: 'tabler:shield-check',
          path: '/security',
          action: 'manage',
          subject: 'security'
        }
      ]
    },
    {
      title: 'Administración',
      icon: 'tabler:settings',
      action: 'read',
      subject: 'admin_section',
      children: [
        {
          title: 'Usuarios',
          icon: 'tabler:users',
          path: '/user',
          action: 'read',
          subject: 'users'
        },
        {
          title: 'Roles',
          icon: 'tabler:shield-lock',
          path: '/roles',
          action: 'read',
          subject: 'roles'
        },
        {
          title: 'Auditoría',
          icon: 'tabler:clipboard-list',
          path: '/audit',
          action: 'read',
          subject: 'audits'
        }
      ]
    }
  ]
}

export default navigation
