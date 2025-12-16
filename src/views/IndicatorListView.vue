<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, View, Download, Delete, ArrowDown, Promotion, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ElTable } from 'element-plus'
import type { StrategicTask, StrategicIndicator, Milestone } from '@/types'
import { useStrategicStore } from '@/stores/strategic'
import { useAuthStore } from '@/stores/auth'
import { getProgressStatus, getProgressColor, getStatusTagType } from '@/utils'

// --- 自定义指令，用于自动聚焦 ---
const vFocus = {
  mounted: (el: HTMLElement) => {
    const input = el.querySelector('input') || el.querySelector('textarea')
    if (input) {
      input.focus()
    } else {
      el.focus()
    }
  }
}

// 使用共享 Store
const strategicStore = useStrategicStore()
const authStore = useAuthStore()

// 接收父组件传递的选中角色
const props = defineProps<{
  selectedRole: string
}>()

// 判断是否可以编辑（只有战略发展部可以编辑）
const canEdit = computed(() => authStore.userRole === 'strategic_dept' || props.selectedRole === 'strategic_dept')

// 当前选中任务索引
const currentTaskIndex = ref(0)
const isAddingOrEditing = ref(false)

// 选中的部门
const selectedDepartment = ref('')

// 筛选条件
const filterType2 = ref('')  // 任务类型筛选
const filterType1 = ref('')  // 指标类型筛选
const filterDept = ref('')   // 责任部门筛选

// 重置筛选条件
const resetFilters = () => {
  filterType2.value = ''
  filterType1.value = ''
  filterDept.value = ''
}

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

// 从 Store 获取指标列表（带里程碑），按任务类型和战略任务分组排序，并应用筛选
const indicators = computed(() => {
  let list = strategicStore.indicators.map(i => ({
    ...i,
    id: Number(i.id)
  }))

  // 应用筛选条件
  if (filterType2.value) {
    list = list.filter(i => i.type2 === filterType2.value)
  }
  if (filterType1.value) {
    list = list.filter(i => i.type1 === filterType1.value)
  }
  if (filterDept.value) {
    list = list.filter(i => i.responsibleDept === filterDept.value)
  }

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

  // 战略任务列（第1列，index=1，选择框后面）合并
  if (columnIndex === 1) {
    const currentTask = row.taskContent || '未关联任务'

    // 计算当前任务在列表中的起始位置
    let startIndex = rowIndex
    while (startIndex > 0 && (dataList[startIndex - 1].taskContent || '未关联任务') === currentTask) {
      startIndex--
    }

    // 如果是该任务的第一行，计算合并行数
    if (startIndex === rowIndex) {
      let count = 1
      while (rowIndex + count < dataList.length && (dataList[rowIndex + count].taskContent || '未关联任务') === currentTask) {
        count++
      }
      return { rowspan: count, colspan: 1 }
    } else {
      // 不是第一行，隐藏该单元格
      return { rowspan: 0, colspan: 0 }
    }
  }
  return { rowspan: 1, colspan: 1 }
}

// 获取任务类型对应的颜色
const getTaskTypeColor = (type2: string) => {
  return type2 === '发展性' ? '#409EFF' : '#67C23A'
}

// 按类别筛选指标
const developmentIndicators = computed(() => indicators.value.filter(i => i.type2 === '发展性'))
const basicIndicators = computed(() => indicators.value.filter(i => i.type2 === '基础性'))

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

// 获取任务选项列表（从 Store 中的 tasks 获取）
const taskOptions = computed(() => strategicStore.tasks.map(t => ({
  value: t.title,
  label: t.title
})))

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
  if (editingIndicatorId.value === null) return

  if (editingIndicatorValue.value === null || editingIndicatorValue.value === undefined) {
    cancelIndicatorEdit()
    return
  }

  const updates: Partial<StrategicIndicator> = {}

  if (field === 'type1' || field === 'type2') {
    updates[field] = editingIndicatorValue.value
    if (field === 'type1') {
      updates.isQualitative = editingIndicatorValue.value === '定性'
    }
  } else {
    (updates as any)[field] = editingIndicatorValue.value
  }

  strategicStore.updateIndicator(row.id.toString(), updates)
  cancelIndicatorEdit()
}

// 取消指标编辑
const cancelIndicatorEdit = () => {
  editingIndicatorId.value = null
  editingIndicatorField.value = null
  editingIndicatorValue.value = null
}

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
}

const saveNewRow = () => {
  if (!newRow.value.taskContent) {
    ElMessage.warning('请先选择所属战略任务')
    return
  }
  if (!newRow.value.name) {
    ElMessage.warning('请输入指标名称')
    return
  }

  strategicStore.addIndicator({
    id: Date.now().toString(),
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
    taskContent: newRow.value.taskContent
  })
  ElMessage.success('指标添加成功')
  cancelAdd()
}

