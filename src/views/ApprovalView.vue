<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, Clock, Document, Check, Close, 
  RefreshLeft, Delete, Search, ArrowRight 
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useStrategicStore } from '@/stores/strategic'

// 接收视角角色（可选）
defineProps<{
  viewingRole?: string
}>()

// 使用共享 Store
const authStore = useAuthStore()
const strategicStore = useStrategicStore()

// ================== 1. 类型定义 (严谨性基础) ==================

// 审批状态枚举
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revoked'

interface AuditLog {
  timestamp: string
  action: string
  operator: string
  comment?: string
}

interface ApprovalItem {
  id: number
  title: string // 考核指标名称
  submitter: string // 提交人
  dept: string // 部门
  time: string // 提交时间
  type: '定量指标' | '定性指标' | '加分项'
  status: ApprovalStatus
  score: number // 申报分值
  auditLogs: AuditLog[] // 审批链路日志
}

// ================== 2. 模拟数据 ==================

const currentUser = computed(() => `${authStore.userDepartment}-${authStore.userName}` || '未登录用户')

// 待审批数据源
const pendingList = ref<ApprovalItem[]>([
  {
    id: 101,
    title: 'Q4 市场占有率提升计划',
    submitter: '李明',
    dept: '市场部',
    time: '2025-11-01 09:30',
    type: '定量指标',
    status: 'pending',
    score: 95,
    auditLogs: [{ timestamp: '2025-11-01 09:30', action: '提交', operator: '李明' }]
  },
  {
    id: 102,
    title: '数字化转型-中台建设',
    submitter: '王强',
    dept: '技术部',
    time: '2025-11-02 14:15',
    type: '定性指标',
    status: 'pending',
    score: 88,
    auditLogs: [{ timestamp: '2025-11-02 14:15', action: '提交', operator: '王强' }]
  }
])

// 历史数据源
const historyList = ref<ApprovalItem[]>([
  {
    id: 99,
    title: '校园招聘专项执行',
    submitter: '赵云',
    dept: '人力资源部',
    time: '2025-10-28 10:00',
    type: '定性指标',
    status: 'approved',
    score: 100,
    auditLogs: [
      { timestamp: '2025-10-28 10:00', action: '提交', operator: '赵云' },
      { timestamp: '2025-10-29 11:00', action: '通过', operator: '张总', comment: '执行效果优秀' }
    ]
  }
])

// ================== 3. 业务逻辑 ==================

// --- 搜索逻辑 ---
const searchKeyword = ref('')
const filteredHistory = computed(() => {
  if (!searchKeyword.value) return historyList.value
  return historyList.value.filter(item => 
    item.title.includes(searchKeyword.value) || 
    item.submitter.includes(searchKeyword.value)
  )
})

// --- 驳回相关 ---
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const currentRejectItem = ref<ApprovalItem | null>(null)

// --- 详情抽屉 ---
const detailDrawerVisible = ref(false)
const currentDetail = ref<ApprovalItem | null>(null)

// 1. 审批通过
const handleApprove = (item: ApprovalItem) => {
  ElMessageBox.confirm(`确认同意 "${item.title}" 的考核申报？`, '审批确认', {
    confirmButtonText: '确认通过',
    cancelButtonText: '取消',
    type: 'success'
  }).then(() => {
    moveItemToHistory(item, 'approved', '同意申报')
    ElMessage.success('审批已通过')
  })
}

// 2. 打开驳回弹窗
const openRejectDialog = (item: ApprovalItem) => {
  currentRejectItem.value = item
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

// 确认驳回
const confirmReject = () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入驳回原因，严谨的考核需要反馈依据')
    return
  }
  if (currentRejectItem.value) {
    moveItemToHistory(currentRejectItem.value, 'rejected', rejectReason.value)
    rejectDialogVisible.value = false
    ElMessage.warning('已驳回该申请')
  }
}

// 核心逻辑：移动数据（待办 -> 历史）
const moveItemToHistory = (item: ApprovalItem, status: ApprovalStatus, comment: string) => {
  // 1. 从待办移除
  const index = pendingList.value.findIndex(i => i.id === item.id)
  if (index !== -1) pendingList.value.splice(index, 1)

  // 2. 更新状态和日志
  item.status = status
  item.auditLogs.push({
    timestamp: new Date().toLocaleString(),
    action: status === 'approved' ? '审批通过' : '审批驳回',
    operator: currentUser,
    comment: comment
  })

  // 3. 加入历史 (头部插入)
  historyList.value.unshift(item)
}

