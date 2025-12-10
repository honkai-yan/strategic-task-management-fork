<script setup lang="ts">
import { ref, computed } from 'vue'
import { Download, TrendCharts, DataAnalysis, Warning, Aim, Refresh, Filter, QuestionFilled } from '@element-plus/icons-vue'
import type { DashboardData, UserRole } from '@/types'
import { useStrategicStore } from '@/stores/strategic'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import BreadcrumbNav from '@/components/dashboard/BreadcrumbNav.vue'
import ScoreCompositionChart from '@/components/charts/ScoreCompositionChart.vue'
import AlertDistributionChart from '@/components/charts/AlertDistributionChart.vue'
import DepartmentProgressChart from '@/components/charts/DepartmentProgressChart.vue'

// 帮助提示内容
const helpTexts = {
  totalScore: '总得分 = 基础性指标得分 + 发展性指标得分，满分120分。基础性指标满分100分，发展性指标满分20分。',
  basicScore: '基础性指标是必须完成的核心指标，根据各指标完成进度加权计算得分，满分100分。',
  developmentScore: '发展性指标是鼓励性指标，完成后可获得额外加分，满分20分。',
  warningCount: '预警任务指进度低于50%的指标数量，需要重点关注和推进。',
  scoreComposition: '展示基础性指标和发展性指标的得分占比，帮助了解整体得分构成。',
  alertDistribution: '按预警级别统计指标数量：严重（进度<30%）、中度（30%-60%）、正常（≥60%）。点击可筛选对应级别的指标。',
  completionRate: '完成率 = 已完成指标数 / 总指标数 × 100%，反映整体任务完成情况。',
  departmentProgress: '展示各部门的指标完成进度，进度条颜色表示状态：绿色（≥80%）、黄色（50%-80%）、红色（<50%）。'
}

// 接收父组件传递的视角角色
const props = defineProps<{
  viewingRole?: string
}>()

const strategicStore = useStrategicStore()
const dashboardStore = useDashboardStore()
const authStore = useAuthStore()

// 当前视角角色（优先使用父组件传递的，否则使用用户实际角色）
const currentRole = computed<UserRole>(() => 
  (props.viewingRole as UserRole) || authStore.user?.role || 'strategic_dept'
)
const currentDepartment = computed(() => authStore.user?.department || '')

// 是否显示筛选功能（二级学院不显示）
const showFilterFeature = computed(() => currentRole.value !== 'secondary_college')

// 是否可以查看所有部门（只有战略发展部可以）
const canViewAllDepartments = computed(() => currentRole.value === 'strategic_dept')

// 筛选面板
const showFilterPanel = ref(false)
const filterForm = ref({
  department: '',
  indicatorType: '' as '' | '定性' | '定量',
  alertLevel: '' as '' | 'severe' | 'moderate' | 'normal'
})

// 部门选项（根据角色权限过滤）
const departmentOptions = computed(() => {
  const allDepts = new Set(strategicStore.indicators.map(i => i.responsibleDept))
  const depts = Array.from(allDepts).filter(Boolean)
  
  // 战略发展部可以看所有部门
  if (currentRole.value === 'strategic_dept') {
    return depts
  }
  
  // 职能部门只能看自己和下发的二级学院
  if (currentRole.value === 'functional_dept') {
    // 这里简化处理，实际应该根据下发关系过滤
    return depts.filter(d => d === currentDepartment.value || d.includes('学院'))
  }
  
  // 二级学院只能看自己
  return [currentDepartment.value]
})

// 从 store 计算仪表盘数据
const dashboardData = computed<DashboardData>(() => {
  const indicators = dashboardStore.filteredIndicators.length > 0 
    ? dashboardStore.filteredIndicators 
    : strategicStore.indicators
  const totalIndicators = indicators.length
  const completedIndicators = indicators.filter(i => i.progress >= 100).length
  
  const basicIndicators = indicators.filter(i => i.type2 === '基础性')
  const developmentIndicators = indicators.filter(i => i.type2 === '发展性')
  
  const basicScore = basicIndicators.length > 0 
    ? Math.round(basicIndicators.reduce((sum, i) => sum + i.progress, 0) / basicIndicators.length)
    : 0
  const developmentScore = developmentIndicators.length > 0
    ? Math.round(developmentIndicators.reduce((sum, i) => sum + i.progress, 0) / developmentIndicators.length * 0.2)
    : 0
  
  const warningCount = indicators.filter(i => i.progress < 50).length
  
  return {
    totalScore: basicScore + developmentScore,
    basicScore,
    developmentScore,
    completionRate: totalIndicators > 0 ? Math.round((completedIndicators / totalIndicators) * 100) : 0,
    warningCount,
    totalIndicators,
    completedIndicators,
    alertIndicators: {
      severe: indicators.filter(i => i.progress < 30).length,
      moderate: indicators.filter(i => i.progress >= 30 && i.progress < 60).length,
      normal: indicators.filter(i => i.progress >= 60).length
    }
  }
})

