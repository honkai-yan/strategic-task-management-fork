import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  DashboardData, 
  DepartmentProgress, 
  ApiResponse,
  DrillDownLevel,
  BreadcrumbItem,
  FilterState,
  AlertSummary,
  StrategicIndicator
} from '@/types'
import { useStrategicStore } from './strategic'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const dashboardData = ref<DashboardData | null>(null)
  const departmentProgress = ref<DepartmentProgress[]>([])
  const recentActivities = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 下钻和筛选状态
  const currentLevel = ref<DrillDownLevel>('organization')
  const breadcrumbs = ref<BreadcrumbItem[]>([
    { level: 'organization', label: '组织总览' }
  ])
  const filters = ref<FilterState>({})
  const selectedDepartment = ref<string | undefined>()
  const selectedIndicator = ref<string | undefined>()

  // Getters
  const completionRate = computed(() => dashboardData.value?.completionRate || 0)
  const totalScore = computed(() => dashboardData.value?.totalScore || 0)
  const warningCount = computed(() => dashboardData.value?.warningCount || 0)
  const alertStats = computed(() => dashboardData.value?.alertIndicators || { severe: 0, moderate: 0, normal: 0 })
  
  // 筛选后的指标列表
  const filteredIndicators = computed<StrategicIndicator[]>(() => {
    const strategicStore = useStrategicStore()
    let result = [...strategicStore.indicators]
    
    // 按部门筛选
    if (filters.value.department) {
      result = result.filter(i => i.responsibleDept === filters.value.department)
    }
    
    // 按指标类型筛选
    if (filters.value.indicatorType) {
      result = result.filter(i => i.type1 === filters.value.indicatorType)
    }
    
    // 按预警级别筛选
    if (filters.value.alertLevel) {
      result = result.filter(i => {
        const level = getAlertLevel(i.progress)
        return level === filters.value.alertLevel
      })
    }
    
    // 按当前下钻层级筛选
    if (currentLevel.value === 'department' && selectedDepartment.value) {
      result = result.filter(i => i.responsibleDept === selectedDepartment.value)
    }
    
    return result
  })
  
  // 部门汇总数据
  const departmentSummary = computed<DepartmentProgress[]>(() => {
    const strategicStore = useStrategicStore()
    const indicators = filteredIndicators.value.length > 0 
      ? filteredIndicators.value 
      : strategicStore.indicators
    
    const deptMap = new Map<string, { total: number; progress: number; count: number; alerts: number }>()
    
    indicators.forEach(indicator => {
      const dept = indicator.responsibleDept || '未分配'
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { total: 0, progress: 0, count: 0, alerts: 0 })
      }
      const data = deptMap.get(dept)!
      data.total += indicator.weight
      data.progress += indicator.progress
      data.count += 1
      if (indicator.progress < 60) data.alerts += 1
    })
    
    const result: DepartmentProgress[] = []
    deptMap.forEach((data, dept) => {
      const avgProgress = data.count > 0 ? Math.round(data.progress / data.count) : 0
      result.push({
        dept,
        progress: avgProgress,
        score: Math.round(avgProgress * 1.2),
        status: avgProgress >= 80 ? 'success' : avgProgress >= 50 ? 'warning' : 'exception',
        totalIndicators: data.count,
        completedIndicators: 0,
        alertCount: data.alerts
      })
    })
    
    return result
  })
  
  // 预警分布
  const alertDistribution = computed<AlertSummary>(() => {
    const strategicStore = useStrategicStore()
    const indicators = filteredIndicators.value.length > 0 
      ? filteredIndicators.value 
      : strategicStore.indicators
    
    const severe = indicators.filter(i => i.progress < 30).length
    const moderate = indicators.filter(i => i.progress >= 30 && i.progress < 60).length
    const normal = indicators.filter(i => i.progress >= 60).length
    
    return { severe, moderate, normal, total: indicators.length }
  })
  
  // 辅助函数：获取预警级别
  const getAlertLevel = (progress: number): 'severe' | 'moderate' | 'normal' => {
    if (progress < 30) return 'severe'
    if (progress < 60) return 'moderate'
    return 'normal'
  }

  // Actions
  const fetchDashboardData = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result: ApiResponse<DashboardData> = await response.json()
      dashboardData.value = result.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Dashboard fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchDepartmentProgress = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/dashboard/department-progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (response.ok) {
        const result: ApiResponse<DepartmentProgress[]> = await response.json()
        departmentProgress.value = result.data
      }
    } catch (err) {
      console.error('Department progress fetch error:', err)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/dashboard/recent-activities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (response.ok) {
        const result: ApiResponse<any[]> = await response.json()
        recentActivities.value = result.data
      }
    } catch (err) {
      console.error('Recent activities fetch error:', err)
    }
  }

  const refreshDashboard = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchDepartmentProgress(),
      fetchRecentActivities(),
    ])
  }

  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await fetch(`/api/dashboard/export/${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (response.ok) {
        // Handle file download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Export error:', err)
      throw new Error('Failed to export report')
    }
  }
  
  // 下钻操作
  const drillDown = (level: DrillDownLevel, value: string, label: string) => {
    currentLevel.value = level
    
    if (level === 'department') {
      selectedDepartment.value = value
      selectedIndicator.value = undefined
      breadcrumbs.value = [
        { level: 'organization', label: '组织总览' },
        { level: 'department', label, value }
      ]
    } else if (level === 'indicator') {
      selectedIndicator.value = value
      breadcrumbs.value = [
        { level: 'organization', label: '组织总览' },
        ...(selectedDepartment.value ? [{ 
          level: 'department' as DrillDownLevel, 
          label: selectedDepartment.value, 
          value: selectedDepartment.value 
        }] : []),
        { level: 'indicator', label, value }
      ]
    }
  }
  
  // 面包屑导航
  const navigateToBreadcrumb = (index: number) => {
    const target = breadcrumbs.value[index]
    if (!target) return
    
    currentLevel.value = target.level
    breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
    
    if (target.level === 'organization') {
      selectedDepartment.value = undefined
      selectedIndicator.value = undefined
    } else if (target.level === 'department') {
      selectedDepartment.value = target.value
      selectedIndicator.value = undefined
    }
  }
  
  // 应用筛选
  const applyFilter = (filter: Partial<FilterState>) => {
    filters.value = { ...filters.value, ...filter }
  }
  
  // 重置筛选和下钻状态
  const resetFilters = () => {
    filters.value = {}
    currentLevel.value = 'organization'
    selectedDepartment.value = undefined
    selectedIndicator.value = undefined
    breadcrumbs.value = [{ level: 'organization', label: '组织总览' }]
  }

  return {
    // State
    dashboardData,
    departmentProgress,
    recentActivities,
    loading,
    error,
    currentLevel,
    breadcrumbs,
    filters,
    selectedDepartment,
    selectedIndicator,

    // Getters
    completionRate,
    totalScore,
    warningCount,
    alertStats,
    filteredIndicators,
    departmentSummary,
    alertDistribution,

    // Actions
    fetchDashboardData,
    fetchDepartmentProgress,
    fetchRecentActivities,
    refreshDashboard,
    exportReport,
    drillDown,
    navigateToBreadcrumb,
    applyFilter,
    resetFilters,
  }
})