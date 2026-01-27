/**
 * 统一错误处理器
 * 
 * 提供前端错误格式转换、requestId 生成和错误处理逻辑
 * 
 * **Validates: Requirements 3.1.1, 3.1.2, 3.1.5**
 * **Validates: P10 - 所有错误响应包含 requestId 用于追踪**
 */

import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorResponse, ExtendedErrorInfo } from '@/types/error'
import { ErrorSeverity, isApiErrorResponse } from '@/types/error'
import { getErrorCodeByStatus, getErrorDefinition } from '@/constants/errorCodes'
import { logger } from '@/utils/logger'

/**
 * 生成唯一的请求 ID
 * 使用 UUID v4 格式
 * 
 * @returns 唯一的请求 ID 字符串
 */
export function generateRequestId(): string {
  // 使用 crypto.randomUUID() 如果可用（现代浏览器）
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // 降级方案：手动生成 UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 请求 ID 存储
 * 用于在请求和响应之间传递 requestId
 */
const requestIdMap = new WeakMap<InternalAxiosRequestConfig, string>()

/**
 * 为请求配置添加 requestId
 * 
 * @param config Axios 请求配置
 * @returns 带有 requestId 的请求配置
 */
export function addRequestId(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const requestId = generateRequestId()
  
  // 存储 requestId 以便后续使用
  requestIdMap.set(config, requestId)
  
  // 添加到请求头
  config.headers = config.headers || {}
  config.headers['X-Request-ID'] = requestId
  
  logger.debug('🔖 [ErrorHandler] RequestId 已添加:', requestId.substring(0, 8) + '...')
  
  return config
}

/**
 * 从请求配置中获取 requestId
 * 
 * @param config Axios 请求配置
 * @returns requestId 或生成新的
 */
export function getRequestId(config?: InternalAxiosRequestConfig): string {
  if (config) {
    // 尝试从 WeakMap 获取
    const storedId = requestIdMap.get(config)
    if (storedId) {
      return storedId
    }
    
    // 尝试从请求头获取
    const headerId = config.headers?.['X-Request-ID']
    if (typeof headerId === 'string') {
      return headerId
    }
  }
  
  // 生成新的 requestId
  return generateRequestId()
}

/**
 * 将 Axios 错误转换为统一的 ApiErrorResponse 格式
 * 
 * @param error Axios 错误对象
 * @returns 统一格式的错误响应
 */
export function transformError(error: AxiosError): ApiErrorResponse {
  const requestId = getRequestId(error.config)
  const timestamp = new Date().toISOString()
  
  // 如果响应已经是标准格式，直接使用
  if (error.response?.data && isApiErrorResponse(error.response.data)) {
    const responseError = error.response.data as ApiErrorResponse
    return {
      ...responseError,
      requestId: responseError.requestId || requestId,
      timestamp: responseError.timestamp || timestamp,
    }
  }
  
  // 处理网络错误（无响应）
  if (!error.response) {
    return {
      code: 'NET_001',
      message: '网络连接失败',
      details: {
        originalMessage: error.message,
        code: error.code,
      },
      requestId,
      timestamp,
    }
  }
  
  // 处理超时错误
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return {
      code: 'NET_002',
      message: '请求超时',
      details: {
        timeout: error.config?.timeout,
      },
      requestId,
      timestamp,
    }
  }
  
  // 根据 HTTP 状态码获取错误码
  const status = error.response.status
  const errorCode = getErrorCodeByStatus(status)
  
  // 尝试从响应中提取错误信息
  const responseData = error.response.data as Record<string, unknown> | undefined
  const message = extractErrorMessage(responseData, status)
  const details = extractErrorDetails(responseData)
  
  return {
    code: (responseData?.code as string) || errorCode,
    message,
    details,
    requestId,
    timestamp,
  }
}

/**
 * 从响应数据中提取错误消息
 */
function extractErrorMessage(data: Record<string, unknown> | undefined, status: number): string {
  if (!data) {
    return getDefaultMessageByStatus(status)
  }
  
  // 尝试多种可能的消息字段
  if (typeof data.message === 'string' && data.message) {
    return data.message
  }
  if (typeof data.error === 'string' && data.error) {
    return data.error
  }
  if (typeof data.msg === 'string' && data.msg) {
    return data.msg
  }
  
  return getDefaultMessageByStatus(status)
}

