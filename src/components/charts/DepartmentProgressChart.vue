<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DepartmentProgress } from '@/types'

const props = defineProps<{
  departments: DepartmentProgress[]
}>()

const progressValues = ref<Record<string, number>>({})

const sortedDepartments = computed(() => 
  [...props.departments].sort((a, b) => b.progress - a.progress)
)

watch(() => props.departments, (newVal) => {
  // Initialize new items to 0 if not present
  newVal.forEach(item => {
    if (progressValues.value[item.dept] === undefined) {
      progressValues.value[item.dept] = 0
    }
  })

  // Animate to target value
  setTimeout(() => {
    newVal.forEach(item => {
      progressValues.value[item.dept] = item.progress
    })
  }, 100)
}, { immediate: true, deep: true })

const getProgressStatus = (status: string) => {
  switch (status) {
    case 'success': return 'success'
    case 'warning': return 'warning'
    case 'exception': return 'exception'
    default: return ''
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return '#67C23A'
    case 'warning': return '#E6A23C'
    case 'exception': return '#F56C6C'
    default: return '#409EFF'
  }
}
</script>

<template>
  <div class="department-progress-chart">
    <div 
      v-for="item in sortedDepartments" 
      :key="item.dept" 
      class="dept-item"
    >
      <div class="dept-header">
        <span class="dept-name">{{ item.dept }}</span>
        <div class="dept-stats">
          <el-tag size="small" :type="item.alertCount > 0 ? 'danger' : 'info'" effect="plain">
            {{ item.totalIndicators }}个指标
          </el-tag>
          <span class="dept-score" :style="{ color: getStatusColor(item.status) }">
            {{ item.score }}分
          </span>
        </div>
      </div>
      <el-progress
        :percentage="progressValues[item.dept] || 0"
        :status="getProgressStatus(item.status)"
        :stroke-width="10"
        :show-text="true"
        :format="() => `${progressValues[item.dept] || 0}%`"
      />
    </div>
    
    <el-empty v-if="sortedDepartments.length === 0" description="暂无部门数据" :image-size="80" />
  </div>
</template>

<style scoped>
.department-progress-chart {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dept-item {
  padding: 12px;
  border-radius: 8px;
  background: var(--bg-light);
}

.dept-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dept-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.dept-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dept-score {
  font-size: 16px;
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

:deep(.el-progress-bar__outer) {
  border-radius: 5px;
  background-color: #f0f2f5;
  overflow: hidden;
}

:deep(.el-progress-bar__inner) {
  border-radius: 5px;
  position: relative;
  overflow: hidden;
  background-image: linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent);
  background-size: 1rem 1rem;
  animation: progress-bar-stripes 1s linear infinite !important;
  transition: width 1.5s ease-out !important;
}

@keyframes progress-bar-stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}
</style>