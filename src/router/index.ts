import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 确保从 localStorage 恢复认证状态
const ensureAuthRestored = () => {
  const authStore = useAuthStore()
  
  // 如果有 token 但没有 user 或 user 没有 id，尝试从 localStorage 恢复
  if (authStore.token && (!authStore.user || !authStore.user.id)) {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        authStore.user = JSON.parse(savedUser)
        console.log('Router: Auth state restored from localStorage')
      } catch (e) {
        console.error('Failed to restore user from localStorage:', e)
        authStore.logout()
      }
    }
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/strategic-tasks',
    name: 'StrategicTasks',
    component: () => import('@/views/StrategicTaskView.vue'),
    meta: { requiresAuth: true, roles: ['strategic_dept'] }
  },
  {
    path: '/indicators',
    name: 'Indicators',
    component: () => import('@/views/IndicatorListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/distribution',
    name: 'Distribution',
    component: () => import('@/views/IndicatorDistributionView.vue'),
    meta: { requiresAuth: true, roles: ['functional_dept'] }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/MessageCenterView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('@/views/404.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, _from, next) => {
  // 确保认证状态已从 localStorage 恢复
  ensureAuthRestored()
  
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.meta['requiresAuth'] && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check if route requires specific roles
  // 使用 effectiveRole 来支持战略发展部的视角切换功能
  if (to.meta['roles'] && Array.isArray(to.meta['roles']) && authStore.isAuthenticated) {
    const currentRole = authStore.effectiveRole
    const userRole = authStore.userRole
    
    // 战略发展部用户可以访问所有页面（通过视角切换）
    if (userRole === 'strategic_dept') {
      // 战略发展部用户始终允许访问，不做角色限制
      next()
      return
    }
    
    // 如果当前有效角色不在允许的角色列表中，才重定向
    if (currentRole && !(to.meta['roles'] as string[]).includes(currentRole)) {
      next('/dashboard')
      return
    }
    // 如果角色为空但已认证，允许访问（可能是数据恢复问题）
  }

  // Redirect authenticated users away from login page
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router