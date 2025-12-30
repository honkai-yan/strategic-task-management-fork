<script setup lang="ts">
/**
 * 任务审批抽屉组件
 * 上方：待审批记录（一键通过/驳回）
 * 下方：审计日志时间线
 */
import { ref, computed } from 'vue'
import {
  Check,
  Close,
  Upload,
  Edit,
  Refresh,
  User,
  ChatDotRound,
  Document,
  Right,
  Promotion,
  Warning,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { StrategicIndicator, StatusAuditEntry } from '@/types'
import { useStrategicStore } from '@/stores/strategic'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  visible: boolean
  indicators: StrategicIndicator[]
  departmentName: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const strategicStore = useStrategicStore()
const authStore = useAuthStore()

// 计算 drawer 可见性
const drawerVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 待审批记录（只显示 pending 状态的指标）
const pendingApprovals = computed(() => {
  return props.indicators.filter(
    (indicator) => indicator.progressApprovalStatus === 'pending'
  )
})

// 汇总所有审计日志（按时间倒序）
const allAuditLogs = computed(() => {
  const logs: any[] = []
  props.indicators.forEach((indicator) => {
    if (indicator.statusAudit && indicator.statusAudit.length > 0) {
      indicator.statusAudit.forEach((entry) => {
        logs.push({
          ...entry,
          _indicatorName: indicator.name,
          _taskContent: indicator.taskContent,
        })
      })
    }
  })
  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})

// 统一驳回原因输入
const batchRejectReason = ref('')

// 一键审批通过所有
const handleBatchApprove = () => {
  if (pendingApprovals.value.length === 0) {
    ElMessage.warning('暂无待审批记录')
    return
  }

  const count = pendingApprovals.value.length
  const indicatorNames = pendingApprovals.value.map(i => i.name).join('、')

  ElMessageBox.confirm(
    `确认一键审批通过所有待审批记录？\n\n共 ${count} 条记录：\n${indicatorNames}`,
    '一键审批通过',
    {
      confirmButtonText: '确认通过',
      cancelButtonText: '取消',
      type: 'success',
    }
  ).then(() => {
    let successCount = 0

    pendingApprovals.value.forEach((indicator) => {
      // 更新指标进度
      strategicStore.updateIndicator(indicator.id.toString(), {
        progress: indicator.pendingProgress || indicator.progress,
        progressApprovalStatus: 'approved',
        pendingProgress: undefined,
        pendingRemark: undefined,
        pendingAttachments: undefined,
      })

      // 添加审计日志
      strategicStore.addStatusAuditEntry(indicator.id.toString(), {
        operator: authStore.userName || 'unknown',
        operatorName: authStore.userName || '未知用户',
        operatorDept: authStore.userDepartment || '战略发展部',
        action: 'approve',
        comment: '一键审批通过',
        previousProgress: indicator.progress,
        newProgress: indicator.pendingProgress || indicator.progress,
        previousStatus: 'pending_approval',
        newStatus: 'active',
      })

      successCount++
    })

    ElMessage.success(`已成功审批通过 ${successCount} 条记录`)
    emit('refresh')
  })
}

// 一键驳回所有
const handleBatchReject = () => {
  if (pendingApprovals.value.length === 0) {
    ElMessage.warning('暂无待审批记录')
    return
  }

  if (!batchRejectReason.value || !batchRejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }

  const count = pendingApprovals.value.length
  const indicatorNames = pendingApprovals.value.map(i => i.name).join('、')

  ElMessageBox.confirm(
    `确认一键驳回所有待审批记录？\n\n共 ${count} 条记录：\n${indicatorNames}\n\n驳回原因：${batchRejectReason.value}`,
    '一键驳回',
    {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    let successCount = 0

    pendingApprovals.value.forEach((indicator) => {
      // 设置驳回状态（保持原进度）
      strategicStore.updateIndicator(indicator.id.toString(), {
        progressApprovalStatus: 'rejected',
      })

      // 添加审计日志
      strategicStore.addStatusAuditEntry(indicator.id.toString(), {
        operator: authStore.userName || 'unknown',
        operatorName: authStore.userName || '未知用户',
        operatorDept: authStore.userDepartment || '战略发展部',
        action: 'reject',
        comment: batchRejectReason.value,
        previousProgress: indicator.progress,
        newProgress: indicator.pendingProgress || indicator.progress,
        previousStatus: 'pending_approval',
        newStatus: 'rejected',
      })

      successCount++
    })

    // 清空驳回原因
    batchRejectReason.value = ''

    ElMessage.info(`已驳回 ${successCount} 条记录`)
    emit('refresh')
  })
}

// 获取操作类型配置
const getActionConfig = (action: StatusAuditEntry['action']) => {
  const configs = {
    submit: { icon: Upload, color: '#409EFF', label: '提交进度', type: 'primary' as const },
    approve: { icon: Check, color: '#67C23A', label: '审批通过', type: 'success' as const },
    reject: { icon: Close, color: '#F56C6C', label: '审批驳回', type: 'danger' as const },
    revoke: { icon: Refresh, color: '#E6A23C', label: '撤回提交', type: 'warning' as const },
    update: { icon: Edit, color: '#909399', label: '更新进度', type: 'info' as const },
    distribute: { icon: Promotion, color: '#409EFF', label: '下发指标', type: 'primary' as const },
  }
  return configs[action] || configs.update
}

// 格式化时间
const formatTime = (timestamp: Date | string) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化相对时间
const formatRelativeTime = (timestamp: Date | string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 30) return `${diffDays}天前`
  return formatTime(timestamp)
}

