<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Download, TrendCharts, DataAnalysis, Warning, Aim, Refresh, Filter, QuestionFilled, Top, Bottom, Lightning } from '@element-plus/icons-vue'
import type { DashboardData, UserRole } from '@/types'
import { useStrategicStore } from '@/stores/strategic'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import { useTimeContextStore } from '@/stores/timeContext'
import BreadcrumbNav from '@/components/dashboard/BreadcrumbNav.vue'
import ScoreCompositionChart from '@/components/charts/ScoreCompositionChart.vue'
import AlertDistributionChart from '@/components/charts/AlertDistributionChart.vue'
import DepartmentProgressChart from '@/components/charts/DepartmentProgressChart.vue'
// 新增图表组件
import TaskSankeyChart from '@/components/charts/TaskSankeyChart.vue'
import SourcePieChart from '@/components/charts/SourcePieChart.vue'
import DashboardFilters from '@/components/dashboard/DashboardFilters.vue'
import * as XLSX from 'xlsx'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { isSecondaryCollege } from '@/utils/colors'
import { getAllFunctionalDepartments, getAllColleges, getAllDepartments } from '@/config/departments'

// 帮助提示内容
const helpTexts = {
  totalScore: '总得分 = 基础性指标得分 + 发展性指标得分，满分120分。基础性指标满分100分，发展性指标满分20分。',
  basicScore: '基础性指标是必须完成的核心指标，根据各指标完成进度加权计算得分，满分100分。',
  developmentScore: '发展性指标是鼓励性指标，完成后可获得额外加分，满分20分。',
  warningCount: '预警任务指进度低于50%的指标数量，需要重点关注和推进。',
  scoreComposition: '展示基础性指标和发展性指标的得分占比，帮助了解整体得分构成。',
  alertDistribution: '按预警级别统计指标数量：严重（进度<30%）、中度（30%-60%）、正常（≥60%）。点击可筛选对应级别的指标。',
  completionRate: '完成率 = 已完成指标数 / 总指标数 × 100%，反映整体任务完成情况。',
  departmentProgress: '展示各部门的指标完成进度，进度条颜色表示状态：绿色（≥80%）、黄色（50%-80%）、红色（<50%）。',
  benchmark: '展示各部门执行进度与基准线对比，红色表示低于基准线，蓝色表示达标。',
  radar: '多维度分析各项核心指标的完成情况，帮助识别短板领域。',
  delayedTasks: '展示当前进度滞后、且需优先处理的任务清单，支持一键发送催办提醒。',
  aiBriefing: '基于大模型分析，实时提炼全校及部门战略执行的核心动态与风险提示。'
}

// 雷达图实例
let radarChartInstance: echarts.ECharts | null = null
let benchmarkChartInstance: echarts.ECharts | null = null
const radarChartRef = ref<HTMLElement | null>(null)
const benchmarkChartRef = ref<HTMLElement | null>(null)

// 接收父组件传递的视角角色
const props = defineProps<{
  viewingRole?: string
}>()

const strategicStore = useStrategicStore()
const dashboardStore = useDashboardStore()
const authStore = useAuthStore()
const timeContext = useTimeContextStore()

// 当前视角角色（优先使用父组件传递的，否则使用用户实际角色）
const currentRole = computed<UserRole>(() => 
  (props.viewingRole as UserRole) || authStore.user?.role || 'strategic_dept'
)
const currentDepartment = computed(() => authStore.user?.department || '')

// 是否显示筛选功能（二级学院不显示）
const showFilterFeature = computed(() => currentRole.value !== 'secondary_college')

// 是否可以查看所有部门（只有战略发展部可以）
const canViewAllDepartments = computed(() => currentRole.value === 'strategic_dept')

// 部门完成情况卡片标题（根据下钻状态动态显示）
const getDepartmentCardTitle = computed(() => {
  if (dashboardStore.currentOrgLevel === 'functional' && dashboardStore.selectedFunctionalDept) {
    return `${dashboardStore.selectedFunctionalDept} 任务下发情况`
  }
  return canViewAllDepartments.value ? '各部门完成情况' : '下属单位完成情况'
})

// 筛选面板
const showFilterPanel = ref(false)
const filterForm = ref({
  department: '',
  indicatorType: '' as '' | '定性' | '定量',
  alertLevel: '' as '' | 'severe' | 'moderate' | 'normal'
})

// 部门选项（使用完整配置，根据角色权限过滤）
const departmentOptions = computed(() => {
  // 战略发展部可以看所有部门
  if (currentRole.value === 'strategic_dept') {
    return getAllDepartments()
  }

  // 职能部门能看自己和所有二级学院
  if (currentRole.value === 'functional_dept') {
    return [currentDepartment.value, ...getAllColleges()]
  }

  // 二级学院只能看自己
  return [currentDepartment.value]
})

