<template>
  <div class="message-center">
    <div class="page-header">
      <h2 class="page-title">消息中心</h2>
      <div class="header-actions">
        <el-button type="primary" @click="markAllAsRead">
          全部标为已读
        </el-button>
        <el-button @click="clearReadMessages">
          清除已读
        </el-button>
      </div>
    </div>

    <div class="message-content">
      <el-tabs v-model="activeTab" class="message-tabs">
        <el-tab-pane name="all">
          <template #label>
            <span class="tab-label">
              全部消息
              <el-badge v-if="unreadCount.all > 0" :value="unreadCount.all" :max="99" class="tab-badge" />
            </span>
          </template>
          <MessageList :messages="allMessages" @read="handleMessageRead" />
        </el-tab-pane>
        <el-tab-pane name="alerts">
          <template #label>
            <span class="tab-label">
              预警通知
              <el-badge v-if="unreadCount.alerts > 0" :value="unreadCount.alerts" :max="99" class="tab-badge" type="danger" />
            </span>
          </template>
          <MessageList :messages="alertMessages" @read="handleMessageRead" />
        </el-tab-pane>
        <el-tab-pane name="approvals">
          <template #label>
            <span class="tab-label">
              审批通知
              <el-badge v-if="unreadCount.approvals > 0" :value="unreadCount.approvals" :max="99" class="tab-badge" type="warning" />
            </span>
          </template>
          <MessageList :messages="approvalMessages" @read="handleMessageRead" />
        </el-tab-pane>
        <el-tab-pane name="system">
          <template #label>
            <span class="tab-label">
              系统通知
              <el-badge v-if="unreadCount.system > 0" :value="unreadCount.system" :max="99" class="tab-badge" type="info" />
            </span>
          </template>
          <MessageList :messages="systemMessages" @read="handleMessageRead" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { Message, MessageType } from '@/types'
import MessageList from '@/components/MessageList.vue'
import { useAuthStore } from '@/stores/auth'
import { useStrategicStore } from '@/stores/strategic'

// 使用共享 Store
const authStore = useAuthStore()
const strategicStore = useStrategicStore()

const activeTab = ref('all')
const messages = ref<Message[]>([])

// 根据 Store 数据生成预警消息
const generateAlertMessages = (): Message[] => {
  const alerts: Message[] = []
  
  // 获取逾期里程碑
  strategicStore.getOverdueMilestones.forEach((item, index) => {
    alerts.push({
      id: `alert-overdue-${index}`,
      type: 'alert',
      title: '里程碑逾期预警',
      content: `指标"${item.indicator.name}"的里程碑"${item.milestone.name}"已逾期，请及时处理`,
      severity: 'severe',
      recipientId: authStore.user?.id || 'user1',
      isRead: false,
      createdAt: new Date(),
      relatedId: item.indicator.id
    })
  })
  
  // 获取即将到期的里程碑
  strategicStore.getUpcomingMilestones.forEach((item, index) => {
    alerts.push({
      id: `alert-upcoming-${index}`,
      type: 'alert',
      title: '里程碑即将到期',
      content: `指标"${item.indicator.name}"的里程碑"${item.milestone.name}"即将到期，请注意进度`,
      severity: 'moderate',
      recipientId: authStore.user?.id || 'user1',
      isRead: false,
      createdAt: new Date(),
      relatedId: item.indicator.id
    })
  })
  
  // 获取进度低于50%的指标
  strategicStore.indicators.filter(i => i.progress < 50).forEach((indicator, index) => {
    alerts.push({
      id: `alert-progress-${index}`,
      type: 'alert',
      title: '进度预警',
      content: `指标"${indicator.name}"完成率仅${indicator.progress}%，低于预期`,
      severity: indicator.progress < 30 ? 'severe' : 'moderate',
      recipientId: authStore.user?.id || 'user1',
      isRead: false,
      createdAt: new Date(),
      relatedId: indicator.id
    })
  })
  
  return alerts
}

// Mock data - 结合 Store 数据
const mockMessages: Message[] = [
  {
    id: '2',
    type: 'approval',
    title: '审批通知',
    content: '您有新的审批任务待处理',
    recipientId: 'user1',
    isRead: false,
    createdAt: new Date('2024-01-15T09:15:00'),
    relatedId: 'approval1'
  },
  {
    id: '3',
    type: 'system',
    title: '系统更新',
    content: '系统将于今晚22:00-23:00进行维护升级',
    recipientId: 'user1',
    isRead: true,
    createdAt: new Date('2024-01-14T16:00:00')
  }
]

const allMessages = computed(() => messages.value)
const alertMessages = computed(() => messages.value.filter(msg => msg.type === 'alert'))
const approvalMessages = computed(() => messages.value.filter(msg => msg.type === 'approval'))
const systemMessages = computed(() => messages.value.filter(msg => msg.type === 'system'))

// 未读消息计数
const unreadCount = computed(() => ({
  all: messages.value.filter(msg => !msg.isRead).length,
  alerts: alertMessages.value.filter(msg => !msg.isRead).length,
  approvals: approvalMessages.value.filter(msg => !msg.isRead).length,
  system: systemMessages.value.filter(msg => !msg.isRead).length
}))

const handleMessageRead = (messageId: string) => {
  const message = messages.value.find(msg => msg.id === messageId)
  if (message) {
    message.isRead = true
  }
}

const markAllAsRead = () => {
  messages.value.forEach(msg => msg.isRead = true)
  ElMessage.success('已将所有消息标为已读')
}

const clearReadMessages = () => {
  const unreadCount = messages.value.filter(msg => !msg.isRead).length
  if (unreadCount === 0) {
    ElMessage.warning('没有已读消息可清除')
    return
  }

  messages.value = messages.value.filter(msg => !msg.isRead)
  ElMessage.success('已清除所有已读消息')
}

onMounted(() => {
  // 结合 Store 数据和 mock 数据初始化消息
  const alertMessages = generateAlertMessages()
  messages.value = [...alertMessages, ...mockMessages]
})
</script>

<style scoped>
.message-center {
  padding: var(--spacing-2xl, 24px);
  background: var(--bg-white);
  border-radius: var(--radius-lg, 12px);
  min-height: calc(100vh - 200px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2xl, 24px);
  padding-bottom: var(--spacing-lg, 16px);
  border-bottom: 1px solid var(--border-color);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-main);
}

.header-actions {
  display: flex;
  gap: var(--spacing-md, 12px);
}

.message-content {
  min-height: 400px;
}

/* Tab 标签样式 */
.tab-label {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm, 8px);
}

.tab-badge {
  margin-left: var(--spacing-xs, 4px);
}

.tab-badge :deep(.el-badge__content) {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 5px;
}

/* Tab 样式定制 */
.message-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  transition: all var(--transition-fast, 0.15s);
}

.message-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 2px;
}
</style>