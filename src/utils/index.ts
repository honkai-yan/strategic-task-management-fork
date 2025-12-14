import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import type { AlertLevel, UserRole } from '@/types'

// Configure dayjs
dayjs.locale('zh-cn')

// Date formatting utilities
export const formatDate = (date: Date | string, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format)
}

export const formatDateShort = (date: Date | string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

export const formatDateTime = (date: Date | string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export const formatRelativeTime = (date: Date | string) => {
  return dayjs(date).fromNow()
}

// Number formatting utilities
export const formatNumber = (num: number, decimals = 2) => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export const formatPercentage = (value: number, decimals = 1) => {
  return `${formatNumber(value, decimals)}%`
}

export const formatCurrency = (amount: number, currency = 'CNY') => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Alert level utilities
export const getAlertColor = (level: AlertLevel): string => {
  const colors = {
    severe: '#F56C6C', // red
    moderate: '#E6A23C', // yellow
    normal: '#67C23A', // green
  }
  return colors[level] || colors.normal
}

export const getAlertLabel = (level: AlertLevel): string => {
  const labels = {
    severe: '严重',
    moderate: '一般',
    normal: '正常',
  }
  return labels[level] || labels.normal
}

// User role utilities
export const getRoleLabel = (role: UserRole): string => {
  const labels = {
    strategic_dept: '战略发展部',
    functional_dept: '职能部门',
    secondary_college: '二级学院',
  }
  return labels[role] || role
}

// Status utilities
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: '#E6A23C',
    approved: '#67C23A',
    rejected: '#F56C6C',
    draft: '#909399',
    active: '#409EFF',
    completed: '#67C23A',
    cancelled: '#F56C6C',
    normal: '#67C23A',
    warning: '#E6A23C',
    danger: '#F56C6C',
    success: '#67C23A',
    exception: '#F56C6C',
  }
  return statusColors[status] || '#909399'
}

export const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    draft: '草稿',
    active: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    normal: '正常',
    warning: '预警',
    danger: '严重',
    success: '成功',
    exception: '异常',
  }
  return statusLabels[status] || status
}

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  return imageExtensions.includes(getFileExtension(filename).toLowerCase())
}

export const isDocumentFile = (filename: string): boolean => {
  const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  return docExtensions.includes(getFileExtension(filename).toLowerCase())
}

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export const validatePercentage = (value: number): boolean => {
  return value >= 0 && value <= 100
}

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const highlightText = (text: string, highlight: string): string => {
  if (!highlight) return text
  const regex = new RegExp(`(${highlight})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1
    } else {
      return a[key] < b[key] ? 1 : -1
    }
  })
}

export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

// URL utilities
export const buildUrl = (baseUrl: string, params: Record<string, any>): string => {
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.append(key, String(value))
    }
  })
  return url.toString()
}

// Local storage utilities
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch {
      return defaultValue || null
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to set localStorage item:', error)
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove localStorage item:', error)
    }
  },

  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  },
}

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Deep clone utility
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

// ========================================
// 样式辅助函数
// ========================================

/**
 * 根据进度值返回对应的CSS颜色变量
 * @param progress 进度值 (0-100)
 * @returns CSS颜色变量字符串
 * 
 * 规则:
 * - progress >= 80: 绿色 (success)
 * - 50 <= progress < 80: 黄色 (warning)
 * - progress < 50: 红色 (danger)
 */
export const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'var(--color-success)' // #67c23a
  if (progress >= 50) return 'var(--color-warning)' // #e6a23c
  return 'var(--color-danger)' // #f56c6c
}

/**
 * 根据进度值返回Element Plus进度条状态类型
 * @param progress 进度值 (0-100)
 * @returns Element Plus状态类型
 * 
 * 规则:
 * - progress >= 80: 'success'
 * - 50 <= progress < 80: 'warning'
 * - progress < 50: 'exception'
 */
export const getProgressStatus = (progress: number): 'success' | 'warning' | 'exception' => {
  if (progress >= 80) return 'success'
  if (progress >= 50) return 'warning'
  return 'exception'
}

/**
 * 状态标签类型
 */
export type StatusTagType = 'success' | 'warning' | 'danger' | 'info' | 'primary'

/**
 * 根据状态字符串返回对应的Element Plus标签类型
 * @param status 状态字符串
 * @returns Element Plus标签类型
 */
export const getStatusTagType = (status: string): StatusTagType => {
  const map: Record<string, StatusTagType> = {
    // 审批相关状态
    'approved': 'success',
    'completed': 'success',
    'passed': 'success',
    // 进行中/待处理状态
    'pending': 'warning',
    'processing': 'warning',
    'in_progress': 'warning',
    // 拒绝/逾期状态
    'rejected': 'danger',
    'overdue': 'danger',
    'failed': 'danger',
    // 草稿/信息状态
    'draft': 'info',
    'inactive': 'info',
    // 活跃状态
    'active': 'primary',
    // 操作类型状态
    'create': 'success',
    'update': 'warning',
    'delete': 'danger',
    'submit': 'primary',
    'approve': 'success',
    'reject': 'danger',
    'withdraw': 'info'
  }
  // Use Object.hasOwn to avoid prototype pollution issues
  if (Object.hasOwn(map, status)) {
    return map[status] as StatusTagType
  }
  return 'info'
}