// 里程碑状态计算
const calculateMilestoneStatus = (indicator: StrategicIndicator): 'success' | 'warning' | 'exception' => {
  if (!indicator.milestones || indicator.milestones.length === 0) {
    return getProgressStatus(indicator.progress)
  }

  const currentDate = new Date()

  const hasOverdueMilestone = indicator.milestones.some(milestone => {
    const deadlineDate = new Date(milestone.deadline)
    return milestone.status === 'pending' && deadlineDate < currentDate
  })

  const hasUpcomingMilestone = indicator.milestones.some(milestone => {
    if (milestone.status === 'completed') return false
    const deadlineDate = new Date(milestone.deadline)
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilDeadline > 0 && daysUntilDeadline <= 30
  })

  if (hasOverdueMilestone) {
    return 'exception'
  } else if (hasUpcomingMilestone) {
    return 'warning'
  } else {
    return 'success'
  }
}

// 获取里程碑进度文本
const getMilestoneProgressText = (indicator: StrategicIndicator): string => {
  if (!indicator.milestones || indicator.milestones.length === 0) {
    return `当前进度: ${indicator.progress}%`
  }

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
    ElMessage.success(`成功下发${selectedIndicators.value.length}项指标到${assignmentTarget.value}`)
    showAssignmentDialog.value = false
    assignmentTarget.value = ''
    assignmentMethod.value = 'self'
  })
}

// 批量分解到职能部门（战略发展部专用）
const batchDistributeToDepartments = () => {
  const departments = ['教务处', '科研处', '人事处']
  const indicatorNames = selectedIndicators.value.map(ind => ind.name).join('、')

  ElMessageBox.confirm(
    `确认将以下指标分解到各职能部门？\n\n${indicatorNames}\n\n目标部门：${departments.join('、')}`,
    '确认分解',
    {
      confirmButtonText: '确定分解',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`成功分解${selectedIndicators.value.length}项指标到职能部门`)
    tableRef.value?.clearSelection()
  })
}

// 详情抽屉状态
const detailDrawerVisible = ref(false)
const currentDetail = ref<StrategicIndicator | null>(null)

// 查看详情
const handleViewDetail = (row: StrategicIndicator) => {
  currentDetail.value = row
  detailDrawerVisible.value = true
}

// 删除指标
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
  })
}

// 表格滚动状态
const tableScrollRef = ref<HTMLElement | null>(null)
const isTableScrolling = ref(false)

const handleTableScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const scrollLeft = target.scrollLeft
  const scrollWidth = target.scrollWidth
  const clientWidth = target.clientWidth
  isTableScrolling.value = scrollLeft < scrollWidth - clientWidth - 2
}
</script>