// 关闭抽屉
const handleClose = () => {
  emit('close')
}
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="任务审批"
    direction="rtl"
    size="550px"
    :before-close="handleClose"
    class="task-approval-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <div class="header-title">
          <el-icon><Check /></el-icon>
          <span>任务审批</span>
        </div>
        <div class="header-subtitle">
          {{ departmentName }} - 待审批 {{ pendingApprovals.length }} 条
        </div>
      </div>
    </template>

    <div class="drawer-content">
      <!-- 待审批记录区域 -->
      <div class="pending-section">
        <div class="section-title">
          <el-icon><Warning /></el-icon>
          <span>待审批记录</span>
          <el-badge :value="pendingApprovals.length" :max="99" class="badge" />
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="pendingApprovals.length === 0"
          description="暂无待审批记录"
          :image-size="80"
        />

        <!-- 待审批卡片列表 -->
        <div v-else class="pending-list">
          <div
            v-for="indicator in pendingApprovals"
            :key="indicator.id"
            class="pending-card"
          >
            <!-- 指标信息 -->
            <div class="card-header">
              <div class="indicator-info">
                <el-icon><Document /></el-icon>
                <div class="info-text">
                  <div class="indicator-name">{{ indicator.name }}</div>
                  <div class="task-content">{{ indicator.taskContent }}</div>
                </div>
              </div>
              <el-tag type="warning" size="small">待审批</el-tag>
            </div>

            <!-- 进度变化 -->
            <div class="progress-change">
              <span class="label">进度变化：</span>
              <span class="from">{{ indicator.progress }}%</span>
              <el-icon class="arrow"><Right /></el-icon>
              <span class="to">{{ indicator.pendingProgress }}%</span>
            </div>

            <!-- 提交说明 -->
            <div v-if="indicator.pendingRemark" class="pending-remark">
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ indicator.pendingRemark }}</span>
            </div>
          </div>
        </div>

        <!-- 统一驳回原因输入 -->
        <div class="batch-reject-section">
          <div class="reject-label">驳回原因（一键驳回时必填）：</div>
          <el-input
            v-model="batchRejectReason"
            type="textarea"
            :rows="3"
            placeholder="请填写驳回原因，将应用于所有待审批记录..."
            class="batch-reject-input"
          />
        </div>

        <!-- 一键操作按钮 -->
        <div class="batch-actions">
          <el-button
            type="success"
            size="large"
            :icon="Check"
            @click="handleBatchApprove"
          >
            一键审批通过（{{ pendingApprovals.length }}条）
          </el-button>
          <el-button
            type="danger"
            size="large"
            :icon="Close"
            @click="handleBatchReject"
          >
            一键驳回（{{ pendingApprovals.length }}条）
          </el-button>
        </div>
      </div>

      <!-- 分隔线 -->
      <el-divider />

      <!-- 审计日志区域 -->
      <div class="audit-section">
        <div class="section-title">
          <el-icon><ChatDotRound /></el-icon>
          <span>审计日志</span>
          <span class="log-count">共 {{ allAuditLogs.length }} 条</span>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="allAuditLogs.length === 0"
          description="暂无审计日志"
          :image-size="80"
        />

        <!-- 时间线 -->
        <el-timeline v-else class="audit-timeline">
          <el-timeline-item
            v-for="(log, index) in allAuditLogs"
            :key="log.id + '-' + index"
            :timestamp="formatRelativeTime(log.timestamp)"
            :type="getActionConfig(log.action).type"
            :hollow="index !== 0"
            placement="top"
          >
            <div class="log-card">
              <!-- 指标信息 -->
              <div class="log-indicator-info">
                <el-icon><Document /></el-icon>
                <span class="indicator-name">{{ log._indicatorName }}</span>
                <span v-if="log._taskContent" class="task-name">{{
                  log._taskContent
                }}</span>
              </div>

              <!-- 操作标题 -->
              <div class="log-header">
                <el-tag
                  :type="getActionConfig(log.action).type"
                  size="small"
                  effect="dark"
                >
                  <div style="display: flex; align-items: center; gap: 4px">
                    <el-icon
                      ><component :is="getActionConfig(log.action).icon"
                    /></el-icon>
                    {{ getActionConfig(log.action).label }}
                  </div>
                </el-tag>
                <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              </div>

              <!-- 操作人信息 -->
              <div class="log-operator">
                <el-icon><User /></el-icon>
                <span class="operator-name">{{ log.operatorName }}</span>
                <span class="operator-dept">{{ log.operatorDept }}</span>
              </div>

              <!-- 进度变化 -->
              <div
                v-if="
                  log.previousProgress !== undefined &&
                  log.newProgress !== undefined
                "
                class="log-progress"
              >
                <span class="progress-label">进度变化:</span>
                <span class="progress-from">{{ log.previousProgress }}%</span>
                <el-icon class="progress-arrow"><Right /></el-icon>
                <span class="progress-to">{{ log.newProgress }}%</span>
              </div>

              <!-- 备注 -->
              <div v-if="log.comment" class="log-comment">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ log.comment }}</span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <span class="footer-info"
          >待审批 {{ pendingApprovals.length }} 条 · 历史记录
          {{ allAuditLogs.length }} 条</span
        >
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-drawer>
</template>