// 应用筛选
const applyFilters = () => {
  const filter: Record<string, string | undefined> = {}
  if (filterForm.value.department) filter.department = filterForm.value.department
  if (filterForm.value.indicatorType) filter.indicatorType = filterForm.value.indicatorType
  if (filterForm.value.alertLevel) filter.alertLevel = filterForm.value.alertLevel
  dashboardStore.applyFilter(filter)
  showFilterPanel.value = false
}

// 重置筛选
const resetFilters = () => {
  filterForm.value = { department: '', indicatorType: '', alertLevel: '' }
  dashboardStore.resetFilters()
  showFilterPanel.value = false
}

// 预警级别点击
const handleAlertClick = (level: 'severe' | 'moderate' | 'normal') => {
  filterForm.value.alertLevel = level
  applyFilters()
}

// 面包屑导航
const handleBreadcrumbNavigate = (index: number) => {
  dashboardStore.navigateToBreadcrumb(index)
}

// 判断是否有活跃筛选
const hasActiveFilters = computed(() => {
  return dashboardStore.filters.department || 
         dashboardStore.filters.indicatorType || 
         dashboardStore.filters.alertLevel
})

// 移除未使用的函数
</script>

<template>
  <div class="dashboard-view">
    <!-- 顶部工具栏（二级学院不显示筛选功能） -->
    <div v-if="showFilterFeature" class="dashboard-toolbar">
      <div class="toolbar-right">
        <el-button 
          :icon="Filter" 
          :type="hasActiveFilters ? 'primary' : 'default'"
          @click="showFilterPanel = !showFilterPanel"
        >
          筛选
        </el-button>
        <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
        <el-button type="primary" :icon="Download">导出报表</el-button>
      </div>
    </div>

    <!-- 筛选面板（根据角色权限显示不同选项） -->
    <el-collapse-transition>
      <div v-show="showFilterPanel && showFilterFeature" class="filter-panel">
        <el-form :model="filterForm" inline>
          <!-- 部门筛选：战略发展部显示所有，职能部门显示自己和下属 -->
          <el-form-item v-if="departmentOptions.length > 1" label="部门">
            <el-select v-model="filterForm.department" placeholder="全部部门" clearable style="width: 140px">
              <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
            </el-select>
          </el-form-item>
          <el-form-item label="指标类型">
            <el-select v-model="filterForm.indicatorType" placeholder="全部类型" clearable style="width: 120px">
              <el-option label="定性" value="定性" />
              <el-option label="定量" value="定量" />
            </el-select>
          </el-form-item>
          <el-form-item label="预警级别">
            <el-select v-model="filterForm.alertLevel" placeholder="全部级别" clearable style="width: 120px">
              <el-option label="严重" value="severe" />
              <el-option label="中度" value="moderate" />
              <el-option label="正常" value="normal" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilters">应用</el-button>
            <el-button @click="resetFilters">清除</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-transition>

    <!-- 面包屑导航 -->
    <BreadcrumbNav 
      v-if="dashboardStore.breadcrumbs.length > 1"
      :items="dashboardStore.breadcrumbs" 
      @navigate="handleBreadcrumbNavigate" 
    />

    <!-- 核心指标卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card primary-card card-animate" shadow="hover">
          <div class="stat-content">
            <div class="stat-header">
              <el-icon :size="32" class="stat-icon"><Aim /></el-icon>
              <span class="stat-label">
                总得分
                <el-tooltip :content="helpTexts.totalScore" placement="top" effect="light">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </div>
            <div class="stat-value">{{ dashboardData.totalScore }}</div>
            <div class="stat-desc">满分120分</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card card-animate" shadow="hover">
          <div class="stat-content">
            <div class="stat-header">
              <el-icon :size="32" class="stat-icon success"><DataAnalysis /></el-icon>
              <span class="stat-label">
                基础性指标
                <el-tooltip :content="helpTexts.basicScore" placement="top" effect="light">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </div>
            <div class="stat-value">{{ dashboardData.basicScore }}</div>
            <div class="stat-desc">满分100分</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card card-animate" shadow="hover">
          <div class="stat-content">
            <div class="stat-header">
              <el-icon :size="32" class="stat-icon purple"><TrendCharts /></el-icon>
              <span class="stat-label">
                发展性指标
                <el-tooltip :content="helpTexts.developmentScore" placement="top" effect="light">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </div>
            <div class="stat-value">{{ dashboardData.developmentScore }}</div>
            <div class="stat-desc">满分20分</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card card-animate" shadow="hover">
          <div class="stat-content">
            <div class="stat-header">
              <el-icon :size="32" class="stat-icon warning"><Warning /></el-icon>
              <span class="stat-label">
                预警任务
                <el-tooltip :content="helpTexts.warningCount" placement="top" effect="light">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </div>
            <div class="stat-value">{{ dashboardData.warningCount }}</div>
            <div class="stat-desc">需关注项目</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-section">
      <!-- 得分构成 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="chart-card card-animate">
          <template #header>
            <div class="card-header">
              <span class="card-title">得分构成</span>
              <el-tooltip :content="helpTexts.scoreComposition" placement="top" effect="light">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <ScoreCompositionChart 
            :basic-score="dashboardData.basicScore" 
            :development-score="dashboardData.developmentScore"
          />
        </el-card>
      </el-col>

      <!-- 预警分布 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="chart-card card-animate">
          <template #header>
            <div class="card-header">
              <span class="card-title">预警分布</span>
              <el-tooltip :content="helpTexts.alertDistribution" placement="top" effect="light">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <AlertDistributionChart 
            :severe="dashboardData.alertIndicators.severe"
            :moderate="dashboardData.alertIndicators.moderate"
            :normal="dashboardData.alertIndicators.normal"
            @click="handleAlertClick"
          />
        </el-card>
      </el-col>

      <!-- 完成率统计 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="chart-card card-animate">
          <template #header>
            <div class="card-header">
              <span class="card-title">完成情况</span>
              <el-tooltip :content="helpTexts.completionRate" placement="top" effect="light">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="completion-stats">
            <div class="completion-ring">
              <el-progress 
                type="circle" 
                :percentage="dashboardData.completionRate" 
                :width="140"
                :stroke-width="12"
              >
                <template #default="{ percentage }">
                  <div class="completion-text">
                    <span class="percentage">{{ percentage }}%</span>
                    <span class="label">完成率</span>
                  </div>
                </template>
              </el-progress>
            </div>
            <div class="completion-detail">
              <div class="detail-item">
                <span class="detail-label">总指标数</span>
                <span class="detail-value">{{ dashboardData.totalIndicators }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">已完成</span>
                <span class="detail-value success">{{ dashboardData.completedIndicators }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">进行中</span>
                <span class="detail-value">{{ dashboardData.totalIndicators - dashboardData.completedIndicators }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 各部门完成情况（战略发展部和职能部门可见） -->
    <el-card v-if="showFilterFeature" shadow="hover" class="department-card card-animate">
      <template #header>
        <div class="card-header">
          <span class="card-title">{{ canViewAllDepartments ? '各部门完成情况' : '下属单位完成情况' }}</span>
          <el-tooltip :content="helpTexts.departmentProgress" placement="top" effect="light">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <DepartmentProgressChart :departments="dashboardStore.departmentSummary" />
    </el-card>
  </div>
</template>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-white);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-panel {
  padding: 16px;
  background: var(--bg-white);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-cards {
  margin-bottom: var(--spacing-lg, 16px);
}

.stat-cards .el-col {
  margin-bottom: var(--spacing-lg, 16px);
}

.chart-section .el-col {
  margin-bottom: var(--spacing-lg, 16px);
}

.stat-card {
  border-radius: var(--radius-lg, 12px);
  transition: all var(--transition-normal, 0.25s);
  /* 移除 margin-bottom，使用 Grid gap 统一控制 */
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover, 0 8px 20px rgba(64, 158, 255, 0.15));
}

.primary-card {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #2563eb) 100%);
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

.stat-icon.success { color: var(--color-success); }
.stat-icon.purple { color: var(--color-purple, #9333ea); }
.stat-icon.warning { color: var(--color-warning); }

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.primary-card .stat-label,
.primary-card .stat-icon {
  color: rgba(255, 255, 255, 0.9);
}

.primary-card .help-icon {
  color: rgba(255, 255, 255, 0.7);
}

.primary-card .help-icon:hover {
  color: rgba(255, 255, 255, 1);
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

.chart-section {
  margin-bottom: 0;
}

.chart-card {
  border-radius: var(--radius-lg, 12px);
  /* 移除 margin-bottom，使用 Grid gap 统一控制 */
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.help-icon {
  color: var(--text-placeholder);
  cursor: help;
  font-size: 14px;
  transition: color 0.2s;
}

.help-icon:hover {
  color: var(--color-primary);
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label .help-icon {
  font-size: 12px;
}

.department-card {
  border-radius: var(--radius-lg, 12px);
}

/* 部门进度列表 hover 交互效果 */
.department-card :deep(.el-progress) {
  transition: all var(--transition-fast, 0.15s);
}

.department-card :deep(.department-item:hover) {
  background: var(--bg-page, #f5f7fa);
  border-radius: var(--radius-sm, 4px);
}

.completion-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.completion-ring {
  display: flex;
  justify-content: center;
}

.completion-text {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.completion-text .percentage {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-main);
}

.completion-text .label {
  font-size: 12px;
  color: var(--text-secondary);
}

.completion-detail {
  display: flex;
  justify-content: center;
  gap: 24px;
  width: 100%;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.detail-value.success {
  color: var(--color-success);
}
</style>
