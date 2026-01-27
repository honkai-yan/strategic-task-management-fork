import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '@/types'
import api from '@/api'
import { logger } from '@/utils/logger'
import { tokenManager, TokenRefreshError } from '@/utils/tokenManager'
import { useTimeContextStore } from './timeContext'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  // Token 现在由 tokenManager 管理（内存存储），不再使用 localStorage
  // 这里的 token ref 仅用于响应式状态追踪
  const token = ref<string | null>(tokenManager.getAccessToken())
  const loading = ref(false)
  const sessionRestoring = ref(false) // 会话恢复状态

  // 视角切换状态（用于战略发展部查看其他部门视角）
  const viewingAsRole = ref<UserRole | null>(null)
  const viewingAsDepartment = ref<string | null>(null)

  // 映射后端OrgType到前端UserRole
  const mapOrgTypeToRole = (orgType: string): UserRole | null => {
    const mapping: Record<string, UserRole> = {
      STRATEGY_DEPT: 'strategic_dept',
      FUNCTIONAL_DEPT: 'functional_dept',
      FUNCTION_DEPT: 'functional_dept',
      COLLEGE: 'secondary_college',
      SCHOOL: 'strategic_dept',
      DIVISION: 'secondary_college',
      OTHER: 'secondary_college'
    }
    return mapping[orgType] || null
  }

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => {
    if (!user.value) {
      return null
    }
    // 如果user已经有role字段,直接使用
    if (user.value.role) {
      return user.value.role
    }
    // 否则从orgType映射
    return mapOrgTypeToRole((user.value as any).orgType) || null
  })
  const userName = computed(() => user.value?.name || (user.value as any)?.realName || '')
  const userDepartment = computed(
    () => user.value?.department || (user.value as any)?.orgName || ''
  )

  // 当前有效角色（考虑视角切换）
  const effectiveRole = computed(() => viewingAsRole.value || user.value?.role || null)
  const effectiveDepartment = computed(
    () => viewingAsDepartment.value || user.value?.department || ''
  )

  // Actions
  const login = async (credentials: { username: string; password: string }) => {
    loading.value = true
    logger.debug('🔐 [Auth] 开始登录:', credentials.username)

    try {
      const response = await api.post('/auth/login', credentials)
      logger.debug('📦 [Auth] 登录响应:', response)

      // 兼容多种响应格式
      let loginData: { token: string; user: any } | null = null

      // API 拦截器已将响应转换为 { success: true, data: { token, user } } 格式
      // 格式1: { success: true, data: { token, user } } (经过拦截器转换)
      if (response.data?.success && response.data?.data?.token) {
        logger.debug('✅ [Auth] 响应格式1: { success: true, data: { token, user } }')
        loginData = response.data.data
      }
      // 格式2: { code: 0, data: { token, user } } (原始后端格式，未经拦截器)
      else if (response.data?.code === 0 && response.data?.data?.token) {
        logger.debug('✅ [Auth] 响应格式2: { code: 0, data: {...} }')
        loginData = response.data.data
      }
      // 格式3: { token, user } (直接返回)
      else if (response.data?.token && response.data?.user) {
        logger.debug('✅ [Auth] 响应格式3: { token, user }')
        loginData = response.data
      }
      // 格式4: { data: { token, user } } (无code/success字段)
      else if (response.data?.data?.token && response.data?.data?.user) {
        logger.debug('✅ [Auth] 响应格式4: { data: { token, user } }')
        loginData = response.data.data
      }
      // 格式5: 直接在response.data中
      else if (response.data) {
        logger.debug('⚠️ [Auth] 尝试解析未知格式:', response.data)
        // 尝试从response.data中提取
        const data = response.data
        if (data.token || data.accessToken) {
          loginData = {
            token: data.token || data.accessToken,
            user: data.user || data.userInfo || {}
          }
        }
      }

      if (loginData && loginData.token) {
        logger.debug('✅ [Auth] 登录成功，Token:', loginData.token.substring(0, 20) + '...')
        logger.debug('👤 [Auth] 用户数据:', loginData.user)

        token.value = loginData.token
        const userData = loginData.user

        // 映射后端字段到前端User类型
        const mappedRole = mapOrgTypeToRole(userData.orgType || userData.role)
        const mappedUser: User = {
          id: userData.userId?.toString() || userData.id?.toString() || '',
          username: userData.username || '',
          name: userData.realName || userData.name || userData.username || '',
          role: mappedRole || 'secondary_college', // 默认角色
          department: userData.orgName || userData.department || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        logger.debug('✅ [Auth] 映射后的用户:', mappedUser)
        user.value = mappedUser

        // 使用 TokenManager 存储 Token (内存存储)
        tokenManager.setAccessToken(loginData.token)
        token.value = loginData.token

        // 保存用户信息和token到 localStorage (用于页面刷新后恢复会话)
        localStorage.setItem('currentUser', JSON.stringify(mappedUser))
        localStorage.setItem('token', loginData.token)

        logger.debug('✅ [Auth] 登录状态已保存 (Token 在内存中，用户信息在 localStorage)')

        // 登录成功后，触发数据重新加载
        // 使用 nextTick 确保 token 已经设置完成
        import('./strategic')
          .then(({ useStrategicStore }) => {
            const strategicStore = useStrategicStore()
            const timeContext = useTimeContextStore()
            logger.debug('🔄 [Auth] 登录成功，重新加载指标数据...')
            strategicStore.loadIndicatorsByYear(timeContext.currentYear)
          })
          .catch(err => {
            logger.warn('⚠️ [Auth] 重新加载数据失败:', err)
          })

        return { success: true }
      } else {
        logger.error('❌ [Auth] 响应中未找到token或user数据')
        logger.error('❌ [Auth] 完整响应:', JSON.stringify(response.data, null, 2))
        return {
          success: false,
          error: response.data?.message || '登录失败：服务器响应格式错误'
        }
      }
    } catch (error: any) {
      logger.error('❌ [Auth] 登录异常:', error)
      logger.error('❌ [Auth] 错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      return {
        success: false,
        error: error.response?.data?.message || error.message || '登录失败：网络错误'
      }
    } finally {
      loading.value = false
      logger.debug('🏁 [Auth] 登录流程结束')
    }
  }

  const logout = () => {
    user.value = null
    token.value = null

    // 清除 TokenManager 中的 Token
    tokenManager.clearAccessToken()

    // 清除 localStorage 中的用户信息
    // 注意: auth_token 已经不再存储在 localStorage 中
    localStorage.removeItem('currentUser')

    // 防御性清理: 确保旧的 auth_token 也被清除
    localStorage.removeItem('auth_token')

    logger.debug('[Auth] 用户已登出，所有凭证已清除')
  }

  const fetchUser = async () => {
    if (!token.value) {
      return
    }

    try {
      const response = await api.get('/auth/me')

      // 后端返回格式: { code: 0, message: "...", data: user, timestamp: ... }
      if (response.data.code === 0 && response.data.data) {
        user.value = response.data.data
        localStorage.setItem('currentUser', JSON.stringify(response.data.data))
      } else {
        // Token invalid, clear auth state
        logout()
      }
    } catch (error) {
      logger.error('Fetch user error:', error)
      logout()
    }
  }

  const hasPermission = (resource: string, action: string) => {
    if (!user.value) {
      return false
    }

    // Define role-based permissions
    const permissions = {
      strategic_dept: [
        'strategic_tasks:create',
        'strategic_tasks:read',
        'strategic_tasks:update',
        'strategic_tasks:delete',
        'indicators:create',
        'indicators:read',
        'indicators:update',
        'indicators:delete',
        'approvals:read',
        'approvals:approve'
      ],
      functional_dept: [
        'indicators:read',
        'indicators:update', // Only their own indicators
        'reports:create',
        'reports:read',
        'reports:update',
        'approvals:read',
        'approvals:approve' // Only for secondary college submissions
      ],
      secondary_college: [
        'reports:create',
        'reports:read',
        'reports:update' // Only their own reports
      ]
    }

    const rolePermissions = permissions[user.value.role] || []
    return rolePermissions.includes(`${resource}:${action}`)
  }

  // Initialize auth state on store creation
  // 页面刷新后恢复会话（优先使用 localStorage 中的 token）
  const initializeAuth = async () => {
    const savedUser = localStorage.getItem('currentUser')
    const savedToken = localStorage.getItem('token')

    // 检查是否有内存中的 Token (通常页面刷新后会丢失)
    const memoryToken = tokenManager.getAccessToken()

    if (memoryToken && savedUser) {
      // 内存中有 Token，直接恢复状态
      try {
        const parsedUser = JSON.parse(savedUser)
        if (parsedUser && parsedUser.role) {
          user.value = parsedUser
          token.value = memoryToken
          logger.debug('[Auth] 从内存恢复会话:', parsedUser.name, parsedUser.role)
          return
        }
      } catch (e) {
        logger.error('[Auth] 解析用户信息失败:', e)
      }
    }

    // 内存中没有 Token，但 localStorage 中有 Token，直接恢复
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        if (parsedUser && parsedUser.role) {
          // 将 localStorage 中的 token 恢复到内存
          tokenManager.setAccessToken(savedToken)
          user.value = parsedUser
          token.value = savedToken
          logger.debug('[Auth] 从 localStorage 恢复会话:', parsedUser.name, parsedUser.role)
          return
        }
      } catch (e) {
        logger.error('[Auth] 解析用户信息失败:', e)
      }
    }

    // localStorage 中也没有有效 Token，尝试通过 Refresh Token 恢复会话
    if (savedUser) {
      sessionRestoring.value = true
      logger.debug('[Auth] 尝试通过 Refresh Token 恢复会话...')

      try {
        // 调用 tokenManager 刷新 Token
        const newToken = await tokenManager.refreshAccessToken()

        // 刷新成功，恢复用户状态
        const parsedUser = JSON.parse(savedUser)
        if (parsedUser && parsedUser.role) {
          user.value = parsedUser
          token.value = newToken
          // 同时保存到 localStorage
          localStorage.setItem('token', newToken)
          logger.debug('[Auth] 会话恢复成功:', parsedUser.name)
        } else {
          logger.warn('[Auth] 用户信息缺少 role，清除登录状态')
          logout()
        }
      } catch (error) {
        // Refresh Token 无效或过期，清除登录状态
        if (error instanceof TokenRefreshError) {
          logger.warn('[Auth] Refresh Token 无效，需要重新登录:', error.message)
        } else {
          logger.error('[Auth] 会话恢复失败:', error)
        }
        logout()
      } finally {
        sessionRestoring.value = false
      }
    }

    // 防御性清理: 确保 localStorage 中没有 auth_token
    localStorage.removeItem('auth_token')
  }

  // 立即初始化 (异步)
  initializeAuth()

  // 切换视角（仅战略发展部可用）
  const setViewingAs = (role: UserRole | null, department: string | null) => {
    viewingAsRole.value = role
    viewingAsDepartment.value = department
  }

  // 重置视角到实际用户
  const resetViewingAs = () => {
    viewingAsRole.value = null
    viewingAsDepartment.value = null
  }

  return {
    // State
    user,
    token,
    loading,
    sessionRestoring,
    viewingAsRole,
    viewingAsDepartment,

    // Getters
    isAuthenticated,
    userRole,
    userName,
    userDepartment,
    effectiveRole,
    effectiveDepartment,

    // Actions
    login,
    logout,
    fetchUser,
    hasPermission,
    setViewingAs,
    resetViewingAs
  }
})
