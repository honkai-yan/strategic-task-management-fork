import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DashboardData, DepartmentProgress, ApiResponse } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const dashboardData = ref<DashboardData | null>(null)
  const departmentProgress = ref<DepartmentProgress[]>([])
  const recentActivities = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const completionRate = computed(() => dashboardData.value?.completionRate || 0)
  const totalScore = computed(() => dashboardData.value?.totalScore || 0)
  const warningCount = computed(() => dashboardData.value?.warningCount || 0)
  const alertStats = computed(() => dashboardData.value?.alertIndicators || { severe: 0, moderate: 0, normal: 0 })

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

  return {
    // State
    dashboardData,
    departmentProgress,
    recentActivities,
    loading,
    error,

    // Getters
    completionRate,
    totalScore,
    warningCount,
    alertStats,

    // Actions
    fetchDashboardData,
    fetchDepartmentProgress,
    fetchRecentActivities,
    refreshDashboard,
    exportReport,
  }
})