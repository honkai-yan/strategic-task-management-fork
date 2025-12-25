<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { Plus, View, Download, Delete, ArrowDown, Promotion, RefreshLeft } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { ElTable } from 'element-plus'
  import type { StrategicTask, StrategicIndicator } from '@/types'
  import { useStrategicStore } from '@/stores/strategic'
  import { useAuthStore } from '@/stores/auth'
  import { useTimeContextStore } from '@/stores/timeContext'
  import AuditLogDrawer from '@/components/task/AuditLogDrawer.vue'
  
  // --- 新增：自定义指令，用于自动聚焦 ---
  const vFocus = {
    mounted: (el: HTMLElement) => {
      // 尝试查找内部的 input 或 textarea 元素
      const input = el.querySelector('input') || el.querySelector('textarea')
      if (input) {
        input.focus()
      } else {
        // 如果找不到（或者是 div 等），直接聚焦元素本身
        el.focus()
      }
    }
  }
  
  // 使用共享 Store
  const strategicStore = useStrategicStore()
  const authStore = useAuthStore()
  const timeContext = useTimeContextStore()

  // 只读模式（历史年份为只读）
  const isReadOnly = computed(() => timeContext.isReadOnly)
  
  // 接收父组件传递的选中角色
  const props = defineProps<{
    selectedRole: string
  }>()
  
  // 判断是否可以编辑（只有战略发展部可以编辑，且非只读模式）
  const canEdit = computed(() => {
    if (isReadOnly.value) return false
    return authStore.userRole === 'strategic_dept' || props.selectedRole === 'strategic_dept'
  })
  
  // 当前选中任务索引
  const currentTaskIndex = ref(0)
  const isAddingOrEditing = ref(false)
  
  // 选中的部门
  const selectedDepartment = ref('')
  
  // 职能部门列表
  const functionalDepartments = [
    '党委办公室 | 党委统战部',
    '纪委办公室 | 监察处',
    '党委宣传部 | 宣传策划部',
    '党委组织部 | 党委教师工作部 | 人力资源部',
    '党委学工部 | 学生工作处',
    '党委保卫部 | 保卫处',
    '学校综合办公室',
    '教务处',
    '科技处',
    '财务部',
    '招生工作处',
    '就业创业指导中心',
    '实验室建设管理处',
    '数字校园建设办公室',
    '图书馆 | 档案馆',
    '后勤资产处',
    '继续教育部',
    '国际合作与交流处'
  ]
  
  // 表格引用和选中的指标
  const tableRef = ref<InstanceType<typeof ElTable>>()
  const selectedIndicators = ref<StrategicIndicator[]>([])
  
  // 从 Store 获取任务列表
  const taskList = computed(() => strategicStore.tasks.map(t => ({
    id: Number(t.id),
    title: t.title,
    desc: t.desc,
    createTime: t.createTime,
    cycle: t.cycle
  })))
  
  // 当前选中的任务
  const currentTask = computed(() => taskList.value[currentTaskIndex.value] || {
    id: 0,
    title: '暂无任务',
    desc: '',
    createTime: '',
    cycle: ''
  })
  
  // 从 Store 获取指标列表（带里程碑），按年份过滤，按任务类型和战略任务分组排序
  const indicators = computed(() => {
    // 过滤当前年份的指标
    const list = strategicStore.indicators
      .filter(i => !i.year || i.year === timeContext.currentYear)
      .map(i => ({
        ...i,
        id: Number(i.id)
      }))
    // 先按 type2（任务类型）排序，再按 taskContent（战略任务）排序
    return list.sort((a, b) => {
      const type2A = a.type2 || ''
      const type2B = b.type2 || ''
      if (type2A !== type2B) {
        // 发展性排在前面
        return type2A === '发展性' ? -1 : 1
      }
      const taskA = a.taskContent || ''
      const taskB = b.taskContent || ''
      return taskA.localeCompare(taskB)
    })
  })
  
  // 计算单元格合并信息
  const getSpanMethod = ({ row, column, rowIndex, columnIndex }: { row: any; column: any; rowIndex: number; columnIndex: number }) => {
    const dataList = indicators.value
  
    // 战略任务列（第1列）和批量操作列（第7列，删除类型列后）
    if (columnIndex === 1 || columnIndex === 7) {
      const currentTask = row.taskContent || '未关联任务'
  
      let startIndex = rowIndex
      while (startIndex > 0 && (dataList[startIndex - 1].taskContent || '未关联任务') === currentTask) {
        startIndex--
      }
  
      if (startIndex === rowIndex) {
        let count = 1
        while (rowIndex + count < dataList.length && (dataList[rowIndex + count].taskContent || '未关联任务') === currentTask) {
          count++
        }
        return { rowspan: count, colspan: 1 }
      } else {
        return { rowspan: 0, colspan: 0 }
      }
    }
    return { rowspan: 1, colspan: 1 }
  }
  
  // 获取当前行所属的任务组
  const getTaskGroup = (row: StrategicIndicator) => {
    const taskContent = row.taskContent || '未命名任务'
    const rows = indicators.value.filter(i => (i.taskContent || '未命名任务') === taskContent)
    return { taskContent, rows }
  }
  
  // 按类别筛选指标
  const developmentIndicators = computed(() => indicators.value.filter(i => i.type2 === '发展性'))
  const basicIndicators = computed(() => indicators.value.filter(i => i.type2 === '基础性'))
  
  const groupIndicatorsByTask = (list: StrategicIndicator[]) => {
    const groups: Array<{ taskContent: string; rows: StrategicIndicator[] }> = []
    const indexMap: Record<string, number> = {}
  
    list.forEach(item => {
      const key = item.taskContent || '未命名任务'
      if (indexMap[key] === undefined) {
        groups.push({ taskContent: key, rows: [item] })
        indexMap[key] = groups.length - 1
      } else {
        groups[indexMap[key]].rows.push(item)
      }
    })
  
    return groups
  }
  
  const groupedDevelopmentIndicators = computed(() => groupIndicatorsByTask(developmentIndicators.value))
  const groupedBasicIndicators = computed(() => groupIndicatorsByTask(basicIndicators.value))
  
  // 获取已有的任务名称列表（去重）
  const existingTaskNames = computed(() => {
    const taskSet = new Set<string>()
    indicators.value.forEach(i => {
      if (i.taskContent && i.taskContent !== '未命名任务') {
        taskSet.add(i.taskContent)
      }
    })
    return Array.from(taskSet)
  })
  
  // 新增行数据
  const newRow = ref({
    taskContent: '',
    name: '',
    type1: '定性' as '定性' | '定量',
    type2: '发展性' as '发展性' | '基础性',
    weight: '',
    remark: '',
    milestones: [] as Milestone[]
  })
  
  // 里程碑输入状态
  const showMilestoneInput = ref(false)
  
  // 任务下发相关状态
  const showAssignmentDialog = ref(false)
  const assignmentTarget = ref('')
  const assignmentMethod = ref<'self' | 'college'>('self')
  
  // 添加新里程碑
  const addMilestone = () => {
    newRow.value.milestones.push({
      id: Date.now(),
      name: '',
      targetProgress: 0,
      deadline: '',
      status: 'pending'
    })
  }
  
  // 删除里程碑
  const removeMilestone = (index: number) => {
    newRow.value.milestones.splice(index, 1)
  }
  
  // 当前日期
  const currentDate = '2025年12月5日'
  
  // 编辑状态管理（任务详情）
  const editingField = ref<string | null>(null)
  const editingValue = ref('')
  
  // 指标列表编辑状态
  const editingIndicatorId = ref<number | null>(null)
  const editingIndicatorField = ref<string | null>(null)
  const editingIndicatorValue = ref<any>(null)
  
  // 任务详情双击编辑处理
  const handleDoubleClick = (field: 'title' | 'desc' | 'cycle' | 'createTime', value: string) => {
    if (!canEdit.value) return
    editingField.value = field
    editingValue.value = value
  }
  
  // 任务详情保存编辑
  const saveEdit = (field: 'title' | 'desc' | 'cycle' | 'createTime') => {
    // 如果值没有变化或者被清空（根据需求，这里假设如果不填则取消编辑或保留原值，这里逻辑是如果不填则取消）
    if (editingValue.value === undefined || editingValue.value === null) {
        cancelEdit()
        return
    }
  
    const task = taskList.value[currentTaskIndex.value]
    if (field === 'title') task.title = editingValue.value
    else if (field === 'desc') task.desc = editingValue.value
    else if (field === 'cycle') task.cycle = editingValue.value
    else if (field === 'createTime') task.createTime = editingValue.value
  
    cancelEdit()
  }
  
  // 任务详情取消编辑
  const cancelEdit = () => {
    editingField.value = null
    editingValue.value = ''
  }
  
  // 指标双击编辑
  const handleIndicatorDblClick = (row: StrategicIndicator, field: string) => {
    if (!canEdit.value) return
    editingIndicatorId.value = row.id
    editingIndicatorField.value = field
    editingIndicatorValue.value = row[field as keyof StrategicIndicator]
  }
  
  // 保存指标编辑
  const saveIndicatorEdit = (row: StrategicIndicator, field: string) => {
    // 如果已经在取消过程中或值无效，直接退出
    if (editingIndicatorId.value === null) return; 
  
    if (editingIndicatorValue.value === null || editingIndicatorValue.value === undefined) {
        cancelIndicatorEdit()
        return
    }
    
    // 使用 Store 更新指标
    const updates: Partial<StrategicIndicator> = {}
    
    if (field === 'type1' || field === 'type2') {
        updates[field] = editingIndicatorValue.value
        // 更新 isQualitative 状态如果修改的是 type1
        if (field === 'type1') {
            updates.isQualitative = editingIndicatorValue.value === '定性'
        }
    } else {
        (updates as any)[field] = editingIndicatorValue.value
    }
    
    strategicStore.updateIndicator(row.id.toString(), updates)
    cancelIndicatorEdit()
    updateEditTime()
  }
  
  // 取消指标编辑
  const cancelIndicatorEdit = () => {
    editingIndicatorId.value = null
    editingIndicatorField.value = null
    editingIndicatorValue.value = null
  }
  
  // 全局点击事件处理 - 点击编辑区域外退出编辑
  const handleGlobalClick = (event: MouseEvent) => {
    // 如果没有正在编辑的字段，直接返回
    if (editingIndicatorId.value === null) return
  
    const target = event.target as HTMLElement
  
    // 检查点击是否在 el-select 或其下拉菜单内
    const isInSelect = target.closest('.el-select') || target.closest('.el-select-dropdown')
    // 检查点击是否在 el-input 内
    const isInInput = target.closest('.el-input') || target.closest('.el-textarea')
  
    // 如果点击不在编辑组件内，则退出编辑
    if (!isInSelect && !isInInput) {
      cancelIndicatorEdit()
    }
  }
  
  // 挂载和卸载全局点击监听
  onMounted(() => {
    document.addEventListener('click', handleGlobalClick, true)
  })
  
  onUnmounted(() => {
    document.removeEventListener('click', handleGlobalClick, true)
  })
  
  // 方法
  const addNewRow = () => {
    isAddingOrEditing.value = true
  }
  
  // 在指定类别中添加新指标
  const addIndicatorToCategory = (category: '发展性' | '基础性') => {
    newRow.value.type2 = category
    isAddingOrEditing.value = true
  }
  
  const cancelAdd = () => {
    isAddingOrEditing.value = false
    newRow.value = { taskContent: '', name: '', type1: '定性', type2: '发展性', weight: '', remark: '', milestones: [] }
    updateEditTime()
  }
  
  // 保存新行
  const saveNewRow = () => {
    if (!newRow.value.name) return
  
    // 使用 Store 添加指标
    strategicStore.addIndicator({
      id: Date.now().toString(),
      taskContent: newRow.value.taskContent || '未命名任务',
      name: newRow.value.name,
      isQualitative: newRow.value.type1 === '定性',
      type1: newRow.value.type1,
      type2: newRow.value.type2,
      progress: 0,
      createTime: currentDate,
      weight: Number(newRow.value.weight) || 0,
      remark: newRow.value.remark || '无备注',
      canWithdraw: true,
      milestones: [...newRow.value.milestones],
      targetValue: 100,
      unit: '%',
      responsibleDept: authStore.userDepartment || '未分配',
      responsiblePerson: authStore.userName || '未分配',
      status: 'active',
      isStrategic: true,
      year: timeContext.currentYear,
      statusAudit: []
    })
    cancelAdd()
    updateEditTime()
  }

  // 删除指标
  const deleteIndicator = (indicator: StrategicIndicator) => {
    ElMessageBox.confirm(
      `确定要删除指标 "${indicator.name}" 吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      strategicStore.deleteIndicator(indicator.id.toString())
      ElMessage.success('指标已删除')
      updateEditTime()
    })
  }
  
  // 最后编辑时间
  const lastEditTime = ref(new Date().toLocaleString())
  
  // 更新最后编辑时间的函数
  const updateEditTime = () => {
    lastEditTime.value = new Date().toLocaleString()
  }
  
  // 里程碑状态计算
  const calculateMilestoneStatus = (indicator: StrategicIndicator): 'success' | 'warning' | 'exception' => {
    if (!indicator.milestones || indicator.milestones.length === 0) {
      return getProgressStatus(indicator.progress)
    }
  
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
  
    // 检查是否有逾期未完成的里程碑
    const hasOverdueMilestone = indicator.milestones.some(milestone => {
      const deadlineDate = new Date(milestone.deadline)
      return milestone.status === 'pending' && deadlineDate < currentDate
    })
  
    // 检查是否有即将到期的里程碑（30天内）
    const hasUpcomingMilestone = indicator.milestones.some(milestone => {
      if (milestone.status === 'completed') return false
      const deadlineDate = new Date(milestone.deadline)
      const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilDeadline > 0 && daysUntilDeadline <= 30
    })
  
    // 判断状态逻辑
    if (hasOverdueMilestone) {
      return 'exception' // 红色：逾期未完成
    } else if (hasUpcomingMilestone) {
      return 'warning' // 黄色：即将到期
    } else {
      return 'success' // 绿色：按计划进行
    }
  }
  
  // 获取里程碑进度文本
  const getMilestoneProgressText = (indicator: StrategicIndicator): string => {
    if (!indicator.milestones || indicator.milestones.length === 0) {
      return `当前进度: ${indicator.progress}%`
    }
  
    const totalMilestones = indicator.milestones.length
    const completedMilestones = indicator.milestones.filter(m => m.status === 'completed').length
    const overdueMilestones = indicator.milestones.filter(m => m.status === 'overdue').length
    const pendingMilestones = indicator.milestones.filter(m => m.status === 'pending').length
  
    const currentDate = new Date()
    const overdueMilestonesCount = indicator.milestones.filter(m => {
      if (m.status !== 'pending') return false
      const deadlineDate = new Date(m.deadline)
      return deadlineDate < currentDate
    }).length
  
    if (overdueMilestonesCount > 0) {
      return `逾期: ${overdueMilestonesCount} 个里程碑`
    } else if (pendingMilestones > 0) {
      return `待完成: ${pendingMilestones} 个里程碑`
    } else {
      return '所有里程碑已完成'
    }
  }
  
  const selectDepartment = (dept: string) => {
    selectedDepartment.value = dept
  }
  
  const selectTask = (index: number) => {
    currentTaskIndex.value = index
  }
  
  // 表格选择变化处理
  const handleSelectionChange = (selection: StrategicIndicator[]) => {
    selectedIndicators.value = selection
  }
  
  // 任务下发相关方法
  const confirmAssignment = () => {
    if (!assignmentTarget.value) {
      ElMessage.warning('请选择下发目标')
      return
    }
  
    const indicatorNames = selectedIndicators.value.map(ind => ind.name).join('、')
    const targetName = assignmentMethod.value === 'self' ? '自己完成' : `下发给${assignmentTarget.value}`
  
    ElMessageBox.confirm(
      `确认将以下指标${targetName}？\n\n${indicatorNames}`,
      '确认下发',
      {
        confirmButtonText: '确定下发',
        cancelButtonText: '取消',
        type: 'info'
      }
    ).then(() => {
      // 这里应该调用API进行任务下发
      ElMessage.success(`成功下发${selectedIndicators.value.length}项指标到${assignmentTarget.value}`)
      showAssignmentDialog.value = false
      assignmentTarget.value = ''
      assignmentMethod.value = 'self'
    })
  }
  
  // ================== 详情抽屉 & 单个下发/撤回 ==================

  // 详情抽屉状态
  const detailDrawerVisible = ref(false)
  const currentDetail = ref<StrategicIndicator | null>(null)

  // 审计日志抽屉状态
  const auditLogVisible = ref(false)
  const currentAuditIndicator = ref<StrategicIndicator | null>(null)

  // 查看审计日志
  const handleViewAuditLog = (row: StrategicIndicator) => {
    currentAuditIndicator.value = row
    auditLogVisible.value = true
  }

  // 下发弹窗状态
  const distributeDialogVisible = ref(false)
  const currentDistributeItem = ref<StrategicIndicator | null>(null)
  const currentDistributeGroup = ref<{ taskContent: string; rows: StrategicIndicator[] } | null>(null)
  const distributeTarget = ref<string[]>([])
  
  // 查看详情
  const handleViewDetail = (row: StrategicIndicator) => {
    currentDetail.value = row
    detailDrawerVisible.value = true
  }
  
  // 打开下发弹窗
  const openDistributeDialog = (row: StrategicIndicator) => {
    currentDistributeItem.value = row
    // 默认选中左侧当前选择的部门
    distributeTarget.value = selectedDepartment.value ? [selectedDepartment.value] : []
    distributeDialogVisible.value = true
  }
  
  // 确认下发（支持单个和整体下发）
  const confirmDistribute = () => {
    if (distributeTarget.value.length === 0) {
      ElMessage.warning('请选择下发目标部门')
      return
    }
    
    const targetDepts = distributeTarget.value.join('、')
    
    // 整体下发模式
    if (currentDistributeGroup.value) {
      const pendingRows = currentDistributeGroup.value.rows.filter(r => r.canWithdraw)
      ElMessageBox.confirm(
        `确认将任务 "${currentDistributeGroup.value.taskContent}" 下的 ${pendingRows.length} 个指标下发到以下部门？\n\n${targetDepts}`,
        '整体下发确认',
        {
          confirmButtonText: '确认下发',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        pendingRows.forEach(row => {
          strategicStore.updateIndicator(row.id.toString(), { canWithdraw: false })
        })
        ElMessage.success(`已成功下发 ${pendingRows.length} 个指标到 ${distributeTarget.value.length} 个部门`)
        closeDistributeDialog()
        updateEditTime()
      })
      return
    }
    
    // 单个下发模式
    if (!currentDistributeItem.value) return
    
    ElMessageBox.confirm(
      `确认将指标 "${currentDistributeItem.value.name}" 下发到以下部门？\n\n${targetDepts}`,
      '下发确认',
      {
        confirmButtonText: '确认下发',
        cancelButtonText: '取消',
        type: 'info'
      }
    ).then(() => {
      strategicStore.updateIndicator(currentDistributeItem.value!.id.toString(), { canWithdraw: false })
      ElMessage.success(`指标已成功下发到 ${distributeTarget.value.length} 个部门`)
      closeDistributeDialog()
      updateEditTime()
    })
  }
  
  // 关闭下发弹窗
  const closeDistributeDialog = () => {
    distributeDialogVisible.value = false
    currentDistributeItem.value = null
    currentDistributeGroup.value = null
    distributeTarget.value = []
  }
  
  // 单个撤回
  const handleWithdraw = (row: StrategicIndicator) => {
    ElMessageBox.confirm(
      `撤回后，该指标将重新变为可下发状态。确认撤回 "${row.name}"？`,
      '撤回操作',
      {
        confirmButtonText: '确认撤回',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      strategicStore.updateIndicator(row.id.toString(), { canWithdraw: true })
      ElMessage.info('指标已撤回')
      updateEditTime()
    })
  }
  
  // 按任务整体下发（复用下发弹窗）
  const handleBatchDistributeByTask = (group: { taskContent: string; rows: StrategicIndicator[] }) => {
    const pendingRows = group.rows.filter(r => r.canWithdraw)
    if (pendingRows.length === 0) {
      ElMessage.warning('该任务下所有指标已下发')
      return
    }
    
    currentDistributeGroup.value = group
    currentDistributeItem.value = null
    distributeTarget.value = selectedDepartment.value ? [selectedDepartment.value] : []
    distributeDialogVisible.value = true
  }
  
  // 删除单个指标
  const handleDeleteIndicator = (row: StrategicIndicator) => {
    ElMessageBox.confirm(
      `确定要删除指标 "${row.name}" 吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      strategicStore.deleteIndicator(row.id.toString())
      ElMessage.success('指标已删除')
      updateEditTime()
    })
  }
  
  // 任务类别颜色映射
  const getCategoryColor = (type2: string) => {
    return type2 === '发展性' ? '#409EFF' : '#67C23A'
  }
  
  // 表格滚动状态
  const tableScrollRef = ref<HTMLElement | null>(null)
  const isTableScrolling = ref(false)
  
  // 监听表格滚动，判断是否需要显示操作列的固定效果
  const handleTableScroll = (e: Event) => {
    const target = e.target as HTMLElement
    const scrollLeft = target.scrollLeft
    const scrollWidth = target.scrollWidth
    const clientWidth = target.clientWidth
    // 当滚动到最右侧时（允许2px误差），隐藏固定效果
    isTableScrolling.value = scrollLeft < scrollWidth - clientWidth - 2
  }
  
  // 进度条颜色计算
  // 未下发：灰色 | 任务周期内未达标：黄色 | 超过任务周期未达标：红色 | 任务周期内已达标：绿色
  // 使用统一的进度条颜色规则 (Requirements: 10.2)
  const getProgressColor = (row: StrategicIndicator): string => {
    // 未下发的进度条为灰色
    if (row.canWithdraw) {
      return 'var(--text-placeholder)' // 使用CSS变量 #C0C4CC
    }
    
    const progress = row.progress || 0
    const targetValue = row.targetValue || 100
    const isAchieved = progress >= targetValue
    
    // 检查是否有里程碑及其截止日期
    const currentDate = new Date()
    let isOverdue = false
    
    if (row.milestones && row.milestones.length > 0) {
      // 检查最后一个里程碑的截止日期
      const lastMilestone = row.milestones[row.milestones.length - 1]
      if (lastMilestone.deadline) {
        const deadlineDate = new Date(lastMilestone.deadline)
        isOverdue = currentDate > deadlineDate
      }
    }
    
    if (isAchieved) {
      return 'var(--color-success)' // 绿色：已达标
    } else if (isOverdue) {
      return 'var(--color-danger)' // 红色：超过任务周期未达标
    } else {
      return 'var(--color-warning)' // 黄色：任务周期内未达标
    }
  }
  
  // 获取进度状态 - 使用统一的进度条颜色规则 (Requirements: 10.2)
  // 规则: progress >= 80: success, 50 <= progress < 80: warning, progress < 50: exception
  const getProgressStatus = (progress: number): 'success' | 'warning' | 'exception' => {
    if (progress >= 80) return 'success'
    if (progress >= 50) return 'warning'
    return 'exception'
  }
  </script>
  
  <template>
    <div class="strategic-task-container page-fade-enter">
      <!-- 侧边栏遮罩层 -->
      <div class="sidebar-backdrop"></div>

      <!-- 左侧任务列表 - 动态隐藏 -->
      <aside class="task-sidebar">
        <!-- 展开箭头（右上角） -->
        <span class="sidebar-arrow">›</span>
        <div class="sidebar-header">
          <div class="task-list-title">部门列表</div>
          <span class="sidebar-badge">{{ functionalDepartments.length }}</span>
        </div>

        <ul class="task-list">
          <li
            v-for="dept in functionalDepartments"
            :key="dept"
            :class="['task-item', { active: selectedDepartment === dept }]"
            @click="selectDepartment(dept)"
          >
            {{ dept }}
          </li>
        </ul>
      </aside>
  
      <!-- 右侧详情区域 - Excel风格 -->
      <section class="task-detail excel-style card-animate" style="animation-delay: 0.1s;">
        <!-- Excel标题头 -->
        <div class="excel-header">
          <h2 class="excel-title">战略任务指标总表</h2>
        </div>
  
        <!-- Excel工具栏 -->
        <div class="excel-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" size="small" :disabled="isReadOnly" @click="addNewRow">
              <el-icon><Plus /></el-icon>
              新增行
            </el-button>
            <el-button size="small">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-tag v-if="isReadOnly" type="warning" size="small" style="margin-right: 12px;">
              历史快照 (只读)
            </el-tag>
            <span class="update-time">更新时间: {{ new Date().toLocaleString() }}</span>
          </div>
        </div>
  
        <!-- Excel表格 -->
        <div class="excel-table-wrapper">
          <div class="table-container">
            <el-table
              ref="tableRef"
              :data="indicators"
              :span-method="getSpanMethod"
              border
              highlight-current-row
              @selection-change="handleSelectionChange"
              class="unified-table"
            >
              <el-table-column type="selection" width="50" />
              <el-table-column prop="taskContent" label="战略任务" width="150">
                <template #default="{ row }">
                  <div class="indicator-name-cell" @dblclick="handleIndicatorDblClick(row, 'taskContent')">
                    <el-input
                      v-if="editingIndicatorId === row.id && editingIndicatorField === 'taskContent'"
                      v-model="editingIndicatorValue"
                      v-focus
                      type="textarea"
                      :autosize="{ minRows: 2, maxRows: 6 }"
                      @blur="saveIndicatorEdit(row, 'taskContent')"
                      @keyup.esc="cancelIndicatorEdit"
                    />
                    <el-tooltip v-else :content="row.type2 === '发展性' ? '发展性任务' : '基础性任务'" placement="top">
                      <span
                        class="indicator-name-text task-content-colored"
                        :style="{ color: row.type2 === '发展性' ? '#409EFF' : '#67C23A' }"
                      >{{ row.taskContent || '未关联任务' }}</span>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="核心指标" min-width="150">
                <template #default="{ row }">
                  <div class="indicator-name-cell" @dblclick="handleIndicatorDblClick(row, 'name')">
                    <el-input
                      v-if="editingIndicatorId === row.id && editingIndicatorField === 'name'"
                      v-model="editingIndicatorValue"
                      v-focus
                      type="textarea"
                      :autosize="{ minRows: 2, maxRows: 6 }"
                      @blur="saveIndicatorEdit(row, 'name')"
                    />
                    <el-tooltip v-else :content="row.type1 === '定性' ? '定性指标' : '定量指标'" placement="top">
                      <span
                        class="indicator-name-text"
                        :class="row.type1 === '定性' ? 'indicator-qualitative' : 'indicator-quantitative'"
                      >{{ row.name }}</span>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="weight" label="权重" width="90" align="center">
                <template #default="{ row }">
                  <span @dblclick="handleIndicatorDblClick(row, 'weight')">
                    <el-input
                      v-if="editingIndicatorId === row.id && editingIndicatorField === 'weight'"
                      v-model="editingIndicatorValue"
                      v-focus
                      size="small"
                      style="width: 50px"
                      @blur="saveIndicatorEdit(row, 'weight')"
                    />
                    <span v-else>{{ row.weight }}</span>
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="进度" width="100" align="center">
                <template #default="{ row }">
                  <span @dblclick="handleIndicatorDblClick(row, 'progress')">
                    <el-input
                      v-if="editingIndicatorId === row.id && editingIndicatorField === 'progress'"
                      v-model="editingIndicatorValue"
                      v-focus
                      size="small"
                      type="number"
                      :min="0"
                      :max="100"
                      style="width: 50px"
                      @blur="saveIndicatorEdit(row, 'progress')"
                    />
                    <el-tooltip v-else :content="`当前进度: ${row.progress || 0}%`" placement="top">
                      <el-progress
                        :percentage="row.progress || 0"
                        :stroke-width="8"
                        :color="getProgressColor(row)"
                        :show-text="false"
                        style="width: 80px;"
                      />
                    </el-tooltip>
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="说明" width="130">
                <template #default="{ row }">
                  <div class="indicator-name-cell" @dblclick="handleIndicatorDblClick(row, 'remark')">
                    <el-input
                      v-if="editingIndicatorId === row.id && editingIndicatorField === 'remark'"
                      v-model="editingIndicatorValue"
                      v-focus
                      type="textarea"
                      :autosize="{ minRows: 2, maxRows: 6 }"
                      @blur="saveIndicatorEdit(row, 'remark')"
                      @keyup.esc="cancelIndicatorEdit"
                    />
                    <span v-else class="indicator-name-text remark-text-wrap">{{ row.remark }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="130" align="center">
                <template #default="{ row }">
                  <div class="action-buttons">
                    <el-button link type="primary" size="small" @click="handleViewDetail(row)">查看</el-button>
                    <el-button v-if="row.canWithdraw && !isReadOnly" link type="warning" size="small" @click="openDistributeDialog(row)">下发</el-button>
                    <el-button v-else-if="!row.canWithdraw && !isReadOnly" link type="info" size="small" @click="handleWithdraw(row)">撤回</el-button>
                    <el-button v-if="!isReadOnly" link type="danger" size="small" @click="handleDeleteIndicator(row)">删除</el-button>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="批量" width="90" align="center" class-name="batch-column">
                <template #default="{ row }">
                  <el-button type="primary" size="small" :disabled="isReadOnly" @click="handleBatchDistributeByTask(getTaskGroup(row))">下发</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
  
          <!-- 新增行表单 -->
          <div v-if="isAddingOrEditing" class="add-row-form">
            <h3 class="form-title">新增任务指标</h3>
            <el-form label-width="80px">
              <el-row :gutter="16">
                <el-col :span="4">
                  <el-form-item label="任务类型">
                    <el-select v-model="newRow.type2" style="width: 100%">
                      <el-option label="发展性" value="发展性" />
                      <el-option label="基础性" value="基础性" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="战略任务">
                    <el-select
                      v-model="newRow.taskContent"
                      filterable
                      allow-create
                      default-first-option
                      placeholder="选择或输入战略任务名称"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="task in existingTaskNames"
                        :key="task"
                        :label="task"
                        :value="task"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="权重">
                    <el-input v-model="newRow.weight" placeholder="权重" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="核心指标">
                    <el-input v-model="newRow.name" placeholder="设置核心指标内容" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="4">
                  <el-form-item label="指标类型">
                    <el-select v-model="newRow.type1" style="width: 100%">
                      <el-option label="定性" value="定性" />
                      <el-option label="定量" value="定量" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24" style="text-align: right;">
                  <el-button type="primary" @click="saveNewRow">保存</el-button>
                  <el-button @click="cancelAdd">取消</el-button>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </div>
  
        <!-- Excel状态栏 -->
        <div class="excel-status-bar">
          <div class="status-left">共 {{ indicators.length }} 条记录</div>
          <div class="status-right">最后编辑: {{ lastEditTime }}</div>
        </div>
      </section>
  
      <!-- 任务下发对话框 -->
      <el-dialog
        v-model="showAssignmentDialog"
        title="任务下发"
        width="600px"
        :before-close="() => { showAssignmentDialog = false; assignmentTarget = ''; assignmentMethod = 'self' }"
      >
        <div class="assignment-dialog">
          <div class="selected-indicators">
            <h4>选中的指标 ({{ selectedIndicators.length }}项)</h4>
            <ul>
              <li v-for="indicator in selectedIndicators" :key="indicator.id">
                {{ indicator.name }}
              </li>
            </ul>
          </div>
  
          <el-form :model="{ assignmentMethod, assignmentTarget }" label-width="120px">
            <el-form-item :label="props.selectedRole === '战略发展部' ? '下发方式' : '下发方式'">
              <el-radio-group v-model="assignmentMethod">
                <el-radio value="self" v-if="props.selectedRole === '战略发展部'">职能部门完成</el-radio>
                <el-radio value="college" v-if="props.selectedRole === '战略发展部'">分解到职能部门</el-radio>
                <el-radio value="self" v-else-if="props.selectedRole === '教务处' || props.selectedRole === '科研处'">自己完成</el-radio>
                <el-radio value="college" v-if="props.selectedRole === '教务处' || props.selectedRole === '科研处'">下发给学院</el-radio>
              </el-radio-group>
            </el-form-item>
  
            <el-form-item label="目标部门" v-if="assignmentMethod === 'college'">
              <el-select v-model="assignmentTarget" placeholder="选择学院" style="width: 100%;">
                <el-option label="计算机学院" value="计算机学院" />
                <el-option label="艺术与科技学院" value="艺术与科技学院" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
  
        <template #footer>
          <el-button @click="showAssignmentDialog = false; assignmentTarget = ''; assignmentMethod = 'self'">
            取消
          </el-button>
          <el-button type="primary" @click="confirmAssignment" :disabled="assignmentMethod === 'college' && !assignmentTarget">
            确认下发
          </el-button>
        </template>
      </el-dialog>
  
      <!-- 指标详情抽屉 -->
      <el-drawer v-model="detailDrawerVisible" title="指标详情" size="45%">
        <div v-if="currentDetail" class="detail-container">
          <!-- 基础信息 -->
          <div class="detail-header">
            <h3>{{ currentDetail.name }}</h3>
            <div class="detail-tags">
              <el-tag size="small" :type="currentDetail.type1 === '定量' ? 'primary' : 'warning'">{{ currentDetail.type1 }}</el-tag>
              <el-tag size="small" :style="{ backgroundColor: getCategoryColor(currentDetail.type2), color: '#fff', border: 'none' }">
                {{ currentDetail.type2 }}任务
              </el-tag>
              <el-tag size="small" :type="currentDetail.canWithdraw ? 'info' : 'success'">
                {{ currentDetail.canWithdraw ? '待下发' : '已下发' }}
              </el-tag>
            </div>
          </div>
  
          <el-descriptions :column="2" border class="detail-desc">
            <el-descriptions-item label="战略任务" :span="2">{{ currentDetail.taskContent }}</el-descriptions-item>
            <el-descriptions-item label="任务类别">{{ currentDetail.type2 }}任务</el-descriptions-item>
            <el-descriptions-item label="指标类型">{{ currentDetail.type1 }}</el-descriptions-item>
            <el-descriptions-item label="权重">{{ currentDetail.weight }}</el-descriptions-item>
            <el-descriptions-item label="当前进度">{{ currentDetail.progress }}%</el-descriptions-item>
            <el-descriptions-item label="责任部门">{{ currentDetail.responsibleDept }}</el-descriptions-item>
            <el-descriptions-item label="责任人">{{ currentDetail.responsiblePerson }}</el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">{{ currentDetail.createTime }}</el-descriptions-item>
            <el-descriptions-item label="说明" :span="2">{{ currentDetail.remark }}</el-descriptions-item>
          </el-descriptions>
  
          <!-- 里程碑信息 -->
          <div v-if="currentDetail.milestones && currentDetail.milestones.length > 0" class="milestone-section">
            <div class="divider"></div>
            <h4>里程碑节点</h4>
            <el-timeline style="margin-top: 20px; padding-left: 5px;">
              <el-timeline-item
                v-for="(milestone, index) in currentDetail.milestones"
                :key="index"
                :timestamp="milestone.deadline"
                :type="milestone.status === 'completed' ? 'success' : milestone.status === 'overdue' ? 'danger' : 'primary'"
                placement="top"
              >
                <div class="timeline-card">
                  <div class="timeline-header">
                    <span class="action-text">{{ milestone.name }}</span>
                    <el-tag size="small" :type="milestone.status === 'completed' ? 'success' : milestone.status === 'overdue' ? 'danger' : 'warning'">
                      {{ milestone.status === 'completed' ? '已完成' : milestone.status === 'overdue' ? '已逾期' : '进行中' }}
                    </el-tag>
                  </div>
                  <div class="timeline-comment">
                    目标进度: {{ milestone.targetProgress }}%
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>

          <!-- 审计日志入口 -->
          <div class="audit-log-section">
            <div class="divider"></div>
            <div class="audit-log-header">
              <h4>审计日志</h4>
              <el-button type="primary" link @click="handleViewAuditLog(currentDetail)">
                查看完整日志
              </el-button>
            </div>
            <div v-if="currentDetail.statusAudit && currentDetail.statusAudit.length > 0" class="audit-log-preview">
              <p class="audit-summary">共 {{ currentDetail.statusAudit.length }} 条记录</p>
            </div>
            <div v-else class="audit-log-empty">
              <span>暂无审计记录</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="detail-actions" v-if="!isReadOnly">
            <el-button v-if="currentDetail.canWithdraw" type="primary" @click="openDistributeDialog(currentDetail); detailDrawerVisible = false">
              下发指标
            </el-button>
            <el-button v-else type="warning" @click="handleWithdraw(currentDetail); detailDrawerVisible = false">
              撤回指标
            </el-button>
          </div>
          <div class="detail-actions" v-else>
            <el-tag type="info">历史快照模式，仅供查看</el-tag>
          </div>
        </div>
      </el-drawer>
  
      <!-- 下发弹窗（支持单个和整体下发） -->
      <el-dialog v-model="distributeDialogVisible" :title="currentDistributeGroup ? '整体下发' : '指标下发'" width="500px">
        <div class="distribute-dialog">
          <!-- 单个指标下发 -->
          <div v-if="currentDistributeItem" class="indicator-info">
            <p><strong>指标名称：</strong>{{ currentDistributeItem.name }}</p>
            <p><strong>任务类别：</strong>{{ currentDistributeItem.type2 }}任务</p>
            <p><strong>权重：</strong>{{ currentDistributeItem.weight }}</p>
          </div>
          <!-- 整体下发 -->
          <div v-else-if="currentDistributeGroup" class="indicator-info">
            <p><strong>任务名称：</strong>{{ currentDistributeGroup.taskContent }}</p>
            <p><strong>待下发指标数：</strong>{{ currentDistributeGroup.rows.filter(r => r.canWithdraw).length }} 个</p>
            <div class="indicator-list">
              <p><strong>包含指标：</strong></p>
              <ul>
                <li v-for="row in currentDistributeGroup.rows.filter(r => r.canWithdraw)" :key="row.id">{{ row.name }}</li>
              </ul>
            </div>
          </div>
          <el-form label-width="100px" style="margin-top: 20px;">
            <el-form-item label="下发目标">
              <el-select v-model="distributeTarget" multiple placeholder="选择下发目标部门（可多选）" style="width: 100%;">
                <el-option v-for="dept in functionalDepartments" :key="dept" :label="dept" :value="dept" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <el-button @click="closeDistributeDialog">取消</el-button>
          <el-button type="primary" @click="confirmDistribute">确认下发</el-button>
        </template>
      </el-dialog>

      <!-- 审计日志抽屉 -->
      <AuditLogDrawer
        v-model:visible="auditLogVisible"
        :indicator="currentAuditIndicator"
        @close="auditLogVisible = false"
      />
    </div>
  </template>
  
  <style scoped>
  /* ========================================
     StrategicTaskView 统一样式
     使用 colors.css 中定义的 CSS 变量
     Requirements: 2.1, 4.1, 5.1, 10.2
     ======================================== */
  
  /* 页面主容器 */
  .strategic-task-container {
    display: flex;
    gap: 0;
    height: calc(100vh - 200px);
    min-height: 500px;
    position: relative;
  }

  /* ========================================
     侧边栏样式 - 精致动态隐藏效果
     Editorial Elegance 设计风格
     ======================================== */

  /* 背景遮罩层 - 侧边栏展开时的半透明背景 */
  .sidebar-backdrop {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(26, 54, 93, 0.08) 0%,
      transparent 50%
    );
    opacity: 0;
    z-index: 5;
    pointer-events: none;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* 侧边栏展开时显示遮罩 */
  .strategic-task-container:has(.task-sidebar:hover) .sidebar-backdrop {
    opacity: 1;
  }

  /* 侧边栏主体 - 完全隐藏，只有箭头可见 */
  .task-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    width: 280px;
    height: 100%;
    background: var(--bg-white, #fff);
    border-radius: 0 12px 12px 0;
    padding: 0;
    border: 1px solid var(--border-color, #e2e8f0);
    border-left: none;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 200px);
    z-index: 25;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    overflow: hidden;
  }

  /* 展开箭头 - 固定在侧边栏右上角外侧 */
  .sidebar-arrow {
    position: absolute;
    right: -20px;
    top: 12px;
    width: 20px;
    height: 32px;
    background: var(--color-primary, #2c5282);
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 6px 6px 0;
    cursor: pointer;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    z-index: 30;
  }

  .sidebar-arrow:hover {
    background: var(--color-primary-dark, #1a365d);
    right: -22px;
    width: 22px;
  }

  /* 侧边栏展开状态 - 只响应箭头和侧边栏本身的hover */
  .task-sidebar:hover {
    transform: translateX(0);
  }

  /* 箭头在侧边栏展开时旋转 */
  .task-sidebar:hover .sidebar-arrow {
    transform: rotate(180deg);
    right: 0;
    border-radius: 6px 0 0 6px;
  }

  /* 侧边栏头部 */
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.6);
    background: linear-gradient(
      180deg,
      rgba(248, 250, 252, 0.8) 0%,
      transparent 100%
    );
  }

  .task-list-title {
    font-weight: 700;
    font-size: 15px;
    color: var(--text-main);
    letter-spacing: 0.02em;
    margin: 0;
    padding: 0;
    border: none;
  }

  .sidebar-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 8px;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #1a365d) 100%);
    color: white;
    font-size: 12px;
    font-weight: 600;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(44, 82, 130, 0.3);
  }
  
  /* 部门列表 */
  .task-list {
    list-style: none;
    padding: 12px 16px 16px;
    margin: 0;
    overflow-y: auto;
    flex: 1;
    scrollbar-width: thin;
    scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
  }

  .task-list::-webkit-scrollbar {
    width: 5px;
  }

  .task-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .task-list::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 3px;
  }

  .task-list::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.5);
  }

  /* 部门列表项 - 精致卡片风格 */
  .task-item {
    padding: 12px 14px;
    font-size: 13px;
    color: var(--text-regular);
    cursor: pointer;
    border-radius: 10px;
    margin-bottom: 6px;
    white-space: normal;
    line-height: 1.5;
    position: relative;
    transition:
      background 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      color 0.25s ease;
    border: 1px solid transparent;
  }

  .task-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 3px;
    height: 60%;
    background: var(--color-primary);
    border-radius: 0 2px 2px 0;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .task-item:hover {
    background: rgba(241, 245, 249, 0.8);
    transform: translateX(4px);
    color: var(--color-primary);
    border-color: rgba(226, 232, 240, 0.6);
  }

  .task-item:hover::before {
    transform: translateY(-50%) scaleY(1);
  }

  .task-item.active {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #1a365d) 100%);
    color: white;
    border-color: transparent;
    box-shadow:
      0 4px 12px rgba(44, 82, 130, 0.25),
      0 2px 4px rgba(44, 82, 130, 0.15);
    transform: translateX(4px);
  }

  .task-item.active::before {
    display: none;
  }
  
  /* ========================================
     右侧详情区域 - 统一卡片规范
     Requirements: 2.1, 2.2
     ======================================== */
  .task-detail {
    flex: 1;
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    padding: var(--spacing-2xl);
    margin-left: 24px; /* 为侧边栏箭头留出空间 */
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: box-shadow var(--transition-normal);
  }
  
  /* 表格行 hover 效果 - 使用实色背景 */
  :deep(.el-table__body tr) {
    transition: background var(--transition-fast);
  }
  
  :deep(.el-table__body tr:hover > td.el-table__cell) {
    background: #f0f7ff !important;
  }
  
  /* ========================================
     详情头部样式 - 统一页面头部规范
     Requirements: 5.1, 5.2, 5.3, 5.4
     ======================================== */
  .detail-header {
    margin-bottom: var(--spacing-2xl);
  }
  
  .task-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 var(--spacing-lg) 0;
  }
  
  .task-meta {
    background: var(--bg-page);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
  }
  
  .meta-row {
    font-size: 13px;
    margin-bottom: var(--spacing-sm);
    color: var(--text-regular);
  }
  
  .meta-row:last-child {
    margin-bottom: 0;
  }
  
  .meta-label {
    color: var(--text-secondary);
  }
  
  .meta-value {
    color: var(--text-main);
  }
  
  /* ========================================
     可编辑字段样式 - 增强双击编辑提示
     ======================================== */
  .editable {
    cursor: text;
    transition: all var(--transition-fast);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    display: inline-block;
    border: 1px dashed transparent;
  }
  
  .editable:hover {
    background: var(--bg-page);
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary);
  }
  
  .task-title.editable {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .editable-cell {
    cursor: text;
    border-radius: var(--radius-sm);
    padding: 2px var(--spacing-xs);
    transition: all var(--transition-fast);
    border: 1px dashed transparent;
    min-height: 24px;
    position: relative;
  }
  
  .editable-cell:hover {
    background: var(--bg-page);
    border-color: var(--border-light);
    box-shadow: inset 0 0 0 1px var(--border-color);
  }
  
  /* 双击编辑提示 tooltip */
  .editable-cell::after,
  .editable::after {
    content: '双击编辑';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--text-main);
    color: var(--bg-white);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 11px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-fast);
    z-index: 10;
  }
  
  .editable-cell:hover::after,
  .editable:hover::after {
    opacity: 0.9;
  }
  
  /* ========================================
     工具栏样式
     ======================================== */
  .indicator-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }
  
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }
  
  .section-title {
    font-weight: 600;
    font-size: 16px;
    color: var(--text-main);
  }
  
  /* 表格区域 */
  .table-container {
    flex: 1;
    overflow: auto;
  }
  
  /* 文字颜色类 */
  .text-orange {
    color: var(--color-warning);
    font-weight: 500;
  }
  
  .text-blue {
    color: var(--color-primary);
    font-weight: 500;
  }
  
  /* ========================================
     标签样式 - 统一标签间距
     Requirements: 9.1, 9.3
     ======================================== */
  .tags-wrapper {
    display: flex;
    gap: var(--spacing-sm);
  }
  
  /* 备注单元格样式 */
  .remark-cell {
    min-height: 24px;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }
  
  .remark-text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    line-height: 1.4;
    max-height: 2.8em;
    width: 100%;
  }
  
  /* 新增行 */
  .add-row {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-lg);
    background: var(--bg-page);
    border-radius: var(--radius-md);
    border: 1px dashed var(--border-color);
  }
  
  .add-form {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    align-items: center;
  }
  
  /* 里程碑输入行样式 */
  .milestone-input-row {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-sm);
    gap: var(--spacing-sm);
  }
  
  /* ========================================
     任务下发相关样式
     ======================================== */
  .task-assignment-panel {
    background: rgba(103, 194, 58, 0.1);
    border: 1px solid var(--color-primary-light);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }
  
  .assignment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .assignment-header h4 {
    margin: 0;
    color: var(--color-primary-dark);
    font-size: 14px;
    font-weight: 600;
  }
  
  .assignment-actions {
    display: flex;
    gap: var(--spacing-md);
  }
  
  .assignment-dialog .selected-indicators {
    background: var(--bg-page);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
  }
  
  .assignment-dialog .selected-indicators h4 {
    margin: 0 0 var(--spacing-md) 0;
    font-size: 14px;
    color: var(--text-regular);
  }
  
  .assignment-dialog .selected-indicators ul {
    margin: 0;
    padding-left: var(--spacing-xl);
    color: var(--text-secondary);
  }
  
  .assignment-dialog .selected-indicators li {
    margin-bottom: var(--spacing-xs);
    line-height: 1.4;
  }
  
  /* ========================================
     Excel风格样式 - 统一表格规范
     Requirements: 4.1, 4.2, 4.3, 4.4
     ======================================== */
  .excel-style {
    padding: 0 !important;
  }
  
  /* Excel标题头 - 统一页面头部规范 */
  .excel-header {
    background: linear-gradient(135deg, var(--bg-blue-light) 0%, rgba(64, 158, 255, 0.2) 100%);
    padding: var(--spacing-lg) var(--spacing-xl);
    border-bottom: 2px solid var(--color-primary);
  }
  
  .excel-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-primary-dark);
    text-align: center;
    margin: 0;
  }
  
  /* Excel工具栏 */
  .excel-toolbar {
    background: var(--bg-light);
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .excel-toolbar .toolbar-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  .excel-toolbar .toolbar-right {
    display: flex;
    align-items: center;
  }
  
  .update-time {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  /* Excel表格容器 */
  .excel-table-wrapper {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .table-container {
    flex: 1;
    overflow: auto;
  }
  
  /* 确保表格有最小宽度，防止列被压缩 */
  .excel-table-wrapper .unified-table {
    min-width: 1200px;
  }
  
  /* 确保表头不换行 */
  .excel-table-wrapper .unified-table :deep(.el-table__header) th .cell {
    white-space: nowrap;
  }
  
  /* 说明列文字换行 */
  .remark-text-wrap {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
  }
  
  /* 操作按钮容器 */
  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2px;
  }
  
  .action-buttons .el-button {
    padding: 4px 6px;
    font-size: 12px;
  }
  
  /* 批量操作列样式 */
  .unified-table :deep(.batch-column) {
    background-color: var(--bg-page) !important;
  }
  
  .unified-table :deep(.batch-column) .el-button {
    font-size: 12px;
  }
  
  /* ========================================
     统一表格样式 (el-table)
     Requirements: 4.1, 4.2, 4.3, 4.4
     ======================================== */
  .unified-table {
    width: 100%;
  }
  
  /* 禁用省略号 */
  .unified-table :deep(.no-ellipsis) .cell {
    overflow: visible !important;
    text-overflow: unset !important;
    white-space: nowrap !important;
  }
  
  .unified-table :deep(td.no-ellipsis) {
    overflow: visible !important;
  }
  
  .unified-table :deep(td.no-ellipsis .cell) {
    overflow: visible !important;
    text-overflow: unset !important;
    white-space: nowrap !important;
  }
  
  .unified-table :deep(.el-table__header th) {
    background: var(--bg-light) !important;
    color: var(--text-main);
    font-weight: 600;
    padding: var(--spacing-md) var(--spacing-lg);
  }
  
  .unified-table :deep(.el-table__body td) {
    padding: var(--spacing-md) var(--spacing-lg);
    color: var(--text-regular);
  }
  
  /* 斑马纹 */
  .unified-table :deep(.el-table__row--striped td) {
    background: var(--bg-page) !important;
  }
  
  /* 悬停效果 */
  .unified-table :deep(.el-table__body tr:hover > td) {
    background: rgba(64, 158, 255, 0.08) !important;
  }
  
  /* 合并单元格样式 */
  .unified-table :deep(td[rowspan]) {
    vertical-align: middle;
    background-color: var(--bg-light) !important;
  }
  
  .unified-table :deep(.el-table__body td) {
    border-right: 1px solid var(--border-color);
  }
  
  .unified-table :deep(.el-table__body td:last-child) {
    border-right: none;
  }
  
  .task-content-text {
    color: var(--text-main);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  /* Excel表格 - 统一表格样式 */
  .excel-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: var(--bg-white);
    font-size: 13px;
  }
  
  .excel-table thead {
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  /* 表头样式 - 使用统一背景色 */
  .excel-table th {
    background: var(--bg-light);
    color: var(--text-regular);
    font-weight: 600;
    padding: var(--spacing-md) var(--spacing-sm);
    border: 1px solid var(--border-color);
    text-align: center;
    white-space: nowrap;
  }
  
  .excel-table td {
    padding: var(--spacing-sm) var(--spacing-sm);
    border: 1px solid var(--border-color);
    vertical-align: top;
    line-height: 1.5;
    color: var(--text-regular);
  }
  
  /* 单元格对齐 */
  .cell-center {
    text-align: center;
    vertical-align: middle;
  }
  
  /* ========================================
     表格行样式 - 斑马纹和悬停效果
     Requirements: 4.2, 4.3
     ======================================== */
  .hover-row {
    transition: background-color var(--transition-fast);
  }
  
  /* 使用实色背景替代透明效果 */
  .hover-row:hover {
    background: #f0f7ff !important;
  }
  
  /* 斑马纹 - 偶数行 */
  .excel-table tbody tr:nth-child(even) {
    background-color: var(--bg-page);
  }
  
  /* 背景色类 */
  .bg-blue-light {
    background: var(--bg-blue-light) !important;
  }
  
  .bg-gray-light {
    background: var(--bg-light) !important;
  }
  
  .bg-red-light {
    background: rgba(245, 108, 108, 0.1) !important;
  }
  
  /* 文字样式 */
  .text-red {
    color: var(--color-danger);
  }
  
  .font-medium {
    font-weight: 500;
  }
  
  /* 列表样式 */
  .list-decimal {
    list-style: decimal;
    margin-left: var(--spacing-lg);
    padding: 0;
  }
  
  .list-decimal li {
    margin-bottom: var(--spacing-xs);
  }
  
  /* 新增行表单 */
  .add-row-form {
    background: rgba(64, 158, 255, 0.08);
    padding: var(--spacing-lg);
    border-top: 1px solid var(--color-primary-light);
  }
  
  .form-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-primary-dark);
    margin: 0 0 var(--spacing-lg) 0;
  }
  
  /* 新增行内联表单 */
  .add-row-inline {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    flex-wrap: wrap;
  }
  
  .form-field {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .form-field label {
    font-size: 13px;
    color: var(--text-regular);
    white-space: nowrap;
  }
  
  .form-actions {
    display: flex;
    gap: var(--spacing-sm);
    margin-left: auto;
  }
  
  /* Excel状态栏 */
  .excel-status-bar {
    background: var(--bg-light);
    padding: var(--spacing-sm) var(--spacing-lg);
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .status-left,
  .status-right {
    display: flex;
    align-items: center;
  }
  
  /* ========================================
     详情抽屉样式
     ======================================== */
  .detail-container {
    padding: 0 var(--spacing-xl);
  }
  
  .detail-header h3 {
    margin: 0 0 var(--spacing-md) 0;
    font-size: 18px;
    color: var(--text-main);
  }
  
  .detail-tags {
    display: flex;
    gap: var(--spacing-sm);
  }
  
  .detail-desc {
    margin-bottom: var(--spacing-2xl);
  }
  
  .divider {
    height: 1px;
    background: var(--border-color);
    margin: var(--spacing-2xl) 0;
  }
  
  .milestone-section h4 {
    font-size: 16px;
    color: var(--text-main);
    margin: 0 0 var(--spacing-lg) 0;
  }
  
  .timeline-card {
    padding: var(--spacing-md);
    background: var(--bg-page);
    border-radius: var(--radius-sm);
  }
  
  .timeline-header {
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: var(--text-main);
  }
  
  .action-text {
    color: var(--text-main);
  }
  
  .timeline-comment {
    margin-top: var(--spacing-sm);
    color: var(--text-regular);
    font-size: 13px;
  }

  /* 审计日志区域样式 */
  .audit-log-section {
    margin-top: var(--spacing-lg);
  }

  .audit-log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }

  .audit-log-header h4 {
    font-size: 16px;
    color: var(--text-main);
    margin: 0;
  }

  .audit-log-preview {
    background: var(--bg-page);
    padding: var(--spacing-md);
    border-radius: var(--radius-sm);
  }

  .audit-summary {
    margin: 0;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .audit-log-empty {
    background: var(--bg-page);
    padding: var(--spacing-md);
    border-radius: var(--radius-sm);
    text-align: center;
    color: var(--text-placeholder);
    font-size: 13px;
  }

  .detail-actions {
    margin-top: var(--spacing-2xl);
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
  }
  
  /* ========================================
     下发弹窗样式
     ======================================== */
  .distribute-dialog .indicator-info {
    background: var(--bg-page);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
  }
  
  .distribute-dialog .indicator-info p {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 14px;
    color: var(--text-regular);
  }
  
  .distribute-dialog .indicator-info p:last-child {
    margin-bottom: 0;
  }
  
  .distribute-dialog .indicator-list {
    margin-top: var(--spacing-md);
  }
  
  .distribute-dialog .indicator-list ul {
    margin: var(--spacing-sm) 0 0 0;
    padding-left: var(--spacing-xl);
    max-height: 150px;
    overflow-y: auto;
  }
  
  .distribute-dialog .indicator-list li {
    font-size: 13px;
    color: var(--text-regular);
    line-height: 1.8;
  }
  
  /* ========================================
     进度条样式 - 统一进度条规范
     Requirements: 10.1, 10.2
     ======================================== */
  .progress-cell {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    justify-content: center;
  }
  
  .progress-text {
    font-size: 12px;
    color: var(--text-regular);
    min-width: 35px;
  }
  
  /* ========================================
     Sticky 列样式 - 与审批中心保持一致
     ======================================== */
  .excel-table .sticky-col {
    position: sticky;
    background: var(--bg-white);
    z-index: 2;
  }
  
  .excel-table .sticky-col-first {
    right: 100px;
    min-width: 150px;
  }
  
  .excel-table .sticky-col-last {
    right: 0;
    min-width: 100px;
  }
  
  .excel-table thead .sticky-col {
    background: var(--bg-light);
    z-index: 11;
  }
  
  /* 滚动时显示阴影和边框 */
  .table-scroll.is-scrolling .sticky-col-first {
    box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1);
    border-left: 1px solid var(--border-color);
  }
  
  /* hover 时固定列背景 - 使用实色背景 */
  .hover-row:hover .sticky-col {
    background: #f0f7ff;
  }
  
  /* 确保表格容器支持sticky */
  .table-scroll {
    overflow-x: auto;
    overflow-y: auto;
  }
  
  /* 操作列按钮容器 */
  .excel-table .sticky-col-first,
  .excel-table .sticky-col-last {
    white-space: nowrap;
  }
  
  /* 整体下发按钮样式 */
  .excel-table .sticky-col-last .el-button {
    font-weight: 500;
  }
  
  /* 合并单元格样式优化 */
  .excel-table td[rowspan] {
    vertical-align: middle;
    background-color: var(--bg-white);
    font-weight: 500;
  }
  
  /* ========================================
     页面加载动画 - 统一动画效果
     Requirements: 6.1, 6.2, 6.3
     ======================================== */
  .page-fade-enter {
    animation: fadeIn var(--transition-slow) ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .card-animate {
    animation: slideUp 0.4s ease-out;
    animation-fill-mode: both;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* ========================================
     核心指标单元格样式 - 完整显示内容
     ======================================== */
  .indicator-name-cell {
    vertical-align: top;
  }
  
  .indicator-name-text {
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    display: block;
  }
  
  /* 战略任务带颜色样式 */
  .task-content-colored {
    font-weight: 500;
    cursor: default;
  }

  /* 核心指标名称带颜色样式（区分定性/定量） */
  .indicator-qualitative {
    color: var(--color-qualitative);
    font-weight: 500;
  }

  .indicator-quantitative {
    color: var(--color-quantitative);
    font-weight: 500;
  }
  </style>