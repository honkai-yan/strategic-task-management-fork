<script setup lang="ts">
/**
 * 指标下发与审批页面（职能部门专用）
 * 功能：接收战略指标 → 拆分子指标 → 下发给学院 → 审批学院提交
 */
import { ref, computed } from 'vue'
import { Plus, Promotion, Check, Close, View, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { StrategicIndicator } from '@/types'
import { useStrategicStore } from '@/stores/strategic'
import { useAuthStore } from '@/stores/auth'
import { useTimeContextStore } from '@/stores/timeContext'
import { getAllColleges } from '@/config/departments'
import AuditLogDrawer from '@/components/task/AuditLogDrawer.vue'

// Stores
const strategicStore = useStrategicStore()
const authStore = useAuthStore()
const timeContext = useTimeContextStore()

// 当前用户部门
const currentDept = computed(() => authStore.userDepartment || '')

// 只读模式
const isReadOnly = computed(() => timeContext.isReadOnly)

// 获取所有学院
const colleges = getAllColleges()

// 当前选中的战略指标
const selectedStrategicIndicator = ref<StrategicIndicator | null>(null)

// 搜索关键词
const searchKeyword = ref('')

// 审计日志
const auditLogVisible = ref(false)
const currentAuditIndicator = ref<StrategicIndicator | null>(null)

// 下发弹窗
const distributeDialogVisible = ref(false)
const distributeForm = ref({
  name: '',
  targetColleges: [] as string[],
  weight: 10,
  targetValue: 100,
  unit: '%',
  remark: ''
})

// 获取分配给当前部门的战略指标（一级指标）
const strategicIndicators = computed(() => {
  return strategicStore.indicators.filter(i =>
    i.isStrategic &&
    i.ownerDept === '战略发展部' &&
    (i.responsibleDept === currentDept.value || !i.responsibleDept)
  )
})

// 当前部门下发的子指标（二级指标）
const distributedIndicators = computed(() => {
  return strategicStore.indicators.filter(i =>
    !i.isStrategic &&
    i.ownerDept === currentDept.value
  )
})

// 按父指标分组的子指标
const groupedDistributedIndicators = computed(() => {
  const groups: Record<string, StrategicIndicator[]> = {}
  distributedIndicators.value.forEach(i => {
    const parentId = i.parentIndicatorId || 'unknown'
    if (!groups[parentId]) groups[parentId] = []
    groups[parentId].push(i)
  })
  return groups
})

// 待审批的学院提交
const pendingApprovals = computed(() => {
  return distributedIndicators.value.filter(i => {
    const audit = i.statusAudit || []
    if (audit.length === 0) return false
    return audit[audit.length - 1].action === 'submit'
  })
})

// 筛选后的战略指标
const filteredStrategicIndicators = computed(() => {
  if (!searchKeyword.value) return strategicIndicators.value
  const keyword = searchKeyword.value.toLowerCase()
  return strategicIndicators.value.filter(i =>
    i.name.toLowerCase().includes(keyword) ||
    (i.taskContent && i.taskContent.toLowerCase().includes(keyword))
  )
})

// 选择战略指标
const selectStrategicIndicator = (indicator: StrategicIndicator) => {
  selectedStrategicIndicator.value = indicator
}

// 获取指标的子指标
const getChildIndicators = (parentId: string) => {
  return distributedIndicators.value.filter(i => i.parentIndicatorId === parentId)
}

// 打开下发弹窗
const openDistributeDialog = () => {
  if (!selectedStrategicIndicator.value) {
    ElMessage.warning('请先选择要下发的战略指标')
    return
  }
  distributeForm.value = {
    name: '',
    targetColleges: [],
    weight: 10,
    targetValue: 100,
    unit: '%',
    remark: ''
  }
  distributeDialogVisible.value = true
}

// 确认下发
const confirmDistribute = () => {
  if (!distributeForm.value.name) {
    ElMessage.warning('请输入子指标名称')
    return
  }
  if (distributeForm.value.targetColleges.length === 0) {
    ElMessage.warning('请选择下发目标学院')
    return
  }

  // 为每个学院创建子指标
  distributeForm.value.targetColleges.forEach(college => {
    const newIndicator: StrategicIndicator = {
      id: `${Date.now()}-${college}`,
      name: `${college}${distributeForm.value.name}`,
      isQualitative: selectedStrategicIndicator.value!.isQualitative,
      type1: selectedStrategicIndicator.value!.type1,
      type2: selectedStrategicIndicator.value!.type2,
      progress: 0,
      createTime: new Date().toLocaleDateString('zh-CN'),
      weight: distributeForm.value.weight,
      remark: distributeForm.value.remark,
      canWithdraw: false,
      taskContent: selectedStrategicIndicator.value!.taskContent,
      milestones: [],
      targetValue: distributeForm.value.targetValue,
      unit: distributeForm.value.unit,
      responsibleDept: college,
      responsiblePerson: '',
      status: 'active',
      isStrategic: false,
      ownerDept: currentDept.value,
      parentIndicatorId: selectedStrategicIndicator.value!.id.toString(),
      year: timeContext.currentYear,
      statusAudit: []
    }
    strategicStore.addIndicator(newIndicator)
  })

  ElMessage.success(`已成功下发到 ${distributeForm.value.targetColleges.length} 个学院`)
  distributeDialogVisible.value = false
}

// 审批通过
const handleApprove = (indicator: StrategicIndicator) => {
  ElMessageBox.confirm('确认通过该学院的进度提交？', '审批确认', {
    confirmButtonText: '通过',
    cancelButtonText: '取消',
    type: 'success'
  }).then(() => {
    strategicStore.addStatusAuditEntry(indicator.id.toString(), {
      operator: authStore.user?.id || 'admin',
      operatorName: authStore.user?.name || '管理员',
      operatorDept: currentDept.value,
      action: 'approve',
      comment: '审批通过'
    })
    ElMessage.success('审批通过')
  })
}

// 审批驳回
const handleReject = (indicator: StrategicIndicator) => {
  ElMessageBox.prompt('请输入驳回原因', '驳回确认', {
    confirmButtonText: '驳回',
    cancelButtonText: '取消',
    type: 'warning',
    inputValidator: (value) => {
      if (!value || !value.trim()) return '请输入驳回原因'
      return true
    }
  }).then(({ value }) => {
    strategicStore.addStatusAuditEntry(indicator.id.toString(), {
      operator: authStore.user?.id || 'admin',
      operatorName: authStore.user?.name || '管理员',
      operatorDept: currentDept.value,
      action: 'reject',
      comment: value
    })
    ElMessage.warning('已驳回')
  })
}

// 查看审计日志
const handleViewAuditLog = (indicator: StrategicIndicator) => {
  currentAuditIndicator.value = indicator
  auditLogVisible.value = true
}
</script>

<template>
  <div class="distribution-view">
    <!-- 只读提示 -->
    <el-alert
      v-if="isReadOnly"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    >
      当前处于历史快照模式（{{ timeContext.currentYear }}年），数据为只读状态
    </el-alert>

    <div class="distribution-layout">
      <!-- 左侧：战略指标列表 -->
      <div class="strategic-panel">
        <div class="panel-header">
          <h3>战略指标</h3>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索指标..."
            :prefix-icon="Search"
            clearable
            size="small"
            style="width: 180px"
          />
        </div>

        <div class="indicator-list">
          <div
            v-for="indicator in filteredStrategicIndicators"
            :key="indicator.id"
            :class="['indicator-item', { selected: selectedStrategicIndicator?.id === indicator.id }]"
            @click="selectStrategicIndicator(indicator)"
          >
            <div class="item-header">
              <el-tag :type="indicator.type2 === '发展性' ? 'primary' : 'success'" size="small">
                {{ indicator.type2 }}
              </el-tag>
              <span class="child-count">
                {{ getChildIndicators(indicator.id.toString()).length }} 个子指标
              </span>
            </div>
            <div class="item-name">{{ indicator.name }}</div>
            <div class="item-task">{{ indicator.taskContent }}</div>
            <el-progress
              :percentage="indicator.progress || 0"
              :stroke-width="6"
              :show-text="false"
              style="margin-top: 8px"
            />
          </div>

          <el-empty v-if="filteredStrategicIndicators.length === 0" description="暂无指标" />
        </div>
      </div>

      <!-- 右侧：下发配置与审批 -->
      <div class="distribution-panel">
        <!-- 选中指标详情 -->
        <div v-if="selectedStrategicIndicator" class="selected-indicator">
          <div class="detail-header">
            <h3>{{ selectedStrategicIndicator.name }}</h3>
            <el-button type="primary" :icon="Promotion" @click="openDistributeDialog" :disabled="isReadOnly">
              下发子指标
            </el-button>
          </div>

          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="战略任务">
              {{ selectedStrategicIndicator.taskContent }}
            </el-descriptions-item>
            <el-descriptions-item label="目标值">
              {{ selectedStrategicIndicator.targetValue }}{{ selectedStrategicIndicator.unit }}
            </el-descriptions-item>
            <el-descriptions-item label="权重">
              {{ selectedStrategicIndicator.weight }}
            </el-descriptions-item>
            <el-descriptions-item label="当前进度">
              {{ selectedStrategicIndicator.progress || 0 }}%
            </el-descriptions-item>
          </el-descriptions>

          <!-- 已下发的子指标 -->
          <div class="child-indicators">
            <h4>已下发子指标（{{ getChildIndicators(selectedStrategicIndicator.id.toString()).length }}）</h4>
            <el-table
              :data="getChildIndicators(selectedStrategicIndicator.id.toString())"
              size="small"
              border
              style="margin-top: 12px"
            >
              <el-table-column prop="responsibleDept" label="学院" width="140" />
              <el-table-column prop="name" label="指标名称" min-width="200" />
              <el-table-column prop="progress" label="进度" width="100" align="center">
                <template #default="{ row }">
                  <el-progress :percentage="row.progress || 0" :stroke-width="6" />
                </template>
              </el-table-column>
              <el-table-column label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag
                    v-if="row.statusAudit?.length && row.statusAudit[row.statusAudit.length - 1].action === 'submit'"
                    type="warning"
                    size="small"
                  >
                    待审批
                  </el-tag>
                  <el-tag v-else type="info" size="small">正常</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="handleViewAuditLog(row)">日志</el-button>
                  <template v-if="row.statusAudit?.length && row.statusAudit[row.statusAudit.length - 1].action === 'submit'">
                    <el-button link type="success" size="small" @click="handleApprove(row)" :disabled="isReadOnly">通过</el-button>
                    <el-button link type="danger" size="small" @click="handleReject(row)" :disabled="isReadOnly">驳回</el-button>
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <el-empty v-else description="请选择左侧战略指标" />

        <!-- 待审批汇总 -->
        <div v-if="pendingApprovals.length > 0" class="pending-section">
          <h4>
            <el-icon color="#E6A23C"><Check /></el-icon>
            待审批提交（{{ pendingApprovals.length }}）
          </h4>
          <div class="pending-list">
            <div v-for="item in pendingApprovals" :key="item.id" class="pending-item">
              <div class="pending-info">
                <span class="dept">{{ item.responsibleDept }}</span>
                <span class="name">{{ item.name }}</span>
              </div>
              <div class="pending-actions">
                <el-button type="success" size="small" @click="handleApprove(item)" :disabled="isReadOnly">通过</el-button>
                <el-button type="danger" size="small" @click="handleReject(item)" :disabled="isReadOnly">驳回</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 下发弹窗 -->
    <el-dialog v-model="distributeDialogVisible" title="下发子指标" width="500px">
      <el-form :model="distributeForm" label-width="100px">
        <el-form-item label="父级指标">
          <el-input :value="selectedStrategicIndicator?.name" disabled />
        </el-form-item>
        <el-form-item label="子指标名称" required>
          <el-input v-model="distributeForm.name" placeholder="例如：就业率达标" />
        </el-form-item>
        <el-form-item label="目标学院" required>
          <el-checkbox-group v-model="distributeForm.targetColleges">
            <el-checkbox v-for="college in colleges" :key="college" :label="college">
              {{ college }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="目标值">
          <el-input-number v-model="distributeForm.targetValue" :min="0" />
          <el-input v-model="distributeForm.unit" style="width: 80px; margin-left: 8px" placeholder="单位" />
        </el-form-item>
        <el-form-item label="权重">
          <el-input-number v-model="distributeForm.weight" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="distributeForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="distributeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDistribute">确认下发</el-button>
      </template>
    </el-dialog>

    <!-- 审计日志 -->
    <AuditLogDrawer
      v-model:visible="auditLogVisible"
      :indicator="currentAuditIndicator"
      @close="auditLogVisible = false"
    />
  </div>
</template>

<style scoped>
.distribution-view {
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.distribution-layout {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow: hidden;
}

/* 左侧面板 */
.strategic-panel {
  width: 360px;
  flex-shrink: 0;
  background: var(--bg-white, #fff);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-light, #f1f5f9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-main, #1e293b);
}

.indicator-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.indicator-item {
  padding: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.indicator-item:hover {
  border-color: var(--color-primary, #2c5282);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.indicator-item.selected {
  border-color: var(--color-primary, #2c5282);
  background: rgba(44, 82, 130, 0.05);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.child-count {
  font-size: 12px;
  color: var(--text-placeholder, #94a3b8);
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main, #1e293b);
  line-height: 1.4;
}

.item-task {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  margin-top: 4px;
}

/* 右侧面板 */
.distribution-panel {
  flex: 1;
  background: var(--bg-white, #fff);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
  padding: 20px;
  overflow-y: auto;
}

.selected-indicator {
  margin-bottom: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-main, #1e293b);
}

.child-indicators {
  margin-top: 24px;
}

.child-indicators h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: var(--text-main, #1e293b);
}

/* 待审批区域 */
.pending-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.pending-section h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: var(--text-main, #1e293b);
  display: flex;
  align-items: center;
  gap: 6px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-page, #f8fafc);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-warning);
}

.pending-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pending-info .dept {
  font-weight: 500;
  color: var(--text-main, #1e293b);
}

.pending-info .name {
  color: var(--text-secondary, #64748b);
  font-size: 13px;
}

.pending-actions {
  display: flex;
  gap: 8px;
}
</style>
