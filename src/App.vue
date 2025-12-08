<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DataAnalysis, Document, Edit, CircleCheck, Bell, Aim, List, Switch } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import DashboardView from './views/DashboardView.vue'
import IndicatorListView from './views/IndicatorListView.vue'
import ReportingView from './views/ReportingView.vue'
import ApprovalView from './views/ApprovalView.vue'
import StrategicTaskView from './views/StrategicTaskView.vue'
import LoginView from './views/LoginView.vue'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('dashboard')
const isLoggedIn = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.user)

// 是否是战略发展部用户（只有战略发展部可以切换视角）
const isStrategicDept = computed(() => authStore.userRole === 'strategic_dept')

// 当前查看的视角（战略发展部可以切换）
const viewingDept = ref<string>('strategic_dept')

// 部门选项（战略发展部用户可以切换查看其他部门视角）
const deptOptions = [
  { value: 'strategic_dept', label: '战略发展部', role: 'strategic_dept' },
  { value: 'jiaowu', label: '教务处', role: 'functional_dept' },
  { value: 'keyan', label: '科研处', role: 'functional_dept' },
  { value: 'renshi', label: '人事处', role: 'functional_dept' },
  { value: 'jisuanji', label: '计算机学院', role: 'secondary_college' },
  { value: 'yishu', label: '艺术与科技学院', role: 'secondary_college' }
]

// 当前视角对应的角色类型
const viewingRole = computed(() => {
  if (!isStrategicDept.value) {
    return authStore.userRole
  }
  const dept = deptOptions.find(d => d.value === viewingDept.value)
  return dept?.role || 'strategic_dept'
})

// 当前视角对应的部门名称
const viewingDeptName = computed(() => {
  const dept = deptOptions.find(d => d.value === viewingDept.value)
  return dept?.label || '战略发展部'
})

// 基于角色的页面配置
const roleBasedTabs = {
  'strategic_dept': [
    { id: 'dashboard', label: '数据看板', icon: DataAnalysis },
    { id: 'strategic', label: '战略任务管理', icon: List },
    { id: 'approval', label: '审批中心', icon: CircleCheck }
  ],
  'functional_dept': [
    { id: 'dashboard', label: '数据看板', icon: DataAnalysis },
    { id: 'indicators', label: '指标管理', icon: Document },
    { id: 'reporting', label: '进度填报', icon: Edit },
    { id: 'approval', label: '审批中心', icon: CircleCheck }
  ],
  'secondary_college': [
    { id: 'dashboard', label: '数据看板', icon: DataAnalysis },
    { id: 'indicators', label: '指标管理', icon: Document },
    { id: 'reporting', label: '进度填报', icon: Edit }
  ]
}

// 根据当前视角角色获取对应的标签页
const tabs = computed(() => {
  const role = viewingRole.value
  if (!role) return []
  return roleBasedTabs[role as keyof typeof roleBasedTabs] || []
})

// 监听标签页变化，确保activeTab在可用范围内
watch(tabs, (newTabs) => {
  if (newTabs.length > 0 && !newTabs.map(t => t.id).includes(activeTab.value)) {
    activeTab.value = newTabs[0].id
  }
}, { immediate: true })

// 切换视角时重置到第一个标签页
watch(viewingDept, () => {
  activeTab.value = 'dashboard'
})

// 处理登录成功
const handleLoginSuccess = (user: any) => {
  // 认证状态已由 LoginView 更新到 authStore
  // 这里只需要更新本地 UI 状态
  activeTab.value = 'dashboard'
}

// 处理退出登录
const handleLogout = () => {
  authStore.logout()
  activeTab.value = 'dashboard'
  router.push('/login')
}

// 组件挂载时检查认证状态
onMounted(() => {
  // 如果已认证，确保 activeTab 有效
  if (authStore.isAuthenticated && tabs.value.length > 0) {
    if (!tabs.value.map(t => t.id).includes(activeTab.value)) {
      activeTab.value = tabs.value[0].id
    }
  }
})
</script>

<template>
  <!-- 登录页面 -->
  <LoginView
    v-if="!isLoggedIn"
    @login-success="handleLoginSuccess"
  />

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
                <el-tag v-if="dept.value === 'strategic_dept'" size="small" type="primary" style="margin-left: 8px;">当前</el-tag>
              </el-option>
            </el-select>
            <el-tag v-if="viewingDept !== 'strategic_dept'" type="warning" size="small" class="viewing-tag">
              查看中: {{ viewingDeptName }}
            </el-tag>
          </div>
          
          <div class="user-info">
            <span class="dept-name">{{ currentUser?.department }}</span>
            <span class="user-name">{{ currentUser?.name }}</span>
          </div>
          <el-badge :value="3" :max="99" class="notification-badge">
            <el-button :icon="Bell" circle />
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
      <!-- 标签页导航 -->
      <div class="tab-nav">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-item', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <el-icon :size="20"><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <DashboardView v-if="activeTab === 'dashboard'" :viewingRole="viewingRole" />
        <StrategicTaskView v-else-if="activeTab === 'strategic'" :selectedRole="viewingRole || ''" />
        <IndicatorListView v-else-if="activeTab === 'indicators'" :viewingRole="viewingRole" />
        <ReportingView v-else-if="activeTab === 'reporting'" :viewingRole="viewingRole" />
        <ApprovalView v-else-if="activeTab === 'approval'" :viewingRole="viewingRole" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-page) 0%, var(--bg-light) 100%);
}

.app-header {
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
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
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-box {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
  line-height: 1.2;
}

.app-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dept-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-page);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.switcher-icon {
  color: var(--color-primary);
  font-size: 16px;
}

.dept-select {
  width: 140px;
}

.dept-select :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
}

.viewing-tag {
  margin-left: 4px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-right: 12px;
}

.dept-name {
  font-size: 12px;
  color: var(--text-secondary);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.notification-badge {
  margin-right: 8px;
}

.user-avatar {
  background: var(--color-primary);
  color: var(--bg-white);
  font-weight: 600;
  cursor: pointer;
}

.app-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.tab-nav {
  background: var(--bg-white);
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 24px;
  display: flex;
  gap: 8px;
  border: 2px solid var(--border-color);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--text-regular);
  font-weight: 500;
}

.tab-item:hover {
  background: var(--bg-page);
}

.tab-item.active {
  background: var(--color-primary);
  color: var(--bg-white);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.content-area {
  min-height: calc(100vh - 200px);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .tab-nav {
    flex-wrap: wrap;
  }

  .tab-item {
    flex: 1 1 45%;
  }

  .app-subtitle {
    display: none;
  }
}
</style>