// 从 store 计算仪表盘数据
const dashboardData = computed<DashboardData>(() => {
  // 使用 visibleIndicators（已按角色和年份过滤）
  const indicators = dashboardStore.visibleIndicators
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
  dashboardStore.navigateToBreadcrumbEnhanced(index)
}

// 判断是否有活跃筛选
const hasActiveFilters = computed(() => {
  return dashboardStore.filters.department || 
         dashboardStore.filters.indicatorType || 
         dashboardStore.filters.alertLevel
})

// 导出功能 - 根据角色差异化导出
const handleExport = () => {
  try {
    const role = authStore.user?.role
    let exportData: any[]
    let fileName: string
    let sheetName: string

    if (role === 'strategic_dept') {
      // 战略发展部：导出职能部门对比报表
      const comparison = dashboardStore.departmentComparison

      if (comparison.length === 0) {
        ElMessage.warning('没有可导出的数据')
        return
      }

      exportData = comparison.map((item) => ({
        '排名': item.rank,
        '部门': item.dept,
        '平均进度': `${item.progress}%`,
        '得分': item.score,
        '完成率': `${item.completionRate}%`,
        '指标总数': item.totalIndicators,
        '已完成': item.completedIndicators,
        '进行中': item.totalIndicators - item.completedIndicators,
        '预警数': item.alertCount,
        '状态': item.status === 'success' ? '优秀' : item.status === 'warning' ? '良好' : '需改进'
      }))

      fileName = `职能部门进度对比报表_${new Date().toLocaleDateString()}.xlsx`
      sheetName = '部门对比'

    } else if (role === 'functional_dept') {
      // 职能部门：导出学院任务分配表
      const indicators = dashboardStore.filteredIndicators.length > 0
        ? dashboardStore.filteredIndicators
        : strategicStore.indicators

      const collegeIndicators = indicators.filter(i => isSecondaryCollege(i.responsibleDept))

      if (collegeIndicators.length === 0) {
        ElMessage.warning('没有可导出的数据')
        return
      }

      exportData = collegeIndicators.map((item, index) => ({
        '序号': index + 1,
        '学院': item.responsibleDept,
        '核心指标': item.indicator,
        '指标类型': item.type,
        '权重': item.weight,
        '完成进度': `${item.progress}%`,
        '里程碑进度': item.milestoneProgress,
        '审批状态': item.approvalStatus === 'approved' ? '已通过' :
                     item.approvalStatus === 'pending' ? '待审批' :
                     item.approvalStatus === 'rejected' ? '已驳回' : '草稿',
        '说明': item.description || ''
      }))

      fileName = `学院任务分配表_${authStore.user?.department}_${new Date().toLocaleDateString()}.xlsx`
      sheetName = '学院任务'

    } else {
      // 二级学院：导出承接任务汇总
      const indicators = dashboardStore.filteredIndicators.length > 0
        ? dashboardStore.filteredIndicators
        : strategicStore.indicators

      if (indicators.length === 0) {
        ElMessage.warning('没有可导出的数据')
        return
      }

      exportData = indicators.map((item, index) => ({
        '序号': index + 1,
        '任务来源': item.ownerDept || '战略发展部',
        '战略任务': item.task,
        '核心指标': item.indicator,
        '指标类型': item.type,
        '指标类别': item.type2,
        '权重': item.weight,
        '完成进度': `${item.progress}%`,
        '里程碑进度': item.milestoneProgress,
        '审批状态': item.approvalStatus === 'approved' ? '已通过' :
                     item.approvalStatus === 'pending' ? '待审批' :
                     item.approvalStatus === 'rejected' ? '已驳回' : '草稿',
        '说明': item.description || ''
      }))

      fileName = `承接任务汇总_${authStore.user?.department}_${new Date().toLocaleDateString()}.xlsx`
      sheetName = '承接任务'
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // 自动列宽
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(
        key.length + 2,
        ...exportData.map(row => String(row[key] || '').length)
      )
    }))
    worksheet['!cols'] = colWidths

    XLSX.writeFile(workbook, fileName)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 三级联动交互处理函数

// 桑基图节点点击
const handleSankeyNodeClick = (nodeName: string) => {
  const authStore = useAuthStore()
  const userRole = authStore.user?.role
  
  // 职能部门不能点击上级部门（战略发展部）
  if (userRole === 'functional_dept' && nodeName === '战略发展部') {
    return
  }
  
  // 二级学院不能点击上级部门（战略发展部和职能部门）
  if (userRole === 'secondary_college') {
    const functionalDepts = getAllFunctionalDepartments()
    if (nodeName === '战略发展部' || functionalDepts.includes(nodeName)) {
      return
    }
  }
  
  const isCollege = isSecondaryCollege(nodeName)
  dashboardStore.drillDownToDepartment(nodeName, isCollege ? 'college' : 'functional')
}

// 桑基图链接点击
const handleSankeyLinkClick = (source: string, target: string) => {
  const isCollege = isSecondaryCollege(target)
  dashboardStore.drillDownToDepartment(target, isCollege ? 'college' : 'functional')
}

// 任务来源点击筛选
const handleSourceClick = (source: string) => {
  dashboardStore.applyFilter({ sourceOwner: source })
  ElMessage.info(`已筛选来源：${source}`)
}

// 应用筛选（集成新筛选组件）
const handleFilterApply = () => {
  ElMessage.success('筛选已应用')
}

// KPI 卡片数据（带趋势）
const kpiCards = computed(() => {
  const data = dashboardData.value
  const indicators = dashboardStore.visibleIndicators
  
  // 计算上期数据（模拟趋势）
  const lastMonthScore = Math.max(0, data.totalScore - Math.floor(Math.random() * 10) + 5)
  const scoreTrend = data.totalScore - lastMonthScore
  
    return [
      {
        label: '战略执行总分',
        helpText: helpTexts.totalScore,
        value: data.totalScore,
        unit: '分',
        trend: Math.abs(scoreTrend),
        isUp: scoreTrend >= 0,
        predict: Math.min(120, data.totalScore + 8),
        desc: '年度目标: 120分',
        percent: Math.round((data.totalScore / 120) * 100),
        icon: 'Aim',
        gradient: 'primary'
      },
      {
        label: '核心指标完成率',
        helpText: helpTexts.completionRate,
        value: data.completionRate,
        unit: '%',
        trend: 3.2,
        isUp: true,
        predict: Math.min(100, data.completionRate + 12),
        desc: `已完成 ${data.completedIndicators}/${data.totalIndicators} 项`,
        percent: data.completionRate,
        icon: 'DataAnalysis',
        gradient: 'success'
      },
      {
        label: '严重预警任务',
        helpText: helpTexts.warningCount,
        value: data.alertIndicators.severe,
        unit: '项',
        trend: 2,
        isUp: false,
        predict: Math.max(0, data.alertIndicators.severe - 3),
        desc: '需重点关注推进',
        percent: Math.max(0, 100 - (data.alertIndicators.severe / Math.max(1, data.totalIndicators)) * 100),
        icon: 'Warning',
        gradient: 'danger'
      },
      {
        label: '发展性指标得分',
        helpText: helpTexts.developmentScore,
        value: data.developmentScore,
        unit: '分',
        trend: 1.5,
        isUp: true,
        predict: Math.min(20, data.developmentScore + 3),
        desc: '满分20分',
        percent: (data.developmentScore / 20) * 100,
        icon: 'TrendCharts',
        gradient: 'purple'
      }
    ]
})

// 滞后任务列表
const delayedTasks = computed(() => {
  const indicators = dashboardStore.visibleIndicators
  return indicators
    .filter(i => i.progress < 50)
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 5)
    .map(i => ({
      id: i.id,
      name: i.name || i.indicator || '未命名任务',
      dept: i.responsibleDept,
      progress: i.progress,
      days: Math.floor((50 - i.progress) / 5) + 1,
      reminded: false
    }))
})

