<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, View, Download, Delete, ArrowDown, Promotion, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ElTable } from 'element-plus'
import type { StrategicTask, StrategicIndicator } from '@/types'
import { useStrategicStore } from '@/stores/strategic'
import { useAuthStore } from '@/stores/auth'

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

// 接收父组件传递的视角角色
const props = defineProps<{
  selectedRole?: string
  viewingRole?: string
}>()

// 当前选中任务索引
const currentTaskIndex = ref(0)
const isAddingOrEditing = ref(false)

// 选中的部门
const selectedDepartment = ref('')

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

// 从 Store 获取指标列表
const indicators = computed(() => strategicStore.indicators.map(i => ({
  ...i,
  id: Number(i.id)
})))

// 新增行数据
const newRow = ref({
  name: '',
  type1: '定性' as '定性' | '定量',
  type2: '发展性' as '发展性' | '基础性',
  weight: '',
  remark: ''
})

// 当前日期
const currentDate = '2025年12月5日'

// 编辑状态管理（任务详情）
const editingField = ref<string | null>(null)
const editingValue = ref('')

// 指标列表编辑状态
const editingIndicatorId = ref<number | null>(null)
const editingIndicatorField = ref<string | null>(null)
const editingIndicatorValue = ref<any>(null)

// 判断是否可以编辑（只有战略发展部可以编辑）
const canEdit = computed(() => authStore.userRole === 'strategic_dept' || props.selectedRole === 'strategic_dept')

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
  
  if (field === 'type1' || field === 'type2') {
      (row as any)[field] = editingIndicatorValue.value;
      // 更新 isQualitative 状态如果修改的是 type1
      if (field === 'type1') {
          row.isQualitative = editingIndicatorValue.value === '定性'
      }
  } else {
      (row as any)[field] = editingIndicatorValue.value
  }
  
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

const cancelAdd = () => {
  isAddingOrEditing.value = false
  newRow.value = { name: '', type1: '定性', type2: '发展性', weight: '', remark: '' }
}

const saveNewRow = () => {
  if (!newRow.value.name) return

  // 使用 Store 添加指标
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
    milestones: [],
    targetValue: 100,
    unit: '%',
    responsibleDept: authStore.userDepartment || '未分配',
    responsiblePerson: authStore.userName || '未分配',
    status: 'active',
    isStrategic: true
  })
  cancelAdd()
}

const getProgressStatus = (progress: number) => {
  if (progress >= 80) return 'success'
  if (progress >= 50) return 'warning'
  return 'exception'
}

const selectTask = (index: number) => {
  currentTaskIndex.value = index
}

// 表格选择变化处理
const handleSelectionChange = (selection: StrategicIndicator[]) => {
  selectedIndicators.value = selection
}

// 批量操作处理
const handleBatchOperation = (command: string) => {
  if (selectedIndicators.value.length === 0) {
    ElMessage.warning('请先选择要操作的指标')
    return
  }

  switch (command) {
    case 'distribute':
      batchDistribute()
      break
    case 'withdraw':
      batchWithdraw()
      break
    case 'delete':
      batchDelete()
      break
  }
}

// 批量下发
const batchDistribute = () => {
  selectedIndicators.value.forEach(indicator => {
    strategicStore.updateIndicator(indicator.id.toString(), { canWithdraw: false })
  })
  ElMessage.success(`已成功下发 ${selectedIndicators.value.length} 个指标`)
  tableRef.value?.clearSelection()
}

// 批量撤回
const batchWithdraw = () => {
  selectedIndicators.value.forEach(indicator => {
    strategicStore.updateIndicator(indicator.id.toString(), { canWithdraw: true })
  })
  ElMessage.success(`已成功撤回 ${selectedIndicators.value.length} 个指标`)
  tableRef.value?.clearSelection()
}

// 批量删除
const batchDelete = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedIndicators.value.length} 个指标吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    selectedIndicators.value.forEach(indicator => {
      strategicStore.deleteIndicator(indicator.id.toString())
    })
    ElMessage.success(`已成功删除 ${selectedIndicators.value.length} 个指标`)
    tableRef.value?.clearSelection()
  }).catch(() => {
    // 取消删除
  })
}
</script>

