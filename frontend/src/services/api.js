import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor – attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ff_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor – handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // Only force-logout for actual auth endpoints, not business logic routes
      // (e.g. email errors can bubble up a 401 from upstream APIs)
      const isAuthRoute = url.includes('/auth/')
      const isGlobalAuthError = error.response?.data?.message?.toLowerCase().includes('token')
      if (isAuthRoute || isGlobalAuthError) {
        localStorage.removeItem('ff_token')
        localStorage.removeItem('ff_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
