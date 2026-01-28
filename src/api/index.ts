import axios from 'axios'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { generateSignature } from '@/utils/security'
import { logger } from '@/utils/logger'
import { createRetryInterceptor, DEFAULT_RETRY_CONFIG } from './retry'
import {
  generateIdempotencyKey,
  shouldAddIdempotencyKey,
  DEFAULT_IDEMPOTENCY_CONFIG
} from '@/utils/idempotency'
import { addRequestId, transformError, toExtendedError } from './errorHandler'
import type { ExtendedErrorInfo } from '@/types/error'
import { recordApiLatency } from '@/utils/performance'
import {
  cacheManager,
  generateCacheKey,
  shouldCache,
  getCacheValidationHeaders
} from '@/utils/cache'

// 扩展 AxiosRequestConfig 以包含请求开始时间和缓存信息
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _startTime?: number
    _cacheKey?: string
    _useCache?: boolean
  }
}

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ============================================================================
// RETRY INTERCEPTOR (MUST be added FIRST, before other interceptors)
// ============================================================================
// The retry interceptor handles automatic retries for GET requests on:
// - Network errors (connection refused, timeout, etc.)
// - Server errors (5xx status codes)
//
// Non-idempotent methods (POST, PUT, DELETE, PATCH) are NOT retried by default.
// Uses exponential backoff: 1s, 2s, 4s (capped at 10s)
//
// **Validates: Requirements 2.1.1, 2.1.2, 2.1.3**
// ============================================================================
createRetryInterceptor(api, {
  maxRetries: DEFAULT_RETRY_CONFIG.maxRetries, // 3 retries
  baseDelay: DEFAULT_RETRY_CONFIG.baseDelay, // 1000ms base delay
  maxDelay: DEFAULT_RETRY_CONFIG.maxDelay // 10000ms max delay
})

// 需要签名验证的敏感操作路径
const SENSITIVE_PATHS = ['/auth/password', '/indicators', '/tasks', '/milestones']

