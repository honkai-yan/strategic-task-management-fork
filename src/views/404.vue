<template>
  <div class="not-found">
    <div class="not-found-content">
      <!-- 动画 SVG 插画 -->
      <div class="illustration">
        <svg viewBox="0 0 400 300" class="not-found-svg">
          <!-- 背景圆形装饰 -->
          <circle cx="200" cy="150" r="120" fill="var(--color-primary-light)" class="bg-circle" />
          <circle cx="200" cy="150" r="80" fill="var(--bg-white)" class="inner-circle" />
          
          <!-- 404 文字 -->
          <text x="200" y="165" text-anchor="middle" class="error-code">404</text>
          
          <!-- 搜索图标动画 -->
          <g class="search-icon" transform="translate(280, 80)">
            <circle cx="0" cy="0" r="20" fill="none" stroke="var(--color-primary)" stroke-width="3" />
            <line x1="14" y1="14" x2="28" y2="28" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" />
          </g>
          
          <!-- 装饰元素 -->
          <circle cx="80" cy="60" r="8" fill="var(--color-warning)" class="dot dot-1" />
          <circle cx="320" cy="220" r="6" fill="var(--color-success)" class="dot dot-2" />
          <circle cx="60" cy="200" r="5" fill="var(--color-purple, #9333ea)" class="dot dot-3" />
        </svg>
      </div>

      <h1 class="title">页面走丢了</h1>
      <p class="subtitle">抱歉，您访问的页面不存在或已被移除</p>

      <div class="actions">
        <el-button type="primary" size="large" @click="router.push('/dashboard')">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button size="large" @click="router.back()">
          <el-icon><Back /></el-icon>
          返回上一页
        </el-button>
      </div>

      <!-- 快捷入口 -->
      <div class="quick-links">
        <span class="quick-label">快捷入口：</span>
        <el-button link type="primary" @click="router.push('/dashboard')">仪表盘</el-button>
        <el-button link type="primary" @click="router.push('/tasks')">战略任务</el-button>
        <el-button link type="primary" @click="router.push('/indicators')">指标列表</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HomeFilled, Back } from '@element-plus/icons-vue'

const router = useRouter()
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-page) 0%, var(--bg-light) 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.illustration {
  margin-bottom: 32px;
}

.not-found-svg {
  width: 100%;
  max-width: 320px;
  height: auto;
}

.error-code {
  font-size: 48px;
  font-weight: 800;
  fill: var(--color-primary);
}

/* 动画效果 */
.bg-circle {
  animation: pulse 3s ease-in-out infinite;
}

.inner-circle {
  animation: pulse 3s ease-in-out infinite 0.5s;
}

.search-icon {
  animation: float 2s ease-in-out infinite;
}

.dot {
  animation: bounce 1.5s ease-in-out infinite;
}

.dot-1 { animation-delay: 0s; }
.dot-2 { animation-delay: 0.3s; }
.dot-3 { animation-delay: 0.6s; }

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}

@keyframes float {
  0%, 100% { transform: translate(280px, 80px) rotate(0deg); }
  50% { transform: translate(280px, 70px) rotate(5deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 12px 0;
}

.subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 32px 0;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
}

.quick-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 响应式 */
@media (max-width: 480px) {
  .title { font-size: 24px; }
  .subtitle { font-size: 14px; }
  .actions { flex-direction: column; }
  .actions .el-button { width: 100%; }
}
</style>