<template>
  <div class="indicator-list-container page-fade-enter">
    <!-- 页面头部 - 统一页面头部样式 (Requirements: 5.1, 5.2) -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">指标列表</h1>
        <p class="page-desc">管理和查看所有战略考核指标</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="addNewRow" v-if="canEdit">
          <el-icon><Plus /></el-icon>
          新增指标
        </el-button>
        <el-button>
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-wrapper">
      <!-- 筛选卡片 - 统一卡片样式 (Requirements: 2.1, 2.2, 8.1) -->
      <div class="filter-card card-base card-animate">
        <div class="card-body">
          <el-form :inline="true" class="filter-form">
            <el-form-item label="任务类型">
              <el-select v-model="filterType2" placeholder="全部类型" clearable style="width: 140px;">
                <el-option label="发展性" value="发展性" />
                <el-option label="基础性" value="基础性" />
              </el-select>
            </el-form-item>
            <el-form-item label="指标类型">
              <el-select v-model="filterType1" placeholder="全部类型" clearable style="width: 140px;">
                <el-option label="定性" value="定性" />
                <el-option label="定量" value="定量" />
              </el-select>
            </el-form-item>
            <el-form-item label="责任部门">
              <el-select v-model="filterDept" placeholder="全部部门" clearable style="width: 200px;">
                <el-option v-for="dept in functionalDepartments" :key="dept" :label="dept" :value="dept" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 指标表格卡片 - 统一表格样式 (Requirements: 4.1, 4.2, 4.3) -->
      <div class="table-card card-base card-animate" style="animation-delay: 0.1s;">
        <div class="card-header">
          <span class="card-title">指标列表</span>
          <span class="indicator-count">共 {{ indicators.length }} 条记录</span>
        </div>
        <div class="card-body table-body">
          <div ref="tableScrollRef" class="table-scroll" :class="{ 'is-scrolling': isTableScrolling }" @scroll="handleTableScroll">
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
              <el-table-column prop="taskContent" label="战略任务" min-width="200">
                <template #default="{ row }">
                  <el-tooltip :content="row.type2 === '发展性' ? '发展性任务' : '基础性任务'" placement="top">
                    <span
                      class="task-content-colored"
                      :style="{ color: getTaskTypeColor(row.type2) }"
                    >{{ row.taskContent || '未关联任务' }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="核心指标" min-width="280">
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
                    <span v-else class="indicator-name-text">{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="type1" label="指标类型" width="120" align="center">
                <template #default="{ row }">
                  <span @dblclick="handleIndicatorDblClick(row, 'type1')">
                    <el-select
                      v-if="editingIndicatorId === row.id && editingIndicatorField === 'type1'"
                      v-model="editingIndicatorValue"
                      size="small"
                      style="width: 90px"
                      @change="saveIndicatorEdit(row, 'type1')"
                      @visible-change="(visible: boolean) => !visible && saveIndicatorEdit(row, 'type1')"
                    >
                      <el-option label="定性" value="定性" />
                      <el-option label="定量" value="定量" />
                    </el-select>
                    <el-tag v-else :type="row.type1 === '定量' ? 'primary' : 'warning'" size="small" effect="plain">
                      {{ row.type1 }}
                    </el-tag>
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="weight" label="权重" width="80" align="center">
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
              <!-- 进度条 - 统一进度条样式 (Requirements: 10.1, 10.2) -->
              <el-table-column prop="progress" label="完成进度" width="180" align="center">
                <template #default="{ row }">
                  <div class="progress-cell">
                    <el-progress
                      :percentage="row.progress || 0"
                      :stroke-width="10"
                      :status="getProgressStatus(row.progress || 0)"
                      :show-text="false"
                      style="width: 100px;"
                    />
                    <span class="progress-text">{{ row.progress || 0 }}%</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="responsibleDept" label="责任部门" min-width="150">
                <template #default="{ row }">
                  <span class="dept-text">{{ row.responsibleDept || '未分配' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">
                    {{ row.status === 'active' ? '进行中' : row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" @click="handleViewDetail(row)">
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                  <el-button link type="danger" @click="handleDeleteIndicator(row)" v-if="canEdit">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 空状态 - 统一空状态样式 (Requirements: 7.1, 7.2, 7.3) -->
          <div v-if="indicators.length === 0" class="empty-state">
            <el-empty description="暂无指标数据">
              <el-button type="primary" @click="addNewRow" v-if="canEdit">
                <el-icon><Plus /></el-icon>
                新增指标
              </el-button>
            </el-empty>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增指标表单 - 统一表单样式 (Requirements: 8.1, 8.2, 8.3) -->
    <el-dialog
      v-model="isAddingOrEditing"
      title="新增指标"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px" class="add-form">
        <el-form-item label="战略任务" required>
          <el-select v-model="newRow.taskContent" placeholder="请选择所属战略任务" style="width: 100%;">
            <el-option
              v-for="task in taskOptions"
              :key="task.value"
              :label="task.label"
              :value="task.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="指标名称" required>
          <el-input v-model="newRow.name" placeholder="请输入指标名称" />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="newRow.type2" style="width: 100%;">
            <el-option label="发展性" value="发展性" />
            <el-option label="基础性" value="基础性" />
          </el-select>
        </el-form-item>
        <el-form-item label="指标类型">
          <el-select v-model="newRow.type1" style="width: 100%;">
            <el-option label="定性" value="定性" />
            <el-option label="定量" value="定量" />
          </el-select>
        </el-form-item>
        <el-form-item label="权重">
          <el-input v-model="newRow.weight" placeholder="请输入权重" type="number" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="newRow.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelAdd">取消</el-button>
        <el-button type="primary" @click="saveNewRow">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="指标详情"
      size="500px"
    >
      <div v-if="currentDetail" class="detail-container">
        <div class="detail-header">
          <h3>{{ currentDetail.name }}</h3>
          <div class="detail-tags">
            <el-tag :type="currentDetail.type2 === '发展性' ? 'primary' : 'success'" size="small">
              {{ currentDetail.type2 }}
            </el-tag>
            <el-tag :type="currentDetail.type1 === '定性' ? 'info' : 'warning'" size="small">
              {{ currentDetail.type1 }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-item">
            <span class="detail-label">权重：</span>
            <span class="detail-value">{{ currentDetail.weight }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">责任部门：</span>
            <span class="detail-value">{{ currentDetail.responsibleDept || '未分配' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">责任人：</span>
            <span class="detail-value">{{ currentDetail.responsiblePerson || '未分配' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">创建时间：</span>
            <span class="detail-value">{{ currentDetail.createTime }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="detail-section">
          <h4>完成进度</h4>
          <div class="progress-detail">
            <el-progress
              :percentage="currentDetail.progress || 0"
              :stroke-width="12"
              :status="getProgressStatus(currentDetail.progress || 0)"
            />
            <p class="progress-hint">{{ getMilestoneProgressText(currentDetail) }}</p>
          </div>
        </div>

        <div class="divider"></div>

        <div class="detail-section">
          <h4>备注说明</h4>
          <p class="detail-remark">{{ currentDetail.remark || '暂无备注' }}</p>
        </div>
      </div>
    </el-drawer>
  </div>
</template>


<style scoped>
/* ========================================
   页面容器 - 统一页面布局样式
   Requirements: 2.1, 3.1
   ======================================== */
.indicator-list-container {
  padding: var(--spacing-2xl);
  background: var(--bg-page);
  min-height: calc(100vh - 120px);
}

/* ========================================
   页面头部 - 统一页面头部样式
   Requirements: 5.1, 5.2, 5.3, 5.4
   ======================================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-2xl);
}

.header-left {
  display: flex;
  flex-direction: column;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-main);
}

.page-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: var(--spacing-sm);
}

.page-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

/* ========================================
   内容区域
   ======================================== */
.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* ========================================
   筛选卡片 - 统一卡片样式
   Requirements: 2.1, 2.2, 8.1
   ======================================== */
.filter-card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.filter-card .card-body {
  padding: var(--spacing-lg) var(--spacing-2xl);
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: var(--spacing-lg);
}

.filter-form :deep(.el-form-item__label) {
  color: var(--text-regular);
}

/* ========================================
   表格卡片 - 统一卡片和表格样式
   Requirements: 2.1, 2.2, 4.1, 4.2, 4.3
   ======================================== */
.table-card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.table-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-2xl);
  border-bottom: 1px solid var(--border-color);
}

.table-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.indicator-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.table-body {
  padding: 0;
}

.table-scroll {
  overflow-x: auto;
}

/* ========================================
   统一表格样式
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

.task-content-text {
  color: var(--text-main);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
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

.indicator-name-cell {
  width: 100%;
}

.indicator-name-text {
  font-weight: 500;
  color: var(--text-main);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  display: block;
}

.dept-text {
  color: var(--text-regular);
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
   空状态样式
   Requirements: 7.1, 7.2, 7.3
   ======================================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(var(--spacing-2xl) * 2);
  color: var(--text-secondary);
}

/* ========================================
   新增表单样式 - 统一表单样式
   Requirements: 8.1, 8.2, 8.3
   ======================================== */
.add-form :deep(.el-form-item__label) {
  color: var(--text-regular);
}

.add-form :deep(.el-input__wrapper),
.add-form :deep(.el-textarea__inner) {
  border-radius: var(--radius-sm);
}

.add-form :deep(.el-input__wrapper:focus-within),
.add-form :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
}

/* ========================================
   详情抽屉样式
   ======================================== */
.detail-container {
  padding: 0 var(--spacing-xl);
}

.detail-header {
  margin-bottom: var(--spacing-2xl);
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

.detail-section {
  margin-bottom: var(--spacing-xl);
}

.detail-section h4 {
  font-size: 15px;
  color: var(--text-main);
  margin: 0 0 var(--spacing-md) 0;
  font-weight: 600;
}

.detail-item {
  display: flex;
  margin-bottom: var(--spacing-sm);
  font-size: 14px;
}

.detail-label {
  color: var(--text-secondary);
  min-width: 80px;
}

.detail-value {
  color: var(--text-regular);
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: var(--spacing-xl) 0;
}

/* 战略任务带颜色样式 */
.task-content-colored {
  font-weight: 500;
  cursor: default;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  display: block;
}

.progress-detail {
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-md);
}

.progress-hint {
  margin: var(--spacing-sm) 0 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.detail-remark {
  margin: 0;
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.6;
}

/* ========================================
   动画效果 - 统一过渡动画
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
   标签样式 - 统一标签间距
   Requirements: 9.1, 9.3
   ======================================== */
.detail-tags :deep(.el-tag) {
  margin-right: 0;
}

/* ========================================
   响应式适配
   ======================================== */
@media (max-width: 768px) {
  .indicator-list-container {
    padding: var(--spacing-lg);
  }

  .page-header {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .page-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .filter-form {
    flex-direction: column;
  }

  .filter-form :deep(.el-form-item) {
    width: 100%;
    margin-right: 0;
  }
}
</style>
