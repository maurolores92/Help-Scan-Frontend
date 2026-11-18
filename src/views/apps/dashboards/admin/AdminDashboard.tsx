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

      {/* 2. Fila con los 4 KPIs Principales Solicitados:
          - Hojas escaneadas (Odómetro acumulado histórico permanente)
          - Usuarios creados
          - Megas utilizados en server
          - Impresoras y equipos funcionando por FTP
      */}
      <ClientKpiCards quota={quota} loading={loading} />
    </Grid>
  )
}

export default AdminDashboard