// 3. 撤回 (History -> Pending)
// 场景：审批错了，或者想重新写评语。
const handleRevoke = (item: ApprovalItem) => {
  ElMessageBox.confirm(
    '撤回后，该单据将重新回到“待我审批”列表，且对方不可见当前审批结果。是否继续？', 
    '撤回操作', 
    { type: 'warning' }
  ).then(() => {
    // 1. 从历史移除
    const index = historyList.value.findIndex(i => i.id === item.id)
    if (index !== -1) historyList.value.splice(index, 1)

    // 2. 更新状态
    item.status = 'pending'
    item.auditLogs.push({
      timestamp: new Date().toLocaleString(),
      action: '操作撤回',
      operator: currentUser,
      comment: '审批人执行撤回操作'
    })

    // 3. 回到待办
    pendingList.value.unshift(item)
    ElMessage.info('已撤回至待审批列表')
  })
}

// 4. 删除记录
// 场景：清理无意义的历史记录（通常建议做软删除，此处做物理删除演示）
const handleDelete = (item: ApprovalItem) => {
  ElMessageBox.confirm(
    '删除后将无法恢复，且审计日志中将保留删除痕迹。确定删除？', 
    '高风险操作', 
    { confirmButtonText: '彻底删除', confirmButtonClass: 'el-button--danger', type: 'error' }
  ).then(() => {
    const index = historyList.value.findIndex(i => i.id === item.id)
    if (index !== -1) {
      historyList.value.splice(index, 1)
      ElMessage.success('记录已删除')
    }
  })
}

// 5. 查看详情
const handleViewDetail = (item: ApprovalItem) => {
  currentDetail.value = item
  detailDrawerVisible.value = true
}

// 辅助：状态颜色映射
const getStatusTag = (status: string) => {
  const map: any = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    revoked: 'info'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: any = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    revoked: '已撤回'
  }
  return map[status]
}
</script>

<template>
  <div class="approval-view">

    <!-- 模块一：待我审批 (保持卡片式，强调当前任务) -->
    <div class="approval-card pending-section">
      <div class="card-header-row">
        <h3 class="card-title">
          待我审批 
          <span class="badge" v-if="pendingList.length > 0">{{ pendingList.length }}</span>
        </h3>
        <div class="header-desc">请严格依据《年度战略考核标准》进行核定</div>
      </div>

      <div v-if="pendingList.length === 0" class="empty-state-mini">
        <el-icon><Check /></el-icon>
        <span>当前无待处理事项，您已完成所有审批。</span>
      </div>

      <div class="approval-list">
        <div v-for="item in pendingList" :key="item.id" class="approval-item">
          <div class="item-left">
            <div class="item-main-info">
              <h4 class="item-title">{{ item.title }}</h4>
              <el-tag :type="item.type === '定量指标' ? '' : 'warning'" effect="plain" size="small" class="type-tag">
                {{ item.type }}
              </el-tag>
            </div>
            <div class="item-sub-info">
              <span class="info-bit"><el-icon><User /></el-icon> {{ item.submitter }} ({{ item.dept }})</span>
              <span class="info-bit"><el-icon><Clock /></el-icon> {{ item.time }}</span>
              <span class="info-bit score">申报分值: <b>{{ item.score }}</b></span>
            </div>
          </div>
          
          <div class="item-actions">
            <el-button plain size="default" @click="handleViewDetail(item)">详情</el-button>
            <!-- 驳回按钮 -->
            <el-button type="danger" plain size="default" :icon="Close" @click="openRejectDialog(item)">
              驳回
            </el-button>
            <!-- 通过按钮 -->
            <el-button type="success" size="default" :icon="Check" @click="handleApprove(item)">
              通过
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 模块二：审批历史 (改为表格，便于追溯和管理) -->
    <div class="approval-card history-section">
      <div class="card-header-row">
        <h3 class="card-title">审批历史记录</h3>
        <div class="search-box">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索指标名称/提交人..." 
            :prefix-icon="Search"
            clearable
            style="width: 240px;"
          />
        </div>
      </div>

      <el-table :data="filteredHistory" style="width: 100%" :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
        <el-table-column prop="title" label="指标名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="submitter" label="提交人" width="120" />
        <el-table-column prop="time" label="提交时间" width="160" />
        <el-table-column label="最终状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small" effect="dark">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">查看</el-button>
            
            <!-- 撤回逻辑：允许管理员撤回自己做的决定，重新审批 -->
            <el-button 
              link 
              type="warning" 
              :icon="RefreshLeft"
              @click="handleRevoke(row)"
            >
              撤回
            </el-button>

            <el-button 
              link 
              type="danger" 
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        
        <template #empty>
          <div class="empty-state">
            <el-icon :size="48" class="empty-icon"><Document /></el-icon>
            <p>暂无历史审批记录</p>
          </div>
        </template>
      </el-table>
    </div>

    <!-- 弹窗：驳回原因 (严谨性要求) -->
    <el-dialog v-model="rejectDialogVisible" title="审批驳回" width="400px">
      <div class="dialog-content">
        <p style="margin-bottom: 10px; color: #606266;">请填写驳回原因，该内容将反馈给提交人：</p>
        <el-input
          v-model="rejectReason"
          type="textarea"
          rows="3"
          placeholder="例如：数据佐证不足，请补充附件后重新提交..."
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmReject">确认驳回</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 抽屉：查看详情 & 审计追踪 -->
    <el-drawer v-model="detailDrawerVisible" title="考核指标详情追溯" size="40%">
      <div v-if="currentDetail" class="detail-container">
        <!-- 基础信息 -->
        <div class="detail-header">
          <h3>{{ currentDetail.title }}</h3>
          <div class="detail-tags">
            <el-tag size="small">{{ currentDetail.type }}</el-tag>
            <el-tag size="small" type="info">{{ currentDetail.dept }}</el-tag>
          </div>
        </div>

        <el-descriptions :column="1" border class="detail-desc">
          <el-descriptions-item label="提交人员">{{ currentDetail.submitter }}</el-descriptions-item>
          <el-descriptions-item label="申报分值">{{ currentDetail.score }} 分</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentDetail.time }}</el-descriptions-item>
        </el-descriptions>

        <div class="divider"></div>

        <!-- 核心：审批链路日志 -->
        <h4>审批流转记录 (Audit Trail)</h4>
        <el-timeline style="margin-top: 20px; padding-left: 5px;">
          <el-timeline-item
            v-for="(log, index) in currentDetail.auditLogs"
            :key="index"
            :timestamp="log.timestamp"
            :type="index === currentDetail.auditLogs.length - 1 ? 'primary' : ''"
            placement="top"
          >
            <div class="timeline-card">
              <div class="timeline-header">
                <span class="action-text">{{ log.action }}</span>
                <span class="operator-text">操作人: {{ log.operator }}</span>
              </div>
              <div v-if="log.comment" class="timeline-comment">
                "{{ log.comment }}"
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-drawer>

  </div>