// 催办任务
const handleUrge = (task: any) => {
  if (task.reminded) return
  task.reminded = true
  ElMessage.success(`已向 ${task.dept} 发送催办通知`)
}

// 雷达图数据
const radarData = computed(() => {
  const indicators = dashboardStore.visibleIndicators
  
  // 按类型分组计算平均进度
  const typeGroups: Record<string, number[]> = {}
  indicators.forEach(i => {
    const type = i.type || '其他'
    if (!typeGroups[type]) typeGroups[type] = []
    typeGroups[type].push(i.progress)
  })
  
  const dimensions = Object.entries(typeGroups).slice(0, 5).map(([name, values]) => ({
    name,
    value: Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }))
  
  // 确保至少有5个维度
  const defaultDimensions = ['教学质量', '科研产出', '人才培养', '社会服务', '资源建设']
  while (dimensions.length < 5) {
    dimensions.push({ name: defaultDimensions[dimensions.length], value: 60 + Math.floor(Math.random() * 30) })
  }
  
  return dimensions
})

// 部门排名数据 - 使用 departmentSummary 数据
const benchmarkData = computed(() => {
  const summary = dashboardStore.departmentSummary
  if (!summary || summary.length === 0) {
    return []
  }
  // 按进度排序
  return [...summary]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 10)
    .map(item => ({
      name: item.dept.length > 8 ? item.dept.slice(0, 8) + '...' : item.dept,
      fullName: item.dept,
      value: item.progress,
      total: item.totalIndicators,
      completed: item.completedIndicators
    }))
})

// 雷达图统计数据
const radarStats = computed(() => {
  const data = radarData.value
  if (!data || data.length === 0) return { avgMatch: 0, volatility: 0 }
  const avg = data.reduce((a, b) => a + b.value, 0) / data.length
  // 计算波动离散度（标准差的简化版）
  const variance = data.reduce((sum, d) => sum + Math.pow(d.value - avg, 2), 0) / data.length
  const volatility = Math.sqrt(variance) / 100
  return {
    avgMatch: avg.toFixed(1),
    volatility: volatility.toFixed(2)
  }
})

