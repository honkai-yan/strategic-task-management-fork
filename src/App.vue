<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DataAnalysis, Document, Edit, Bell, Aim, List, Switch, Promotion } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useTimeContextStore } from '@/stores/timeContext'
import { useOrgStore } from '@/stores/org'
import { useMessageStore } from '@/stores/message'
import YearSelector from '@/components/common/YearSelector.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const timeContext = useTimeContextStore()
const orgStore = useOrgStore()
const messageStore = useMessageStore()

const isLoggedIn = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.user)

// 初始化部门数据 - 在用户登录后加载
onMounted(async () => {
  console.log('🚀 [App] 组件挂载')
  if (authStore.isAuthenticated) {
    console.log('✅ [App] 用户已登录，开始加载部门数据...')
    await orgStore.loadDepartments()
    console.log('✅ [App] 部门数据加载完成，共', orgStore.departments.length, '个部门')
  } else {
    console.log('⚠️ [App] 用户未登录，跳过部门数据加载')
  }
})

// 监听登录状态变化，登录后加载部门数据和消息
watch(() => authStore.isAuthenticated, async (isAuth, wasAuth) => {
  console.log('👁️ [App] 登录状态变化:', { isAuth, wasAuth, loaded: orgStore.loaded })
  
  if (isAuth && !orgStore.loaded) {
    console.log('✅ [App] 用户刚登录，开始加载部门数据和消息...')
    await orgStore.loadDepartments()
    console.log('✅ [App] 部门数据加载完成，共', orgStore.departments.length, '个部门')
    
    // 初始化消息数据
    messageStore.initializeMessages()
    console.log('✅ [App] 消息数据初始化完成，未读消息:', messageStore.unreadCount.all)
  } else if (isAuth && orgStore.loaded) {
    console.log('📋 [App] 用户已登录且部门数据已加载')
    // 确保消息已初始化
    if (messageStore.messages.length === 0) {
      messageStore.initializeMessages()
      console.log('✅ [App] 消息数据初始化完成，未读消息:', messageStore.unreadCount.all)
    }
  } else if (!isAuth) {
    console.log('🔒 [App] 用户未登录')
  }
}, { immediate: true })

// 是否是战略发展部用户（只有战略发展部可以切换视角）
const isStrategicDept = computed(() => authStore.userRole === 'strategic_dept')

// 战略发展部名称（从 store 获取）
const strategicDeptName = computed(() => orgStore.getStrategicDeptName())

// 当前查看的视角（战略发展部可以切换，其他部门固定为自己的部门）
const viewingDept = ref<string>('')

// 初始化 viewingDept
watch([() => authStore.user, () => orgStore.loaded], ([user, loaded]) => {
  if (user && loaded) {
    if (authStore.userRole === 'strategic_dept') {
      viewingDept.value = strategicDeptName.value
    } else {
      viewingDept.value = user.department || strategicDeptName.value
    }
  }
}, { immediate: true })

// 部门选项（战略发展部用户可以切换查看其他部门视角）
// 从数据库动态获取：战略发展部 + 职能部门 + 二级学院
const deptOptions = computed(() => {
  console.log('[App] Computing deptOptions, orgStore.loaded:', orgStore.loaded, 'departments:', orgStore.departments.length)
  
  const options: { value: string; label: string; role: 'strategic_dept' | 'functional_dept' | 'secondary_college' }[] = []

  // 1. 战略发展部（系统管理员）
  if (orgStore.strategicDept) {
    options.push({
      value: orgStore.strategicDept.name,
      label: orgStore.strategicDept.name,
      role: 'strategic_dept'
    })
  }

  // 2. 职能部门
  orgStore.functionalDepartments.forEach(dept => {
    options.push({
      value: dept.name,
      label: dept.name,
      role: 'functional_dept'
    })
  })

  // 3. 二级学院
  orgStore.colleges.forEach(college => {
    options.push({
      value: college.name,
      label: college.name,
      role: 'secondary_college'
    })
  })

  console.log('[App] deptOptions computed:', options.length, 'options')
  return options
})