<template>
  <div class="strategic-task-container">
    <!-- 左侧任务列表 -->
    <aside class="task-sidebar">
      <div class="sidebar-header">
        <el-select v-model="selectedDepartment" placeholder="选择部门" size="default" style="width: 120px;">
          <el-option label="教务处" value="教务处" />
          <el-option label="科研处" value="科研处" />
          <el-option label="人事处" value="人事处" />
        </el-select>
        <el-button type="primary" size="default">
          <el-icon><Plus /></el-icon>
          发布任务
        </el-button>
      </div>

      <div class="task-list-title">任务列表</div>

      <ul class="task-list">
        <li
          v-for="(task, index) in taskList"
          :key="task.id"
          :class="['task-item', { active: currentTaskIndex === index }]"
          @click="selectTask(index)"
        >
          {{ task.title }}
        </li>
      </ul>
    </aside>

    <!-- 右侧详情区域 -->
    <section class="task-detail">
      <!-- 任务详情头部 -->
      <div class="detail-header">
        <h2
          class="task-title"
          :class="{ 'editable': canEdit }"
          @dblclick="handleDoubleClick('title', currentTask.title)"
        >
          <!-- 添加 v-focus -->
          <el-input
            v-if="editingField === 'title'"
            v-model="editingValue"
            v-focus
            @blur="saveEdit('title')"
            @keyup.enter="saveEdit('title')"
            @keyup.esc="cancelEdit"
          />
          <span v-else>{{ currentTask.title }}</span>
        </h2>
        <div class="task-meta">
          <div class="meta-row">
            <span class="meta-label">任务描述：</span>
            <span
              class="meta-value"
              :class="{ 'editable': canEdit }"
              @dblclick="handleDoubleClick('desc', currentTask.desc)"
            >
              <!-- 添加 v-focus -->
              <el-input
                v-if="editingField === 'desc'"
                v-model="editingValue"
                v-focus
                @blur="saveEdit('desc')"
                @keyup.enter="saveEdit('desc')"
                @keyup.esc="cancelEdit"
                type="textarea"
                :rows="2"
              />
              <span v-else>{{ currentTask.desc }}</span>
            </span>
          </div>
          <div class="meta-row">
            <span class="meta-label">创建时间：</span>
            <span
              class="meta-value"
              :class="{ 'editable': canEdit }"
              @dblclick="handleDoubleClick('createTime', currentTask.createTime)"
            >
              <el-input
                v-if="editingField === 'createTime'"
                v-model="editingValue"
                v-focus
                @blur="saveEdit('createTime')"
                @keyup.enter="saveEdit('createTime')"
                @keyup.esc="cancelEdit"
              />
              <span v-else>{{ currentTask.createTime }}</span>
            </span>
          </div>
          <div class="meta-row">
            <span class="meta-label">周期：</span>
            <span
              class="meta-value"
              :class="{ 'editable': canEdit }"
              @dblclick="handleDoubleClick('cycle', currentTask.cycle)"
            >
              <!-- 添加 v-focus -->
              <el-input
                v-if="editingField === 'cycle'"
                v-model="editingValue"
                v-focus
                @blur="saveEdit('cycle')"
                @keyup.enter="saveEdit('cycle')"
                @keyup.esc="cancelEdit"
              />
              <span v-else>{{ currentTask.cycle }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- 指标列表工具栏 -->
      <div class="indicator-toolbar">
        <div class="toolbar-left">
          <span class="section-title">指标列表</span>
          <el-button type="primary" link @click="addNewRow">
            <el-icon><Plus /></el-icon>
            新建指标
          </el-button>
          <el-dropdown @command="handleBatchOperation">
            <el-button type="primary" link>
              <el-icon><Download /></el-icon>
              批量操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="distribute">
                  <el-icon><Promotion /></el-icon>
                  批量下发
                </el-dropdown-item>
                <el-dropdown-item command="withdraw">
                  <el-icon><RefreshLeft /></el-icon>
                  批量撤回
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>
                  <span style="color: var(--el-color-danger);">批量删除</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 指标表格 -->
      <div class="table-container">
        <el-table :data="indicators" style="width: 100%" stripe>
          <el-table-column type="selection" width="50" />

          <el-table-column label="指标名称" min-width="240">
            <template #default="{ row }">
              <div
                @dblclick="handleIndicatorDblClick(row, 'name')"
                :class="{ 'editable-cell': canEdit }"
                class="indicator-name-cell"
              >
                <!-- 添加 v-focus，使用 textarea 支持多行显示 -->
                <el-input
                  v-if="editingIndicatorId === row.id && editingIndicatorField === 'name'"
                  v-model="editingIndicatorValue"
                  v-focus
                  @blur="saveIndicatorEdit(row, 'name')"
                  @keyup.esc="cancelIndicatorEdit"
                  size="small"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 5 }"
                  class="indicator-name-input"
                />
                <span v-else :class="row.isQualitative ? 'text-orange' : 'text-blue'" class="indicator-name-text">
                  {{ row.name }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="指标类型" width="150">
            <template #default="{ row }">
              <div class="tags-wrapper">
                <div @dblclick="handleIndicatorDblClick(row, 'type1')" :class="{'editable-cell': canEdit}">
                    <!-- el-select 比较特殊，automatic-dropdown 打开下拉，visible-change 处理关闭 -->
                    <!-- v-focus 确保点击外部能触发失焦/关闭 -->
                    <el-select 
                        v-if="editingIndicatorId === row.id && editingIndicatorField === 'type1'"
                        v-model="editingIndicatorValue"
                        v-focus
                        size="small"
                        style="width: 70px"
                        @visible-change="(val) => !val && saveIndicatorEdit(row, 'type1')"
                        @blur="saveIndicatorEdit(row, 'type1')"
                        automatic-dropdown
                    >
                        <el-option label="定性" value="定性" />
                        <el-option label="定量" value="定量" />
                    </el-select>
                    <el-tag v-else :type="row.type1 === '定性' ? 'warning' : 'primary'" size="small">
                        {{ row.type1 }}
                    </el-tag>
                </div>
                <div @dblclick="handleIndicatorDblClick(row, 'type2')" :class="{'editable-cell': canEdit}">
                    <el-select 
                        v-if="editingIndicatorId === row.id && editingIndicatorField === 'type2'"
                        v-model="editingIndicatorValue"
                        v-focus
                        size="small"
                        style="width: 80px"
                        @visible-change="(val) => !val && saveIndicatorEdit(row, 'type2')"
                        @blur="saveIndicatorEdit(row, 'type2')"
                        automatic-dropdown
                    >
                        <el-option label="发展性" value="发展性" />
                        <el-option label="基础性" value="基础性" />
                    </el-select>
                    <el-tag v-else :type="row.type2 === '发展性' ? 'success' : 'info'" size="small">
                        {{ row.type2 }}
                    </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="完成进度" width="150">
            <template #default="{ row }">
              <div @dblclick="handleIndicatorDblClick(row, 'progress')" :class="{'editable-cell': canEdit}" style="min-height: 24px; display: flex; align-items: center;">
                <!-- 添加 v-focus -->
                <el-input-number
                  v-if="editingIndicatorId === row.id && editingIndicatorField === 'progress'"
                  v-model="editingIndicatorValue"
                  v-focus
                  :min="0" :max="100"
                  size="small"
                  style="width: 120px"
                  @blur="saveIndicatorEdit(row, 'progress')"
                  @keydown.enter="saveIndicatorEdit(row, 'progress')"
                  controls-position="right"
                />
                <el-progress
                  v-else
                  :percentage="row.progress"
                  :status="getProgressStatus(row.progress)"
                  :stroke-width="8"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="150">
            <template #default="{ row }">
              <div
                @dblclick="handleIndicatorDblClick(row, 'createTime')"
                :class="{ 'editable-cell': canEdit }"
                style="min-height: 24px; display: flex; align-items: center;"
              >
                <el-input
                  v-if="editingIndicatorId === row.id && editingIndicatorField === 'createTime'"
                  v-model="editingIndicatorValue"
                  v-focus
                  size="small"
                  @blur="saveIndicatorEdit(row, 'createTime')"
                  @keyup.enter="saveIndicatorEdit(row, 'createTime')"
                  @keyup.esc="cancelIndicatorEdit"
                />
                <span v-else>{{ row.createTime }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="weight" label="权重" width="80">
            <template #default="{ row }">
              <div @dblclick="handleIndicatorDblClick(row, 'weight')" :class="{'editable-cell': canEdit}" style="min-height: 24px; display: flex; align-items: center;">
                <!-- 添加 v-focus -->
                <el-input
                   v-if="editingIndicatorId === row.id && editingIndicatorField === 'weight'"
                   v-model="editingIndicatorValue"
                   v-focus
                   size="small"
                   @blur="saveIndicatorEdit(row, 'weight')"
                   @keyup.enter="saveIndicatorEdit(row, 'weight')"
                />
                <span v-else>{{ row.weight }}%</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div
                @dblclick="handleIndicatorDblClick(row, 'remark')"
                :class="{'editable-cell': canEdit}"
                class="remark-cell"
                :title="row.remark"
              >
                 <!-- 添加 v-focus -->
                 <el-input
                   v-if="editingIndicatorId === row.id && editingIndicatorField === 'remark'"
                   v-model="editingIndicatorValue"
                   v-focus
                   @blur="saveIndicatorEdit(row, 'remark')"
                   @keyup.enter="saveIndicatorEdit(row, 'remark')"
                   size="small"
                   type="textarea"
                   :rows="2"
                   :autosize="{ minRows: 1, maxRows: 3 }"
                 />
                 <span v-else class="remark-text">{{ row.remark }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button v-if="row.canWithdraw" type="warning" link size="small">
                下发
              </el-button>
              <el-button v-else type="warning" link size="small">
                撤回
              </el-button>
              <el-button type="danger" link size="small">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 新增行 -->
        <div v-if="isAddingOrEditing" class="add-row">
          <el-form :inline="true" class="add-form">
            <el-form-item label="指标名称">
              <el-input v-model="newRow.name" placeholder="设置指标名称" style="width: 200px;" />
            </el-form-item>
            <el-form-item label="指标类型">
              <el-select v-model="newRow.type1" style="width: 90px;">
                <el-option label="定性" value="定性" />
                <el-option label="定量" value="定量" />
              </el-select>
              <el-select v-model="newRow.type2" style="width: 90px; margin-left: 8px;">
                <el-option label="发展性" value="发展性" />
                <el-option label="基础性" value="基础性" />
              </el-select>
            </el-form-item>
            <el-form-item label="权重">
              <el-input v-model="newRow.weight" placeholder="权重" style="width: 80px;" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="newRow.remark" placeholder="设置指标备注" style="width: 150px;" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveNewRow">完成</el-button>
              <el-button @click="cancelAdd">取消</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.strategic-task-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
  min-height: 500px;
}

/* 左侧任务列表 */
.task-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--bg-white);
  border-radius: var(--radius-lg, 12px);
  padding: var(--spacing-lg, 16px);
  border: 2px solid var(--border-color);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
  /* 自定义滚动条 */
  scrollbar-width: thin;
  scrollbar-color: var(--border-light) transparent;
}

