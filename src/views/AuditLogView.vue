<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Refresh, Document, User, Clock, Operation } from '@element-plus/icons-vue'
import { useAuditLogStore } from '@/stores/auditLog'
import type { AuditLogFilters, AuditLogItem, AuditAction, EntityType } from '@/types'
import dayjs from 'dayjs'

const auditLogStore = useAuditLogStore()

// 筛选条件
const filters = ref<AuditLogFilters>({
  operator: '',
  entityType: undefined,
  action: undefined,
  dateRange: undefined
})

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 详情弹窗
const showDetailDialog = ref(false)
const selectedLog = ref<AuditLogItem | null>(null)

// 操作类型选项
const actionOptions: { value: AuditAction; label: string }[] = [
  { value: 'create', label: '创建' },
  { value: 'update', label: '修改' },
  { value: 'delete', label: '删除' },
  { value: 'submit', label: '提交' },
  { value: 'approve', label: '审批通过' },
  { value: 'reject', label: '审批驳回' },
  { value: 'withdraw', label: '撤回' }
]

// 实体类型选项
const entityTypeOptions: { value: EntityType; label: string }[] = [
  { value: 'task', label: '战略任务' },
  { value: 'indicator', label: '指标' },
  { value: 'milestone', label: '里程碑' },
  { value: 'approval', label: '审批' }
]

// 查询结果
const filteredLogs = computed(() => {
  return auditLogStore.queryLogs(filters.value)
})

// 分页后的数据
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

// 获取操作类型标签
type TagType = 'success' | 'warning' | 'danger' | 'primary' | 'info'
const getActionTag = (action: AuditAction): { type: TagType; label: string } => {
  const map: Record<AuditAction, { type: TagType; label: string }> = {
    create: { type: 'success', label: '创建' },
    update: { type: 'warning', label: '修改' },
    delete: { type: 'danger', label: '删除' },
    submit: { type: 'primary', label: '提交' },
    approve: { type: 'success', label: '通过' },
    reject: { type: 'danger', label: '驳回' },
    withdraw: { type: 'info', label: '撤回' }
  }
  return map[action] || { type: 'info' as TagType, label: action }
}

// 获取实体类型标签
const getEntityTypeLabel = (type: EntityType) => {
  const map: Record<EntityType, string> = {
    task: '战略任务',
    indicator: '指标',
    milestone: '里程碑',
    approval: '审批'
  }
  return map[type] || type
}