// 当前视角对应的角色类型
const viewingRole = computed(() => {
  if (!isStrategicDept.value) {
    return authStore.userRole
  }
  const dept = deptOptions.value.find(d => d.value === viewingDept.value)
  return dept?.role || 'strategic_dept'
})

// 当前视角对应的部门名称
const viewingDeptName = computed(() => {
  const dept = deptOptions.value.find(d => d.value === viewingDept.value)
  return dept?.label || STRATEGIC_DEPT
})

// 基于角色的页面配置（审批功能已融入业务页面）
const roleBasedTabs = {
  'strategic_dept': [
    { id: 'dashboard', label: '数据看板', icon: DataAnalysis, path: '/dashboard' },
    { id: 'strategic', label: '战略任务管理', icon: List, path: '/strategic-tasks' }
  ],
  'functional_dept': [
    { id: 'dashboard', label: '数据看板', icon: DataAnalysis, path: '/dashboard' },
    { id: 'indicators', label: '指标填报', icon: Edit, path: '/indicators' },
    { id: 'distribution', label: '指标下发与审批', icon: Promotion, path: '/distribution' }
  ],
  'secondary_college': [
    { id: 'dashboard', label: '数据看板', icon: DataAnalysis, path: '/dashboard' },
    { id: 'indicators', label: '指标填报', icon: Edit, path: '/indicators' }
  ]
}

// 根据当前视角角色获取对应的标签页
const tabs = computed(() => {
  const role = viewingRole.value
  console.log('Computing tabs for role:', role, 'viewingRole:', viewingRole.value, 'authStore.userRole:', authStore.userRole)
  if (!role) {
    console.warn('No role found, returning empty tabs')
    return []
  }
  const result = roleBasedTabs[role as keyof typeof roleBasedTabs] || []
  console.log('Tabs result:', result)
  return result
})

// 当前激活的tab基于路由
const activeTab = computed(() => {
  const currentPath = route.path
  const tab = tabs.value.find(t => t.path === currentPath)
  return tab?.id || 'dashboard'
})

// 切换视角时重置到第一个标签页，并更新 authStore 的视角状态
watch(viewingDept, (newDept) => {
  // 更新 authStore 的视角状态
  if (newDept === strategicDeptName.value) {
    // 切换回战略发展部，重置视角
    authStore.resetViewingAs()
  } else {
    // 切换到其他部门视角
    const dept = deptOptions.value.find(d => d.value === newDept)
    if (dept) {
      authStore.setViewingAs(dept.role as any, newDept)
    }
  }
  
  // 导航到第一个可用的tab
  if (tabs.value.length > 0) {
    router.push(tabs.value[0].path)
  }
}, { immediate: true })

// 处理tab点击
const handleTabClick = (tabPath: string) => {
  router.push(tabPath)
}