/**
 * 从响应数据中提取错误详情
 */
function extractErrorDetails(data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!data) {
    return undefined
  }
  
  // 如果有 details 字段，直接使用
  if (data.details && typeof data.details === 'object') {
    return data.details as Record<string, unknown>
  }
  
  // 如果有 errors 字段（验证错误），包装为 details
  if (data.errors && typeof data.errors === 'object') {
    return { errors: data.errors }
  }
  
  // 如果有 data 字段且包含错误信息
  if (data.data && typeof data.data === 'object') {
    return data.data as Record<string, unknown>
  }
  
  return undefined
}

/**
 * 根据 HTTP 状态码获取默认错误消息
 */
function getDefaultMessageByStatus(status: number): string {
  switch (status) {
    case 400:
      return '请求参数错误'
    case 401:
      return '未授权访问'
    case 403:
      return '权限不足'
    case 404:
      return '资源不存在'
    case 409:
      return '资源冲突'
    case 422:
      return '数据验证失败'
    case 429:
      return '请求过于频繁'
    case 500:
      return '服务器内部错误'
    case 502:
      return '网关错误'
    case 503:
      return '服务暂不可用'
    case 504:
      return '网关超时'
    default:
      return '请求失败'
  }
}

/**
 * 将 ApiErrorResponse 转换为扩展错误信息
 * 
 * @param error API 错误响应
 * @param originalError 原始错误对象
 * @returns 扩展的错误信息
 */
export function toExtendedError(
  error: ApiErrorResponse,
  originalError?: unknown
): ExtendedErrorInfo {
  const definition = getErrorDefinition(error.code)
  
  return {
    ...error,
    severity: definition.severity,
    retryable: definition.retryable,
    retryAfter: extractRetryAfter(originalError),
    originalError: import.meta.env.DEV ? originalError : undefined,
  }
}

/**
 * 从错误响应中提取重试延迟时间
 */
function extractRetryAfter(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }
  
  const axiosError = error as AxiosError
  const retryAfterHeader = axiosError.response?.headers?.['retry-after']
  
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10)
    if (!isNaN(seconds)) {
      return seconds * 1000 // 转换为毫秒
    }
  }
  
  return undefined
}

/**
 * 创建错误处理器
 * 用于 Axios 响应拦截器
 * 
 * @returns 错误处理函数
 */
export function createErrorHandler() {
  return (error: AxiosError): Promise<never> => {
    const apiError = transformError(error)
    const extendedError = toExtendedError(apiError, error)
    
    // 记录错误日志
    logger.error('❌ [ErrorHandler] API 错误:', {
      code: extendedError.code,
      message: extendedError.message,
      requestId: extendedError.requestId,
      severity: extendedError.severity,
      retryable: extendedError.retryable,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    })
    
    return Promise.reject(extendedError)
  }
}

/**
 * 格式化错误消息用于用户显示
 * 
 * @param error 错误对象
 * @returns 用户友好的错误消息
 */
export function formatErrorMessage(error: unknown): string {
  if (isApiErrorResponse(error)) {
    return error.message || '发生未知错误'
  }
  
  if (error instanceof Error) {
    return error.message || '发生未知错误'
  }
  
  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }
  
  return '发生未知错误'
}

/**
 * 检查错误是否可重试
 * 
 * @param error 错误对象
 * @returns 是否可重试
 */
export function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }
  
  const extendedError = error as Partial<ExtendedErrorInfo>
  
  // 如果有明确的 retryable 标志，使用它
  if (typeof extendedError.retryable === 'boolean') {
    return extendedError.retryable
  }
  
  // 根据错误码判断
  if (extendedError.code) {
    const definition = getErrorDefinition(extendedError.code)
    return definition.retryable
  }
  
  return false
}

/**
 * 获取错误的严重级别
 * 
 * @param error 错误对象
 * @returns 错误严重级别
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (!error || typeof error !== 'object') {
    return ErrorSeverity.ERROR
  }
  
  const extendedError = error as Partial<ExtendedErrorInfo>
  
  // 如果有明确的 severity，使用它
  if (extendedError.severity) {
    return extendedError.severity
  }
  
  // 根据错误码判断
  if (extendedError.code) {
    const definition = getErrorDefinition(extendedError.code)
    return definition.severity
  }
  
  return ErrorSeverity.ERROR
}