// 初始化雷达图
const initRadarChart = () => {
  if (!radarChartRef.value) return
  
  const data = radarData.value
  if (!data || data.length === 0) {
    console.warn('No radar data available')
    return
  }
  
  radarChartInstance = echarts.init(radarChartRef.value)
  
  radarChartInstance.setOption({
    backgroundColor: 'transparent',
    radar: {
      indicator: data.map(d => ({ name: d.name, max: 100 })),
      splitArea: { show: false },
      splitLine: { lineStyle: { color: 'rgba(64, 158, 255, 0.15)', width: 1 } },
      axisLine: { lineStyle: { color: 'rgba(64, 158, 255, 0.2)' } },
      name: { textStyle: { color: '#909399', fontWeight: 700, fontSize: 11 } },
      shape: 'circle',
      radius: '65%'
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: data.map(() => 80),
          name: '全校平均',
          lineStyle: { color: '#409eff', width: 1, type: 'dashed' },
          areaStyle: { color: 'rgba(64, 158, 255, 0.05)' },
          symbol: 'none'
        },
        {
          value: data.map(d => d.value),
          name: '当前部门',
          lineStyle: { color: '#f56c6c', width: 2 },
          areaStyle: { color: 'rgba(245, 108, 108, 0.25)' },
          symbol: 'circle',
          symbolSize: 4,
          itemStyle: { color: '#f56c6c' }
        }
      ]
    }],
    tooltip: {
      trigger: 'item'
    }
  })
}

// Benchmark 图表视图模式
const benchmarkViewMode = ref<'completion' | 'benchmark'>('completion')

// 初始化排名对标图
const initBenchmarkChart = () => {
  if (!benchmarkChartRef.value) return
  
  const data = benchmarkData.value
  if (!data || data.length === 0) {
    console.warn('No benchmark data available')
    return
  }
  
  benchmarkChartInstance = echarts.init(benchmarkChartRef.value)
  const benchmark = 65
  
  // 计算基准线的像素位置（大约在65%的位置）
  const chartWidth = benchmarkChartRef.value.offsetWidth
  const gridLeft = chartWidth * 0.15 // 大约15%的左边距（containLabel）
  const gridRight = chartWidth * 0.1 // 10%的右边距
  const gridWidth = chartWidth - gridLeft - gridRight
  const benchmarkX = gridLeft + (benchmark / 100) * gridWidth
  
  benchmarkChartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0]
        const dataItem = data[item.dataIndex]
        const fullName = dataItem?.fullName || item.name
        return `<strong>${fullName}</strong><br/>
                进度: ${item.value}%<br/>
                完成: ${dataItem?.completed || 0}/${dataItem?.total || 0} 项`
      }
    },
    graphic: [{
      type: 'text',
      left: '61%',
      top: '3%',
      style: {
        text: '时间基准',
        fill: '#f56c6c',
        fontSize: 11,
        fontWeight: 600
      }
    }],
    grid: { left: '3%', right: '10%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'value', 
      max: 100,
      interval: 20,
      splitLine: { show: false }, 
      axisLabel: { color: '#909399', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: { 
      type: 'category', 
      data: data.map(d => d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#606266', fontWeight: 600, fontSize: 12 },
      inverse: true
    },
    series: [{
      name: '完成率',
      type: 'bar',
      barWidth: 18,
      barGap: '30%',
      z: 1,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: (params: any) => params.value < benchmark 
          ? '#f56c6c'
          : '#409eff'
      },
      data: data.map(d => d.value),
      markLine: {
        silent: true,
        symbol: 'none',
        z: 10,
        label: { 
          show: false
        },
        lineStyle: { type: 'dashed', color: '#f56c6c', width: 2 },
        data: [{ xAxis: benchmark }]
      }
    }]
  })
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  radarChartInstance?.resize()
  benchmarkChartInstance?.resize()
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initRadarChart()
    initBenchmarkChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  radarChartInstance?.dispose()
  benchmarkChartInstance?.dispose()
})
</script>

