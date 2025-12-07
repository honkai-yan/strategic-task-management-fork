<template>
  <div class="login-container" @mousemove="handleMouseMove">
    
    <!-- 1. 背景层 -->
    <div class="background-layer">
      <transition-group name="zoom-fade">
        <div 
          v-for="(img, index) in bgList" 
          v-show="currentIndex === index"
          :key="img.url"
          class="bg-slide"
          :style="{ backgroundImage: `url(${img.url})` }"
        ></div>
      </transition-group>
      <div class="strategic-grid"></div>
      <div class="bg-overlay"></div>
    </div>

    <!-- 2. 氛围层 (HUD Widgets) -->
    <div class="hud-layer" :style="parallaxStyle">
      <!-- 左侧：战略愿景 -->
      <div class="hud-card card-left">
        <div class="vision-icon"><el-icon><Trophy /></el-icon></div>
        <div class="vision-content">
          <transition name="slide-up" mode="out-in">
            <div :key="currentSloganIndex" class="slogan-wrapper">
              <h3 class="slogan-title">{{ slogans[currentSloganIndex].title }}</h3>
              <p class="slogan-desc">{{ slogans[currentSloganIndex].desc }}</p>
            </div>
          </transition>
          <div class="slider-dots">
            <span v-for="(s, i) in slogans" :key="i" class="dot" :class="{ active: i === currentSloganIndex }"></span>
          </div>
        </div>
      </div>

      <!-- 右侧：时间与进度 -->
      <div class="hud-card card-right">
        <div class="time-section">
          <div class="digital-clock">{{ currentTime }}</div>
          <div class="current-date">{{ currentDate }}</div>
        </div>
        <div class="progress-section">
          <div class="progress-label">
            <span>2025 年度战略进度</span>
            <span class="highlight-num">{{ yearProgress }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar" :style="{ width: `${yearProgress}%` }"></div>
          </div>
          <p class="progress-tip">Current Period: Q4 Strategic Sprint</p>
        </div>
      </div>
    </div>

    <!-- 3. 登录区域核心容器 -->
    <div class="login-content-wrapper">
      
      <!-- 主登录卡片 -->
      <div class="login-box glass-effect">
        <div class="login-header">
          <div class="logo-wrapper">
            <el-icon :size="36" color="#fff"><Aim /></el-icon>
          </div>
          <div class="header-text">
            <h1 class="app-title">战略指标管理系统</h1>
            <p class="app-subtitle">Strategic Indicator Management System</p>
          </div>
        </div>

        <div class="login-form-section">
          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large" @keyup.enter="handleLogin">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                class="custom-input"
                @input="resetErrorCount"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password class="custom-input" />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                :disabled="isLoginLocked"
                class="submit-btn"
                @click="handleLogin"
              >
                {{ loading ? '身份校验中...' : (isLoginLocked ? '账户已锁定' : '登 录') }}
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="forgot-password">
            <el-button type="text" @click="handleForgotPassword" class="forgot-link">忘记密码？</el-button>
          </div>

          <!-- 锁定状态提示 -->
          <div v-if="isLoginLocked" class="lock-warning">
            <el-alert
              title="账户已被临时锁定"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>由于多次登录失败，您的账户已被临时锁定。</p>
                <p>请检查用户名和密码，或联系管理员解锁。</p>
              </template>
            </el-alert>
          </div>

          <!-- 错误次数提示 -->
          <div v-else-if="loginErrorCount > 0" class="error-hint">
            <el-text type="danger" size="small">
              已失败 {{ loginErrorCount }} 次，剩余尝试次数：{{ remainingAttempts }}
            </el-text>
          </div>
        </div>

        <div class="login-footer">
          <div class="system-status">
            <span class="status-dot"></span> 
            <span>系统运行正常</span>
          </div>
          <div class="copyright">© 2024 Strategic Data Corp.</div>
        </div>
      </div>

      <!-- === 新增：地理位置悬浮条 (位于登录框下方) === -->
      <transition name="fade-slide">
        <div v-if="locationData.loaded" class="location-badge">
          <div class="location-icon">
            <div class="pulse-ring"></div>
            <el-icon><MapLocation /></el-icon>
          </div>
          <div class="location-text">
            <span class="loc-city">{{ locationData.city }}</span>
            <div class="loc-details">
              <span v-if="locationData.district" class="loc-district">{{ locationData.district }}</span>
              <span v-if="locationData.street" class="loc-street">{{ locationData.street }}</span>
              <span class="loc-ip">IP: {{ locationData.ip }}</span>
              <span v-if="locationData.accuracy" class="loc-accuracy">{{ locationData.accuracy }}</span>
            </div>
          </div>
        </div>
      </transition>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { User, Lock, Aim, Trophy, MapLocation } from '@element-plus/icons-vue'

// ================== 1. 核心逻辑 (保持不变) ==================
const slogans = [
  { title: '精准数据决策', desc: 'Precision Data-Driven Decisions' },
  { title: '全员协同增效', desc: 'Collaborative Efficiency Improvement' },
  { title: '聚焦战略核心', desc: 'Focus on Strategic Core' }
]
const currentSloganIndex = ref(0)
const currentTime = ref('')
const currentDate = ref('')
const yearProgress = ref(0)
const bgList = ref<{url: string}[]>([])
const currentIndex = ref(0)
let timer: any = null
let timeInterval: any = null
let sloganInterval: any = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-GB', { hour12: false })
  currentDate.value = now.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1)
  const total = endOfYear.getTime() - startOfYear.getTime()
  const current = now.getTime() - startOfYear.getTime()
  yearProgress.value = Number(((current / total) * 100).toFixed(6))
}

