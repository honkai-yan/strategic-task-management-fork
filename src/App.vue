<script setup lang="ts">
// 简化版本，仅用于测试基础功能
</script>

<template>
  <div class="app-container">
    <h1>战略考核系统</h1>
    <p>如果您看到这个页面，说明基础应用正在运行。</p>
    <router-view />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-page) 0%, var(--bg-light) 100%);
}

.app-header {
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-box {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-box {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
  line-height: 1.2;
}

.app-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-select {
  width: 140px;
}

.notification-badge {
  margin-right: 8px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 16px;
}

.role-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.dept-name {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 600;
}

.user-avatar {
  background: var(--color-primary);
  color: var(--bg-white);
  font-weight: 600;
  cursor: pointer;
}

.app-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.tab-nav {
  background: var(--bg-white);
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 24px;
  display: flex;
  gap: 8px;
  border: 2px solid var(--border-color);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--text-regular);
  font-weight: 500;
}

.tab-item:hover {
  background: var(--bg-page);
}

.tab-item.active {
  background: var(--color-primary);
  color: var(--bg-white);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.content-area {
  min-height: calc(100vh - 200px);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .tab-nav {
    flex-wrap: wrap;
  }

  .tab-item {
    flex: 1 1 45%;
  }

  .app-subtitle {
    display: none;
  }
}
</style>
