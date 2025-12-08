<template>
  <div class="profile">
    <div class="page-header">
      <h2 class="page-title">个人信息管理</h2>
    </div>

    <div class="profile-content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <BasicInfo />
        </el-tab-pane>
        <el-tab-pane label="修改密码" name="password">
          <ChangePassword />
        </el-tab-pane>
        <el-tab-pane label="通知设置" name="notifications">
          <NotificationSettings />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BasicInfo from '@/components/profile/BasicInfo.vue'
import ChangePassword from '@/components/profile/ChangePassword.vue'
import NotificationSettings from '@/components/profile/NotificationSettings.vue'
import { useAuthStore } from '@/stores/auth'

// 使用共享 Store
const authStore = useAuthStore()

// 当前用户信息
const currentUser = computed(() => authStore.user)

const activeTab = ref('basic')
</script>

<style scoped>
.profile {
  padding: 24px;
  background: var(--bg-white);
  border-radius: 12px;
  min-height: calc(100vh - 200px);
}

.page-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
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
</style>