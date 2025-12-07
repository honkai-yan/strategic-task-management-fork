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
      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部消息" name="all">
          <MessageList :messages="allMessages" @read="handleMessageRead" />
        </el-tab-pane>
        <el-tab-pane label="预警通知" name="alerts">
          <MessageList :messages="alertMessages" @read="handleMessageRead" />
        </el-tab-pane>
        <el-tab-pane label="审批通知" name="approvals">
          <MessageList :messages="approvalMessages" @read="handleMessageRead" />
        </el-tab-pane>
        <el-tab-pane label="系统通知" name="system">
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

const activeTab = ref('all')
const messages = ref<Message[]>([])

// Mock data - replace with actual API calls
const mockMessages: Message[] = [
  {
    id: '1',
    type: 'alert',
    title: '严重预警',
    content: '指标"学生就业率"完成率低于60%，请及时关注',
    severity: 'severe',
    recipientId: 'user1',
    isRead: false,
    createdAt: new Date('2024-01-15T10:30:00'),
    relatedId: 'indicator1'
  },
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
  // Initialize with mock data
  messages.value = mockMessages
})
</script>

<style scoped>
.message-center {
  padding: 24px;
  background: var(--bg-white);
  border-radius: 12px;
  min-height: calc(100vh - 200px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
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
  gap: 12px;
}

.message-content {
  min-height: 400px;
}
</style>