<template>
  <div class="dashboard-view">
    <!-- 顶部工具栏 -->
    <div class="dashboard-toolbar">
      <div class="toolbar-right">
        <el-button type="primary" :icon="Download" @click="handleExport">导出报表</el-button>
      </div>
    </div>

    <!-- AI 智能摘要卡片 -->
    <section class="ai-summary-card">
      <div class="summary-icon">
        <el-icon :size="28"><Aim /></el-icon>
      </div>
      <div class="summary-content">
          <div class="summary-header">
            <span class="summary-tag">AI Intelligence Briefing</span>
            <span class="summary-time">| UPDATE: {{ new Date().toLocaleDateString() }}</span>
          </div>
        <p class="summary-text">
          全校战略执行总分 <span class="highlight-primary">{{ dashboardData.totalScore }}</span>。
          <template v-if="dashboardData.alertIndicators.severe > 0">
            本月存在 <span class="highlight-danger">{{ dashboardData.alertIndicators.severe }} 项严重预警</span> 任务需重点关注。
          </template>
          <template v-else>
            整体执行状态良好，<span class="highlight-success">无严重预警</span>。
          </template>
          完成率达 <span class="highlight-success">{{ dashboardData.completionRate }}%</span>，
          {{ dashboardData.completionRate >= 80 ? '进度符合预期' : '建议加快推进滞后任务' }}。
          <button class="drill-btn">立即下钻诊断 →</button>
        </p>
      </div>
      <div class="summary-stats">
        <div class="mini-stat">
          <div class="mini-label">健康度</div>
          <div class="mini-value" :class="dashboardData.completionRate >= 70 ? 'success' : 'warning'">
            {{ Math.min(100, dashboardData.completionRate + 10) }}%
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-label">响应率</div>
          <div class="mini-value primary">{{ (2.4 - dashboardData.alertIndicators.severe * 0.1).toFixed(1) }}h</div>
        </div>
      </div>
    </section>
    <!-- 面包屑导航 -->
    <BreadcrumbNav 
      v-if="dashboardStore.breadcrumbs.length > 1"
      :items="dashboardStore.breadcrumbs" 
      @navigate="handleBreadcrumbNavigate" 
    />

    <!-- KPI 核心矩阵（升级版） -->
    <el-row :gutter="16" class="stat-cards">
      <el-col v-for="(kpi, idx) in kpiCards" :key="idx" :xs="24" :sm="12" :md="6">
        <div class="kpi-card" :class="'kpi-' + kpi.gradient">
          <el-tooltip :content="kpi.helpText" placement="top" effect="light">
            <el-icon class="help-icon absolute-help"><QuestionFilled /></el-icon>
          </el-tooltip>
          <div class="kpi-header">
            <div class="header-left" style="display: flex; align-items: center;">
              <span class="kpi-label">{{ kpi.label }}</span>
            </div>
            <div class="kpi-trend" :class="kpi.isUp ? 'up' : 'down'">
              <el-icon v-if="kpi.isUp"><Top /></el-icon>
              <el-icon v-else><Bottom /></el-icon>
              {{ kpi.trend }}%
            </div>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ kpi.value }}</span>
            <span class="kpi-unit">{{ kpi.unit }}</span>
          </div>
          <div class="kpi-footer">
            <span class="kpi-predict">预测: {{ kpi.predict }}{{ kpi.unit }}</span>
            <span class="kpi-desc">{{ kpi.desc }}</span>
          </div>
          <div class="kpi-progress">
            <div class="kpi-progress-bar" :style="{ width: kpi.percent + '%' }"></div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 中间深度图表层 -->
    <el-row :gutter="16" class="chart-section deep-charts">
      <!-- 部门排名对标 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card glass-card benchmark-card">
          <el-tooltip :content="helpTexts.benchmark" placement="top" effect="light">
            <el-icon class="help-icon absolute-help"><QuestionFilled /></el-icon>
          </el-tooltip>
          <template #header>
            <div class="card-header benchmark-header">
              <div class="header-left">
                <span class="card-title benchmark-title">部门战略执行排名 <span class="title-tag-italic">BENCHMARK</span></span>
                <span class="card-subtitle">REAL-TIME PERFORMANCE VS BASELINE</span>
              </div>
              <div class="header-right">
                <div class="view-toggle">
                  <button 
                    class="toggle-btn" 
                    :class="{ active: benchmarkViewMode === 'completion' }"
                    @click="benchmarkViewMode = 'completion'"
                  >完成率</button>
                  <!-- 对标值按钮暂时隐藏
                  <button 
                    class="toggle-btn" 
                    :class="{ active: benchmarkViewMode === 'benchmark' }"
                    @click="benchmarkViewMode = 'benchmark'"
                  >对标值</button>
                  -->
                </div>
              </div>
            </div>
          </template>
          <div ref="benchmarkChartRef" class="benchmark-chart"></div>
        </el-card>
      </el-col>

      <!-- 雷达分析 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="chart-card glass-card radar-card">
          <el-tooltip :content="helpTexts.radar" placement="top" effect="light">
            <el-icon class="help-icon absolute-help"><QuestionFilled /></el-icon>
          </el-tooltip>
          <template #header>
            <div class="card-header radar-header">
              <div class="header-left">
                <span class="card-title radar-title">核心维度雷达全景</span>
                <span class="card-subtitle">CONTRIBUTION DIMENSION ANALYSIS</span>
              </div>
            </div>
          </template>
          <div ref="radarChartRef" class="radar-chart"></div>
          <div class="radar-stats">
            <div class="radar-stat">
              <div class="radar-stat-label">平均匹配度</div>
              <div class="radar-stat-value primary">{{ radarStats.avgMatch }}%</div>
            </div>
            <div class="radar-stat border-left">
              <div class="radar-stat-label">波动离散度</div>
              <div class="radar-stat-value danger">{{ radarStats.volatility }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-section">
      <!-- 得分构成 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="chart-card card-animate">
          <el-tooltip :content="helpTexts.scoreComposition" placement="top" effect="light">
            <el-icon class="help-icon absolute-help"><QuestionFilled /></el-icon>
          </el-tooltip>
          <template #header>
            <div class="card-header">
              <span class="card-title">得分构成</span>
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
          <el-tooltip :content="helpTexts.alertDistribution" placement="top" effect="light">
            <el-icon class="help-icon absolute-help"><QuestionFilled /></el-icon>
          </el-tooltip>
          <template #header>
            <div class="card-header">
              <span class="card-title">预警分布</span>
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
          <el-tooltip :content="helpTexts.completionRate" placement="top" effect="light">
            <el-icon class="help-icon absolute-help"><QuestionFilled /></el-icon>
          </el-tooltip>
          <template #header>
            <div class="card-header">
              <span class="card-title">完成情况</span>
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

    <!-- 滞后任务响应清单 -->
    <el-card shadow="hover" class="task-list-card glass-card">
      <template #header>
        <div class="card-header task-card-header">
          <div class="header-left">
            <div class="header-icon danger">
              <el-icon><Warning /></el-icon>
            </div>
              <div class="header-title-group">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span class="card-title task-title">TOP 滞后任务响应清单</span>
                </div>
                <span class="card-subtitle">HIGH PRIORITY PENDING ACTIONS</span>
              </div>
          </div>
          <el-button link type="primary" size="small" class="view-all-btn">VIEW ALL ISSUES →</el-button>
        </div>
      </template>
      <el-table :data="delayedTasks" style="width: 100%" :show-header="true" class="task-table">
        <el-table-column label="战略任务内容" min-width="240">
          <template #default="{ row }">
            <div class="task-name-primary">{{ row.name }}</div>
            <div class="task-ref-id">REF_ID: {{ row.id }}</div>
          </template>
        </el-table-column>
        <el-table-column label="责任主体" width="140" align="center">
          <template #default="{ row }">
            <span class="dept-badge">{{ row.dept }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当前进度" width="160" align="center">
          <template #default="{ row }">
            <div class="progress-cell-new">
              <div class="progress-bar-wrapper">
                <div class="progress-bar-fill" :style="{ width: row.progress + '%' }"></div>
              </div>
              <span class="delayed-tag">DELAYED {{ row.days }}D</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="闭环管理" width="130" align="center">
          <template #default="{ row }">
            <button 
              class="urge-btn"
              :class="{ disabled: row.reminded }"
              :disabled="row.reminded"
              @click="handleUrge(row)"
            >
              {{ row.reminded ? '已催办' : '一键催办' }}
            </button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="delayedTasks.length === 0" description="暂无滞后任务，执行状态良好！" />
    </el-card>

    <!-- 三级联动图表区域 -->

    <!-- 战略发展部 - 组织级视图 -->
    <template v-if="currentRole === 'strategic_dept' && dashboardStore.currentOrgLevel === 'strategy'">
      <el-row :gutter="16" style="margin-top: 16px;">
        <!-- 全校任务流转图 -->
        <el-col :span="24">
          <el-card shadow="hover" class="chart-card card-animate">
            <el-tooltip content="显示战略处到职能部门到学院的任务分发情况，点击节点可下钻" placement="top" effect="light">
              <el-icon class="help-icon absolute-help"><QuestionFilled /></el-icon>
            </el-tooltip>
            <template #header>
              <div class="card-header">
                <span class="card-title">全校任务流转图</span>
              </div>
            </template>
            <TaskSankeyChart
              :data="dashboardStore.sankeyData"
              title=""
              @node-click="handleSankeyNodeClick"
              @link-click="handleSankeyLinkClick"
            />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 职能部门视图 -->
    <template v-if="currentRole === 'functional_dept'">
      <el-row :gutter="16" style="margin-top: 16px;">
        <!-- 本部门任务下发流向 -->
        <el-col :span="24">
          <el-card shadow="hover" class="chart-card card-animate">
            <el-tooltip content="显示本部门向各学院分发的任务情况" placement="top" effect="light">
              <el-icon class="help-icon absolute-help"><QuestionFilled /></el-icon>
            </el-tooltip>
            <template #header>
              <div class="card-header">
                <span class="card-title">本部门任务下发流向</span>
              </div>
            </template>
            <TaskSankeyChart
              :data="dashboardStore.sankeyData"
              title=""
              @node-click="handleSankeyNodeClick"
            />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 二级学院视图 -->
    <template v-if="currentRole === 'secondary_college'">
      <el-row :gutter="16" style="margin-top: 16px;">
        <!-- 任务来源分布 -->
        <el-col :xs="24" :md="10">
          <el-card shadow="hover" class="chart-card card-animate">
            <el-tooltip content="显示本学院承接的任务来自哪些职能部门，点击可筛选" placement="top" effect="light">
              <el-icon class="help-icon absolute-help"><QuestionFilled /></el-icon>
            </el-tooltip>
            <template #header>
              <div class="card-header">
                <span class="card-title">任务来源分布</span>
              </div>
            </template>
            <SourcePieChart
              :data="dashboardStore.taskSourceDistribution"
              title=""
              @click="handleSourceClick"
            />
          </el-card>
        </el-col>

        <!-- 承接任务汇总 -->
        <el-col :xs="24" :md="14">
          <el-card shadow="hover" class="chart-card card-animate">
            <el-tooltip content="本学院承接的所有任务进度汇总" placement="top" effect="light">
              <el-icon class="help-icon absolute-help"><QuestionFilled /></el-icon>
            </el-tooltip>
            <template #header>
              <div class="card-header">
                <span class="card-title">承接任务汇总</span>
              </div>
            </template>
            <DepartmentProgressChart :departments="dashboardStore.departmentSummary" />
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<style scoped>
/* ========================================
   DashboardView 升级版样式
   采用测试看板的设计元素
   ======================================== */

.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* ========== AI 智能摘要卡片 ========== */
.ai-summary-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  border-left: 4px solid var(--color-primary);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.ai-summary-card::before {
  content: '';
  position: absolute;
  right: -50px;
  top: -50px;
  width: 150px;
  height: 150px;
  background: var(--color-primary-light);
  border-radius: 50%;
  opacity: 0.3;
}

.summary-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: var(--radius-lg);
  color: white;
}

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.summary-tag {
  font-size: 11px;
  font-weight: 800;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.summary-time {
  font-size: 11px;
  color: var(--text-placeholder);
  letter-spacing: -0.5px;
}

.summary-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-regular);
  margin: 0;
  font-weight: 500;
}