const mouseX = ref(0)
const mouseY = ref(0)
const handleMouseMove = (e: MouseEvent) => {
  const x = (e.clientX - window.innerWidth / 2) / 80 
  const y = (e.clientY - window.innerHeight / 2) / 80
  mouseX.value = x
  mouseY.value = y
}
const parallaxStyle = computed(() => ({ transform: `translate(${-mouseX.value}px, ${-mouseY.value}px)` }))

// ================== 2. 新增：地理位置逻辑 ==================
const locationData = reactive({
  loaded: false,
  city: '正在定位...',
  district: '',
  street: '',
  ip: '---.---.---.---',
  accuracy: '',
  coordinates: { latitude: 0, longitude: 0 }
})

// 高德地图API配置 - 请替换为您自己的API Key
const AMAP_KEY = '1a050f1e81c12b0a2c78167dc8feed9e'
const AMAP_SECURITY_KEY = '7cafd0736a072ed3a4ff47ffe4c73ecb'

// 获取浏览器原生地理位置（GPS精确位置）
const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理位置功能'))
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,  // 开启高精度定位
      timeout: 10000,             // 10秒超时
      maximumAge: 300000          // 5分钟内缓存有效
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

// 使用高德地图API进行逆地理编码（坐标转地址）
const reverseGeocoding = async (longitude: number, latitude: number): Promise<any> => {
  try {
    // 使用高德地图Web服务API
    const url = `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=${AMAP_KEY}&extensions=all`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === '1' && data.regeocode) {
      return data.regeocode
    } else {
      throw new Error(data.info || '地理编码失败')
    }
  } catch (error) {
    console.error('高德地图API调用失败:', error)
    throw error
  }
}

// 获取IP地址信息
const getIPInfo = async (): Promise<{ ip: string, city: string }> => {
  try {
    // 使用免费的IP查询API
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()

    return {
      ip: data.ip || '未知',
      city: data.city || '未知城市'
    }
  } catch (error) {
    console.error('IP查询失败:', error)
    return {
      ip: '获取失败',
      city: '未知城市'
    }
  }
}