<style scoped>
.task-approval-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.drawer-header {
  width: 100%;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main, #1e293b);
}

.header-title .el-icon {
  color: var(--color-primary, #2c5282);
}

.header-subtitle {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  line-height: 1.4;
}

.drawer-content {
  padding: 20px;
  height: calc(100% - 60px);
  overflow-y: auto;
}

/* 区域标题 */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main, #1e293b);
  margin-bottom: 16px;
}

.section-title .el-icon {
  color: var(--color-primary, #2c5282);
}

.section-title .badge {
  margin-left: auto;
}

.section-title .log-count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary, #64748b);
}

/* 待审批区域 */
.pending-section {
  margin-bottom: 20px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pending-card {
  background: var(--bg-white, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.pending-card:hover {
  border-color: var(--color-primary, #2c5282);
  box-shadow: 0 2px 8px rgba(44, 82, 130, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.indicator-info {
  display: flex;
  gap: 10px;
  flex: 1;
}

.indicator-info .el-icon {
  color: var(--color-primary, #2c5282);
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-text {
  flex: 1;
}

.indicator-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main, #1e293b);
  line-height: 1.4;
  margin-bottom: 4px;
}

.task-content {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
}

.progress-change {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-page, #f8fafc);
  border-radius: 6px;
  margin-bottom: 12px;
}

.progress-change .label {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}

.progress-change .from {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-placeholder, #94a3b8);
}

.progress-change .arrow {
  color: var(--text-placeholder, #94a3b8);
  font-size: 12px;
}

.progress-change .to {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary, #2c5282);
}

.pending-remark {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: var(--text-regular, #475569);
  padding: 10px 12px;
  background: var(--bg-page, #f8fafc);
  border-radius: 6px;
  border-left: 3px solid var(--color-primary-light, #93c5fd);
  margin-bottom: 12px;
}

.pending-remark .el-icon {
  color: var(--color-primary, #2c5282);
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

/* 统一驳回原因区域 */
.batch-reject-section {
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-page, #f8fafc);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.reject-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main, #1e293b);
  margin-bottom: 8px;
}

.batch-reject-input {
  width: 100%;
}

/* 一键操作按钮 */
.batch-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.batch-actions .el-button {
  flex: 1;
}

/* 审计日志区域 */
.audit-section {
  margin-top: 20px;
}

.audit-timeline {
  padding-left: 4px;
}

.log-card {
  background: var(--bg-page, #f8fafc);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 4px;
}

.log-indicator-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--border-color, #e2e8f0);
}

.log-indicator-info .el-icon {
  color: var(--color-primary, #2c5282);
  font-size: 14px;
}

.log-indicator-info .indicator-name {
  font-weight: 500;
  color: var(--text-main, #1e293b);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-indicator-info .task-name {
  color: var(--text-placeholder, #94a3b8);
  font-size: 11px;
}

.log-indicator-info .task-name::before {
  content: '·';
  margin: 0 4px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.log-header .el-tag {
  width: fit-content;
}

.log-time {
  font-size: 12px;
  color: var(--text-placeholder, #94a3b8);
}

.log-operator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-regular, #475569);
  margin-bottom: 8px;
}

.log-operator .el-icon {
  color: var(--text-placeholder, #94a3b8);
  font-size: 14px;
}

.operator-name {
  font-weight: 500;
}

.operator-dept {
  color: var(--text-secondary, #64748b);
}

.operator-dept::before {
  content: '·';
  margin: 0 4px;
}

.log-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 8px;
  padding: 8px 10px;
  background: var(--bg-white, #fff);
  border-radius: 4px;
}

.progress-label {
  color: var(--text-secondary, #64748b);
}

.progress-from {
  color: var(--text-placeholder, #94a3b8);
}

.progress-arrow {
  color: var(--text-placeholder, #94a3b8);
  font-size: 12px;
}

.progress-to {
  color: var(--color-primary, #2c5282);
  font-weight: 600;
}

.log-comment {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: var(--text-regular, #475569);
  padding: 8px 10px;
  background: var(--bg-white, #fff);
  border-radius: 4px;
  border-left: 3px solid var(--color-primary-light, #93c5fd);
}

.log-comment .el-icon {
  color: var(--color-primary, #2c5282);
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

.drawer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.footer-info {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}

/* 滚动条样式 */
.drawer-content::-webkit-scrollbar {
  width: 6px;
}

.drawer-content::-webkit-scrollbar-track {
  background: transparent;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: var(--border-light, #e2e8f0);
  border-radius: 3px;
}

.drawer-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-color, #cbd5e1);
}
</style>
