import axios from 'axios'
import type { ApiResponse, ApiError } from '@/types'
import { useAuthStore } from '@/stores/auth'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth state and redirect to login
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    }

    // Transform error to consistent format
    const apiError: ApiError = {
      code: error.response?.data?.code || 'NETWORK_ERROR',
      message: error.response?.data?.message || error.message || 'Network error occurred',
      details: error.response?.data?.details || {},
      timestamp: new Date(),
    }

    return Promise.reject(apiError)
  }
)

// Generic API methods
export const apiService = {
  // GET request
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await api.get(url, { params })
    return response.data
  },

  // POST request
  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await api.post(url, data)
    return response.data
  },

  // PUT request
  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await api.put(url, data)
    return response.data
  },

  // DELETE request
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await api.delete(url)
    return response.data
  },

  // PATCH request
  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await api.patch(url, data)
    return response.data
  },

  // File upload
  async upload<T>(url: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // File download
  async download(url: string, filename?: string): Promise<void> {
    const response = await api.get(url, {
      responseType: 'blob',
    })

    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  },
}

export default api