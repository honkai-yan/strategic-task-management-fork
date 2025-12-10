import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
    path: '/approval',
    name: 'Approval',
    component: () => import('@/views/ApprovalView.vue'),
    meta: { requiresAuth: true, roles: ['strategic_dept', 'functional_dept'] }
  },
  {
    path: '/reporting',
    name: 'Reporting',
    component: () => import('@/views/ReportingView.vue'),
    meta: { requiresAuth: true, roles: ['functional_dept', 'secondary_college'] }
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
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.meta['requiresAuth'] && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check if route requires specific roles
  if (to.meta['roles'] && Array.isArray(to.meta['roles'])) {
    const userRole = authStore.user?.role
    if (!userRole || !(to.meta['roles'] as string[]).includes(userRole)) {
      next('/dashboard')
      return
    }
  }

  // Redirect authenticated users away from login page
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router