<template>
  <div class="profile">
    <div class="page-header">
      <!-- 用户头像展示区域 -->
      <div class="user-avatar-section">
        <div class="avatar-wrapper">
          <el-avatar :size="80" class="user-avatar">
            {{ currentUser?.name?.charAt(0) || 'U' }}
          </el-avatar>
          <el-button class="avatar-edit-btn" circle size="small" type="primary">
            <el-icon><Edit /></el-icon>
          </el-button>
        </div>
        <div class="user-info">
          <h2 class="user-name">{{ currentUser?.name || '用户' }}</h2>
          <div class="user-meta">
            <el-tag size="small" type="info">{{ currentUser?.department || '未分配部门' }}</el-tag>
            <span class="user-role">{{ getRoleLabel(currentUser?.role) }}</span>
          </div>
        </div>
      </div>
      <h2 class="page-title">个人信息管理</h2>
    </div>

    <div class="profile-content">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <transition name="tab-fade" mode="out-in">
            <BasicInfo v-if="activeTab === 'basic'" />
          </transition>
        </el-tab-pane>
        <el-tab-pane label="修改密码" name="password">
          <transition name="tab-fade" mode="out-in">
            <ChangePassword v-if="activeTab === 'password'" />
          </transition>
        </el-tab-pane>
        <el-tab-pane label="通知设置" name="notifications">
          <transition name="tab-fade" mode="out-in">
            <NotificationSettings v-if="activeTab === 'notifications'" />
          </transition>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import BasicInfo from '@/components/profile/BasicInfo.vue'
import ChangePassword from '@/components/profile/ChangePassword.vue'
import NotificationSettings from '@/components/profile/NotificationSettings.vue'
import { useAuthStore } from '@/stores/auth'

// 使用共享 Store
const authStore = useAuthStore()

// 当前用户信息
const currentUser = computed(() => authStore.user)

const activeTab = ref('basic')

// 角色标签映射
const getRoleLabel = (role?: string) => {
  const roleMap: Record<string, string> = {
    'strategic_dept': '战略发展部',
    'functional_dept': '职能部门',
    'secondary_college': '二级学院'
  }
  return roleMap[role || ''] || '普通用户'
}
</script>

<style scoped>
.profile {
  padding: var(--spacing-2xl, 24px);
  background: var(--bg-white);
  border-radius: var(--radius-lg, 12px);
  min-height: calc(100vh - 200px);
}

.page-header {
  margin-bottom: var(--spacing-2xl, 24px);
  padding-bottom: var(--spacing-lg, 16px);
  border-bottom: 1px solid var(--border-color);
}

/* 用户头像区域 */
.user-avatar-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 16px);
  margin-bottom: var(--spacing-xl, 20px);
}

.avatar-wrapper {
  position: relative;
}

.user-avatar {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  font-size: 28px;
  font-weight: 600;
  color: var(--bg-white);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 8px);
}

.user-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
}

.user-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 8px);
}

.user-role {
  font-size: 13px;
  color: var(--text-secondary);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-main);
}

.profile-content {
  min-height: 400px;
}

/* Tab 样式定制 */
.profile-tabs :deep(.el-tabs__header) {
  margin-bottom: var(--spacing-xl, 20px);
}

.profile-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  padding: 0 var(--spacing-xl, 20px);
  transition: all var(--transition-fast, 0.15s);
}

.profile-tabs :deep(.el-tabs__item:hover) {
  color: var(--color-primary);
}

.profile-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 2px;
  transition: transform var(--transition-normal, 0.25s);
}

/* Tab 切换过渡动画 */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: all var(--transition-normal, 0.25s);
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>