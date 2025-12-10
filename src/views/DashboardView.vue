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
  totalScore: '总得分 = 基础性指标得分 + 发展性指标得分，满分120分',
  basicScore: '基础性指标是必须完成的核心指标，满分100分',
  developmentScore: '发展性指标是鼓励性指标，满分20分',
  warningCount: '预警任务指进度低于50%的指标数量',
  completionRate: '完成率 = 已完成指标数 / 总指标数 × 100%'
}

const props = defineProps<{
  viewingRole?: string
}>()

const strategicStore = useStrategicStore()
const dashboardStore = useDashboardStore()
const authStore = useAuthStore()

const currentRole = computed<UserRole>(() => 
  (props.viewingRole as UserRole) || authStore.user?.role || 'strategic_dept'
)
const currentDepartment = computed(() => authStore.user?.department || '')
const showFilterFeature = computed(() => currentRole.value !== 'secondary_college')
const canViewAllDepartments = computed(() => currentRole.value === 'strategic_dept')

// 筛选面板
const showFilterPanel = ref(false)
const filterForm = ref({
  department: '',
  indicatorType: '' as '' | '定性' | '定量',
  alertLevel: '' as '' | 'severe' | 'moderate' | 'normal'
})

const departmentOptions = computed(() => {
  const allDepts = new Set(strategicStore.indicators.map(i => i.responsibleDept))
  const depts = Array.from(allDepts).filter(Boolean)
  if (currentRole.value === 'strategic_dept') return depts
  if (currentRole.value === 'functional_dept') {
    return depts.filter(d => d === currentDepartment.value || d.includes('学院'))
  }
  return [currentDepartment.value]
})

// 仪表盘数据计算
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
  
  return {
    totalScore: basicScore + developmentScore,
    basicScore,
    developmentScore,
    completionRate: totalIndicators > 0 ? Math.round((completedIndicators / totalIndicators) * 100) : 0,
    warningCount: indicators.filter(i => i.progress < 50).length,
    totalIndicators,
    completedIndicators,
    alertIndicators: {
      severe: indicators.filter(i => i.progress < 30).length,
      moderate: indicators.filter(i => i.progress >= 30 && i.progress < 60).length,
      normal: indicators.filter(i => i.progress >= 60).length
    }
  }
})

const applyFilters = () => {
  const filter: Record<string, string | undefined> = {}
  if (filterForm.value.department) filter.department = filterForm.value.department
  if (filterForm.value.indicatorType) filter.indicatorType = filterForm.value.indicatorType
  if (filterForm.value.alertLevel) filter.alertLevel = filterForm.value.alertLevel
  dashboardStore.applyFilter(filter)
  showFilterPanel.value = false
}

const resetFilters = () => {
  filterForm.value = { department: '', indicatorType: '', alertLevel: '' }
  dashboardStore.resetFilters()
  showFilterPanel.value = false
}

const handleAlertClick = (level: 'severe' | 'moderate' | 'normal') => {
  filterForm.value.alertLevel = level
  applyFilters()
}

const handleBreadcrumbNavigate = (index: number) => {
  dashboardStore.navigateToBreadcrumb(index)
}

const hasActiveFilters = computed(() => {
  return dashboardStore.filters.department || 
         dashboardStore.filters.indicatorType || 
         dashboardStore.filters.alertLevel
})
</script>