// Request interceptor
api.interceptors.request.use(
  async config => {
    // ========================================================================
    // PERFORMANCE MONITORING - Record request start time
    // ========================================================================
    // **Validates: Requirements 4.1.2**
    // ========================================================================
    config._startTime = Date.now()

    // ========================================================================
    // CACHE VALIDATION HEADERS
    // ========================================================================
    // Add If-None-Match (ETag) or If-Modified-Since headers for cache validation
    // Only for GET requests with cache configuration
    //
    // **Validates: Requirements 4.2.1, 4.2.2, 4.2.4**
    // ========================================================================
    if (config.method?.toUpperCase() === 'GET' && shouldCache(config.method, config.url || '')) {
      const cacheKey = generateCacheKey(config.url || '', config.params)
      config._cacheKey = cacheKey
      config._useCache = true

      // Add cache validation headers
      const cacheHeaders = getCacheValidationHeaders(config.url || '', config.params)
      Object.entries(cacheHeaders).forEach(([key, value]) => {
        config.headers[key] = value
      })

      if (Object.keys(cacheHeaders).length > 0) {
        logger.debug('📦 [API Cache] Validation headers added:', cacheHeaders)
      }
    }

    // ========================================================================
    // REQUEST ID (for error tracking and log correlation)
    // ========================================================================
    // Generates a unique request ID for each request to enable:
    // - Error tracking across frontend and backend
    // - Log correlation for debugging
    //
    // **Validates: Requirements 3.1.5, P10**
    // ========================================================================
    addRequestId(config)

    // 🔍 调试日志：请求开始
    logger.debug('🚀 [API Request]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      params: config.params,
      data: config.data,
      requestId: config.headers['X-Request-ID'],
      headers: {
        'Content-Type': config.headers['Content-Type'],
        Authorization: config.headers.Authorization ? '***' : 'none'
      }
    })

    const authStore = useAuthStore()

    // 添加 Token
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
      logger.debug('🔐 [API Auth] Token已添加')
    } else {
      logger.debug('⚠️ [API Auth] 无Token')
    }

    // 敏感操作添加签名
    const isSensitive = SENSITIVE_PATHS.some(path => config.url?.includes(path))
    const isWriteOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
      config.method?.toUpperCase() || ''
    )

    if (isSensitive && isWriteOperation) {
      const timestamp = Date.now()
      const signature = await generateSignature(config.data, timestamp)
      config.headers['X-Timestamp'] = timestamp.toString()
      config.headers['X-Signature'] = signature
      logger.debug('🔏 [API Security] 签名已添加')
    }

    // ========================================================================
    // IDEMPOTENCY KEY (for write operations on protected paths)
    // ========================================================================
    // Generates a unique key based on request content (method, URL, data)
    // to prevent duplicate requests from creating duplicate data.
    //
    // **Validates: Requirements 2.2.1, 2.2.3**
    // ========================================================================
    if (shouldAddIdempotencyKey(config.method, config.url || '', DEFAULT_IDEMPOTENCY_CONFIG)) {
      try {
        const idempotencyKey = await generateIdempotencyKey(
          config.method || 'POST',
          config.url || '',
          config.data
        )
        config.headers['X-Idempotency-Key'] = idempotencyKey
        logger.debug('🔑 [API Idempotency] Key已添加:', idempotencyKey.substring(0, 8) + '...')
      } catch (error) {
        logger.warn('⚠️ [API Idempotency] 生成Key失败:', error)
        // Continue without idempotency key - the request will still work
      }
    }

    return config
  },
  error => {
    logger.error('❌ [API Request Error]', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  response => {
    // ========================================================================
    // PERFORMANCE MONITORING - Record API latency for successful requests
    // ========================================================================
    // **Validates: Requirements 4.1.2**
    // ========================================================================
    const startTime = response.config._startTime
    if (startTime) {
      const duration = Date.now() - startTime
      recordApiLatency(
        response.config.url || '',
        response.config.method || 'GET',
        duration,
        response.status,
        true
      )
    }

    // ========================================================================
    // CACHE RESPONSE HANDLING
    // ========================================================================
    // Handle 304 Not Modified responses and cache new responses
    //
    // **Validates: Requirements 4.2.1, 4.2.2, 4.2.4**
    // ========================================================================
    if (response.config._useCache && response.config._cacheKey) {
      const cacheKey = response.config._cacheKey

      // Handle 304 Not Modified - return cached data
      if (response.status === 304) {
        const cached = cacheManager.get(cacheKey)
        if (cached) {
          logger.debug('📦 [API Cache] 304 Not Modified, using cached data:', cacheKey)
          return { ...response, data: cached.data }
        }
      }

      // Cache the new response with ETag/Last-Modified from headers
      const etag = response.headers['etag']
      const lastModified = response.headers['last-modified']

      cacheManager.set(cacheKey, response.data, {
        etag,
        lastModified
      })

      logger.debug('📦 [API Cache] Cached response:', {
        key: cacheKey,
        etag: etag || 'none',
        lastModified: lastModified || 'none'
      })
    }

    // 🔍 调试日志：响应成功
    logger.debug('✅ [API Response]', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      requestId: response.config.headers['X-Request-ID'],
      cached: response.status === 304,
      headers: {
        'content-type': response.headers['content-type'],
        etag: response.headers['etag'],
        'last-modified': response.headers['last-modified']
      }
    })

    // 🔧 统一处理多种后端响应格式
    const data = response.data

    // 格式1: { code: 0, data: {...}, message: "..." }
    if (data && typeof data === 'object' && 'code' in data) {
      logger.debug('📦 [API Format] 检测到格式1: { code, data, message }')
      if (data.code === 0) {
        // 成功响应，统一转换为 { success: true, data: ... }
        return {
          ...response,
          data: {
            success: true,
            data: data.data,
            message: data.message
          }
        }
      } else {
        // 业务错误，抛出异常
        logger.error('❌ [API Business Error] code:', data.code, 'message:', data.message)
        throw new Error(data.message || 'Request failed')
      }
    }

    // 格式2: { success: true, data: {...} }
    if (data && typeof data === 'object' && 'success' in data) {
      logger.debug('📦 [API Format] 检测到格式2: { success, data }')
      return response
    }

    // 格式3: 直接返回数据（数组或对象）
    logger.debug('📦 [API Format] 检测到格式3: 直接返回数据')
    return {
      ...response,
      data: {
        success: true,
        data: data
      }
    }
  },
  (error: AxiosError) => {
    // ========================================================================
    // PERFORMANCE MONITORING - Record API latency for failed requests
    // ========================================================================
    // **Validates: Requirements 4.1.2**
    // ========================================================================
    const startTime = error.config?._startTime
    if (startTime) {
      const duration = Date.now() - startTime
      recordApiLatency(
        error.config?.url || '',
        error.config?.method || 'GET',
        duration,
        error.response?.status,
        false
      )
    }

    // 🔍 调试日志：响应错误
    logger.error('❌ [API Response Error]', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data,
      code: error.code,
      requestId: error.config?.headers?.['X-Request-ID']
    })

    // ⚠️ 降级机制已禁用，所有数据从后端API获取
    // 如果后端服务不可用，将直接返回错误给用户处理

    if (error.response?.status === 401) {
      logger.warn('🔒 [API Auth] 401 未授权')
      // 检查是否是登录请求本身失败（不需要重定向）
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      if (!isLoginRequest) {
        // 非登录请求的 401 错误，清除登录状态并重定向
        // 但不立即重定向，让调用者有机会处理错误（如降级到本地数据）
        const authStore = useAuthStore()
        authStore.logout()
        // 延迟重定向，给调用者处理错误的机会
        setTimeout(() => {
          // 只有当前不在登录页时才重定向
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }, 100)
      }
    }

    // ========================================================================
    // UNIFIED ERROR HANDLING
    // ========================================================================
    // Transform error to consistent ApiErrorResponse format with:
    // - code: Error code (e.g., "AUTH_001", "VAL_001")
    // - message: User-friendly error message
    // - requestId: Unique request ID for tracking
    // - timestamp: ISO 8601 timestamp
    // - details: Additional error details (dev only)
    //
    // **Validates: Requirements 3.1.1, 3.1.2, 3.1.5, P10**
    // ========================================================================
    const apiError = transformError(error)
    const extendedError: ExtendedErrorInfo = toExtendedError(apiError, error)

    logger.error('❌ [API Error] 统一错误格式:', {
      code: extendedError.code,
      message: extendedError.message,
      requestId: extendedError.requestId,
      severity: extendedError.severity,
      retryable: extendedError.retryable
    })

    return Promise.reject(extendedError)
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
  async upload<T>(
    url: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // File download
  async download(url: string, filename?: string): Promise<void> {
    const response = await api.get(url, {
      responseType: 'blob'
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
  }
}

export default api

// Re-export error handling utilities for use in components
export { formatErrorMessage, isRetryableError, getErrorSeverity } from './errorHandler'
export type { ExtendedErrorInfo } from '@/types/error'

// Re-export cache utilities for manual cache management
export { refreshCache, refreshCachePattern, cacheManager, getFromCache } from '@/utils/cache'