// 处理退出登录
const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <router-view v-if="!isLoggedIn" />

  <!-- 主应用界面 -->
  <div v-else class="app-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-box">
            <el-icon :size="24" color="#ffffff"><Aim /></el-icon>
          </div>
          <div class="title-box">
            <h1 class="app-title">战略指标管理系统</h1>
            <p class="app-subtitle">Strategic Indicator Management System</p>
          </div>
        </div>
        <div class="header-right">
          <!-- 年份选择器 -->
          <YearSelector />

          <!-- 战略发展部专属：部门视角切换 -->
          <div v-if="isStrategicDept" class="dept-switcher">
            <el-icon class="switcher-icon"><Switch /></el-icon>
            <el-select
              v-model="viewingDept"
              placeholder="切换部门视角"
              size="small"
              class="dept-select"
            >
              <el-option
                v-for="dept in deptOptions"
                :key="dept.value"
                :label="dept.label"
                :value="dept.value"
              >
                <span>{{ dept.label }}</span>
                <el-tag v-if="dept.role === 'strategic_dept'" size="small" type="primary" style="margin-left: 8px;">管理</el-tag>
              </el-option>
            </el-select>
            <el-tag v-if="viewingDept !== strategicDeptName" type="warning" size="small" class="viewing-tag">
              查看中: {{ viewingDeptName }}
            </el-tag>
          </div>

          <div class="user-info">
            <span class="dept-name">{{ currentUser?.department }}</span>
            <span class="user-name">{{ currentUser?.name }}</span>
          </div>
          <el-badge :value="messageStore.unreadCount.all" :max="99" class="notification-badge">
            <el-button :icon="Bell" circle @click="router.push('/messages')" />
          </el-badge>
          <el-dropdown @command="handleLogout">
            <el-avatar class="user-avatar" :size="32">
              {{ currentUser?.name?.charAt(0)?.toUpperCase() || 'U' }}
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-main">
      <!-- 标签页导航 - 修复P3: 增强点击事件处理 -->
      <div class="tab-nav" v-if="tabs.length > 0">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-item', { active: activeTab === tab.id }]"
          @click.stop.prevent="handleTabClick(tab.path)"
          role="tab"
          :aria-selected="activeTab === tab.id"
          tabindex="0"
          @keydown.enter="handleTabClick(tab.path)"
          @keydown.space.prevent="handleTabClick(tab.path)"
        >
          <el-icon :size="20"><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
        </div>
      </div>
      <!-- 调试信息 -->
      <div v-else style="background: #fff3cd; padding: 12px; margin-bottom: 20px; border-radius: 4px; border: 1px solid #ffc107;">
        <p style="margin: 0; color: #856404;">
          ⚠️ 导航标签未显示 - 当前角色: {{ currentRole }} | 标签数量: {{ tabs.length }}
        </p>
      </div>

      <!-- 内容区域 - 使用 router-view -->
      <div class="content-area">
        <router-view :viewingRole="viewingRole" :viewingDept="viewingDept" :selectedRole="viewingRole || ''" />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ========== 高校教务系统风格 - 主框架 ========== */
.app-container {
  --primary-dark: #1a365d;
  --primary: #2c5282;
  --primary-light: #3182ce;
  --accent: #c9a227;
  --text-dark: #1e293b;
  --text-regular: #475569;
  --text-light: #94a3b8;
  --bg-page: #f1f5f9;
  --bg-card: #ffffff;
  --border: #e2e8f0;
  
  min-height: 100vh;
  background: var(--bg-page);
}

/* ========== 顶部导航栏 ========== */
.app-header {
  background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(26, 54, 93, 0.3);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-box {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.title-box {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  line-height: 1.2;
  letter-spacing: 1px;
}

.app-subtitle {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 部门切换器 */
.dept-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.switcher-icon {
  color: var(--accent);
  font-size: 16px;
}

.dept-select {
  width: 130px;
}

.dept-select :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
  border: none;
}

.dept-select :deep(.el-input__inner) {
  color: #fff;
  font-size: 13px;
}

.dept-select :deep(.el-input__suffix) {
  color: rgba(255, 255, 255, 0.7);
}

.viewing-tag {
  margin-left: 4px;
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.9);
  color: var(--primary);
}

/* 用户信息 */
.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-right: 8px;
}

.dept-name {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
}

.notification-badge {
  margin-right: 8px;
}

.notification-badge :deep(.el-button) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.notification-badge :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.2);
}

.notification-badge :deep(.el-badge__content) {
  background: #dc2626;
}

.user-avatar {
  background: var(--accent);
  color: var(--primary-dark);
  font-weight: 700;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

/* ========== 主内容区 ========== */
.app-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 24px;
}

/* ========== 标签页导航 ========== */
.tab-nav {
  background: var(--bg-card);
  border-radius: 4px;
  padding: 4px;
  margin-bottom: 20px;
  display: flex;
  gap: 4px;
  border: 1px solid var(--border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-regular);
  font-weight: 500;
  font-size: 14px;
  user-select: none;
  -webkit-user-select: none;
}

.tab-item:hover {
  background: var(--bg-page);
  color: var(--primary);
}

.tab-item.active {
  background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(26, 54, 93, 0.3);
}

.content-area {
  min-height: calc(100vh - 180px);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }

  .tab-nav {
    flex-wrap: wrap;
  }

  .tab-item {
    flex: 1 1 45%;
    padding: 10px 12px;
    font-size: 13px;
  }

  .app-subtitle {
    display: none;
  }
  
  .dept-switcher {
    display: none;
  }
}
</style>
