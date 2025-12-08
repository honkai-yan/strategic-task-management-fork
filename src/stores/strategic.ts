import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StrategicTask, StrategicIndicator, Milestone } from '@/types'

export const useStrategicStore = defineStore('strategic', () => {
  // State
  const tasks = ref<StrategicTask[]>([
    {
      id: '1',
      title: '2025年度教学质量提升战略任务',
      desc: '通过多维度教学改革提升整体教学质量',
      createTime: '2025年12月1日',
      cycle: '2025年度',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'active',
      createdBy: 'admin',
      indicators: []
    },
    {
      id: '2',
      title: '科研创新能力建设战略任务',
      desc: '加强科研团队建设，提升科研产出',
      createTime: '2025年11月15日',
      cycle: '2025年度',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'active',
      createdBy: 'admin',
      indicators: []
    }
  ])

  const indicators = ref<StrategicIndicator[]>([
    {
      id: '101',
      name: '就业率达90%',
      isQualitative: true,
      type1: '定性',
      type2: '发展性',
      progress: 33,
      createTime: '2025年11月21日',
      weight: 20,
      remark: '需要各学院配合完成就业数据统计',
      canWithdraw: true,
      milestones: [
        {
          id: '1001',
          name: '第一季度：数据收集与初步分析',
          targetProgress: 30,
          deadline: '2025-03-31',
          status: 'completed'
        },
        {
          id: '1002',
          name: '第二季度：各学院配合统计',
          targetProgress: 60,
          deadline: '2025-06-30',
          status: 'completed'
        },
        {
          id: '1003',
          name: '第三季度：就业率评估与调整',
          targetProgress: 80,
          deadline: '2025-09-30',
          status: 'overdue'
        },
        {
          id: '1004',
          name: '第四季度：最终达标率90%',
          targetProgress: 90,
          deadline: '2025-12-31',
          status: 'pending'
        }
      ],
      targetValue: 90,
      unit: '%',
      responsibleDept: '教务处',
      responsiblePerson: '李老师',
      status: 'active',
      isStrategic: true
    },
    {
      id: '102',
      name: '针对各学院开设专业引进优质校招企业（各专业大类不低于2家）',
      isQualitative: false,
      type1: '定量',
      type2: '基础性',
      progress: 90,
      createTime: '2025年11月21日',
      weight: 66,
      remark: '已对接多家企业，进展顺利',
      canWithdraw: false,
      milestones: [
        {
          id: '2001',
          name: 'Q1: 企业调研与需求分析',
          targetProgress: 25,
          deadline: '2025-03-31',
          status: 'completed'
        },
        {
          id: '2002',
          name: 'Q2: 优质企业对接洽谈',
          targetProgress: 50,
          deadline: '2025-06-30',
          status: 'completed'
        },
        {
          id: '2003',
          name: 'Q3: 校园招聘会组织',
          targetProgress: 75,
          deadline: '2025-09-30',
          status: 'completed'
        },
        {
          id: '2004',
          name: 'Q4: 全专业覆盖完成',
          targetProgress: 100,
          deadline: '2025-12-31',
          status: 'pending'
        }
      ],
      targetValue: 100,
      unit: '家',
      responsibleDept: '人事处',
      responsiblePerson: '王主任',
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