</template>

<style scoped>
/* 通用变量 */
:root {
  --bg-white: #ffffff;
  --text-main: #303133;
  --text-secondary: #909399;
  --border-color: #ebeef5;
}

.approval-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 卡片容器 */
.approval-card {
  background: var(--bg-white);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border-color); /* 稍微减淡边框 */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.pending-section { border-top: 4px solid #E6A23C; /* 待办用橙色顶部条强调 */ }
.history-section { border-top: 4px solid #909399; }

/* 头部样式 */
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f6fc;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  background: #F56C6C;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: normal;
}

.header-desc { font-size: 13px; color: var(--text-secondary); }

/* 待审批列表项 */
.approval-list { display: flex; flex-direction: column; gap: 16px; }

.approval-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fcfcfc;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s;
}

.approval-item:hover {
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border-color: #c0c4cc;
}

.item-main-info { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.item-title { font-size: 16px; font-weight: 600; margin: 0; color: #303133; }
.type-tag { font-weight: normal; }

.item-sub-info {
  display: flex; gap: 24px; font-size: 13px; color: #606266;
}

.info-bit { display: flex; align-items: center; gap: 6px; }
.info-bit.score { color: #409EFF; }

.item-actions { display: flex; gap: 12px; }

/* 空状态 */
.empty-state-mini {
  padding: 30px;
  text-align: center;
  color: #67C23A;
  background: #f0f9eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 0; color: var(--text-secondary);
}
.empty-icon { opacity: 0.5; margin-bottom: 8px; }

/* 抽屉内样式 */
.detail-header { margin-bottom: 20px; }
.detail-header h3 { margin: 0 0 10px 0; }
.detail-tags { display: flex; gap: 8px; }
.detail-desc { margin-bottom: 24px; }
.divider { height: 1px; background: #ebeef5; margin: 24px 0; }

.timeline-card {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}
.timeline-header { font-weight: bold; display: flex; justify-content: space-between; font-size: 14px; }
.operator-text { font-weight: normal; color: #909399; font-size: 12px; }
.timeline-comment { margin-top: 8px; color: #606266; font-size: 13px; font-style: italic; }
</style>