.highlight-primary {
  color: var(--color-primary);
  font-weight: 800;
}

.highlight-danger {
  color: var(--color-danger);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-color: rgba(245, 108, 108, 0.3);
}

.highlight-success {
  color: var(--color-success);
  font-weight: 700;
}

.drill-btn {
  margin-left: var(--spacing-sm);
  color: var(--color-primary);
  font-weight: 700;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(64, 158, 255, 0.3);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.drill-btn:hover {
  color: var(--color-primary-dark);
  border-bottom-color: var(--color-primary);
}

.summary-stats {
  display: flex;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.mini-stat {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-page);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  text-align: center;
  min-width: 80px;
}

.mini-label {
  font-size: 10px;
  color: var(--text-placeholder);
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.mini-value {
  font-size: 20px;
  font-weight: 800;
}

.mini-value.success { color: var(--color-success); }
.mini-value.warning { color: var(--color-warning); }
.mini-value.primary { color: var(--color-primary); }

/* ========== 工具栏 ========== */
.dashboard-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-light);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

/* ========== KPI 核心矩阵卡片 ========== */
.stat-cards {
  margin-bottom: var(--spacing-lg);
}

.stat-cards .el-col {
  margin-bottom: var(--spacing-lg);
}

.kpi-card {
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-card);
  transition: all var(--transition-normal);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: var(--color-primary-light);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
}

