<template>
  <div class="message-list">
    <div v-if="messages.length === 0" class="empty-state">
      <el-empty description="暂无消息" />
    </div>

    <div v-else class="messages">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message-item', { 'unread': !message.isRead }]"
        @click="handleMessageClick(message)"
      >
        <div class="message-header">
          <div class="message-type">
            <el-tag
              :type="getMessageTypeTag(message.type)"
              size="small"
            >
              {{ getMessageTypeLabel(message.type) }}
            </el-tag>
            <el-tag
              v-if="message.severity"
              :type="getSeverityTag(message.severity)"
              size="small"
              class="severity-tag"
            >
              {{ getSeverityLabel(message.severity) }}
            </el-tag>
          </div>
          <div class="message-time">
            {{ formatDateTime(message.createdAt) }}
          </div>
        </div>

        <div class="message-title">
          {{ message.title }}
        </div>

        <div class="message-content">
          {{ message.content }}
        </div>

        <div class="message-actions">
          <el-button
            v-if="!message.isRead"
            type="primary"
            size="small"
            @click.stop="markAsRead(message.id)"
          >
            标为已读
          </el-button>
          <el-button
            size="small"
            @click.stop="viewDetails(message)"
          >
            查看详情
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { formatDateTime } from '@/utils'
import type { Message, MessageType, AlertLevel } from '@/types'

interface Props {
  messages: Message[]
}

interface Emits {
  (e: 'read', messageId: string): void
  (e: 'view', message: Message): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getMessageTypeTag = (type: MessageType): string => {
  const tags: Record<MessageType, string> = {
    alert: 'danger',
    approval: 'warning',
    system: 'info'
  }
  return tags[type]
}

const getMessageTypeLabel = (type: MessageType): string => {
  const labels: Record<MessageType, string> = {
    alert: '预警',
    approval: '审批',
    system: '系统'
  }
  return labels[type]
}

const getSeverityTag = (severity: AlertLevel): string => {
  const tags: Record<AlertLevel, string> = {
    severe: 'danger',
    moderate: 'warning',
    normal: 'success'
  }
  return tags[severity]
}

const getSeverityLabel = (severity: AlertLevel): string => {
  const labels: Record<AlertLevel, string> = {
    severe: '严重',
    moderate: '一般',
    normal: '正常'
  }
  return labels[severity]
}

const handleMessageClick = (message: Message) => {
  if (!message.isRead) {
    markAsRead(message.id)
  }
  viewDetails(message)
}

const markAsRead = (messageId: string) => {
  emit('read', messageId)
}

const viewDetails = (message: Message) => {
  emit('view', message)
}
</script>

<style scoped>
.message-list {
  min-height: 300px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--bg-white);
}

.message-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-item.unread {
  border-left: 4px solid var(--color-primary);
  background: var(--bg-light);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-type {
  display: flex;
  gap: 8px;
  align-items: center;
}

.severity-tag {
  margin-left: 4px;
}

.message-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.message-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.message-content {
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.5;
  margin-bottom: 12px;
}

.message-actions {
  display: flex;
  gap: 8px;
}
</style>