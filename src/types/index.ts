// Core System Types
export type UserRole = 'strategic_dept' | 'functional_dept' | 'secondary_college'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type IndicatorType = 'quantitative' | 'qualitative'

export type AlertLevel = 'severe' | 'moderate' | 'normal'

export type MessageType = 'alert' | 'approval' | 'system'

// User and Permission Types
export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  department: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'approve'
}

// Strategic Task Types
export interface StrategicTask {
  id: string
  title: string
  desc: string
  createTime: string
  cycle: string
  startDate: Date
  endDate: Date
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  createdBy: string
  indicators: StrategicIndicator[]
}

// Strategic Indicator Types (Enhanced)
export interface StrategicIndicator {
  id: string
  name: string
  isQualitative: boolean
  type1: '定性' | '定量'
  type2: '发展性' | '基础性'
  progress: number
  createTime: string
  weight: number
  remark: string
  canWithdraw: boolean
  milestones: Milestone[]
  targetValue: number
  actualValue?: number
  unit: string
  responsibleDept: string
  responsiblePerson: string
  status: 'draft' | 'active' | 'archived'
  isStrategic: boolean
  approvalStatus?: ApprovalStatus
  alertLevel?: AlertLevel
}

// 里程碑类型
export interface Milestone {
  id: string
  name: string
  targetProgress: number // 目标进度
  deadline: string // 截止时间
  status: 'pending' | 'completed' | 'overdue' // 状态：待完成、已完成、逾期未完成
}

// 仪表盘数据类型 (Enhanced)
export interface DashboardData {
  totalScore: number
  basicScore: number
  developmentScore: number
  completionRate: number
  warningCount: number
  totalIndicators: number
  completedIndicators: number
  alertIndicators: {
    severe: number
    moderate: number
    normal: number
  }
}

// 部门进度类型 (Enhanced)
export interface DepartmentProgress {
  dept: string
  progress: number
  score: number
  status: 'success' | 'warning' | 'exception'
  totalIndicators: number
  completedIndicators: number
  alertCount: number
}

// 指标类型 (Enhanced)
export interface Indicator {
  id: string
  name: string
  type: '定量' | '定性'
  progress: number
  status: 'normal' | 'warning' | 'danger'
  deadline: string
  department: string
  targetValue: number
  actualValue?: number
  unit: string
  responsiblePerson: string
}

// 待审批项类型 (Enhanced)
export interface PendingApproval {
  id: string
  title: string
  submitter: string
  time: string
  type: string
  priority: 'high' | 'medium' | 'low'
  alertDescription?: string
  approvalStatus: ApprovalStatus
}

// Approval Types
export interface ApprovalRequest {
  id: string
  indicatorId: string
  indicatorName: string
  submittedBy: string
  submittedDept: string
  submittedAt: Date
  approvalStatus: ApprovalStatus
  approverId?: string
  approvedAt?: Date
  rejectionReason?: string
  priority: 'high' | 'medium' | 'low'
  alertDescription?: string
  attachments?: Attachment[]
}

export interface ApprovalHistory {
  id: string
  requestId: string
  approverId: string
  approverName: string
  action: 'approved' | 'rejected'
  comment?: string
  timestamp: Date
}

// Reporting Types
export interface ProgressReport {
  id: string
  indicatorId: string
  reportedBy: string
  reportedAt: Date
  actualValue: number
  evidence?: string
  attachments?: Attachment[]
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  rejectionReason?: string
}

// Message Types
export interface Message {
  id: string
  type: MessageType
  title: string
  content: string
  severity?: AlertLevel
  recipientId: string
  isRead: boolean
  createdAt: Date
  relatedId?: string
}

export interface NotificationSettings {
  userId: string
  emailNotifications: boolean
  alertNotifications: boolean
  approvalNotifications: boolean
  systemNotifications: boolean
}

// Tab 类型
export interface TabItem {
  id: string
  label: string
  icon: string
}

// 角色选项类型
export interface RoleOption {
  value: string
  label: string
}

// Utility Types
export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt: Date
}

export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: Date
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface StrategicTaskForm {
  title: string
  desc: string
  cycle: string
  startDate: string
  endDate: string
}

export interface IndicatorForm {
  taskId: string
  name: string
  type: IndicatorType
  targetValue: number
  unit: string
  description?: string
  responsibleDept: string
  responsiblePerson: string
  isStrategic: boolean
}

export interface ApprovalForm {
  requestId: string
  action: 'approve' | 'reject'
  comment?: string
  rejectionReason?: string
}

export interface ReportForm {
  indicatorId: string
  actualValue: number
  evidence?: string
  attachments?: File[]
}

// Chart and Visualization Types
export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string
  borderWidth?: number
}

export interface GaugeData {
  value: number
  min: number
  max: number
  thresholds: {
    severe: number
    moderate: number
    normal: number
  }
}

// System Configuration Types
export interface SystemConfig {
  alertThresholds: {
    severe: number
    moderate: number
  }
  approvalWorkflow: {
    autoApproveBelowThreshold: boolean
    threshold: number
  }
  reporting: {
    allowLateSubmission: boolean
    maxAttachments: number
    maxAttachmentSize: number
  }
}

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}
