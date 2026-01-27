/**
 * 前端数据降级服务
 * 
 * 当后端 API 不可用时（网络错误或 5xx），自动切换到本地模拟数据
 * 
 * Requirements: 6.1, 6.2
 */
import type { AxiosError } from 'axios'
import type { ApiResponse, StrategicIndicator } from '@/types'
import {
  allMockIndicators,
  mockIndicators2026,
  mockDashboardData,
  mockDepartmentProgress,
  mockOrgTree,
  getMockIndicatorsByYear
} from '@/data/mockIndicators'
import { logger } from '@/utils/logger'

/**
 * 降级配置
 */
export interface FallbackConfig {
  /** 是否启用降级 */
  enabled: boolean
  /** 强制使用模拟数据（通过环境变量 VITE_USE_MOCK=true 配置） */
  forceMock: boolean
}

/**
 * 获取降级配置
 */
export function getFallbackConfig(): FallbackConfig {
  const forceMock = import.meta.env['VITE_USE_MOCK'] === 'true'
  return {
    enabled: true,
    forceMock
  }
}

/**
 * 判断是否应该触发降级
 * 
 * 降级触发条件：
 * 1. 网络错误 (Network Error)
 * 2. 服务器错误 (status >= 500)
 * 3. 环境变量 VITE_USE_MOCK=true
 * 
 * @param error Axios 错误对象
 * @returns 是否应该降级
 */
export function shouldFallback(error?: AxiosError | null): boolean {
  const config = getFallbackConfig()
  
  // 强制使用模拟数据
  if (config.forceMock) {
    return true
  }
  
  // 没有错误时不降级
  if (!error) {
    return false
  }
  
  // 网络错误（无响应）
  if (!error.response) {
    return true
  }
  
  // 服务器错误 (5xx)
  const status = error.response.status
  if (status >= 500 && status < 600) {
    return true
  }
  
  return false
}

/**
 * 记录降级日志
 * 
 * @param url 请求 URL
 * @param reason 降级原因
 */
export function logFallback(url: string, reason: string): void {
  logger.warn(`[Fallback] API 降级: ${url}`)
  logger.warn(`[Fallback] 原因: ${reason}`)
  logger.warn(`[Fallback] 已切换到本地模拟数据`)
}

/**
 * URL 到模拟数据的映射类型
 */
type MockDataGenerator<T> = () => T

/**
 * 模拟数据路由映射
 */
const mockDataRoutes: Record<string, MockDataGenerator<unknown>> = {
  // 指标相关
  '/indicators': () => allMockIndicators,
  '/indicators/tree': () => buildIndicatorTree(mockIndicators2026),
  '/indicators/current': () => mockIndicators2026,
  
  // 仪表盘
  '/dashboard': () => mockDashboardData,
  '/dashboard/summary': () => mockDashboardData,
  
  // 部门进度
  '/departments/progress': () => mockDepartmentProgress,
  
  // 组织树
  '/orgs/tree': () => mockOrgTree,
  '/orgs': () => mockOrgTree,
  
  // 任务相关
  '/tasks': () => [],
  
  // 里程碑
  '/milestones': () => []
}

/**
 * 构建指标树结构
 */
function buildIndicatorTree(indicators: StrategicIndicator[]): StrategicIndicator[] {
  // 分离父指标和子指标
  const parentIndicators = indicators.filter(i => !i.parentIndicatorId)
  const childIndicators = indicators.filter(i => i.parentIndicatorId)
  
  // 为每个父指标添加子指标
  return parentIndicators.map(parent => ({
    ...parent,
    children: childIndicators.filter(child => child.parentIndicatorId === parent.id)
  }))
}

/**
 * 获取模拟数据
 * 
 * @param url 请求 URL
 * @returns 模拟数据响应，如果没有匹配的路由则返回 null
 */
export function getMockData<T>(url: string): ApiResponse<T> | null {
  // 移除查询参数
  const cleanUrl = url.split('?')[0] || ''
  
  // 尝试精确匹配
  let generator = mockDataRoutes[cleanUrl]
  
  // 尝试前缀匹配
  if (!generator) {
    for (const [route, gen] of Object.entries(mockDataRoutes)) {
      if (cleanUrl.startsWith(route) || cleanUrl.includes(route)) {
        generator = gen
        break
      }
    }
  }
  
  // 处理带年份参数的指标请求
  if (!generator && cleanUrl.includes('/indicators')) {
    const yearMatch = url.match(/year=(\d{4})/)
    if (yearMatch && yearMatch[1]) {
      const year = parseInt(yearMatch[1], 10)
      generator = () => getMockIndicatorsByYear(year)
    } else {
      generator = () => mockIndicators2026
    }
  }
  
  if (!generator) {
    return null
  }
  
  const data = generator() as T
  
  return {
    data,
    message: '降级数据',
    success: true,
    timestamp: new Date()
  }
}

/**
 * 获取降级原因描述
 */
export function getFallbackReason(error?: AxiosError | null): string {
  const config = getFallbackConfig()
  
  if (config.forceMock) {
    return '环境变量 VITE_USE_MOCK=true 强制使用模拟数据'
  }
  
  if (!error) {
    return '未知原因'
  }
  
  if (!error.response) {
    return `网络错误: ${error.message || 'Network Error'}`
  }
  
  const status = error.response.status
  if (status >= 500) {
    return `服务器错误: HTTP ${status}`
  }
  
  return `请求失败: HTTP ${status}`
}

/**
 * 降级服务类
 */
export class FallbackService {
  private config: FallbackConfig
  
  constructor() {
    this.config = getFallbackConfig()
  }
  
  /**
   * 判断是否应该降级
   */
  shouldFallback(error?: AxiosError | null): boolean {
    return shouldFallback(error)
  }
  
  /**
   * 获取模拟数据
   */
  getMockData<T>(url: string): ApiResponse<T> | null {
    return getMockData<T>(url)
  }
  
  /**
   * 记录降级日志
   */
  logFallback(url: string, reason: string): void {
    logFallback(url, reason)
  }
  
  /**
   * 获取降级原因
   */
  getFallbackReason(error?: AxiosError | null): string {
    return getFallbackReason(error)
  }
  
  /**
   * 是否强制使用模拟数据
   */
  isForceMock(): boolean {
    return this.config.forceMock
  }
}

// 导出单例实例
export const fallbackService = new FallbackService()

export default fallbackService
