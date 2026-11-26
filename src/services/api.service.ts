import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from 'src/utils/api-url';
import { reportClientError } from 'src/utils/security-error-reporter';

const repository = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '12345',
  },
});
repository.interceptors.request.use(
  function (config) {
    // Obtener el token actual de localStorage antes de cada petición
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('[API Request] Token added to headers', {
          path: config.url,
          hasToken: !!token
        });
      }
    }

    return config;
  },
  function (error) {
    console.error(error);

    return Promise.reject(error);
  }
);

repository.interceptors.response.use(
  function (response) {

    if (response.data.status === 403 || response.data.status === 401) {
      // authService.logout();
      console.error('Error al iniciar sesion');
      throw new Error('Error al iniciar sesion');
    }

    return response;
  },
  function (error) {
    const status = error.response?.status;
    const message = String(error.response?.data?.message || '');
    const errorCode = error.response?.data?.code ? String(error.response.data.code) : undefined;
    const requestUrl = String(error.config?.url || '');
    const requestMethod = String(error.config?.method || 'GET').toUpperCase();

    if (
      typeof window !== 'undefined' &&
      !requestUrl.includes('/security/client-errors') &&
      errorCode !== 'ACTIVE_SESSION_EXISTS' &&
      (!status || status >= 400)
    ) {
      reportClientError({
        statusCode: typeof status === 'number' ? status : 0,
        method: requestMethod,
        path: requestUrl || window.location.pathname,
        frontendRoute: window.location.pathname,
        errorCode: errorCode || error.code || undefined,
        message: message || error.message || 'Error de comunicación con la API',
      });
    }

    if (
      typeof window !== 'undefined' &&
      status === 401 &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/register')
    ) {
      const hasToken = Boolean(localStorage.getItem('accessToken'));
      if (hasToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        if (message.includes('SESSION_REPLACED')) {
          toast.error('Tu sesión se cerró porque se inició sesión desde otro dispositivo.', {
            id: 'session-revoked',
          });
        }
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    throw error;
  }
);
const getHeaders = () => {
  const headers: any = {};
  const token = localStorage.getItem("accessToken");
  if (token) {
    const tokenHeader = token ? `Bearer ${token}` : null;
    headers['Authorization'] = tokenHeader;
  }

  return headers;
}

const apiConnector = {
  get: async <T = any>(path: string, params = {}) => await repository.get<T>(path, { params }).then(({ data }) => data),
  post: async <T = any>(path: string, body: any) => await repository.post<T>(path, body).then(({ data }) => data),
  put: async <T = any>(path: string, body: any) => await repository.put<T>(path, body).then(({ data }) => data),
  patch: async <T = any>(path: string, body: any) => await repository.patch<T>(path, body).then(({ data }) => data),
  remove: async <T = any>(path: string, params = {}) => await repository.delete<T>(path, { params }).then(({ data }) => data),
  sendFile: async (path: string, body: any) => {
    const headers = { "Content-Type": "multipart/form-data", ...getHeaders() };

    return await repository
      .post(path, body, {
        headers,
      }).then(({ data }) => data);
  },
  downloadFile: async (path: string, fileName: any, params = {}) => {
    const headers = { 'Content-Type': 'blob', ...getHeaders() };

    const response = await repository
      .get(path, {
        responseType: 'blob',
        params,
        headers,
      });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
  },
  getFileBlob: async (path: string, params = {}) => {
    const headers = { ...getHeaders() };

    const response = await repository.get(path, {
      responseType: 'blob',
      params,
      headers,
    });

    return response.data;
  },
};

export default apiConnector;