.task-list::-webkit-scrollbar {
  width: 6px;
}

.task-list::-webkit-scrollbar-track {
  background: transparent;
}

.task-list::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb:hover {
  background: var(--border-color);
}

.sidebar-header {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.task-list-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-main);
  margin-bottom: 12px;
  padding-left: 4px;
}

.task-item {
  padding: var(--spacing-md, 12px) 10px;
  font-size: 13px;
  color: var(--text-regular);
  cursor: pointer;
  border-radius: var(--radius-md, 8px);
  margin-bottom: var(--spacing-xs, 4px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all var(--transition-normal, 0.25s);
}

.task-item:hover {
  background: var(--bg-page);
  transform: translateX(4px);
}

.task-item.active {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

/* 右侧详情区域 */
.task-detail {
  flex: 1;
  background: var(--bg-white);
  border-radius: var(--radius-lg, 12px);
  padding: var(--spacing-2xl, 24px);
  border: 2px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 表格行 hover 效果 */
:deep(.el-table__body tr) {
  transition: background var(--transition-fast, 0.15s);
}

:deep(.el-table__body tr:hover > td.el-table__cell) {
  background: rgba(64, 158, 255, 0.06) !important;
}

.detail-header {
  margin-bottom: 24px;
}

.task-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 16px 0;
}

.task-meta {
  background: var(--bg-page);
  padding: var(--spacing-lg, 16px);
  border-radius: var(--radius-md, 8px);
}

.meta-row {
  font-size: 13px;
  margin-bottom: 8px;
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

/* 可编辑字段样式 - 增强双击编辑提示 */
.editable {
  cursor: text;
  transition: all var(--transition-fast, 0.15s);
  padding: 4px 8px;
  border-radius: var(--radius-sm, 4px);
  display: inline-block;
  border: 1px dashed transparent;
}

.editable:hover {
  background: var(--bg-page);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.task-title.editable {
  padding: 8px 12px;
}

.editable-cell {
  cursor: text;
  border-radius: var(--radius-sm, 4px);
  padding: 2px 4px;
  transition: all var(--transition-fast, 0.15s);
  border: 1px dashed transparent;
  min-height: 24px;
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
  padding: 4px 8px;
  border-radius: var(--radius-sm, 4px);
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast, 0.15s);
  z-index: 10;
}

.editable-cell:hover::after,
.editable:hover::after {
  opacity: 0.9;
}

.editable-cell,
.editable {
  position: relative;
}

/* 指标工具栏 */
.indicator-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
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

.text-orange {
  color: var(--color-warning);
  font-weight: 500;
}

.text-blue {
  color: var(--color-primary);
  font-weight: 500;
}

.tags-wrapper {
  display: flex;
  gap: 6px;
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
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-page);
  border-radius: 8px;
  border: 1px dashed var(--border-color);
}

.add-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
</style>