<template>
  <div class="dashboard-view">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">数据看板</h2>
        <span class="page-subtitle">Dashboard</span>
      </div>
      <div v-if="showFilterFeature" class="header-right">
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

    <!-- 筛选面板 -->
    <el-collapse-transition>
      <div v-show="showFilterPanel && showFilterFeature" class="filter-panel">
        <el-form :model="filterForm" inline>
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
    <div class="stat-cards">
      <!-- 总得分 - 主卡片 -->
      <div class="stat-card primary-card">
        <div class="card-icon">
          <el-icon :size="28"><Aim /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-label">
            总得分
            <el-tooltip :content="helpTexts.totalScore" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="card-value">{{ dashboardData.totalScore }}</div>
          <div class="card-desc">满分 120 分</div>
        </div>
        <div class="card-decoration"></div>
      </div>

      <!-- 基础性指标 -->
      <div class="stat-card">
        <div class="card-icon success">
          <el-icon :size="28"><DataAnalysis /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-label">
            基础性指标
            <el-tooltip :content="helpTexts.basicScore" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="card-value">{{ dashboardData.basicScore }}</div>
          <div class="card-desc">满分 100 分</div>
        </div>
      </div>

      <!-- 发展性指标 -->
      <div class="stat-card">
        <div class="card-icon purple">
          <el-icon :size="28"><TrendCharts /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-label">
            发展性指标
            <el-tooltip :content="helpTexts.developmentScore" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="card-value">{{ dashboardData.developmentScore }}</div>
          <div class="card-desc">满分 20 分</div>
        </div>
      </div>

      <!-- 预警任务 -->
      <div class="stat-card" :class="{ 'warning-active': dashboardData.warningCount > 0 }">
        <div class="card-icon warning">
          <el-icon :size="28"><Warning /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-label">
            预警任务
            <el-tooltip :content="helpTexts.warningCount" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="card-value">{{ dashboardData.warningCount }}</div>
          <div class="card-desc">需关注项目</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-section">
      <!-- 得分构成 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">得分构成</span>
        </div>
        <div class="chart-body">
          <ScoreCompositionChart 
            :basic-score="dashboardData.basicScore" 
            :development-score="dashboardData.developmentScore"
          />
        </div>
      </div>

      <!-- 预警分布 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">预警分布</span>
        </div>
        <div class="chart-body">
          <AlertDistributionChart 
            :severe="dashboardData.alertIndicators.severe"
            :moderate="dashboardData.alertIndicators.moderate"
            :normal="dashboardData.alertIndicators.normal"
            @click="handleAlertClick"
          />
        </div>
      </div>

      <!-- 完成情况 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">完成情况</span>
        </div>
        <div class="chart-body">
          <div class="completion-stats">
            <el-progress 
              type="circle" 
              :percentage="dashboardData.completionRate" 
              :width="120"
              :stroke-width="10"
              :color="dashboardData.completionRate >= 80 ? '#059669' : dashboardData.completionRate >= 50 ? '#d97706' : '#dc2626'"
            >
              <template #default="{ percentage }">
                <div class="completion-text">
                  <span class="percentage">{{ percentage }}%</span>
                  <span class="label">完成率</span>
                </div>
              </template>
            </el-progress>
            <div class="completion-detail">
              <div class="detail-row">
                <span class="detail-label">总指标数</span>
                <span class="detail-value">{{ dashboardData.totalIndicators }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">已完成</span>
                <span class="detail-value success">{{ dashboardData.completedIndicators }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">进行中</span>
                <span class="detail-value">{{ dashboardData.totalIndicators - dashboardData.completedIndicators }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 各部门完成情况 -->
    <div v-if="showFilterFeature" class="department-section">
      <div class="section-header">
        <span class="section-title">{{ canViewAllDepartments ? '各部门完成情况' : '下属单位完成情况' }}</span>
      </div>
      <div class="section-body">
        <DepartmentProgressChart :departments="dashboardStore.departmentSummary" />
      </div>
    </div>
  </div>
</template>


<style scoped>
/* ========== 高校教务系统风格 - 数据看板 ========== */
.dashboard-view {
  --primary-dark: #1a365d;
  --primary: #2c5282;
  --primary-light: #3182ce;
  --accent: #c9a227;
  --success: #059669;
  --warning: #d97706;
  --danger: #dc2626;
  --purple: #7c3aed;
  --text-dark: #1e293b;
  --text-regular: #475569;
  --text-light: #94a3b8;
  --bg-card: #ffffff;
  --bg-page: #f1f5f9;
  --border: #e2e8f0;
  
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px;
}

/* ========== 页面标题栏 ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: 4px;
  border-left: 4px solid var(--primary-dark);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-dark);
  letter-spacing: 1px;
}

.page-subtitle {
  font-size: 12px;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  gap: 10px;
}

/* ========== 筛选面板 ========== */
.filter-panel {
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: 4px;
  border: 1px solid var(--border);
}

/* ========== 核心指标卡片 ========== */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 4px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border: 1px solid var(--border);
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(26, 54, 93, 0.1);
}

/* 主卡片样式 */
.stat-card.primary-card {
  background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
  border: none;
  color: #fff;
}

.stat-card.primary-card .card-label,
.stat-card.primary-card .card-value,
.stat-card.primary-card .card-desc {
  color: #fff;
}

.stat-card.primary-card .card-icon {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.stat-card.primary-card .help-icon {
  color: rgba(255, 255, 255, 0.7);
}

.stat-card.primary-card .card-decoration {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

/* 预警激活状态 */
.stat-card.warning-active {
  border-color: var(--warning);
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.stat-card.warning-active .card-value {
  color: var(--warning);
}

/* 卡片图标 */
.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
  color: var(--primary);
  flex-shrink: 0;
}

.card-icon.success { background: #ecfdf5; color: var(--success); }
.card-icon.purple { background: #f5f3ff; color: var(--purple); }
.card-icon.warning { background: #fffbeb; color: var(--warning); }

/* 卡片内容 */
.card-content {
  flex: 1;
  min-width: 0;
}

.card-label {
  font-size: 13px;
  color: var(--text-regular);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-dark);
  line-height: 1;
  margin-bottom: 4px;
  font-family: 'DIN', 'Roboto Mono', monospace;
}

.card-desc {
  font-size: 12px;
  color: var(--text-light);
}

.help-icon {
  font-size: 14px;
  color: var(--text-light);
  cursor: help;
  transition: color 0.2s;
}

.help-icon:hover {
  color: var(--primary);
}

/* ========== 图表区域 ========== */
.chart-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.chart-card {
  background: var(--bg-card);
  border-radius: 4px;
  border: 1px solid var(--border);
  overflow: hidden;
}

.chart-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark);
}

.chart-body {
  padding: 20px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 完成情况统计 */
.completion-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.completion-text {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.completion-text .percentage {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark);
}

.completion-text .label {
  font-size: 12px;
  color: var(--text-light);
}

.completion-detail {
  width: 100%;
  max-width: 200px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 13px;
  color: var(--text-regular);
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.detail-value.success {
  color: var(--success);
}

/* ========== 部门完成情况 ========== */
.department-section {
  background: var(--bg-card);
  border-radius: 4px;
  border: 1px solid var(--border);
  overflow: hidden;
}

.section-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark);
}

.section-body {
  padding: 20px;
}

/* ========== 响应式 ========== */
@media (max-width: 1200px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .stat-cards {
    grid-template-columns: 1fr;
  }
  
  .chart-section {
    grid-template-columns: 1fr;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-button) {
  border-radius: 4px;
}

:deep(.el-button--primary) {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
}

:deep(.el-button--primary:hover) {
  background: var(--primary);
  border-color: var(--primary);
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 4px;
}

:deep(.el-progress-circle__track) {
  stroke: var(--border);
}
</style>
