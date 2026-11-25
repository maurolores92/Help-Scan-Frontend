// ** React Imports
import React, { useEffect, useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Hooks & Services
import { useAuth } from 'src/hooks/useAuth'
import apiConnector from 'src/services/api.service'

// ** Types
import { CompanyQuotaSummaryType } from 'src/types/apps/planTypes'

// ** Custom Dashboard Components
import WelcomeCard from './WelcomeCard'
import ClientKpiCards from './ClientKpiCards'

export const AdminDashboard = () => {
  const { user } = useAuth()
  const [quota, setQuota] = useState<CompanyQuotaSummaryType | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    // Consultamos la cuota y métricas acumuladas de la compañía
    apiConnector
      .get<CompanyQuotaSummaryType>('/plans/my-quota')
      .then(res => {
        if (isMounted) {
          setQuota(res)
        }
      })
      .catch(() => {
        if (isMounted) {
          setQuota(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <Grid container spacing={6} className='match-height'>
      {/* 1. Card Superior de Bienvenida Personalizada */}
      <Grid item xs={12}>
        <WelcomeCard user={user} quota={quota} loading={loading} />
      </Grid>

      {/* 2. Fila con los KPIs principales y estado de canales (WhatsApp, Email, Telegram):
          - Documentos procesados (Odómetro acumulado histórico permanente)
          - Usuarios creados
          - Espacio en servidor y archivos guardados
          - Impresoras FTP + estado de canales automáticos
      */}
      <ClientKpiCards quota={quota} loading={loading} />
    </Grid>
  )
}

export default AdminDashboard