// 主要的地理位置获取函数
const fetchLocation = async () => {
  try {
    // 1. 获取IP地址信息（作为备选）
    const ipInfo = await getIPInfo()
    locationData.ip = ipInfo.ip

    // 2. 尝试获取GPS精确位置
    try {
      const position = await getCurrentPosition()
      const { latitude, longitude, accuracy } = position.coords

      locationData.coordinates = { latitude, longitude }
      locationData.accuracy = `精度: ±${Math.round(accuracy)}米`

      // 3. 使用高德地图API解析详细地址
      if (AMAP_KEY !== '您的高德地图API_KEY') {
        try {
          const addressInfo = await reverseGeocoding(longitude, latitude)
          const { formatted_address, addressComponent } = addressInfo

          if (addressComponent) {
            locationData.city = `${addressComponent.province || ''} ${addressComponent.city || ''}`.trim()
            locationData.district = addressComponent.district || ''
            locationData.street = addressComponent.street || addressComponent.township || ''
          }
        } catch (amapError) {
          console.warn('高德地图API调用失败，使用基础信息:', amapError)
          // 如果高德API失败，使用IP定位的城市信息
          locationData.city = ipInfo.city
        }
      } else {
        // 如果没有配置API Key，使用IP定位
        locationData.city = ipInfo.city
        locationData.district = '需要配置地图API'
      }
    } catch (geoError) {
      console.warn('GPS定位失败，使用IP定位:', geoError)
      // 如果GPS定位失败（用户拒绝或设备不支持），使用IP定位
      locationData.city = ipInfo.city
      locationData.accuracy = 'IP定位'
    }

    locationData.loaded = true
  } catch (error) {
    console.error('地理位置获取完全失败:', error)
    locationData.city = '定位失败'
    locationData.ip = '获取失败'
    locationData.loaded = true
  }
}

// ================== 3. 登录逻辑 ==================
const loginForm = reactive({ username: '', password: '' })
const loading = ref(false)
const loginFormRef = ref<FormInstance>()

// 登录错误计数器
const loginErrorCount = ref(0)
const maxLoginAttempts = 7
let lockTimer: any = null

// 重置错误计数
const resetErrorCount = () => {
  loginErrorCount.value = 0
  if (lockTimer) {
    clearTimeout(lockTimer)
    lockTimer = null
  }
}

// 自动解锁定时器（5分钟后）
const startAutoUnlock = () => {
  if (lockTimer) clearTimeout(lockTimer)

  lockTimer = setTimeout(() => {
    resetErrorCount()
    ElMessage({
      message: '账户锁定已解除，请重新登录',
      type: 'success',
      duration: 3000
    })
  }, 5 * 60 * 1000) // 5分钟
}

// 检查是否超过最大尝试次数
const isLoginLocked = computed(() => loginErrorCount.value >= maxLoginAttempts)

// 获取剩余尝试次数
const remainingAttempts = computed(() => maxLoginAttempts - loginErrorCount.value)
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在 3-20 个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在 6-20 个字符之间', trigger: 'blur' }
  ]
}
const userDatabase = [
  { username: 'jiaowu', password: '123456', role: '教务处', department: '教务处' },
  { username: 'admin', password: '123456', role: '战略发展部', department: '战略发展部' }
]
const emit = defineEmits(['login-success'])

const handleLogin = async () => {
  if (!loginFormRef.value) return

  // 1. 检查是否被锁定
  if (isLoginLocked.value) {
    ElMessage({
      message: `登录尝试次数过多，请稍后再试`,
      type: 'error',
      duration: 5000
    })
    return
  }

  // 2. 先进行表单验证
  try {
    await loginFormRef.value.validate()
  } catch (error) {
    // 表单验证失败，Element Plus会自动显示错误信息
    loading.value = false
    return
  }

  loading.value = true

  // 3. 检查用户名是否存在
  const userExists = userDatabase.find(u => u.username === loginForm.username)

  if (!userExists) {
    setTimeout(() => {
      loginErrorCount.value += 1
      ElMessage({
        message: '用户名不存在，请检查输入',
        type: 'error',
        duration: 3000
      })
      loading.value = false
    }, 800)
    return
  }

  // 4. 检查密码是否正确
  setTimeout(() => {
    const user = userDatabase.find(u => u.username === loginForm.username && u.password === loginForm.password)

    if (user) {
      // 登录成功，重置错误计数
      resetErrorCount()
      localStorage.setItem('currentUser', JSON.stringify({ ...user, loginTime: new Date().toISOString() }))
      ElMessage({
        message: `登录成功！欢迎 ${user.department}`,
        type: 'success',
        duration: 2000
      })
      emit('login-success', user)
    } else {
      // 密码错误，增加错误计数
      loginErrorCount.value += 1

      let errorMessage = '密码错误，请重新输入'
      if (remainingAttempts.value > 0) {
        errorMessage += `（剩余尝试次数：${remainingAttempts.value}）`
      }

      if (remainingAttempts.value === 1) {
        errorMessage += '，这是最后一次尝试！'
      }

      ElMessage({
        message: errorMessage,
        type: 'error',
        duration: 4000
      })

      // 如果达到最大尝试次数，显示锁定提示并启动自动解锁
      if (isLoginLocked.value) {
        startAutoUnlock() // 启动5分钟后自动解锁

        setTimeout(() => {
          ElMessage({
            message: '登录尝试次数过多，账户已被临时锁定，5分钟后自动解锁',
            type: 'warning',
            duration: 6000
          })
        }, 1000)
      }
    }
    loading.value = false
  }, 1000)
}
const handleForgotPassword = () => ElMessage.info('请联系管理员')