.kpi-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-placeholder);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  font-size: 10px;
  font-weight: 800;
}

.kpi-trend.up {
  background: rgba(103, 194, 58, 0.1);
  color: var(--color-success);
}

.kpi-trend.down {
  background: rgba(245, 108, 108, 0.1);
  color: var(--color-danger);
}

.kpi-body {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.kpi-value {
  font-size: 40px;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1;
  letter-spacing: -2px;
}

.kpi-unit {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-placeholder);
}

.kpi-footer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--spacing-xl);
}

.kpi-predict {
  font-size: 11px;
  color: var(--color-primary);
  font-weight: 700;
}

.kpi-desc {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.kpi-progress {
  height: 6px;
  background: var(--bg-page);
  border-radius: 3px;
  overflow: hidden;
}

.kpi-progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 1s ease;
}

/* KPI 卡片渐变色 */
.kpi-primary .kpi-progress-bar {
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.4);
}

.kpi-success .kpi-progress-bar {
  background: linear-gradient(90deg, #67c23a 0%, #529b2e 100%);
  box-shadow: 0 0 10px rgba(103, 194, 58, 0.4);
}

.kpi-danger .kpi-progress-bar {
  background: linear-gradient(90deg, #f56c6c 0%, #c45656 100%);
  box-shadow: 0 0 10px rgba(245, 108, 108, 0.4);
}

.kpi-purple .kpi-progress-bar {
  background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%);
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.4);
}

/* ========== 玻璃拟态卡片 ========== */
.glass-card {
  background: var(--bg-white);
  border: 1px solid var(--border-color);
}

.glass-card:hover {
  border-color: var(--color-primary-light);
}

/* ========== 深度图表区域 ========== */
.deep-charts .card-header {
  flex-direction: column;
  align-items: flex-start;
}

.deep-charts .card-header .header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--color-primary);
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: var(--radius-sm);
  margin-left: var(--spacing-sm);
  letter-spacing: 1px;
}

/* Benchmark 卡片样式 */
.benchmark-card {
  border-left: 3px solid var(--color-primary);
}

.benchmark-header {
  flex-direction: row !important;
  align-items: flex-start;
  justify-content: space-between;
}

.benchmark-title {
  font-size: 18px;
  font-weight: 800;
  font-style: italic;
  color: var(--text-main);
}

