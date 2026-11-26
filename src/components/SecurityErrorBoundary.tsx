import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { reportClientError } from 'src/utils/security-error-reporter'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

export class SecurityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error inesperado de renderizado',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportClientError({
      statusCode: 500,
      method: 'REACT_UI',
      path: typeof window !== 'undefined' ? window.location.pathname : '/',
      frontendRoute: typeof window !== 'undefined' ? window.location.pathname : '/',
      errorCode: error?.name || 'REACT_RENDER_ERROR',
      message: error?.message || 'Error no controlado en componente React',
      stackTrace: [error?.stack, errorInfo?.componentStack].filter(Boolean).join('\n\n'),
    })
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' })
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            bgcolor: 'background.default',
          }}
        >
          <Card sx={{ maxWidth: 480, width: '100%', textAlign: 'center', borderRadius: 3 }}>
            <CardContent sx={{ p: 6 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 3,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'error.lighter',
                  color: 'error.main',
                }}
              >
                <Icon icon='tabler:alert-triangle' fontSize={32} />
              </Box>
              <Typography variant='h5' fontWeight={700} gutterBottom>
                Ocurrió un error inesperado en la vista
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
                El incidente fue registrado automáticamente en el monitoreo de seguridad para su análisis.
              </Typography>
              <Button variant='contained' color='primary' onClick={this.handleReload}>
                Recargar aplicación
              </Button>
            </CardContent>
          </Card>
        </Box>
      )
    }

    return this.props.children
  }
}

export default SecurityErrorBoundary