onMounted(() => {
  bgList.value = [
    { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2632&auto=format&fit=crop' }
  ]
  updateTime()
  fetchLocation() // 启动定位
  timer = setInterval(() => { currentIndex.value = (currentIndex.value + 1) % bgList.value.length }, 8000)
  timeInterval = setInterval(updateTime, 100)
  sloganInterval = setInterval(() => { currentSloganIndex.value = (currentSloganIndex.value + 1) % slogans.length }, 5000)
})

onUnmounted(() => {
  clearInterval(timer);
  clearInterval(timeInterval);
  clearInterval(sloganInterval);
  if (lockTimer) clearTimeout(lockTimer);
})
</script>

<style scoped>
:root {
  --color-primary-dark: #2b6de7;
  --color-primary: #409eff;
  --color-primary-light: #ecf5ff;
  --text-main: #303133;
  --text-regular: #606266;
  --text-secondary: #909399;
  --bg-page: #f5f7fa;
  --bg-white: #ffffff;
  --bg-light: #fafafa;
  --border-color: #ebeef5;
  --border-light: #e4e7ed;
  --border-input: #dcdfe6;
  --color-danger: #f56c6c;
  --color-warning: #e6a23c;
  --color-success: #67c23a;
  --shadow-card: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.login-container {
  min-height: 100vh; width: 100%; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  color: var(--text-main);
  background: var(--bg-page);
}

/* === 背景层 === */
.background-layer { position: absolute; inset: 0; z-index: 0; }
.bg-slide { position: absolute; inset: 0; background-size: cover; background-position: center; transition: transform 10s ease; transform: scale(1.05); }
.strategic-grid {
  position: absolute; inset: 0; z-index: 1;
  background-image: linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}
.bg-overlay {
  position: absolute; inset: 0; z-index: 2;
  background: rgba(245, 247, 250, 0.25);
  backdrop-filter: blur(2px);
}
.zoom-fade-enter-active, .zoom-fade-leave-active { transition: opacity 2s ease; }
.zoom-fade-enter-from, .zoom-fade-leave-to { opacity: 0; }

/* === HUD 氛围层 === */
.hud-layer {
  position: absolute; inset: 0; z-index: 3; pointer-events: none;
  display: flex; justify-content: center; align-items: center;
}
.hud-card {
  position: absolute; padding: 24px; width: 260px; text-align: left;
  background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(16px);
  border: 1px solid var(--bg-white); border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}
.card-left { transform: translateX(-400px); }
.vision-icon { font-size: 36px; color: var(--color-warning); margin-bottom: 12px; }
.slogan-title { font-size: 18px; font-weight: 700; margin: 0 0 8px 0; color: var(--text-main); letter-spacing: 0.5px; }
.slogan-desc { font-size: 12px; color: var(--text-secondary); font-style: italic; margin: 0; }
.slider-dots { display: flex; gap: 6px; margin-top: 16px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border-color); transition: all 0.3s; }
.dot.active { width: 24px; background: var(--color-primary); border-radius: 4px; }

.card-right { transform: translateX(400px); display: flex; flex-direction: column; justify-content: flex-end; }
.digital-clock { font-size: 48px; font-weight: 300; line-height: 1; color: var(--color-primary-dark); font-feature-settings: "tnum"; }
.current-date { font-size: 13px; color: var(--text-secondary); margin-top: 8px; margin-bottom: 24px; font-weight: 500; }
.progress-label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: var(--text-regular); font-weight: 500; }
.highlight-num { color: var(--color-primary); font-weight: 700; font-feature-settings: "tnum"; }
.progress-track { height: 6px; background: var(--border-light); border-radius: 3px; overflow: hidden; }
.progress-bar { height: 100%; background: var(--color-primary); border-radius: 3px; transition: width 0.1s linear; }
.progress-tip { font-size: 11px; color: var(--text-secondary); margin-top: 8px; text-align: right; }

