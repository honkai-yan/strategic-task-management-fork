import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { StrategicTask, StrategicIndicator, Milestone, StatusAuditEntry } from '@/types'
import { useTimeContextStore } from './timeContext'
import { indicators2023, indicators2024, indicators2025, indicators2026 } from '@/data/indicators'
import strategicApi, { type IndicatorVO, type StrategicTaskVO } from '@/api/strategic'
import { useDataValidator, type ValidationResult } from '@/composables/useDataValidator'

/**
 * 数据健康状态接口
 * @requirement 8.4 - Store data consistency check
 */
export interface DataHealthStatus {
  /** 健康状态: healthy=正常, warning=有警告, critical=严重问题 */
  status: 'healthy' | 'warning' | 'critical'
  /** 数据来源: api=后端API, fallback=降级数据, local=本地数据 */
  dataSource: 'api' | 'fallback' | 'local'
  /** 指标数量 */
  indicatorCount: number
  /** 任务数量 */
  taskCount: number
  /** 验证问题数量 */
  validationIssues: number
  /** 最后验证时间 */
  lastValidated: Date | null
}

export const useStrategicStore = defineStore('strategic', () => {
  // Loading 状态
  const loading = ref(false)
  const error = ref<string | null>(null)
  const useApiData = ref(true) // 是否使用 API 数据，失败时降级到本地数据

  // 新增：数据来源标记
  const dataSource = ref<'api' | 'fallback' | 'local'>('local')

  // 新增：数据加载状态（更详细）
  const loadingState = ref({
    indicators: false,
    tasks: false,
    error: null as string | null
  })

  // 新增：数据验证状态
  const validationState = ref({
    lastValidated: null as Date | null,
    isValid: true,
    issues: [] as Array<{
      severity: 'error' | 'warning' | 'info'
      field: string
      message: string
    }>
  })

  // State
  const tasks = ref<StrategicTask[]>([
    {
      id: '1',
      title: '全力促进毕业生多元化高质量就业创业',
      desc: '围绕毕业生就业质量提升，多措并举促进高质量就业创业',
      createTime: '2025年12月14日',
      cycle: '2025年度',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'active',
      createdBy: 'admin',
      indicators: [],
      year: 2025,
      isRecurring: true // 长久性任务，每年持续
    },
    {
      id: '2',
      title: '推进校友工作提质增效，赋能校友成长',
      desc: '建立完善校友工作机制，提升校友服务质量',
      createTime: '2025年12月14日',
      cycle: '2025年度',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'active',
      createdBy: 'admin',
      indicators: [],
      year: 2025,
      isRecurring: true // 长久性任务
    },
    {
      id: '3',
      title: '根据学校整体部署',
      desc: '按照学校整体战略部署推进信息化建设等相关工作',
      createTime: '2025年12月14日',
      cycle: '2025年度',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'active',
      createdBy: 'admin',
      indicators: [],
      year: 2025,
      isRecurring: false // 非长久性任务
    }
  ])

  const indicators = ref<StrategicIndicator[]>([
    // ============ 发展性指标 - 战略任务1：全力促进毕业生多元化高质量就业创业 ============
    // 一级指标：职能部门
    {
      id: '101',
      name: '优质就业比例不低于15%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 45,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '力争突破',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '1001', name: '1月: 就业数据摸底', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '1002', name: '2月: 企业需求调研', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '1003', name: '3月: 就业指导活动', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '1004', name: '4月: 优质就业渠道拓展', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '1005', name: '5月: 校企合作洽谈', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '1006', name: '6月: 实习岗位推荐', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '1007', name: '7月: 就业跟踪服务', targetProgress: 58.31, deadline: '2025-07-31', status: 'pending' },
        { id: '1008', name: '8月: 暑期实习总结', targetProgress: 66.64, deadline: '2025-08-31', status: 'pending' },
        { id: '1009', name: '9月: 新学期就业服务', targetProgress: 74.97, deadline: '2025-09-30', status: 'pending' },
        { id: '1010', name: '10月: 秋季招聘会', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '1011', name: '11月: 就业质量跟踪', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '1012', name: '12月: 年度就业质量报告', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 15,
      unit: '%',
      responsibleDept: '就业创业指导中心',
      responsiblePerson: '张老师',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部',
      year: 2025,
      progressApprovalStatus: 'pending',
      pendingProgress: 55,
      pendingRemark: '本季度优质就业企业对接工作进展顺利，已完成10个优质岗位推荐',
      statusAudit: [
        {
          id: 'audit-101-1',
          timestamp: new Date('2025-03-01'),
          operator: 'zhangsan',
          operatorName: '张老师',
          operatorDept: '就业创业指导中心',
          action: 'submit',
          comment: '提交Q1进度25%',
          previousProgress: 25,
          newProgress: 45
        }
      ]
    },
    {
      id: '102',
      name: '毕业生就业率不低于95%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 90,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '确保就业率稳定',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '1021', name: '1月: 就业数据收集', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '1022', name: '2月: 就业指导培训', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '1023', name: '3月: 就业信息推送', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '1024', name: '4月: 就业指导讲座', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '1025', name: '5月: 就业指导咨询', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '1026', name: '6月: 就业指导活动', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '1027', name: '7月: 就业指导服务', targetProgress: 58.31, deadline: '2025-07-31', status: 'pending' },
        { id: '1028', name: '8月: 就业指导跟踪', targetProgress: 66.64, deadline: '2025-08-31', status: 'pending' },
        { id: '1029', name: '9月: 就业指导反馈', targetProgress: 74.97, deadline: '2025-09-30', status: 'pending' },
        { id: '1030', name: '10月: 就业指导总结', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '1031', name: '11月: 就业指导改进', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '1032', name: '12月: 就业指导报告', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 95,
      unit: '%',
      responsibleDept: '就业创业指导中心',
      responsiblePerson: '张老师',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部',
      year: 2025,
      progressApprovalStatus: 'pending',
      pendingProgress: 92,
      pendingRemark: '就业指导活动效果显著，就业率稳步提升',
      statusAudit: [
        {
          id: 'audit-102-1',
          timestamp: new Date('2025-12-27'),
          operator: 'zhangsan',
          operatorName: '张老师',
          operatorDept: '就业创业指导中心',
          action: 'submit',
          comment: '提交进度更新，就业率提升至92%',
          previousProgress: 90,
          newProgress: 92
        }
      ]
    },
    {
      id: '103',
      name: '针对各学院开设专业引进优质校招企业（各专业大类不低于2家）',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 30,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '根据学校发展现状',
      canWithdraw: true,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '1031', name: '1月: 企业调研', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '1032', name: '2月: 需求分析', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '1033', name: '3月: 企业调研与需求分析', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '1034', name: '4月: 企业初步接触', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '1035', name: '5月: 企业需求确认', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '1036', name: '6月: 优质企业对接洽谈', targetProgress: 49.98, deadline: '2025-06-30', status: 'pending' },
        { id: '1037', name: '7月: 洽谈进展跟踪', targetProgress: 58.31, deadline: '2025-07-31', status: 'pending' },
        { id: '1038', name: '8月: 企业确认', targetProgress: 66.64, deadline: '2025-08-31', status: 'pending' },
        { id: '1039', name: '9月: 校园招聘会组织', targetProgress: 74.97, deadline: '2025-09-30', status: 'pending' },
        { id: '1040', name: '10月: 招聘活动实施', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '1041', name: '11月: 企业反馈收集', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '1042', name: '12月: 全专业覆盖完成', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 2,
      unit: '家/专业',
      responsibleDept: '招生工作处',
      responsiblePerson: '王主任',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部',
      year: 2025,
      progressApprovalStatus: 'pending',
      pendingProgress: 42,
      pendingRemark: '已成功对接3家优质企业，计划下月组织校园宣讲会',
      statusAudit: [
        {
          id: 'audit-103-1',
          timestamp: new Date('2025-12-27'),
          operator: 'wangzhu',
          operatorName: '王主任',
          operatorDept: '招生工作处',
          action: 'submit',
          comment: '提交进度更新，企业对接工作取得阶段性成果',
          previousProgress: 30,
          newProgress: 42
        }
      ]
    },
    {
      id: '104',
      name: '毕业生创业比例不低于5%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 40,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '鼓励创业精神',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '1041', name: '1月: 创业政策宣传', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '1042', name: '2月: 创业培训课程', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '1043', name: '3月: 创业项目征集', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '1044', name: '4月: 创业项目评审', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '1045', name: '5月: 创业项目孵化', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '1046', name: '6月: 创业项目支持', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '1047', name: '7月: 创业项目跟踪', targetProgress: 58.31, deadline: '2025-07-31', status: 'pending' },
        { id: '1048', name: '8月: 创业项目总结', targetProgress: 66.64, deadline: '2025-08-31', status: 'pending' },
        { id: '1049', name: '9月: 创业项目改进', targetProgress: 74.97, deadline: '2025-09-30', status: 'pending' },
        { id: '1050', name: '10月: 创业项目推广', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '1051', name: '11月: 创业项目反馈', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '1052', name: '12月: 创业项目报告', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 5,
      unit: '%',
      responsibleDept: '就业创业指导中心',
      responsiblePerson: '张老师',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部',
      year: 2025,
      progressApprovalStatus: 'pending',
      pendingProgress: 45,
      pendingRemark: '创业培训课程反响良好，创业项目孵化进展顺利',
      statusAudit: [
        {
          id: 'audit-104-1',
          timestamp: new Date('2025-12-27'),
          operator: 'zhangsan',
          operatorName: '张老师',
          operatorDept: '就业创业指导中心',
          action: 'submit',
          comment: '提交进度更新，创业项目孵化进展顺利',
          previousProgress: 40,
          newProgress: 45
        }
      ]
    },
    {
      id: '102',
      name: '就业率达90%，教育厅公布的就业数据排名川内同类民办院校前三',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 60,
      createTime: '2025年12月14日',
      weight: 50,
      remark: '中长期发展规划内容',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '1021', name: '1月: 就业数据收集', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '1022', name: '2月: 就业趋势分析', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '1023', name: '3月: 就业数据统计', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '1024', name: '4月: 各学院配合统计', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '1025', name: '5月: 数据核实', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '1026', name: '6月: 就业情况跟踪', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '1027', name: '7月: 毕业生就业情况评估', targetProgress: 58.31, deadline: '2025-07-31', status: 'pending' },
        { id: '1028', name: '8月: 就业数据更新', targetProgress: 66.64, deadline: '2025-08-31', status: 'pending' },
        { id: '1029', name: '9月: 就业率评估与调整', targetProgress: 74.97, deadline: '2025-09-30', status: 'pending' },
        { id: '1030', name: '10月: 就业质量分析', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '1031', name: '11月: 就业数据汇总', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '1032', name: '12月: 最终达标率90%', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 90,
      unit: '%',
      responsibleDept: '就业创业指导中心',
      responsiblePerson: '李老师',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部',
      year: 2025,
      progressApprovalStatus: 'approved',
      pendingProgress: 60,
      pendingRemark: '',
      statusAudit: []
    },

    // 二级指标：学院级（下发自职能部门）
    {
      id: '101-1',
      name: '计算机学院优质就业比例不低于18%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 72,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '工科学院就业质量要求更高',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '10111', name: 'Q1: 优质就业企业对接', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '10112', name: 'Q2: 学生能力提升培训', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '10113', name: 'Q3: 就业质量跟踪调查', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '10114', name: 'Q4: 目标达成验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 18,
      unit: '%',
      responsibleDept: '计算机学院',
      responsiblePerson: '赵院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '就业创业指导中心',
      parentIndicatorId: '101',
      statusAudit: [
        {
          id: 'audit-101-1-1',
          timestamp: new Date('2025-12-01'),
          operator: 'jyc-admin',
          operatorName: '就业中心管理员',
          operatorDept: '就业创业指导中心',
          action: 'distribute',
          comment: '下发子指标'
        },
        {
          id: 'audit-101-1-2',
          timestamp: new Date('2025-12-15'),
          operator: 'zhao-dean',
          operatorName: '赵院长',
          operatorDept: '计算机学院',
          action: 'submit',
          comment: '提交进度72%',
          previousProgress: 0,
          newProgress: 72
        }
      ]
    },
    {
      id: '101-2',
      name: '商学院优质就业比例不低于12%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 58,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '商科专业就业质量稳步提升',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '10121', name: 'Q1: 校企合作洽谈', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '10122', name: 'Q2: 实习基地建设', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '10123', name: 'Q3: 就业推荐与跟进', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '10124', name: 'Q4: 达标验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 12,
      unit: '%',
      responsibleDept: '商学院',
      responsiblePerson: '钱院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '就业创业指导中心',
      parentIndicatorId: '101',
      statusAudit: [
        {
          id: 'audit-101-2-1',
          timestamp: new Date('2025-12-01'),
          operator: 'jyc-admin',
          operatorName: '就业中心管理员',
          operatorDept: '就业创业指导中心',
          action: 'distribute',
          comment: '下发子指标'
        },
        {
          id: 'audit-101-2-2',
          timestamp: new Date('2025-12-10'),
          operator: 'qian-dean',
          operatorName: '钱院长',
          operatorDept: '商学院',
          action: 'submit',
          comment: '提交进度58%',
          previousProgress: 0,
          newProgress: 58
        },
        {
          id: 'audit-101-2-3',
          timestamp: new Date('2025-12-12'),
          operator: 'jyc-admin',
          operatorName: '就业中心管理员',
          operatorDept: '就业创业指导中心',
          action: 'approve',
          comment: '审批通过，进度达标'
        }
      ]
    },
    {
      id: '101-3',
      name: '艺术与科技学院优质就业比例不低于10%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 35,
      createTime: '2025年12月14日',
      weight: 15,
      remark: '艺术类专业就业质量提升',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '10131', name: 'Q1: 就业市场调研', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '10132', name: 'Q2: 企业对接与洽谈', targetProgress: 50, deadline: '2025-06-30', status: 'pending' },
        { id: '10133', name: 'Q3: 学生作品展示推介', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '10134', name: 'Q4: 目标达成', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 10,
      unit: '%',
      responsibleDept: '艺术与科技学院',
      responsiblePerson: '孙院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '就业创业指导中心',
      parentIndicatorId: '101',
      statusAudit: [
        {
          id: 'audit-101-3-1',
          timestamp: new Date('2025-12-01'),
          operator: 'jyc-admin',
          operatorName: '就业中心管理员',
          operatorDept: '就业创业指导中心',
          action: 'distribute',
          comment: '下发子指标'
        }
      ]
    },
    {
      id: '101-4',
      name: '工学院优质就业比例不低于16%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 68,
      createTime: '2025年12月14日',
      weight: 22,
      remark: '工科类专业就业质量要求高',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '10141', name: 'Q1: 优质企业对接', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '10142', name: 'Q2: 学生技能培训', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '10143', name: 'Q3: 就业质量跟踪', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '10144', name: 'Q4: 目标达成验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 16,
      unit: '%',
      responsibleDept: '工学院',
      responsiblePerson: '李院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '就业创业指导中心',
      parentIndicatorId: '101',
      statusAudit: [
        {
          id: 'audit-101-4-1',
          timestamp: new Date('2025-12-01'),
          operator: 'jyc-admin',
          operatorName: '就业中心管理员',
          operatorDept: '就业创业指导中心',
          action: 'distribute',
          comment: '下发子指标'
        },
        {
          id: 'audit-101-4-2',
          timestamp: new Date('2025-12-08'),
          operator: 'li-dean',
          operatorName: '李院长',
          operatorDept: '工学院',
          action: 'submit',
          comment: '提交进度50%',
          previousProgress: 0,
          newProgress: 50
        },
        {
          id: 'audit-101-4-3',
          timestamp: new Date('2025-12-10'),
          operator: 'jyc-admin',
          operatorName: '就业中心管理员',
          operatorDept: '就业创业指导中心',
          action: 'reject',
          comment: '进度偏低，请加强跟进'
        }
      ]
    },
    {
      id: '101-5',
      name: '航空学院优质就业比例不低于17%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 82,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '航空专业就业质量优势明显',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '10151', name: 'Q1: 航空企业洽谈', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '10152', name: 'Q2: 专业技能培训', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '10153', name: 'Q3: 就业质量评估', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '10154', name: 'Q4: 目标达成', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 17,
      unit: '%',
      responsibleDept: '航空学院',
      responsiblePerson: '周院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '就业创业指导中心',
      parentIndicatorId: '101',
      statusAudit: [
        {
          id: 'audit-101-5-1',
          timestamp: new Date('2025-12-01'),
          operator: 'jyc-admin',
          operatorName: '就业中心管理员',
          operatorDept: '就业创业指导中心',
          action: 'distribute',
          comment: '下发子指标'
        },
        {
          id: 'audit-101-5-2',
          timestamp: new Date('2025-12-20'),
          operator: 'zhou-dean',
          operatorName: '周院长',
          operatorDept: '航空学院',
          action: 'submit',
          comment: '提交进度82%',
          previousProgress: 0,
          newProgress: 82
        }
      ]
    },
    {
      id: '102-1',
      name: '计算机学院就业率达92%以上',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 78,
      createTime: '2025年12月14日',
      weight: 30,
      remark: '工科就业率目标更高',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '10211', name: 'Q1: 就业数据统计', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '10212', name: 'Q2: 就业困难学生帮扶', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '10213', name: 'Q3: 就业率提升专项行动', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '10214', name: 'Q4: 最终达标率92%', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 92,
      unit: '%',
      responsibleDept: '计算机学院',
      responsiblePerson: '赵院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '就业创业指导中心',
      parentIndicatorId: '102'
    },
    {
      id: '102-2',
      name: '商学院就业率达90%以上',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 65,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '商科就业率稳步提升',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '10221', name: 'Q1: 就业数据收集', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '10222', name: 'Q2: 就业困难帮扶', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '10223', name: 'Q3: 就业推进', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '10224', name: 'Q4: 达标验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 90,
      unit: '%',
      responsibleDept: '商学院',
      responsiblePerson: '钱院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '就业创业指导中心',
      parentIndicatorId: '102'
    },
    {
      id: '102-3',
      name: '文理学院就业率达88%以上',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 55,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '文理综合类专业就业稳步提升',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '10231', name: 'Q1: 就业调研', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '10232', name: 'Q2: 帮扶推进', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '10233', name: 'Q3: 就业率提升', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '10234', name: 'Q4: 达标验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 88,
      unit: '%',
      responsibleDept: '文理学院',
      responsiblePerson: '吴院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '就业创业指导中心',
      parentIndicatorId: '102'
    },
    {
      id: '102-4',
      name: '国际教育学院就业率达85%以上',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 72,
      createTime: '2025年12月14日',
      weight: 18,
      remark: '国际化专业就业多元化',
      canWithdraw: false,
      taskContent: '全力促进毕业生多元化高质量就业创业',
      milestones: [
        { id: '10241', name: 'Q1: 就业渠道拓展', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '10242', name: 'Q2: 双语就业指导', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '10243', name: 'Q3: 就业率评估', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '10244', name: 'Q4: 目标达成', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 85,
      unit: '%',
      responsibleDept: '国际教育学院',
      responsiblePerson: '郑院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '就业创业指导中心',
      parentIndicatorId: '102'
    },
    // ============ 基础性指标 - 战略任务2：推进校友工作提质增效，赋能校友成长 ============
    {
      id: '201',
      name: '1.建立完善校友反馈母校的工作机制；\n2.择优建立部分地区校友会并开展高质量活动；\n3.启动《延续以来校友建设发展计划》；\n4.拟定并实施《校友状况分析报告》，完成第一阶段任务；\n5.实现校友数据全面信息化。',
      isQualitative: true,
      type1: '定性',
      type2: '基础性',
      progress: 40,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '中长期发展规划未完成内容',
      canWithdraw: false,
      taskContent: '推进校友工作提质增效，赋能校友成长',
      milestones: [
        { id: '2011', name: 'Q1: 校友工作机制建立', targetProgress: 20, deadline: '2025-03-31', status: 'completed' },
        { id: '2012', name: 'Q2: 地区校友会筹建', targetProgress: 40, deadline: '2025-06-30', status: 'completed' },
        { id: '2013', name: 'Q3: 校友发展计划启动', targetProgress: 70, deadline: '2025-09-30', status: 'pending' },
        { id: '2014', name: 'Q4: 校友数据全面信息化', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '学校综合办公室',
      responsiblePerson: '陈主任',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 二级学院指标：校友工作（由学校综合办公室下发）
    {
      id: '201-1',
      name: '计算机学院完善校友信息库，建立本学院校友联络机制',
      isQualitative: true,
      type1: '定性',
      type2: '基础性',
      progress: 48,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '工科学院校友资源丰富',
      canWithdraw: false,
      taskContent: '推进校友工作提质增效，赋能校友成长',
      milestones: [
        { id: '20111', name: 'Q1: 校友信息收集', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '20112', name: 'Q2: 校友联络机制建立', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '20113', name: 'Q3: 校友活动组织', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '20114', name: 'Q4: 数据入库完成', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '计算机学院',
      responsiblePerson: '赵院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '学校综合办公室',
      parentIndicatorId: '201'
    },
    {
      id: '201-2',
      name: '商学院建立区域校友会，开展校友返校日活动',
      isQualitative: true,
      type1: '定性',
      type2: '基础性',
      progress: 38,
      createTime: '2025年12月14日',
      weight: 18,
      remark: '商科校友资源广泛',
      canWithdraw: false,
      taskContent: '推进校友工作提质增效，赋能校友成长',
      milestones: [
        { id: '20121', name: 'Q1: 区域校友摸底', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '20122', name: 'Q2: 校友会筹备', targetProgress: 50, deadline: '2025-06-30', status: 'pending' },
        { id: '20123', name: 'Q3: 校友返校日活动', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '20124', name: 'Q4: 校友会正式成立', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '商学院',
      responsiblePerson: '钱院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '学校综合办公室',
      parentIndicatorId: '201'
    },

    // ============ 基础性指标 - 战略任务3：根据学校整体部署 ============
    {
      id: '202',
      name: '信息化相关数据报送准确、及时、可靠',
      isQualitative: true,
      type1: '定性',
      type2: '基础性',
      progress: 55,
      createTime: '2025年12月14日',
      weight: 5,
      remark: '加快提升信息化治理水平',
      canWithdraw: false,
      taskContent: '根据学校整体部署',
      milestones: [
        { id: '2021', name: 'Q1: 数据标准制定', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '2022', name: 'Q2: 报送流程优化', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '2023', name: 'Q3: 系统对接测试', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '2024', name: 'Q4: 全面运行验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '数字校园建设办公室',
      responsiblePerson: '刘工',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 二级学院指标：信息化数据报送（由数字校园建设办公室下发）
    {
      id: '202-1',
      name: '计算机学院按时准确报送教学、科研相关数据',
      isQualitative: true,
      type1: '定性',
      type2: '基础性',
      progress: 68,
      createTime: '2025年12月14日',
      weight: 10,
      remark: '工科学院数据化意识强',
      canWithdraw: false,
      taskContent: '根据学校整体部署',
      milestones: [
        { id: '20211', name: 'Q1: 数据报送规范培训', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '20212', name: 'Q2: 系统对接调试', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '20213', name: 'Q3: 数据质量提升', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '20214', name: 'Q4: 全面合格验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '计算机学院',
      responsiblePerson: '赵院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '数字校园建设办公室',
      parentIndicatorId: '202'
    },
    {
      id: '202-2',
      name: '商学院建立数据报送责任人制度，确保数据准确',
      isQualitative: true,
      type1: '定性',
      type2: '基础性',
      progress: 52,
      createTime: '2025年12月14日',
      weight: 8,
      remark: '建立数据报送规范',
      canWithdraw: false,
      taskContent: '根据学校整体部署',
      milestones: [
        { id: '20221', name: 'Q1: 责任人明确', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '20222', name: 'Q2: 报送制度建立', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '20223', name: 'Q3: 数据质量监控', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '20224', name: 'Q4: 验收达标', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '商学院',
      responsiblePerson: '钱院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '数字校园建设办公室',
      parentIndicatorId: '202'
    },
    {
      id: '202-3',
      name: '艺术学院完善数据采集流程，提升数据时效性',
      isQualitative: true,
      type1: '定性',
      type2: '基础性',
      progress: 42,
      createTime: '2025年12月14日',
      weight: 6,
      remark: '提升数据报送及时性',
      canWithdraw: false,
      taskContent: '根据学校整体部署',
      milestones: [
        { id: '20231', name: 'Q1: 数据采集流程梳理', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '20232', name: 'Q2: 流程优化实施', targetProgress: 50, deadline: '2025-06-30', status: 'pending' },
        { id: '20233', name: 'Q3: 时效性提升', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '20234', name: 'Q4: 达标验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '艺术与科技学院',
      responsiblePerson: '孙院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '数字校园建设办公室',
      parentIndicatorId: '202'
    },

    // ============ 新增职能部门指标 ============

    // 教务处 - 教学质量提升
    {
      id: '301',
      name: '提升教学质量，课程优良率达85%以上',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 76,
      createTime: '2025年12月14日',
      weight: 30,
      remark: '中长期发展规划核心内容',
      canWithdraw: false,
      taskContent: '提升教学质量，深化教学改革',
      milestones: [
        { id: '3011', name: '1月: 教学质量调研', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '3012', name: '2月: 教学方法研讨', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '3013', name: '3月: 教学质量调研', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '3014', name: '4月: 教学质量评估', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '3015', name: '5月: 教学改进方案', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '3016', name: '6月: 课程改革试点', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '3017', name: '7月: 教学质量提升', targetProgress: 58.31, deadline: '2025-07-31', status: 'completed' },
        { id: '3018', name: '8月: 暑期教学培训', targetProgress: 66.64, deadline: '2025-08-31', status: 'completed' },
        { id: '3019', name: '9月: 新学期教学质量监控', targetProgress: 74.97, deadline: '2025-09-30', status: 'completed' },
        { id: '3020', name: '10月: 教学评估', targetProgress: 83.3, deadline: '2025-10-31', status: 'completed' },
        { id: '3021', name: '11月: 教学质量巩固', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '3022', name: '12月: 达标验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 85,
      unit: '%',
      responsibleDept: '教务处',
      responsiblePerson: '陈处长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },
    {
      id: '301-1',
      name: '计算机学院课程优良率达88%',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 85,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '工科专业教学质量领先',
      canWithdraw: false,
      taskContent: '提升教学质量，深化教学改革',
      milestones: [
        { id: '30111', name: 'Q1: 课程质量评估', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '30112', name: 'Q2: 教学方法改进', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '30113', name: 'Q3: 质量持续提升', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '30114', name: 'Q4: 目标达成', targetProgress: 100, deadline: '2025-12-31', status: 'completed' }
      ],
      targetValue: 88,
      unit: '%',
      responsibleDept: '计算机学院',
      responsiblePerson: '赵院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '教务处',
      parentIndicatorId: '301'
    },
    {
      id: '301-2',
      name: '工学院课程优良率达86%',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 82,
      createTime: '2025年12月14日',
      weight: 24,
      remark: '工科教学质量稳步提升',
      canWithdraw: false,
      taskContent: '提升教学质量，深化教学改革',
      milestones: [
        { id: '30121', name: 'Q1: 质量分析', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '30122', name: 'Q2: 改革实施', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '30123', name: 'Q3: 质量跟踪', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '30124', name: 'Q4: 达标验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 86,
      unit: '%',
      responsibleDept: '工学院',
      responsiblePerson: '李院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '教务处',
      parentIndicatorId: '301'
    },

    // 科技处 - 科研成果提升
    {
      id: '302',
      name: '提升科研水平，年度发表高水平论文不少于50篇',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 62,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '科研水平提升关键指标',
      canWithdraw: false,
      taskContent: '提升科研水平，增强学术影响力',
      milestones: [
        { id: '3021', name: '1月: 科研项目规划', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '3022', name: '2月: 研究方向确定', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '3023', name: '3月: 科研项目立项', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '3024', name: '4月: 研究进展跟踪', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '3025', name: '5月: 研究成果整理', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '3026', name: '6月: 科研成果培育', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '3027', name: '7月: 论文撰写指导', targetProgress: 58.31, deadline: '2025-07-31', status: 'pending' },
        { id: '3028', name: '8月: 论文修改完善', targetProgress: 66.64, deadline: '2025-08-31', status: 'pending' },
        { id: '3029', name: '9月: 论文投稿', targetProgress: 74.97, deadline: '2025-09-30', status: 'pending' },
        { id: '3030', name: '10月: 论文发表跟踪', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '3031', name: '11月: 论文质量评估', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '3032', name: '12月: 目标达成', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 50,
      unit: '篇',
      responsibleDept: '科技处',
      responsiblePerson: '林处长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },
    {
      id: '302-1',
      name: '计算机学院发表高水平论文不少于15篇',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 73,
      createTime: '2025年12月14日',
      weight: 30,
      remark: '理工科科研优势明显',
      canWithdraw: false,
      taskContent: '提升科研水平，增强学术影响力',
      milestones: [
        { id: '30211', name: 'Q1: 科研项目推进', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '30212', name: 'Q2: 成果积累', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '30213', name: 'Q3: 论文发表', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '30214', name: 'Q4: 目标达成', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 15,
      unit: '篇',
      responsibleDept: '计算机学院',
      responsiblePerson: '赵院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '科技处',
      parentIndicatorId: '302'
    },

    // 党委学工部 - 学生工作
    {
      id: '303',
      name: '加强学生思想政治教育，学生满意度达90%以上',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 88,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '立德树人根本任务',
      canWithdraw: false,
      taskContent: '加强学生工作，提升育人质量',
      milestones: [
        { id: '3031', name: '1月: 学生调研摸底', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '3032', name: '2月: 学生需求分析', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '3033', name: '3月: 学生调研摸底', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '3034', name: '4月: 思政教育计划实施', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '3035', name: '5月: 思政活动策划', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '3036', name: '6月: 思政活动开展', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '3037', name: '7月: 思政教育效果评估', targetProgress: 58.31, deadline: '2025-07-31', status: 'completed' },
        { id: '3038', name: '8月: 暑期思政实践', targetProgress: 66.64, deadline: '2025-08-31', status: 'completed' },
        { id: '3039', name: '9月: 新学期思政工作', targetProgress: 74.97, deadline: '2025-09-30', status: 'completed' },
        { id: '3040', name: '10月: 思政教育深化', targetProgress: 83.3, deadline: '2025-10-31', status: 'completed' },
        { id: '3041', name: '11月: 效果巩固', targetProgress: 91.63, deadline: '2025-11-30', status: 'completed' },
        { id: '3042', name: '12月: 满意度调查', targetProgress: 100, deadline: '2025-12-31', status: 'completed' }
      ],
      targetValue: 90,
      unit: '%',
      responsibleDept: '党委学工部 | 学生工作处',
      responsiblePerson: '王部长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },
    {
      id: '303-1',
      name: '马克思主义学院思政教育满意度达95%',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 94,
      createTime: '2025年12月14日',
      weight: 30,
      remark: '思政教育专业优势',
      canWithdraw: false,
      taskContent: '加强学生工作，提升育人质量',
      milestones: [
        { id: '30311', name: 'Q1: 教学质量提升', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '30312', name: 'Q2: 实践活动开展', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '30313', name: 'Q3: 效果巩固', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '30314', name: 'Q4: 满意度调查', targetProgress: 100, deadline: '2025-12-31', status: 'completed' }
      ],
      targetValue: 95,
      unit: '%',
      responsibleDept: '马克思主义学院',
      responsiblePerson: '张院长',
      status: 'active',
      isStrategic: false,
      ownerDept: '党委学工部 | 学生工作处',
      parentIndicatorId: '303'
    },

    // 招生工作处 - 招生质量
    {
      id: '304',
      name: '提升生源质量，一志愿录取率达75%以上',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 68,
      createTime: '2025年12月14日',
      weight: 22,
      remark: '生源质量提升关键',
      canWithdraw: false,
      taskContent: '提升招生质量，扩大办学影响力',
      milestones: [
        { id: '3041', name: '1月: 招生政策研究', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '3042', name: '2月: 招生计划制定', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '3043', name: '3月: 招生宣传策划', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '3044', name: '4月: 宣传材料制作', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '3045', name: '5月: 宣传活动筹备', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '3046', name: '6月: 招生宣传实施', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '3047', name: '7月: 招生咨询', targetProgress: 58.31, deadline: '2025-07-31', status: 'completed' },
        { id: '3048', name: '8月: 招生录取', targetProgress: 66.64, deadline: '2025-08-31', status: 'completed' },
        { id: '3049', name: '9月: 新生报到统计', targetProgress: 74.97, deadline: '2025-09-30', status: 'completed' },
        { id: '3050', name: '10月: 生源质量分析', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '3051', name: '11月: 招生总结', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '3052', name: '12月: 数据统计分析', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 75,
      unit: '%',
      responsibleDept: '招生工作处',
      responsiblePerson: '刘处长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 继续教育部 - 继续教育招生
    {
      id: '411',
      name: '继续教育招生人数增长15%，培训项目满意度达85%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 68,
      createTime: '2025年12月14日',
      weight: 22,
      remark: '继续教育发展',
      canWithdraw: false,
      taskContent: '拓展继续教育，服务社会发展',
      milestones: [
        { id: '4111', name: '1月: 继续教育规划', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '4112', name: '2月: 市场调研', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '4113', name: '3月: 市场调研', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '4114', name: '4月: 培训项目开发', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '4115', name: '5月: 项目开发', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '4116', name: '6月: 项目开发', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '4117', name: '7月: 招生推广', targetProgress: 58.31, deadline: '2025-07-31', status: 'pending' },
        { id: '4118', name: '8月: 招生推广', targetProgress: 66.64, deadline: '2025-08-31', status: 'pending' },
        { id: '4119', name: '9月: 招生推广', targetProgress: 74.97, deadline: '2025-09-30', status: 'pending' },
        { id: '4120', name: '10月: 招生推广', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '4121', name: '11月: 满意度提升', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '4122', name: '12月: 效果评估', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 15,
      unit: '%',
      responsibleDept: '继续教育部',
      responsiblePerson: '郑部长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // ============ 更多职能部门指标 ============

    // 党委办公室 | 党委统战部
    {
      id: '401',
      name: '加强党建工作，党员发展质量达标率95%以上',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 92,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '党建引领发展',
      canWithdraw: false,
      taskContent: '加强党的建设，提升组织凝聚力',
      milestones: [
        { id: '4011', name: '1月: 党员发展计划制定', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '4012', name: '2月: 党员培训计划', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '4013', name: '3月: 党员发展计划制定', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '4014', name: '4月: 党员培训实施', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '4015', name: '5月: 党员教育活动', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '4016', name: '6月: 党员培训实施', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '4017', name: '7月: 党员考核评估', targetProgress: 58.31, deadline: '2025-07-31', status: 'completed' },
        { id: '4018', name: '8月: 党员考核评估', targetProgress: 66.64, deadline: '2025-08-31', status: 'completed' },
        { id: '4019', name: '9月: 党员考核评估', targetProgress: 74.97, deadline: '2025-09-30', status: 'completed' },
        { id: '4020', name: '10月: 党建工作推进', targetProgress: 83.3, deadline: '2025-10-31', status: 'completed' },
        { id: '4021', name: '11月: 党建工作评估', targetProgress: 91.63, deadline: '2025-11-30', status: 'completed' },
        { id: '4022', name: '12月: 年度总结', targetProgress: 100, deadline: '2025-12-31', status: 'completed' }
      ],
      targetValue: 95,
      unit: '%',
      responsibleDept: '党委办公室 | 党委统战部',
      responsiblePerson: '李书记',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部',
      year: 2025,
      progressApprovalStatus: 'pending',
      pendingProgress: 96,
      pendingRemark: '本年度党员发展工作圆满完成，新发展党员质量优秀，培训考核全部达标',
      statusAudit: [
        {
          id: 'audit-401-1',
          timestamp: new Date('2025-12-29'),
          operator: 'lishuji',
          operatorName: '李书记',
          operatorDept: '党委办公室 | 党委统战部',
          action: 'submit',
          comment: '提交年度党建工作进度，党员发展质量达标率已超目标',
          previousProgress: 92,
          newProgress: 96
        }
      ]
    },
    {
      id: '402',
      name: '统战工作覆盖率达100%，民主党派联络机制完善',
      isQualitative: true,
      type1: '定性',
      type2: '基础性',
      progress: 85,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '统一战线工作',
      canWithdraw: false,
      taskContent: '加强党的建设，提升组织凝聚力',
      milestones: [
        { id: '4021', name: 'Q1: 统战对象摸底', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '4022', name: 'Q2: 联络机制建立', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '4023', name: 'Q3: 活动开展', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '4024', name: 'Q4: 工作总结', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '党委办公室 | 党委统战部',
      responsiblePerson: '李书记',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部',
      year: 2025,
      progressApprovalStatus: 'pending',
      pendingProgress: 92,
      pendingRemark: '统战工作取得显著成效，民主党派联络机制已完善，各项活动顺利开展',
      statusAudit: [
        {
          id: 'audit-402-1',
          timestamp: new Date('2025-12-28'),
          operator: 'lishuji',
          operatorName: '李书记',
          operatorDept: '党委办公室 | 党委统战部',
          action: 'submit',
          comment: '提交统战工作进度更新，覆盖率和联络机制建设均达标',
          previousProgress: 85,
          newProgress: 92
        }
      ]
    },

    // 纪委办公室 | 监察处
    {
      id: '403',
      name: '廉政教育覆盖率100%，违纪违规案件处理及时率100%',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 100,
      createTime: '2025年12月14日',
      weight: 30,
      remark: '全面从严治党',
      canWithdraw: false,
      taskContent: '加强纪检监察，营造风清气正环境',
      milestones: [
        { id: '4031', name: '1月: 廉政教育计划', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '4032', name: '2月: 廉政制度完善', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '4033', name: '3月: 廉政教育计划', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '4034', name: '4月: 廉政教育宣传', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '4035', name: '5月: 廉政教育活动', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '4036', name: '6月: 教育活动实施', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '4037', name: '7月: 监督检查', targetProgress: 58.31, deadline: '2025-07-31', status: 'completed' },
        { id: '4038', name: '8月: 监督检查', targetProgress: 66.64, deadline: '2025-08-31', status: 'completed' },
        { id: '4039', name: '9月: 监督检查', targetProgress: 74.97, deadline: '2025-09-30', status: 'completed' },
        { id: '4040', name: '10月: 案件处理', targetProgress: 83.3, deadline: '2025-10-31', status: 'completed' },
        { id: '4041', name: '11月: 案件处理', targetProgress: 91.63, deadline: '2025-11-30', status: 'completed' },
        { id: '4042', name: '12月: 年度总结', targetProgress: 100, deadline: '2025-12-31', status: 'completed' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '纪委办公室 | 监察处',
      responsiblePerson: '张纪委',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 财务部
    {
      id: '407',
      name: '预算执行率达95%以上，财务合规率100%',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 88,
      createTime: '2025年12月14日',
      weight: 30,
      remark: '财务规范管理',
      canWithdraw: false,
      taskContent: '加强财务管理，提升资金使用效率',
      milestones: [
        { id: '4071', name: '1月: 财务预算规划', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '4072', name: '2月: 预算编制', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '4073', name: '3月: 预算编制', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '4074', name: '4月: 预算执行准备', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '4075', name: '5月: 预算执行监控', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '4076', name: '6月: 预算执行监控', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '4077', name: '7月: 财务审计', targetProgress: 58.31, deadline: '2025-07-31', status: 'completed' },
        { id: '4078', name: '8月: 财务审计', targetProgress: 66.64, deadline: '2025-08-31', status: 'completed' },
        { id: '4079', name: '9月: 财务审计', targetProgress: 74.97, deadline: '2025-09-30', status: 'completed' },
        { id: '4080', name: '10月: 财务合规检查', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '4081', name: '11月: 预算执行分析', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '4082', name: '12月: 年度决算', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 95,
      unit: '%',
      responsibleDept: '财务部',
      responsiblePerson: '赵部长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 党委宣传部 | 宣传策划部
    {
      id: '404',
      name: '校园文化活动覆盖率达90%，新媒体传播影响力提升30%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 78,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '提升学校品牌影响力',
      canWithdraw: false,
      taskContent: '加强宣传工作，提升学校影响力',
      milestones: [
        { id: '4041', name: '1月: 宣传工作规划', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '4042', name: '2月: 宣传计划制定', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '4043', name: '3月: 宣传计划制定', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '4044', name: '4月: 宣传活动筹备', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '4045', name: '5月: 新媒体平台建设', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '4046', name: '6月: 新媒体平台建设', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '4047', name: '7月: 品牌活动策划', targetProgress: 58.31, deadline: '2025-07-31', status: 'completed' },
        { id: '4048', name: '8月: 品牌活动实施', targetProgress: 66.64, deadline: '2025-08-31', status: 'completed' },
        { id: '4049', name: '9月: 品牌活动策划', targetProgress: 74.97, deadline: '2025-09-30', status: 'completed' },
        { id: '4050', name: '10月: 传播影响力提升', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '4051', name: '11月: 活动覆盖提升', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '4052', name: '12月: 效果评估', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 30,
      unit: '%',
      responsibleDept: '党委宣传部 | 宣传策划部',
      responsiblePerson: '王部长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 党委组织部 | 党委教师工作部 | 人力资源部
    {
      id: '405',
      name: '教师队伍建设，高层次人才引进不少于10人',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 60,
      createTime: '2025年12月14日',
      weight: 30,
      remark: '人才强校战略',
      canWithdraw: false,
      taskContent: '加强人才队伍建设，提升师资水平',
      milestones: [
        { id: '4051', name: '1月: 人才队伍建设规划', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '4052', name: '2月: 人才需求调研', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '4053', name: '3月: 人才需求调研', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '4054', name: '4月: 招聘计划制定', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '4055', name: '5月: 招聘公告发布', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '4056', name: '6月: 招聘计划实施', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '4057', name: '7月: 人才引进', targetProgress: 58.31, deadline: '2025-07-31', status: 'pending' },
        { id: '4058', name: '8月: 人才引进', targetProgress: 66.64, deadline: '2025-08-31', status: 'pending' },
        { id: '4059', name: '9月: 人才引进', targetProgress: 74.97, deadline: '2025-09-30', status: 'pending' },
        { id: '4060', name: '10月: 人才引进', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '4061', name: '11月: 人才引进', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '4062', name: '12月: 目标达成', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 10,
      unit: '人',
      responsibleDept: '党委组织部 | 党委教师工作部 | 人力资源部',
      responsiblePerson: '陈部长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 图书馆 | 档案馆
    {
      id: '409',
      name: '图书馆资源利用率提升20%，数字资源访问量增长30%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 72,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '文献资源建设',
      canWithdraw: false,
      taskContent: '加强图书馆建设，提升服务质量',
      milestones: [
        { id: '4091', name: '1月: 图书馆资源评估', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '4092', name: '2月: 资源采购', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '4093', name: '3月: 资源采购', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '4094', name: '4月: 数字资源建设', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '4095', name: '5月: 数字化建设', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '4096', name: '6月: 数字化建设', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '4097', name: '7月: 服务推广', targetProgress: 58.31, deadline: '2025-07-31', status: 'completed' },
        { id: '4098', name: '8月: 服务推广', targetProgress: 66.64, deadline: '2025-08-31', status: 'completed' },
        { id: '4099', name: '9月: 服务推广', targetProgress: 74.97, deadline: '2025-09-30', status: 'completed' },
        { id: '4100', name: '10月: 数字资源访问提升', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '4101', name: '11月: 资源利用率提升', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '4102', name: '12月: 效果评估', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 30,
      unit: '%',
      responsibleDept: '图书馆 | 档案馆',
      responsiblePerson: '周馆长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 党委保卫部 | 保卫处
    {
      id: '406',
      name: '校园安全事故零发生，安全隐患整改率100%',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 95,
      createTime: '2025年12月14日',
      weight: 35,
      remark: '平安校园建设',
      canWithdraw: false,
      taskContent: '加强校园安全管理，保障师生安全',
      milestones: [
        { id: '4061', name: '1月: 安全隐患排查', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '4062', name: '2月: 安全制度完善', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '4063', name: '3月: 安全教育培训', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '4064', name: '4月: 消防安全检查', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '4065', name: '5月: 交通安全整治', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '4066', name: '6月: 防汛防暑措施', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '4067', name: '7月: 暑期安全管控', targetProgress: 58.31, deadline: '2025-07-31', status: 'completed' },
        { id: '4068', name: '8月: 开学安全检查', targetProgress: 66.64, deadline: '2025-08-31', status: 'completed' },
        { id: '4069', name: '9月: 新生安全教育', targetProgress: 74.97, deadline: '2025-09-30', status: 'completed' },
        { id: '40610', name: '10月: 校园周边安全整治', targetProgress: 83.3, deadline: '2025-10-31', status: 'completed' },
        { id: '40611', name: '11月: 冬季安全防范', targetProgress: 91.63, deadline: '2025-11-30', status: 'completed' },
        { id: '40612', name: '12月: 年度安全工作总结', targetProgress: 100, deadline: '2025-12-31', status: 'completed' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '党委保卫部 | 保卫处',
      responsiblePerson: '刘处长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 财务部
    {
      id: '407',
      name: '预算执行率达95%以上，财务合规率100%',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 88,
      createTime: '2025年12月14日',
      weight: 30,
      remark: '财务规范管理',
      canWithdraw: false,
      taskContent: '加强财务管理，提升资金使用效率',
      milestones: [
        { id: '4071', name: 'Q1: 预算编制', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '4072', name: 'Q2: 预算执行监控', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '4073', name: 'Q3: 财务审计', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '4074', name: 'Q4: 年度决算', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 95,
      unit: '%',
      responsibleDept: '财务部',
      responsiblePerson: '赵部长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 实验室建设管理处
    {
      id: '408',
      name: '实验室利用率达85%以上，设备完好率98%',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 82,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '实验教学保障',
      canWithdraw: false,
      taskContent: '加强实验室建设，提升实践教学质量',
      milestones: [
        { id: '4081', name: 'Q1: 设备检修', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '4082', name: 'Q2: 实验室升级', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '4083', name: 'Q3: 利用率提升', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '4084', name: 'Q4: 年度评估', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 85,
      unit: '%',
      responsibleDept: '实验室建设管理处',
      responsiblePerson: '孙处长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 图书馆 | 档案馆
    {
      id: '409',
      name: '图书馆资源利用率提升20%，数字资源访问量增长30%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 72,
      createTime: '2025年12月14日',
      weight: 20,
      remark: '文献资源建设',
      canWithdraw: false,
      taskContent: '加强图书馆建设，提升服务质量',
      milestones: [
        { id: '4091', name: 'Q1: 资源采购', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '4092', name: 'Q2: 数字化建设', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '4093', name: 'Q3: 服务推广', targetProgress: 75, deadline: '2025-09-30', status: 'completed' },
        { id: '4094', name: 'Q4: 效果评估', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 30,
      unit: '%',
      responsibleDept: '图书馆 | 档案馆',
      responsiblePerson: '周馆长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 后勤资产处
    {
      id: '410',
      name: '后勤服务满意度达90%以上，资产管理规范率100%',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 86,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '后勤保障服务',
      canWithdraw: false,
      taskContent: '提升后勤服务质量，保障校园运行',
      milestones: [
        { id: '4101', name: '1月: 后勤服务规划', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '4102', name: '2月: 服务调研', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '4103', name: '3月: 服务调研', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '4104', name: '4月: 服务改进计划', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '4105', name: '5月: 服务改进实施', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '4106', name: '6月: 服务改进', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '4107', name: '7月: 资产盘点', targetProgress: 58.31, deadline: '2025-07-31', status: 'completed' },
        { id: '4108', name: '8月: 资产管理优化', targetProgress: 66.64, deadline: '2025-08-31', status: 'completed' },
        { id: '4109', name: '9月: 资产盘点', targetProgress: 74.97, deadline: '2025-09-30', status: 'completed' },
        { id: '4110', name: '10月: 满意度提升', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '4111', name: '11月: 后勤服务质量提升', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '4112', name: '12月: 满意度调查', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 90,
      unit: '%',
      responsibleDept: '后勤资产处',
      responsiblePerson: '吴处长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 继续教育部
    {
      id: '411',
      name: '继续教育招生人数增长15%，培训项目满意度达85%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 68,
      createTime: '2025年12月14日',
      weight: 22,
      remark: '继续教育发展',
      canWithdraw: false,
      taskContent: '拓展继续教育，服务社会发展',
      milestones: [
        { id: '4111', name: 'Q1: 市场调研', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '4112', name: 'Q2: 项目开发', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '4113', name: 'Q3: 招生推广', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '4114', name: 'Q4: 效果评估', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 15,
      unit: '%',
      responsibleDept: '继续教育部',
      responsiblePerson: '郑部长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    },

    // 国际合作与交流处
    {
      id: '412',
      name: '国际合作项目新增3个，留学生招生增长20%',
      isQualitative: false,
      type1: '定量',
      type2: '发展性',
      progress: 55,
      createTime: '2025年12月14日',
      weight: 25,
      remark: '国际化办学',
      canWithdraw: false,
      taskContent: '推进国际化办学，提升国际影响力',
      milestones: [
        { id: '4121', name: '1月: 国际合作规划', targetProgress: 8.33, deadline: '2025-01-31', status: 'completed' },
        { id: '4122', name: '2月: 合作洽谈', targetProgress: 16.66, deadline: '2025-02-28', status: 'completed' },
        { id: '4123', name: '3月: 合作洽谈', targetProgress: 24.99, deadline: '2025-03-31', status: 'completed' },
        { id: '4124', name: '4月: 合作意向确认', targetProgress: 33.32, deadline: '2025-04-30', status: 'completed' },
        { id: '4125', name: '5月: 项目洽谈', targetProgress: 41.65, deadline: '2025-05-31', status: 'completed' },
        { id: '4126', name: '6月: 项目签约', targetProgress: 49.98, deadline: '2025-06-30', status: 'completed' },
        { id: '4127', name: '7月: 留学生招生', targetProgress: 58.31, deadline: '2025-07-31', status: 'pending' },
        { id: '4128', name: '8月: 留学生招生', targetProgress: 66.64, deadline: '2025-08-31', status: 'pending' },
        { id: '4129', name: '9月: 留学生招生', targetProgress: 74.97, deadline: '2025-09-30', status: 'pending' },
        { id: '4130', name: '10月: 项目实施', targetProgress: 83.3, deadline: '2025-10-31', status: 'pending' },
        { id: '4131', name: '11月: 国际合作推进', targetProgress: 91.63, deadline: '2025-11-30', status: 'pending' },
        { id: '4132', name: '12月: 项目实施', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 3,
      unit: '个',
      responsibleDept: '国际合作与交流处',
      responsiblePerson: '钱处长',
      status: 'active',
      isStrategic: true,
      ownerDept: '战略发展部'
    }
  ])

  // Getters
  const activeTasks = computed(() => tasks.value.filter(t => t.status === 'active'))
  const activeIndicators = computed(() => indicators.value.filter(i => i.status === 'active'))

  const getTaskById = (id: string) => tasks.value.find(t => t.id === id)
  const getIndicatorById = (id: string) => indicators.value.find(i => i.id === id)

  const getIndicatorsByTask = (taskId: string) => {
    const task = getTaskById(taskId)
    return task?.indicators || []
  }

  // 获取逾期的里程碑
  const getOverdueMilestones = computed(() => {
    const now = new Date()
    const overdue: Array<{ indicator: StrategicIndicator; milestone: Milestone }> = []
    
    indicators.value.forEach(indicator => {
      indicator.milestones.forEach(milestone => {
        if (milestone.status === 'pending') {
          const deadline = new Date(milestone.deadline)
          if (deadline < now) {
            overdue.push({ indicator, milestone })
          }
        }
      })
    })
    
    return overdue
  })

  // 获取即将到期的里程碑（30天内）
  const getUpcomingMilestones = computed(() => {
    const now = new Date()
    const upcoming: Array<{ indicator: StrategicIndicator; milestone: Milestone }> = []
    
    indicators.value.forEach(indicator => {
      indicator.milestones.forEach(milestone => {
        if (milestone.status !== 'completed') {
          const deadline = new Date(milestone.deadline)
          const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntilDeadline > 0 && daysUntilDeadline <= 30) {
            upcoming.push({ indicator, milestone })
          }
        }
      })
    })
    
    return upcoming
  })

  // Actions
  const addTask = (task: StrategicTask) => {
    tasks.value.push(task)
  }

  const updateTask = (id: string, updates: Partial<StrategicTask>) => {
    const task = getTaskById(id)
    if (task) {
      Object.assign(task, updates)
    }
  }

  const deleteTask = (id: string) => {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }
  }

  const addIndicator = (indicator: StrategicIndicator) => {
    indicators.value.push(indicator)
  }

  const updateIndicator = (id: string, updates: Partial<StrategicIndicator>) => {
    const index = indicators.value.findIndex(i => i.id === id)
    if (index !== -1) {
      // 使用响应式更新方式，确保 Vue 能检测到变化
      indicators.value[index] = { ...indicators.value[index], ...updates }
      // 强制触发响应式更新（创建新数组引用）
      indicators.value = [...indicators.value]
    }
  }

  const deleteIndicator = (id: string) => {
    const index = indicators.value.findIndex(i => i.id === id)
    if (index !== -1) {
      indicators.value.splice(index, 1)
    }
  }

  const updateMilestoneStatus = (indicatorId: string, milestoneId: string, status: 'pending' | 'completed' | 'overdue') => {
    const indicator = getIndicatorById(indicatorId)
    if (indicator) {
      const milestone = indicator.milestones.find(m => m.id === milestoneId)
      if (milestone) {
        milestone.status = status
      }
    }
  }

  // ============ 时间上下文相关 ============

  // 获取时间上下文 Store（延迟获取避免循环依赖）
  const getTimeContext = () => useTimeContextStore()

  // 按当前年份过滤的任务
  const tasksByCurrentYear = computed(() => {
    const timeContext = getTimeContext()
    return tasks.value.filter(t => t.year === timeContext.currentYear)
  })

  // 按当前年份过滤的指标
  const indicatorsByCurrentYear = computed(() => {
    const timeContext = getTimeContext()
    return indicators.value.filter(i => i.year === timeContext.currentYear)
  })

  // 初始化：确保所有指标都有 year 和 statusAudit 字段
  const initializeIndicatorFields = () => {
    indicators.value.forEach(indicator => {
      // 如果没有 year 字段，默认为 2025
      if (!indicator.year) {
        indicator.year = 2025
      }
      // 如果没有 statusAudit 字段，初始化为空数组
      if (!indicator.statusAudit) {
        indicator.statusAudit = []
      }
    })
  }

  // 保存 2025 和 2026 年的当前数据（工作模式数据）
  const initial2025Indicators = ref<StrategicIndicator[]>([])
  const current2026Indicators = ref<StrategicIndicator[]>([])
  
  // 保存初始数据
  const saveCurrentIndicators = () => {
    current2026Indicators.value = JSON.parse(JSON.stringify(indicators.value))
  }

  // 保存2025年初始数据
  const save2025Indicators = () => {
    initial2025Indicators.value = JSON.parse(JSON.stringify(
      indicators.value.filter(i => i.year === 2025)
    ))
  }

  // 从 API 加载指标数据
  const loadIndicatorsFromApi = async (year: number): Promise<StrategicIndicator[]> => {
    try {
      const response = await strategicApi.getIndicatorsByYear(year)
      if (response.success && response.data) {
        return response.data.map(vo => strategicApi.convertIndicatorVOToStrategicIndicator(vo))
      }
      return []
    } catch (err) {
      console.error(`Failed to load indicators for year ${year} from API:`, err)
      throw err
    }
  }

  // 从 API 加载任务数据
  const loadTasksFromApi = async (year: number): Promise<StrategicTask[]> => {
    try {
      const response = await strategicApi.getTasksByYear(year)
      if (response.success && response.data) {
        return response.data.map(vo => strategicApi.convertTaskVOToStrategicTask(vo))
      }
      return []
    } catch (err) {
      console.error(`Failed to load tasks for year ${year} from API:`, err)
      throw err
    }
  }

  // 根据年份加载对应数据（优先使用 API，失败时降级到本地数据）
  const loadIndicatorsByYear = async (year: number) => {
    loading.value = true
    error.value = null
    loadingState.value.indicators = true
    loadingState.value.tasks = true
    loadingState.value.error = null

    // 尝试从 API 加载数据
    if (useApiData.value) {
      try {
        console.log(`[Strategic Store] Loading data for year ${year} from API...`)
        
        // 并行加载任务和指标
        const [apiIndicators, apiTasks] = await Promise.all([
          loadIndicatorsFromApi(year),
          loadTasksFromApi(year)
        ])

        if (apiIndicators.length > 0 || apiTasks.length > 0) {
          indicators.value = apiIndicators
          tasks.value = apiTasks
          dataSource.value = 'api' // 数据来源：API
          console.log(`[Strategic Store] Loaded ${apiIndicators.length} indicators and ${apiTasks.length} tasks from API`)
          loading.value = false
          loadingState.value.indicators = false
          loadingState.value.tasks = false
          return
        }
        
        console.log(`[Strategic Store] No data from API for year ${year}, falling back to local data`)
      } catch (err) {
        console.warn(`[Strategic Store] API failed, falling back to local data:`, err)
        error.value = err instanceof Error ? err.message : 'API 请求失败'
        loadingState.value.error = err instanceof Error ? err.message : 'API 请求失败'
        dataSource.value = 'fallback' // 数据来源：降级
      }
    }

    // 降级到本地数据
    console.log(`[Strategic Store] Using local mock data for year ${year}`)
    if (year === 2026) {
      indicators.value = JSON.parse(JSON.stringify(indicators2026))
    } else if (year === 2023) {
      indicators.value = JSON.parse(JSON.stringify(indicators2023))
    } else if (year === 2024) {
      indicators.value = JSON.parse(JSON.stringify(indicators2024))
    } else if (year === 2025) {
      indicators.value = JSON.parse(JSON.stringify(indicators2025))
    } else {
      indicators.value = []
    }
    
    // 如果之前没有设置为 fallback（API 失败），则设置为 local
    if (dataSource.value !== 'fallback') {
      dataSource.value = 'local' // 数据来源：本地
    }
    
    loading.value = false
    loadingState.value.indicators = false
    loadingState.value.tasks = false
  }

  // 监听年份变化，动态切换数据
  const timeContext = getTimeContext()
  watch(
    () => timeContext.currentYear,
    (newYear) => {
      loadIndicatorsByYear(newYear)
    }
  )

  // 初始化流程
  // 1. 先初始化字段（确保所有指标都有 year 和 statusAudit）
  initializeIndicatorFields()
  // 2. 保存 2025 年初始数据（作为历史数据）
  save2025Indicators()
  // 3. 保存 2026 年当前数据（作为工作模式的基准数据）
  saveCurrentIndicators()
  // 4. 根据当前年份加载对应数据（异步）
  loadIndicatorsByYear(timeContext.currentYear)

  // 添加审计日志条目
  const addStatusAuditEntry = (
    indicatorId: string,
    entry: Omit<StatusAuditEntry, 'id' | 'timestamp'>
  ) => {
    const indicator = getIndicatorById(indicatorId)
    if (indicator) {
      if (!indicator.statusAudit) {
        indicator.statusAudit = []
      }
      indicator.statusAudit.push({
        ...entry,
        id: `audit-${indicatorId}-${Date.now()}`,
        timestamp: new Date()
      })
    }
  }

  // 根据学院获取子指标
  const getChildIndicatorsByCollege = (college: string) => {
    return indicators.value.filter(i => {
      if (i.isStrategic) return false
      // 支持字符串或数组格式的 responsibleDept
      if (Array.isArray(i.responsibleDept)) {
        return i.responsibleDept.includes(college)
      }
      return i.responsibleDept === college
    })
  }

  /**
   * 验证当前 Store 中的数据
   * 
   * 使用 DataValidator 验证所有指标数据的完整性和格式
   * 更新 validationState 状态
   * 
   * @returns 验证结果汇总
   * @requirement 8.4 - Store data consistency check
   */
  const validateCurrentData = (): ValidationResult => {
    const { validateIndicator, mergeResults, createEmptyResult } = useDataValidator({
      strict: false,
      logErrors: true
    })

    // 验证所有指标
    const indicatorResults: ValidationResult[] = indicators.value.map(indicator => {
      return validateIndicator(indicator)
    })

    // 合并所有验证结果
    const mergedResult = indicatorResults.length > 0 
      ? mergeResults(...indicatorResults)
      : createEmptyResult()

    // 构建问题列表
    const issues: Array<{ severity: 'error' | 'warning' | 'info'; field: string; message: string }> = []
    
    // 添加错误
    for (const err of mergedResult.errors) {
      issues.push({
        severity: 'error',
        field: err.field,
        message: err.message
      })
    }
    
    // 添加警告
    for (const warn of mergedResult.warnings) {
      issues.push({
        severity: 'warning',
        field: warn.field,
        message: warn.message
      })
    }

    // 更新验证状态
    validationState.value = {
      lastValidated: new Date(),
      isValid: mergedResult.isValid,
      issues
    }

    // 如果数据不一致，记录数据同步错误
    if (!mergedResult.isValid) {
      console.error('[Strategic Store] 数据验证失败，存在数据同步问题:', {
        errorCount: mergedResult.errors.length,
        warningCount: mergedResult.warnings.length,
        errors: mergedResult.errors.slice(0, 5) // 只显示前5个错误
      })
    }

    return mergedResult
  }

  /**
   * 获取数据健康状态
   * 
   * 返回当前 Store 数据的健康状态摘要，包括数据来源、数量和验证问题
   * 
   * @returns 数据健康状态对象
   * @requirement 8.4 - Store data consistency check
   */
  const getDataHealth = (): DataHealthStatus => {
    // 计算健康状态
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    const errorCount = validationState.value.issues.filter(i => i.severity === 'error').length
    const warningCount = validationState.value.issues.filter(i => i.severity === 'warning').length
    
    if (errorCount > 0) {
      status = 'critical'
    } else if (warningCount > 0 || dataSource.value === 'fallback') {
      status = 'warning'
    }
    
    // 如果数据来源是降级数据，至少是 warning 状态
    if (dataSource.value === 'fallback' && status === 'healthy') {
      status = 'warning'
    }

    return {
      status,
      dataSource: dataSource.value,
      indicatorCount: indicators.value.length,
      taskCount: tasks.value.length,
      validationIssues: validationState.value.issues.length,
      lastValidated: validationState.value.lastValidated
    }
  }

  return {
    // State
    tasks,
    indicators,
    loading,
    error,
    useApiData,
    dataSource,
    loadingState,
    validationState,

    // Getters
    activeTasks,
    activeIndicators,
    getTaskById,
    getIndicatorById,
    getIndicatorsByTask,
    getOverdueMilestones,
    getUpcomingMilestones,
    getChildIndicatorsByCollege,
    // 按年份过滤
    tasksByCurrentYear,
    indicatorsByCurrentYear,

    // Actions
    addTask,
    updateTask,
    deleteTask,
    addIndicator,
    updateIndicator,
    deleteIndicator,
    updateMilestoneStatus,
    addStatusAuditEntry,
    initializeIndicatorFields,
    loadIndicatorsByYear,
    loadIndicatorsFromApi,
    loadTasksFromApi,
    saveCurrentIndicators,
    
    // 数据验证和健康检查
    validateCurrentData,
    getDataHealth
  }
})
