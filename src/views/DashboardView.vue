<script setup lang="ts">
import { ref } from 'vue'
import { Download, TrendCharts, DataAnalysis, Warning, Aim } from '@element-plus/icons-vue'
import type { DashboardData, DepartmentProgress } from '@/types'
import { dashboardData as initialData, departmentProgress as initialProgress } from '@/data/mockData'

const dashboardData = ref<DashboardData>(initialData)
const departmentProgress = ref<DepartmentProgress[]>(initialProgress)

const getProgressStatus = (status: string) => {
  switch (status) {
    case 'normal': return 'success'
    case 'warning': return 'warning'
    case 'danger': return 'exception'
    default: return ''
  }
}
</script>

<template>
  <div class="dashboard-view">
    <!-- 核心指标卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card primary-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-header">
              <el-icon :size="32" class="stat-icon"><Aim /></el-icon>
              <span class="stat-label">总得分</span>
            </div>
            <div class="stat-value">{{ dashboardData.totalScore }}</div>
            <div class="stat-desc">满分120分</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-header">
              <el-icon :size="32" class="stat-icon success"><DataAnalysis /></el-icon>
              <span class="stat-label">基础性指标</span>
            </div>
            <div class="stat-value">{{ dashboardData.basicScore }}</div>
            <div class="stat-desc">满分100分</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-header">
              <el-icon :size="32" class="stat-icon purple"><TrendCharts /></el-icon>
              <span class="stat-label">发展性指标</span>
            </div>
            <div class="stat-value">{{ dashboardData.developmentScore }}</div>
            <div class="stat-desc">满分20分</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-header">
              <el-icon :size="32" class="stat-icon warning"><Warning /></el-icon>
              <span class="stat-label">预警任务</span>
            </div>
            <div class="stat-value">{{ dashboardData.warningCount }}</div>
            <div class="stat-desc">需关注项目</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 各部门完成情况 -->
    <el-card shadow="hover" class="department-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">各部门完成情况</span>
          <el-button type="primary" :icon="Download">导出报表</el-button>
        </div>
      </template>

      <div class="department-list">
        <div v-for="(item, idx) in departmentProgress" :key="idx" class="department-item">
          <div class="dept-name">{{ item.dept }}</div>
          <div class="dept-progress-wrapper">
            <el-progress
              :percentage="item.progress"
              :status="getProgressStatus(item.status)"
              :stroke-width="12"
            />
            <span class="dept-score">{{ item.score }}分</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stat-cards {
  margin-bottom: 0;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s;
  margin-bottom: 16px;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.primary-card {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--bg-white);
}

.primary-card :deep(.el-card__body) {
  padding: 24px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-icon {
  opacity: 0.8;
}

.stat-icon.success {
  color: var(--color-success);
}

.stat-icon.purple {
  color: var(--color-purple);
}

.stat-icon.warning {
  color: var(--color-warning);
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.primary-card .stat-label {
  color: rgba(255, 255, 255, 0.9);
}

.primary-card .stat-icon {
  color: rgba(255, 255, 255, 0.9);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  line-height: 1.2;
}

.primary-card .stat-value {
  color: var(--bg-white);
}

.stat-desc {
  font-size: 12px;
  opacity: 0.7;
}

.primary-card .stat-desc {
  color: rgba(255, 255, 255, 0.8);
}

.department-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.department-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.department-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dept-name {
  width: 140px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  flex-shrink: 0;
}

.dept-progress-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.dept-progress-wrapper :deep(.el-progress) {
  flex: 1;
}

.dept-score {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  min-width: 60px;
  text-align: right;
}
</style>