// 格式化时间
const formatTime = (date: Date | string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 查看详情
const viewDetail = (log: AuditLogItem) => {
  selectedLog.value = log
  showDetailDialog.value = true
}

// 重置筛选
const resetFilters = () => {
  filters.value = {
    operator: '',
    entityType: undefined,
    action: undefined,
    dateRange: undefined
  }
  currentPage.value = 1
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 初始化模拟数据
onMounted(() => {
  // 添加一些模拟日志数据
  if (auditLogStore.logs.length === 0) {
    const mockLogs = [
      {
        entityType: 'indicator' as EntityType,
        entityId: '1',
        entityName: '本科生就业率',
        action: 'update' as AuditAction,
        operator: 'user1',
        operatorName: '张三',
        dataBefore: { progress: 60, status: '进行中' },
        dataAfter: { progress: 75, status: '进行中' }
      },
      {
        entityType: 'indicator' as EntityType,
        entityId: '2',
        entityName: '科研项目数量',
        action: 'submit' as AuditAction,
        operator: 'user2',
        operatorName: '李四',
        dataAfter: { progress: 100, status: '待审批' }
      },
      {
        entityType: 'approval' as EntityType,
        entityId: '3',
        entityName: '教学质量评估',
        action: 'approve' as AuditAction,
        operator: 'user3',
        operatorName: '王五',
        dataAfter: { status: '已通过', remark: '审批通过，数据准确' }
      }
    ]
    mockLogs.forEach(log => auditLogStore.logAction(log))
  }
})
</script>

<template>
  <div class="audit-log-view">
    <!-- 筛选工具栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" inline class="filter-form">
        <el-form-item label="操作人">
          <el-select v-model="filters.operator" placeholder="全部" clearable style="width: 120px">
            <el-option 
              v-for="op in auditLogStore.operators" 
              :key="op" 
              :label="op" 
              :value="op" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="实体类型">
          <el-select v-model="filters.entityType" placeholder="全部" clearable style="width: 120px">
            <el-option 
              v-for="opt in entityTypeOptions" 
              :key="opt.value" 
              :label="opt.label" 
              :value="opt.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" placeholder="全部" clearable style="width: 120px">
            <el-option 
              v-for="opt in actionOptions" 
              :key="opt.value" 
              :label="opt.label" 
              :value="opt.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="log-list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">操作日志</span>
          <span class="count">共 {{ filteredLogs.length }} 条记录</span>
        </div>
      </template>

      <el-table :data="paginatedLogs" stripe style="width: 100%">
        <el-table-column label="操作时间" width="180">
          <template #default="{ row }">
            <div class="time-cell">
              <el-icon><Clock /></el-icon>
              <span>{{ formatTime(row.operateTime) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="100">
          <template #default="{ row }">
            <div class="operator-cell">
              <el-icon><User /></el-icon>
              <span>{{ row.operatorName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionTag(row.action).type">
              {{ getActionTag(row.action).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实体类型" width="100">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">
              {{ getEntityTypeLabel(row.entityType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实体名称" prop="entityName" min-width="200" show-overflow-tooltip />
        <el-table-column label="变更摘要" min-width="200">
          <template #default="{ row }">
            <div v-if="row.changes && row.changes.length > 0" class="changes-summary">
              <span v-for="(change, idx) in row.changes.slice(0, 2)" :key="idx" class="change-item">
                {{ change.fieldLabel }}: 
                <span class="old-value">{{ change.oldValue }}</span>
                →
                <span class="new-value">{{ change.newValue }}</span>
              </span>
              <span v-if="row.changes.length > 2" class="more-changes">
                +{{ row.changes.length - 2 }}项
              </span>
            </div>
            <span v-else class="no-changes">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredLogs.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="操作详情" :width="600">
      <template v-if="selectedLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作时间">
            {{ formatTime(selectedLog.operateTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ selectedLog.operatorName }}
          </el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getActionTag(selectedLog.action).type">
              {{ getActionTag(selectedLog.action).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="实体类型">
            {{ getEntityTypeLabel(selectedLog.entityType) }}
          </el-descriptions-item>
          <el-descriptions-item label="实体名称" :span="2">
            {{ selectedLog.entityName }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 变更详情 -->
        <div v-if="selectedLog.changes && selectedLog.changes.length > 0" class="changes-detail">
          <h4>变更详情</h4>
          <el-table :data="selectedLog.changes" border>
            <el-table-column label="字段" prop="fieldLabel" width="120" />
            <el-table-column label="变更前">
              <template #default="{ row }">
                <span class="diff-old">{{ row.oldValue ?? '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="变更后">
              <template #default="{ row }">
                <span class="diff-new">{{ row.newValue ?? '-' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-dialog>
  </div>
</template>


<style scoped>
.audit-log-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  border-radius: 12px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.log-list-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.card-header .count {
  font-size: 14px;
  color: var(--text-secondary);
}

.time-cell,
.operator-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-regular);
}

.changes-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-item {
  font-size: 12px;
  color: var(--text-regular);
}

.old-value {
  color: var(--color-danger);
  text-decoration: line-through;
}

.new-value {
  color: var(--color-success);
  font-weight: 500;
}

.more-changes {
  font-size: 12px;
  color: var(--color-primary);
}

.no-changes {
  color: var(--text-placeholder);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.changes-detail {
  margin-top: 20px;
}

.changes-detail h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.diff-old {
  color: var(--color-danger);
  background: rgba(245, 108, 108, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.diff-new {
  color: var(--color-success);
  background: rgba(103, 194, 58, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