/* === 登录容器与卡片 === */
.login-content-wrapper { 
  z-index: 10; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 20px; /* 登录框与地理位置条的间距 */
}

.login-box {
  width: 420px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px);
  border: 1px solid var(--bg-white);
  border-radius: 20px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
}
.logo-wrapper {
  width: 64px; height: 64px; margin: 0 auto 20px;
  background: var(--color-primary); border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 20px rgba(64, 158, 255, 0.3);
}
.header-text { text-align: center; }
.app-title { font-size: 24px; font-weight: 600; margin: 0; color: var(--text-main); }
.app-subtitle { color: var(--text-secondary); font-size: 12px; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; }

.login-form-section { margin-top: 40px; }
:deep(.el-input__wrapper) {
  background: var(--bg-page); box-shadow: none !important; border: 1px solid transparent;
  padding: 10px 15px; border-radius: 8px; transition: all 0.3s;
}
:deep(.el-input__inner) { color: var(--text-main); font-weight: 500; }
:deep(.el-input__wrapper:focus-within) {
  background: var(--bg-white); border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light) !important;
}
.submit-btn {
  width: 100%; height: 48px; margin-top: 10px; border-radius: 8px; border: none;
  font-size: 16px; letter-spacing: 1px; font-weight: 600;
  background: var(--color-primary); box-shadow: 0 8px 16px rgba(64, 158, 255, 0.25); transition: all 0.3s;
}
.submit-btn:hover {
  background: var(--color-primary-dark); transform: translateY(-2px); box-shadow: 0 12px 20px rgba(64, 158, 255, 0.35);
}

.login-footer { 
  margin-top: 40px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-secondary);
  border-top: 1px solid var(--border-light); padding-top: 20px;
}
.system-status { display: flex; align-items: center; gap: 8px; }
.status-dot { width: 8px; height: 8px; background: var(--color-success); border-radius: 50%; box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2); }
.forgot-password { margin-top: 16px; text-align: center; }
.forgot-link { color: var(--color-primary); font-size: 14px; }
.forgot-link:hover { color: var(--color-primary-dark); text-decoration: underline; }

.lock-warning {
  margin-top: 16px;
}

.lock-warning :deep(.el-alert) {
  border-radius: 8px;
  font-size: 12px;
}

.lock-warning :deep(.el-alert__content) {
  padding: 8px 0;
}

.lock-warning :deep(.el-alert__title) {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.lock-warning p {
  margin: 2px 0;
  font-size: 11px;
  line-height: 1.4;
}

.error-hint {
  margin-top: 12px;
  text-align: center;
  padding: 8px;
  background: rgba(245, 108, 108, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(245, 108, 108, 0.1);
}

.error-hint :deep(.el-text) {
  font-weight: 500;
}

/* === 新增：地理位置悬浮条 === */
.location-badge {
  display: flex; align-items: center; gap: 12px;
  background: rgba(255, 255, 255, 0.65); /* 胶囊半透明背景 */
  backdrop-filter: blur(12px);
  padding: 8px 20px;
  border-radius: 50px; /* 胶囊形状 */
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  margin-top: 10px; /* 与登录框的距离 */
  transition: all 0.3s;
}
.location-badge:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.location-icon {
  width: 32px; height: 32px;
  background: var(--bg-white);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-success); /* 使用成功绿 */
  position: relative;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.pulse-ring {
  position: absolute; inset: -2px; border-radius: 50%;
  border: 2px solid var(--color-success);
  opacity: 0;
  animation: pulse-ring 2s infinite;
}

.location-text { display: flex; flex-direction: column; line-height: 1.2; }
.loc-city { font-size: 13px; font-weight: 600; color: var(--text-main); }
.loc-details { display: flex; flex-direction: column; gap: 1px; }
.loc-district { font-size: 11px; color: var(--text-regular); font-weight: 500; }
.loc-street { font-size: 10px; color: var(--text-secondary); }
.loc-ip { font-size: 10px; color: var(--text-secondary); font-family: 'Monaco', monospace; }
.loc-accuracy { font-size: 9px; color: var(--color-success); font-weight: 500; }

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.5); opacity: 0; }
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.5s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(-10px); }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.5s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