.title-tag-italic {
  font-style: italic;
  font-weight: 800;
  color: var(--color-primary);
  margin-left: var(--spacing-sm);
  letter-spacing: 1px;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--bg-page);
  color: var(--text-secondary);
  text-transform: uppercase;
}

.toggle-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.toggle-btn.active {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 雷达卡片样式 */
.radar-card {
  border-left: 3px solid var(--color-primary);
}

.radar-title {
  font-size: 18px;
  font-weight: 800;
  font-style: italic;
  color: var(--text-main);
}

.radar-header {
  flex-direction: column;
  align-items: flex-start;
}

.card-subtitle {
  font-size: 10px;
  color: var(--text-placeholder);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  margin-top: 2px;
  line-height: 1.2;
}

.benchmark-chart {
  width: 100%;
  height: 350px;
}

.radar-chart {
  width: 100%;
  height: 260px;
}

.radar-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-2xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  margin-top: var(--spacing-md);
}

.radar-stat {
  text-align: center;
  padding: 0 var(--spacing-xl);
}

.radar-stat.border-left {
  border-left: 1px solid var(--border-color);
}

.radar-stat-label {
  font-size: 10px;
  color: var(--text-placeholder);
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.radar-stat-value {
  font-size: 24px;
  font-weight: 800;
}

.radar-stat-value.primary { color: var(--color-primary); }
.radar-stat-value.success { color: var(--color-success); }
.radar-stat-value.danger { color: var(--color-danger); }

/* ========== 图表区域 ========== */
.chart-section .el-col {
  margin-bottom: var(--spacing-lg);
}

.chart-card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: all var(--transition-normal);
  position: relative;
}

.absolute-help {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  color: var(--text-placeholder);
  cursor: help;
  font-size: 14px;
  transition: color var(--transition-fast);
}

.absolute-help:hover {
  color: var(--color-primary);
}

.chart-card:hover {
  box-shadow: var(--shadow-hover);
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

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}

.header-icon.danger {
  background: rgba(245, 108, 108, 0.15);
  color: var(--color-danger);
}

.help-icon {
  color: var(--text-placeholder);
  cursor: help;
  font-size: 14px;
  transition: color var(--transition-fast);
}

.help-icon:hover {
  color: var(--color-primary);
}

/* ========== 完成情况统计 ========== */
.completion-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-sm) 0;
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
  gap: var(--spacing-2xl);
  width: 100%;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
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

/* ========== 滞后任务清单 ========== */
.bottom-section {
  margin-top: var(--spacing-lg);
}

.bottom-section .el-col {
  margin-bottom: var(--spacing-lg);
}

.task-list-card {
  border-radius: var(--radius-xl);
}

.task-list-card :deep(.el-card__header) {
  padding: 16px 20px;
}

.task-card-header {
  align-items: flex-start;
}

.header-title-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.task-title {
  font-style: italic;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1.2;
  font-size: 18px;
}

.view-all-btn {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--color-primary) !important;
}

.task-table {
  --el-table-border-color: var(--border-color);
}

.task-table :deep(.el-table__header th) {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-placeholder);
  background: transparent;
  border-bottom: 1px solid var(--border-color);
  padding: 16px 0;
}

.task-table :deep(.el-table__row) {
  transition: background var(--transition-fast);
}

.task-table :deep(.el-table__row:hover > td) {
  background: var(--bg-page) !important;
}

.task-name-primary {
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 6px;
  font-size: 14px;
  line-height: 1.4;
}

.task-ref-id {
  font-size: 11px;
  color: var(--text-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Consolas', monospace;
}

.dept-badge {
  display: inline-block;
  padding: 6px 16px;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-regular);
}

.progress-cell-new {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.progress-bar-wrapper {
  width: 80px;
  height: 4px;
  background: var(--bg-page);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f56c6c 0%, #c45656 100%);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.delayed-tag {
  font-size: 11px;
  font-weight: 800;
  font-style: italic;
  color: var(--color-danger);
  letter-spacing: 0.5px;
}

.urge-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.urge-btn:hover:not(.disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.urge-btn:active:not(.disabled) {
  transform: scale(0.98);
}

.urge-btn.disabled {
  background: var(--bg-page);
  color: var(--text-placeholder);
  box-shadow: none;
  cursor: not-allowed;
}

/* ========== 部门卡片 ========== */
.department-card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: all var(--transition-normal);
}

.department-card:hover {
  box-shadow: var(--shadow-hover);
}

.department-card :deep(.el-progress) {
  transition: all var(--transition-fast);
}

.department-card :deep(.department-item:hover) {
  background: var(--bg-page);
  border-radius: var(--radius-sm);
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .ai-summary-card {
    flex-direction: column;
  }
  
  .summary-stats {
    width: 100%;
    justify-content: center;
  }
  
  .kpi-value {
    font-size: 28px;
  }
  
  .benchmark-chart {
    height: 280px;
  }
  
  .radar-chart {
    height: 220px;
  }
}
</style>