import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { AppDispatch, RootState } from 'src/store'
import {
  clearLiveSecurityEvents,
  fetchSecurityErrors,
  fetchSecurityIps,
  fetchSecurityLogins,
  fetchSecurityOverview,
  refreshSecurityIp,
  toggleSecurityIpBlock,
} from 'src/store/apps/security'
import { useNotificationSocket } from 'src/context/NotificationContext'
import { SecurityKpiCards } from './SecurityKpiCards'
import { SecurityIpsTab } from './SecurityIpsTab'
import { SecurityLoginsTab } from './SecurityLoginsTab'
import { SecurityErrorsTab } from './SecurityErrorsTab'
import { SecurityLiveFeedTab } from './SecurityLiveFeedTab'

export const SecurityMonitoringView = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { connected } = useNotificationSocket()
  const {
    overview,
    overviewLoading,
    ips,
    ipsTotal,
    ipsLoading,
    logins,
    loginsTotal,
    loginsLoading,
    errors,
    errorsTotal,
    errorsLoading,
    liveEvents,
    actionLoadingIp,
  } = useSelector((state: RootState) => state.security)

  const [tab, setTab] = useState<'ips' | 'logins' | 'errors' | 'live'>('ips')
  const [periodDays, setPeriodDays] = useState<number>(7)

  const [ipSearch, setIpSearch] = useState('')
  const [ipBlockedOnly, setIpBlockedOnly] = useState(false)
  const [ipHasErrors, setIpHasErrors] = useState(false)
  const [ipPage, setIpPage] = useState(1)
  const [ipLimit, setIpLimit] = useState(25)

  const [loginSearch, setLoginSearch] = useState('')
  const [loginEventType, setLoginEventType] = useState('')
  const [loginPage, setLoginPage] = useState(1)
  const [loginLimit, setLoginLimit] = useState(25)

  const [errorSearch, setErrorSearch] = useState('')
  const [errorSource, setErrorSource] = useState('')
  const [errorStatusFamily, setErrorStatusFamily] = useState('')
  const [errorPage, setErrorPage] = useState(1)
  const [errorLimit, setErrorLimit] = useState(25)

  const loadIps = useCallback(() => {
    void dispatch(
      fetchSecurityIps({
        search: ipSearch || undefined,
        blockedOnly: ipBlockedOnly ? 'true' : undefined,
        hasErrors: ipHasErrors ? 'true' : undefined,
        page: ipPage,
        limit: ipLimit,
      })
    )
  }, [dispatch, ipSearch, ipBlockedOnly, ipHasErrors, ipPage, ipLimit])

  const loadLogins = useCallback(() => {
    void dispatch(
      fetchSecurityLogins({
        search: loginSearch || undefined,
        eventType: loginEventType || undefined,
        page: loginPage,
        limit: loginLimit,
      })
    )
  }, [dispatch, loginSearch, loginEventType, loginPage, loginLimit])

  const loadErrors = useCallback(() => {
    void dispatch(
      fetchSecurityErrors({
        search: errorSearch || undefined,
        source: errorSource || undefined,
        statusFamily: errorStatusFamily || undefined,
        page: errorPage,
        limit: errorLimit,
      })
    )
  }, [dispatch, errorSearch, errorSource, errorStatusFamily, errorPage, errorLimit])

  const loadAll = useCallback(() => {
    void dispatch(fetchSecurityOverview(periodDays))
    loadIps()
    loadLogins()
    loadErrors()
  }, [dispatch, periodDays, loadIps, loadLogins, loadErrors])

  useEffect(() => {
    void dispatch(fetchSecurityOverview(periodDays))
  }, [dispatch, periodDays])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadIps()
    }, 200)

    return () => clearTimeout(timer)
  }, [loadIps])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogins()
    }, 200)

    return () => clearTimeout(timer)
  }, [loadLogins])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadErrors()
    }, 200)

    return () => clearTimeout(timer)
  }, [loadErrors])

  const handleRefreshIp = async (ip: string) => {
    try {
      await dispatch(refreshSecurityIp(ip)).unwrap()
      toast.success(`Datos GeoIP actualizados para ${ip}`)
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo refrescar la información de la IP')
    }
  }

  const handleToggleBlock = async (ip: string, blocked: boolean, reason?: string) => {
    try {
      await dispatch(toggleSecurityIpBlock({ ip, blocked, reason })).unwrap()
      toast.success(blocked ? `IP ${ip} bloqueada correctamente` : `IP ${ip} desbloqueada`)
      void dispatch(fetchSecurityOverview(periodDays))
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo actualizar el estado de bloqueo de la IP'
      toast.error(Array.isArray(msg) ? msg.join(', ') : String(msg))
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant='h4' fontWeight={700}>
            Seguridad y Monitoreo Global
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Inteligencia de IPs (país y dueño/ISP), auditoría de sesiones y registro unificado de errores 4xx/5xx.
          </Typography>
        </Box>

        <Stack direction='row' spacing={2} alignItems='center'>
          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel>Período KPIs</InputLabel>
            <Select
              label='Período KPIs'
              value={periodDays}
              onChange={e => setPeriodDays(Number(e.target.value))}
            >
              <MenuItem value={1}>Últimas 24h</MenuItem>
              <MenuItem value={7}>Últimos 7 días</MenuItem>
              <MenuItem value={30}>Últimos 30 días</MenuItem>
              <MenuItem value={60}>Últimos 60 días</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant='outlined'
            startIcon={<Icon icon='tabler:refresh' />}
            onClick={loadAll}
          >
            Actualizar
          </Button>
        </Stack>
      </Stack>

      <SecurityKpiCards overview={overview} loading={overviewLoading} />

      <Card sx={{ borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          variant='scrollable'
          scrollButtons='auto'
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            value='ips'
            icon={<Icon icon='tabler:network' fontSize={18} />}
            iconPosition='start'
            label={`IPs y Orígenes (${ipsTotal})`}
          />
          <Tab
            value='logins'
            icon={<Icon icon='tabler:key' fontSize={18} />}
            iconPosition='start'
            label={`Inicios de Sesión (${loginsTotal})`}
          />
          <Tab
            value='errors'
            icon={<Icon icon='tabler:alert-circle' fontSize={18} />}
            iconPosition='start'
            label={`Errores 4xx / 5xx (${errorsTotal})`}
          />
          <Tab
            value='live'
            icon={<Icon icon='tabler:activity-heartbeat' fontSize={18} />}
            iconPosition='start'
            label={`Monitor en Vivo (${liveEvents.length})`}
          />
        </Tabs>

        {tab === 'ips' && (
          <SecurityIpsTab
            ips={ips}
            total={ipsTotal}
            loading={ipsLoading}
            actionLoadingIp={actionLoadingIp}
            page={ipPage}
            limit={ipLimit}
            search={ipSearch}
            blockedOnly={ipBlockedOnly}
            hasErrors={ipHasErrors}
            onSearchChange={val => {
              setIpSearch(val)
              setIpPage(1)
            }}
            onBlockedOnlyChange={checked => {
              setIpBlockedOnly(checked)
              setIpPage(1)
            }}
            onHasErrorsChange={checked => {
              setIpHasErrors(checked)
              setIpPage(1)
            }}
            onPageChange={setIpPage}
            onLimitChange={val => {
              setIpLimit(val)
              setIpPage(1)
            }}
            onRefreshIp={handleRefreshIp}
            onToggleBlock={handleToggleBlock}
          />
        )}

        {tab === 'logins' && (
          <SecurityLoginsTab
            logins={logins}
            total={loginsTotal}
            loading={loginsLoading}
            page={loginPage}
            limit={loginLimit}
            search={loginSearch}
            eventType={loginEventType}
            onSearchChange={val => {
              setLoginSearch(val)
              setLoginPage(1)
            }}
            onEventTypeChange={val => {
              setLoginEventType(val)
              setLoginPage(1)
            }}
            onPageChange={setLoginPage}
            onLimitChange={val => {
              setLoginLimit(val)
              setLoginPage(1)
            }}
          />
        )}

        {tab === 'errors' && (
          <SecurityErrorsTab
            errors={errors}
            total={errorsTotal}
            loading={errorsLoading}
            page={errorPage}
            limit={errorLimit}
            search={errorSearch}
            source={errorSource}
            statusFamily={errorStatusFamily}
            onSearchChange={val => {
              setErrorSearch(val)
              setErrorPage(1)
            }}
            onSourceChange={val => {
              setErrorSource(val)
              setErrorPage(1)
            }}
            onStatusFamilyChange={val => {
              setErrorStatusFamily(val)
              setErrorPage(1)
            }}
            onPageChange={setErrorPage}
            onLimitChange={val => {
              setErrorLimit(val)
              setErrorPage(1)
            }}
          />
        )}

        {tab === 'live' && (
          <SecurityLiveFeedTab
            events={liveEvents}
            connected={connected}
            onClear={() => dispatch(clearLiveSecurityEvents())}
          />
        )}
      </Card>
    </Box>
  )
}

export default SecurityMonitoringView
