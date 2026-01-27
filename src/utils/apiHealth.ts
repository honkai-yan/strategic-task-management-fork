/**
 * API健康检查工具
 * 用于诊断后端服务连接问题
 */

import api from '@/api'
import { logger } from '@/utils/logger'

export interface HealthCheckResult {
  service: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
  timestamp: Date
}

/**
 * 检查后端服务是否可用
 */
export async function checkBackendHealth(): Promise<HealthCheckResult> {
  logger.debug('🏥 [Health Check] 检查后端服务健康状态...')
  
  try {
    // 尝试访问一个简单的端点（通常是健康检查端点）
    const response = await api.get('/health', { timeout: 5000 })
    
    logger.debug('✅ [Health Check] 后端服务正常')
    return {
      service: 'Backend API',
      status: 'success',
      message: '后端服务运行正常',
      details: response.data,
      timestamp: new Date()
    }
  } catch (error: any) {
    logger.error('❌ [Health Check] 后端服务异常:', error)
    
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      return {
        service: 'Backend API',
        status: 'error',
        message: '无法连接到后端服务，请确认后端是否运行在 http://localhost:8080',
        details: { error: error.message, code: error.code },
        timestamp: new Date()
      }
    }
    
    if (error.response?.status === 404) {
      return {
        service: 'Backend API',
        status: 'warning',
        message: '后端服务可访问，但健康检查端点不存在（这是正常的）',
        details: { status: 404 },
        timestamp: new Date()
      }
    }
    
    return {
      service: 'Backend API',
      status: 'error',
      message: `后端服务异常: ${error.message}`,
      details: { error: error.message, response: error.response?.data },
      timestamp: new Date()
    }
  }
}

/**
 * 测试认证流程
 */
export async function checkAuthFlow(credentials?: { username: string; password: string }): Promise<HealthCheckResult> {
  logger.debug('🔐 [Health Check] 测试认证流程...')
  
  const testCredentials = credentials || {
    username: 'admin',
    password: '123456'
  }
  
  try {
    const response = await api.post('/auth/login', testCredentials)
    
    logger.debug('✅ [Health Check] 认证流程正常')
    logger.debug('📦 [Health Check] 登录响应:', response.data)
    
    // 检查响应格式
    const hasToken = !!(
      response.data?.token ||
      response.data?.data?.token ||
      response.data?.accessToken
    )
    
    if (hasToken) {
      return {
        service: 'Authentication',
        status: 'success',
        message: '认证流程正常，Token获取成功',
        details: {
          responseFormat: response.data,
          hasToken: true
        },
        timestamp: new Date()
      }
    } else {
      return {
        service: 'Authentication',
        status: 'warning',
        message: '认证请求成功，但响应格式可能不正确（未找到token）',
        details: {
          responseFormat: response.data,
          hasToken: false
        },
        timestamp: new Date()
      }
    }
  } catch (error: any) {
    logger.error('❌ [Health Check] 认证流程异常:', error)
    
    if (error.response?.status === 401) {
      return {
        service: 'Authentication',
        status: 'warning',
        message: '认证端点可访问，但测试凭据无效（这可能是正常的）',
        details: { status: 401, message: error.response?.data?.message },
        timestamp: new Date()
      }
    }
    
    return {
      service: 'Authentication',
      status: 'error',
      message: `认证流程异常: ${error.message}`,
      details: { error: error.message, response: error.response?.data },
      timestamp: new Date()
    }
  }
}

/**
 * 检查关键API端点
 */
export async function checkCriticalEndpoints(): Promise<HealthCheckResult[]> {
  logger.debug('🔍 [Health Check] 检查关键API端点...')
  
  const endpoints = [
    { path: '/orgs', name: '组织机构' },
    { path: '/indicators', name: '指标' },
    { path: '/tasks', name: '任务' },
    { path: '/milestones', name: '里程碑' }
  ]
  
  const results: HealthCheckResult[] = []
  
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint.path, { timeout: 5000 })
      
      logger.debug(`✅ [Health Check] ${endpoint.name}端点正常`)
      results.push({
        service: endpoint.name,
        status: 'success',
        message: `${endpoint.name}端点可访问`,
        details: { path: endpoint.path, status: response.status },
        timestamp: new Date()
      })
    } catch (error: any) {
      logger.error(`❌ [Health Check] ${endpoint.name}端点异常:`, error)
      
      // 401/403 表示端点存在但需要认证，这是正常的
      if (error.response?.status === 401 || error.response?.status === 403) {
        results.push({
          service: endpoint.name,
          status: 'success',
          message: `${endpoint.name}端点存在（需要认证）`,
          details: { path: endpoint.path, status: error.response.status },
          timestamp: new Date()
        })
      } else {
        results.push({
          service: endpoint.name,
          status: 'error',
          message: `${endpoint.name}端点异常: ${error.message}`,
          details: { path: endpoint.path, error: error.message },
          timestamp: new Date()
        })
      }
    }
  }
  
  return results
}

/**
 * 运行完整的健康检查
 */
export async function runFullHealthCheck(): Promise<{
  overall: 'healthy' | 'degraded' | 'unhealthy'
  results: HealthCheckResult[]
  summary: string
}> {
  logger.debug('🏥 [Health Check] 开始完整健康检查...')
  
  const results: HealthCheckResult[] = []
  
  // 1. 检查后端服务
  const backendHealth = await checkBackendHealth()
  results.push(backendHealth)
  
  // 2. 测试认证流程
  const authHealth = await checkAuthFlow()
  results.push(authHealth)
  
  // 3. 检查关键端点
  const endpointResults = await checkCriticalEndpoints()
  results.push(...endpointResults)
  
  // 计算整体健康状态
  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length
  const successCount = results.filter(r => r.status === 'success').length
  
  let overall: 'healthy' | 'degraded' | 'unhealthy'
  let summary: string
  
  if (errorCount === 0 && warningCount === 0) {
    overall = 'healthy'
    summary = '所有服务运行正常'
  } else if (errorCount === 0) {
    overall = 'degraded'
    summary = `${warningCount} 个服务有警告`
  } else {
    overall = 'unhealthy'
    summary = `${errorCount} 个服务异常，${warningCount} 个服务有警告`
  }
  
  logger.debug(`🏥 [Health Check] 检查完成: ${overall}`)
  logger.debug(`📊 [Health Check] 成功: ${successCount}, 警告: ${warningCount}, 错误: ${errorCount}`)
  
  return {
    overall,
    results,
    summary
  }
}

/**
 * 在开发环境下自动运行健康检查
 */
export function autoHealthCheck() {
  if (import.meta.env.DEV) {
    logger.debug('🏥 [Health Check] 开发环境，自动运行健康检查...')
    
    // 延迟1秒执行，确保应用已初始化
    setTimeout(async () => {
      const result = await runFullHealthCheck()
      
      logger.info('🏥 健康检查报告')
      logger.info('整体状态:', result.overall)
      logger.info('摘要:', result.summary)
      logger.debug('详细结果:', result.results.map(r => ({
        服务: r.service,
        状态: r.status,
        消息: r.message
      })))
      
      // 如果有严重问题，显示警告
      if (result.overall === 'unhealthy') {
        logger.warn('⚠️ 检测到后端服务问题，请检查:')
        logger.warn('1. 后端服务是否运行在 http://localhost:8080')
        logger.warn('2. 数据库连接是否正常')
        logger.warn('3. 查看后端日志获取详细错误信息')
      }
    }, 1000)
  }
}
