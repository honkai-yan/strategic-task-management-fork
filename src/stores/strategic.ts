import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StrategicTask, StrategicIndicator, Milestone } from '@/types'

export const useStrategicStore = defineStore('strategic', () => {
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
      indicators: []
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
      indicators: []
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
      indicators: []
    }
  ])

  const indicators = ref<StrategicIndicator[]>([
    // ============ 发展性指标 - 战略任务1：全力促进毕业生多元化高质量就业创业 ============
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
        { id: '1001', name: 'Q1: 就业数据摸底', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '1002', name: 'Q2: 优质就业渠道拓展', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '1003', name: 'Q3: 就业质量跟踪', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '1004', name: 'Q4: 目标达成验收', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 15,
      unit: '%',
      responsibleDept: '就业创业指导中心',
      responsiblePerson: '张老师',
      status: 'active',
      isStrategic: true
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
        { id: '1021', name: 'Q1: 就业数据收集', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '1022', name: 'Q2: 各学院配合统计', targetProgress: 50, deadline: '2025-06-30', status: 'completed' },
        { id: '1023', name: 'Q3: 就业率评估与调整', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '1024', name: 'Q4: 最终达标率90%', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 90,
      unit: '%',
      responsibleDept: '就业创业指导中心',
      responsiblePerson: '李老师',
      status: 'active',
      isStrategic: true
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
        { id: '1031', name: 'Q1: 企业调研与需求分析', targetProgress: 25, deadline: '2025-03-31', status: 'completed' },
        { id: '1032', name: 'Q2: 优质企业对接洽谈', targetProgress: 50, deadline: '2025-06-30', status: 'pending' },
        { id: '1033', name: 'Q3: 校园招聘会组织', targetProgress: 75, deadline: '2025-09-30', status: 'pending' },
        { id: '1034', name: 'Q4: 全专业覆盖完成', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 2,
      unit: '家/专业',
      responsibleDept: '招生工作处',
      responsiblePerson: '王主任',
      status: 'active',
      isStrategic: true
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
        { id: '2014', name: 'Q4: 校友数据信息化', targetProgress: 100, deadline: '2025-12-31', status: 'pending' }
      ],
      targetValue: 100,
      unit: '%',
      responsibleDept: '学校综合办公室',
      responsiblePerson: '陈主任',
      status: 'active',
      isStrategic: true
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
      isStrategic: true
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
    const indicator = getIndicatorById(id)
    if (indicator) {
      Object.assign(indicator, updates)
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

  return {
    // State
    tasks,
    indicators,

    // Getters
    activeTasks,
    activeIndicators,
    getTaskById,
    getIndicatorById,
    getIndicatorsByTask,
    getOverdueMilestones,
    getUpcomingMilestones,

    // Actions
    addTask,
    updateTask,
    deleteTask,
    addIndicator,
    updateIndicator,
    deleteIndicator,
    updateMilestoneStatus
  }
})
