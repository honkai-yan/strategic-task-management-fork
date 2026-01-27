import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import './unified-styles.css'
import './colors.css'
import App from './App.vue'
import { autoHealthCheck } from './utils/apiHealth'
import { performanceMonitor } from './utils/performance'

const app = createApp(App)
const pinia = createPinia()

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Use plugins
app.use(ElementPlus)
app.use(pinia)
app.use(router)

// Global error handling
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err)
  console.error('Error info:', info)
}

// Mount app
app.mount('#app')

// 初始化性能监控
// **Validates: Requirements 4.1.1, 4.1.2, 4.1.3, 4.1.4, 4.1.5**
performanceMonitor.init({
  enabled: true,
  consoleOutput: import.meta.env.DEV, // 开发环境在控制台输出
  reportInterval: 60000, // 每分钟上报一次
  sampleRate: 1.0, // 100% 采样
  // endpoint: '/api/v1/metrics/performance', // 可配置上报端点
})

// 开发环境下自动运行API健康检查
console.log('🚀 [Main] 应用已启动')
autoHealthCheck()
