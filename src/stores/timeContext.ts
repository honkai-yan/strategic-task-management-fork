/**
 * 时间上下文状态管理
 * 控制全局时间轴，实现历史快照模式和工作模式切换
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTimeContextStore = defineStore('timeContext', () => {
  // 当前选中的年份
  const currentYear = ref<number>(new Date().getFullYear())

  // 可用年份列表（从后端获取或本地生成）
  const availableYears = ref<number[]>([])

  // 是否正在加载数据
  const loading = ref(false)

  // 加载错误信息
  const error = ref<string | null>(null)

  // 计算当前真实年份
  const realCurrentYear = computed(() => new Date().getFullYear())

  // 是否为只读模式（历史年份）
  const isReadOnly = computed(() => currentYear.value < realCurrentYear.value)

  // 是否为当前年份
  const isCurrentYear = computed(() => currentYear.value === realCurrentYear.value)

  // 是否为未来年份
  const isFutureYear = computed(() => currentYear.value > realCurrentYear.value)

  // 年份显示标签
  const yearLabel = computed(() => {
    if (isReadOnly.value) {
      return `${currentYear.value}年度（历史快照）`
    }
    if (isFutureYear.value) {
      return `${currentYear.value}年度（规划中）`
    }
    return `${currentYear.value}年度`
  })

  /**
   * 初始化可用年份列表
   * 默认显示当前年份前后5年
   */
  function initAvailableYears() {
    const current = realCurrentYear.value
    const years: number[] = []

    // 往前5年 + 当前年 + 往后1年
    for (let i = current - 5; i <= current + 1; i++) {
      years.push(i)
    }

    availableYears.value = years
  }

  /**
   * 切换年份
   * @param year 目标年份
   * @returns 是否切换成功
   */
  async function switchYear(year: number): Promise<boolean> {
    if (year === currentYear.value) {
      return true
    }

    if (!availableYears.value.includes(year)) {
      error.value = '无效的年份'
      return false
    }

    loading.value = true
    error.value = null

    try {
      // 更新当前年份
      currentYear.value = year

      // TODO: 触发数据重新加载
      // 这里会触发其他 Store 的 watch 监听器重新加载数据

      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : '切换年份失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取年份的显示状态
   */
  function getYearStatus(year: number): 'history' | 'current' | 'future' {
    const current = realCurrentYear.value
    if (year < current) return 'history'
    if (year > current) return 'future'
    return 'current'
  }

  /**
   * 重置到当前年份
   */
  function resetToCurrentYear() {
    switchYear(realCurrentYear.value)
  }

  // 初始化
  initAvailableYears()

  return {
    // State
    currentYear,
    availableYears,
    loading,
    error,

    // Computed
    realCurrentYear,
    isReadOnly,
    isCurrentYear,
    isFutureYear,
    yearLabel,

    // Actions
    initAvailableYears,
    switchYear,
    getYearStatus,
    resetToCurrentYear
  }
})
