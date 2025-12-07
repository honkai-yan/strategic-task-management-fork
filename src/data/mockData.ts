import type { DashboardData, Indicator, DepartmentProgress, PendingApproval, TabItem, RoleOption } from '@/types'

// 仪表盘数据
export const dashboardData: DashboardData = {
  totalScore: 87.5,
  basicScore: 92.3,
  developmentScore: 15.8,
  completionRate: 75.2,
  warningCount: 3
}

// 指标列表
export const indicators: Indicator[] = [
  { id: 1, name: '教学质量提升', type: '定量', progress: 85, status: 'normal', deadline: '2024-12-31', department: '教务处' },
  { id: 2, name: '科研项目申报', type: '定量', progress: 60, status: 'warning', deadline: '2024-11-30', department: '科研处' },
  { id: 3, name: '就业率提升', type: '定性', progress: 45, status: 'danger', deadline: '2024-12-15', department: '就业指导中心' },
  { id: 4, name: '师资队伍建设', type: '定性', progress: 90, status: 'normal', deadline: '2024-12-31', department: '人事处' }
]

// 部门进度
export const departmentProgress: DepartmentProgress[] = [
  { dept: '教务处', progress: 85, score: 89.5, status: 'success' },
  { dept: '科研处', progress: 72, score: 78.3, status: 'warning' },
  { dept: '就业指导中心', progress: 65, score: 71.2, status: 'warning' },
  { dept: '人事处', progress: 90, score: 94.1, status: 'success' },
  { dept: '计算机学院', progress: 55, score: 62.8, status: 'exception' }
]

// 待审批列表
export const pendingApprovals: PendingApproval[] = [
  { id: 1, title: '10月教学质量数据', submitter: '教务处-张三', time: '2小时前', type: '定量指标' },
  { id: 2, title: '科研项目中期报告', submitter: '计算机学院-李四', time: '5小时前', type: '定性指标' },
  { id: 3, title: '就业数据统计', submitter: '就业指导中心-王五', time: '1天前', type: '定量指标' }
]

// 标签页配置
export const tabItems: TabItem[] = [
  { id: 'dashboard', label: '数据看板', icon: 'DataAnalysis' },
  { id: 'indicators', label: '指标管理', icon: 'Document' },
  { id: 'reporting', label: '进度填报', icon: 'Edit' },
  { id: 'approval', label: '审批中心', icon: 'CircleCheck' }
]

// 角色选项
export const roleOptions: RoleOption[] = [
  { value: '战略发展部', label: '战略发展部' },
  { value: '教务处', label: '教务处' },
  { value: '科研处', label: '科研处' },
  { value: '计算机学院', label: '计算机学院' }
]
