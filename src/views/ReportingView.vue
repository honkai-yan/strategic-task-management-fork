<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { 
  RefreshLeft, CircleCheck, Warning, Edit, 
  Timer, Document, Calendar, ArrowLeft, FolderOpened
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

// ================== 1. 类型定义 ==================
const SHARED_DB_KEY = 'STRATEGIC_ASSESSMENT_DB_V2_MULTI_MONTH'

type IndicatorType = 'quantitative' | 'qualitative'
type Status = 'draft' | 'submitted' | 'approved' | 'rejected'
type MonthStatus = 'pending' | 'processing' | 'completed'

interface Milestone {
  name: string; target?: number; weight?: number; completed?: boolean
}

interface AuditLog {
  timestamp: string; action: string; operator: string; comment?: string
}

interface IndicatorItem {
  id: number
  type: IndicatorType
  title: string
  subtitle: string
  status: Status
  isChecked: boolean 
  percentage?: number
  actualValue?: string
  quantMilestones?: Milestone[]
  qualMilestones?: Milestone[]
  submitter: string
  dept: string
  submitTime?: string
  rejectReason?: string
  auditLogs: AuditLog[]
}

interface MonthModule {
  id: string; name: string; deadline: string; status: MonthStatus; indicators: IndicatorItem[]
}

// ================== 2. 初始数据 ==================
const currentUser = computed(() => {
  const dept = authStore.userDepartment
  const name = authStore.userName
  if (dept && name) return `${dept}-${name}`
  return '未登录用户'
})
const currentView = ref<'list' | 'detail'>('list')
const activeMonthId = ref<string | null>(null)

// 动态创建默认指标（使用当前用户信息）
const createDefaultIndicators = (monthPrefix: string): IndicatorItem[] => {
  const user = currentUser.value
  const dept = authStore.userDepartment || '未知部门'
  return [
    {
      id: Date.now() + Math.random(),
      type: 'quantitative',
      title: `${monthPrefix} - 教学质量提升`,
      subtitle: '数据驱动 • 目标达成率',
      status: 'draft',
      isChecked: false,
      percentage: 0,
      submitter: user,
      dept: dept,
      auditLogs: [],
      quantMilestones: [
        { name: '阶段一：启动', target: 30 },
        { name: '阶段二：实施', target: 60 },
        { name: '阶段三：验收', target: 100 }
      ]
    },
    {
      id: Date.now() + Math.random() + 1,
      type: 'qualitative',
      title: `${monthPrefix} - 课程体系优化`,
      subtitle: '任务驱动 • 关键节点确认',
      status: 'draft',
      isChecked: false,
      submitter: user,
      dept: dept,
      auditLogs: [],
      qualMilestones: [
        { name: '调研', weight: 30, completed: false },
        { name: '方案', weight: 40, completed: false },
        { name: '落地', weight: 30, completed: false }
      ]
    }
  ]
}

// 创建默认月份数据（延迟到需要时调用）
const createDefaultMonths = (): MonthModule[] => [
  {
    id: '2023-11',
    name: '11月指标填报',
    deadline: '11月10日 截止',
    status: 'processing',
    indicators: createDefaultIndicators('11月')
  },
  {
    id: '2024-02',
    name: '2月指标填报',
    deadline: '2月10日 截止',
    status: 'pending',
    indicators: createDefaultIndicators('2月')
  },
  {
    id: '2024-03',
    name: '3月指标填报',
    deadline: '3月15日 截止',
    status: 'pending',
    indicators: createDefaultIndicators('3月')
  }
]

const monthList = ref<MonthModule[]>([])

const currentMonthData = computed(() => monthList.value.find(m => m.id === activeMonthId.value))
const indicatorList = computed(() => currentMonthData.value ? currentMonthData.value.indicators : [])

// ================== 3. 业务逻辑 ==================
const enterMonth = (month: MonthModule) => {
  activeMonthId.value = month.id
  currentView.value = 'detail'
}

const backToList = () => {
  currentView.value = 'list'
  activeMonthId.value = null
  saveToLocal()
}

const addLog = (item: IndicatorItem, action: string, comment?: string) => {
  item.auditLogs.push({ timestamp: new Date().toLocaleString(), action, operator: currentUser.value, comment })
}

const handleBatchSubmit = () => {
  if (!currentMonthData.value) return
  const selectedItems = currentMonthData.value.indicators.filter(item => item.isChecked)
  if (selectedItems.length === 0) return ElMessage.warning('请先勾选')

  ElMessageBox.confirm(`确认提交 ${selectedItems.length} 项指标至考核办？`, '提交申报', {
    confirmButtonText: '确定提交', type: 'primary'
  }).then(() => {
    selectedItems.forEach(item => {
      item.status = 'submitted'; item.isChecked = false
      item.submitTime = new Date().toLocaleString(); item.rejectReason = undefined 
      addLog(item, '提交申报', '发起考核申请')
    })
    saveToLocal(); ElMessage.success('提交成功')
  })
}

const handleRevoke = (item: IndicatorItem) => {
  ElMessageBox.confirm('撤回后可重新编辑。', '确认撤回', {
    confirmButtonText: '确认撤回', cancelButtonText: '取消', type: 'warning', icon: RefreshLeft
  }).then(() => {
    item.status = 'draft'; addLog(item, '撤回', '填报人主动撤回')
    saveToLocal(); ElNotification({ title: '已撤回', message: `"${item.title}" 已回到草稿箱`, type: 'info' })
  })
}

const handleFix = (item: IndicatorItem) => {
  item.status = 'draft'; addLog(item, '开始整改', '针对驳回意见进行修改'); saveToLocal()
}

// ================== 4. UI 计算 ==================
const selectableFilters = (item: IndicatorItem) => ['draft', 'rejected'].includes(item.status)
const isAllSelected = computed(() => {
  const targets = indicatorList.value.filter(selectableFilters)
  return targets.length > 0 && targets.every(i => i.isChecked)
})
const isIndeterminate = computed(() => {
  const targets = indicatorList.value.filter(selectableFilters)
  const selected = targets.filter(i => i.isChecked).length
  return selected > 0 && selected < targets.length
})
const selectedCount = computed(() => indicatorList.value.filter(i => i.isChecked).length)
const toggleSelectAll = (val: any) => {
  indicatorList.value.forEach(item => { if (selectableFilters(item)) item.isChecked = !!val })
}

// ================== 5. 视觉渲染 ==================
const getQuantVisuals = (item: IndicatorItem) => {
  if (!item.quantMilestones) return { progress: item.percentage || 0, markers: [] }
  const current = item.percentage || 0
  const markers = item.quantMilestones.map((m, idx) => ({
    label: m.name, position: m.target,
    status: current >= (m.target || 0) ? 'completed' : 'pending',
    description: `目标: ${m.target}%`, isTop: idx % 2 !== 0
  }))
  return { progress: current, markers }
}

const getQualVisuals = (item: IndicatorItem) => {
  if (!item.qualMilestones) return { progress: 0, markers: [] }
  let acc = 0
  const curr = item.qualMilestones.filter(m => m.completed).reduce((sum, m) => sum + (m.weight||0), 0)
  const markers = item.qualMilestones.map((m, idx) => {
    acc += (m.weight || 0)
    return {
      label: m.name, position: acc, 
      status: m.completed ? 'completed' : 'pending',
      description: `权重: ${m.weight}%`, isTop: idx % 2 !== 0
    }
  })
  return { progress: curr, markers }
}

// ================== 6. 持久化 ==================
const saveToLocal = () => localStorage.setItem(SHARED_DB_KEY, JSON.stringify(monthList.value))
const loadFromLocal = () => {
  const saved = localStorage.getItem(SHARED_DB_KEY)
  if (saved) { 
    try { 
      monthList.value = JSON.parse(saved) 
    } catch { 
      monthList.value = createDefaultMonths() 
    } 
  } else { 
    monthList.value = createDefaultMonths()
    saveToLocal() 
  }
}
onMounted(() => loadFromLocal())
watch(monthList, () => saveToLocal(), { deep: true })
</script>

<template>
  <div class="dashboard-container">

    <!-- VIEW 1: 月份选择概览 -->
    <div v-if="currentView === 'list'" class="month-overview">
      <div class="overview-header">
        <h3>📅 考核任务中心</h3>
        <p class="desc">请选择对应的考核周期进行填报</p>
      </div>
      <div class="month-grid">
        <div v-for="month in monthList" :key="month.id" class="month-card" @click="enterMonth(month)">
          <div class="month-icon-box"><el-icon :size="32"><Calendar /></el-icon></div>
          <div class="month-info">
            <h4>{{ month.name }}</h4>
            <p class="deadline">{{ month.deadline }}</p>
            <div class="month-meta">
              <el-tag size="small" effect="plain">{{ month.indicators.length }} 项任务</el-tag>
              <el-tag size="small" :type="month.status === 'completed' ? 'success' : 'warning'">
                {{ month.status === 'completed' ? '已归档' : '进行中' }}
              </el-tag>
            </div>
          </div>
          <div class="enter-btn">进入填报 <el-icon><FolderOpened /></el-icon></div>
        </div>
      </div>
    </div>

    <!-- VIEW 2: 详情填报视图 -->
    <div v-else class="detail-view">
      <!-- 头部导航 -->
      <div class="page-header detail-header">
        <div class="header-left">
          <el-button link :icon="ArrowLeft" @click="backToList" class="back-btn">返回列表</el-button>
          <el-divider direction="vertical" />
          <h3>{{ currentMonthData?.name }}</h3>
          <div class="header-meta">
            <span class="linkage-badge"><el-icon><Document /></el-icon> 数据已联通</span>
          </div>
        </div>
        <div class="header-actions">
          <div class="batch-tools">
            <el-checkbox :model-value="isAllSelected" :indeterminate="isIndeterminate" @change="toggleSelectAll" size="large" class="select-all-checkbox">
              全选待办 ({{ selectedCount }})
            </el-checkbox>
            <el-button type="primary" :disabled="selectedCount === 0" @click="handleBatchSubmit">批量提交</el-button>
          </div>
        </div>
      </div>

      <!-- 指标卡片网格 -->
      <div v-if="indicatorList.length > 0" class="cards-grid">
        <div 
          v-for="item in indicatorList" 
          :key="item.id"
          class="metric-card-wrapper"
          :class="{ 'is-submitted': item.status === 'submitted', 'is-approved': item.status === 'approved', 'is-rejected': item.status === 'rejected' }"
        >
          <!-- 顶部操作区 -->
          <div class="card-top-action">
            <el-checkbox v-if="item.status === 'draft'" v-model="item.isChecked" size="large" @click.stop />
            <el-button v-else-if="item.status === 'submitted'" type="warning" link :icon="RefreshLeft" class="action-btn revoke-btn" @click.stop="handleRevoke(item)">撤回</el-button>
            <el-button v-else-if="item.status === 'rejected'" type="danger" link :icon="Edit" class="action-btn fix-btn" @click.stop="handleFix(item)">去整改</el-button>
            <el-tag v-else-if="item.status === 'approved'" type="success" effect="dark" round>已归档</el-tag>
          </div>

          <!-- 状态印章 -->
          <div class="stamp stamp-pending" v-if="item.status === 'submitted'"><el-icon><Timer /></el-icon> 审批中</div>
          <div class="reject-reason-box" v-if="item.status === 'rejected'">
            <div class="reason-title"><el-icon><Warning /></el-icon> 被驳回</div>
            <div class="reason-content">"{{ item.rejectReason || '数据不达标' }}"</div>
          </div>
          <div class="stamp stamp-approved" v-if="item.status === 'approved'"><el-icon><CircleCheck /></el-icon> 考核通过</div>

          <!-- 卡片主体 -->
          <div 
            class="metric-card" 
            :class="[
              item.type === 'quantitative' ? 'quantitative-card' : 'qualitative-card',
              { 'card-locked': item.status === 'submitted' || item.status === 'approved' }
            ]"
            @click="item.status === 'draft' ? item.isChecked = !item.isChecked : null"
          >
            <div class="card-header">
              <div class="header-main">
                <div class="icon-wrapper" :class="item.type === 'quantitative' ? 'blue-bg' : 'orange-bg'">
                  <span class="icon-text">{{ item.type === 'quantitative' ? '数' : '质' }}</span>
                </div>
                <div>
                  <h4 class="card-title">{{ item.title }}</h4>
                  <p class="card-subtitle">{{ item.subtitle }}</p>
                </div>
              </div>
              <div class="current-value" :class="item.type === 'quantitative' ? 'blue-text' : 'orange-text'">
                <template v-if="item.type === 'quantitative'">{{ getQuantVisuals(item).progress }}<span class="unit">%</span></template>
                <template v-else>{{ getQualVisuals(item).progress }}<span class="unit">%</span></template>
              </div>
            </div>
            
            <div class="card-body">
              
              <!-- === 核心修改：添加标签 === -->
              <!-- 定量标签 -->
              <el-tag :type="item.type === 'quantitative' ? 'primary' : 'warning'" size="small">
                {{ item.type === 'quantitative' ? '定量指标' : '定性指标' }}
              </el-tag>
              <!-- ======================== -->

              <!-- 定量可视化内容 -->
              <template v-if="item.type === 'quantitative'">
                <div class="milestone-track-wrapper">
                  <div class="track-bg"></div>
                  <div class="track-fill blue-fill" :style="{ width: getQuantVisuals(item).progress + '%' }"></div>
                  <div v-for="(marker, idx) in getQuantVisuals(item).markers" :key="idx"
                       class="track-marker" :class="[marker.status, marker.isTop?'marker-top':'marker-bottom']"
                       :style="{ left: marker.position + '%' }">
                    <div class="marker-point"></div>
                    <div class="marker-info"><div class="marker-label">{{marker.label}}</div></div>
                  </div>
                </div>
                <div class="action-panel blue-panel">
                  <div class="panel-row">
                    <div class="input-group">
                      <span class="label">当前完成度</span>
                      <el-slider v-model="item.percentage" :step="1" show-input input-size="small" 
                        :disabled="!['draft','rejected'].includes(item.status)" class="custom-slider" @click.stop />
                    </div>
                  </div>
                </div>
              </template>

              <!-- 定性可视化内容 -->
              <template v-else>
                 <div class="milestone-track-wrapper">
                  <div class="track-bg"></div>
                  <div class="track-fill orange-fill" :style="{ width: getQualVisuals(item).progress + '%' }"></div>
                  <div v-for="(marker, idx) in getQualVisuals(item).markers" :key="idx" 
                       class="track-marker" :class="[marker.status, marker.isTop?'marker-top':'marker-bottom']" 
                       :style="{ left: marker.position + '%' }">
                    <div class="marker-point orange-mode"></div>
                    <div class="marker-info"><div class="marker-label">{{marker.label}}</div></div>
                  </div>
                </div>
                <div class="action-panel orange-panel">
                  <div class="checklist-grid">
                    <div v-for="(m, idx) in item.qualMilestones" :key="idx" class="check-card" 
                         :class="{ 'is-active': m.completed, 'is-disabled': !['draft','rejected'].includes(item.status) }"
                         @click.stop="['draft','rejected'].includes(item.status) && (m.completed = !m.completed)">
                      <div class="check-indicator"><i class="check-icon" v-if="m.completed">✓</i></div>
                      <span class="name">{{ m.name }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态处理 -->
      <div v-else class="empty-state">
        <el-empty description="当前月份暂无指标任务">
          <el-button type="primary" @click="backToList">返回列表</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========================================
   基础布局 - 使用统一CSS变量
   ======================================== */
.dashboard-container { 
  padding: var(--spacing-xl); 
  background: var(--bg-page); 
  min-height: 100vh; 
}

/* ========================================
   空状态样式 - 统一样式 (Requirements 7.1)
   ======================================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: calc(var(--spacing-2xl) * 2);
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  color: var(--text-secondary);
}

/* ========================================
   VIEW 1: 月度概览样式 - 统一卡片样式 (Requirements 2.1)
   ======================================== */
.month-overview { 
  max-width: 1200px; 
  margin: 0 auto; 
}

.overview-header { 
  margin-bottom: var(--spacing-2xl); 
  text-align: center; 
}

.overview-header h3 { 
  font-size: 28px; 
  color: var(--text-main); 
  margin-bottom: var(--spacing-sm); 
  font-weight: 600;
}

.overview-header .desc { 
  color: var(--text-secondary); 
  font-size: 14px; 
}

.month-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
  gap: var(--spacing-2xl); 
}

/* 月份选择卡片 - 统一卡片样式 */
.month-card {
  background: var(--bg-white); 
  border-radius: var(--radius-lg); 
  padding: var(--spacing-2xl);
  display: flex; 
  align-items: center; 
  gap: var(--spacing-xl);
  cursor: pointer; 
  transition: all var(--transition-normal);
  border: 2px solid transparent; 
  box-shadow: var(--shadow-card);
  height: 100%;
}

.month-card:hover {
  transform: translateY(-4px); 
  box-shadow: var(--shadow-hover);
  border-color: var(--color-primary);
}

.month-icon-box { 
  width: 60px; 
  height: 60px; 
  background: var(--color-primary-light); 
  color: var(--color-primary); 
  border-radius: var(--radius-lg); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}

.month-info { 
  flex: 1; 
}

.month-info h4 { 
  margin: 0 0 var(--spacing-xs) 0; 
  font-size: 18px; 
  color: var(--text-main); 
  font-weight: 600;
}

.deadline { 
  color: var(--color-danger); 
  font-size: 12px; 
  margin-bottom: var(--spacing-sm); 
}

/* 月份元数据标签 - 统一标签间距 (Requirements 9.1) */
.month-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.enter-btn { 
  font-size: 12px; 
  color: var(--text-secondary); 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: var(--spacing-xs); 
  opacity: 0; 
  transition: opacity var(--transition-normal); 
}

.month-card:hover .enter-btn { 
  opacity: 1; 
  color: var(--color-primary); 
}

/* ========================================
   VIEW 2: 详情页样式 - 统一页面头部 (Requirements 5.1)
   ======================================== */
.detail-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  background: var(--bg-white); 
  padding: var(--spacing-lg) var(--spacing-2xl); 
  border-radius: var(--radius-lg); 
  box-shadow: var(--shadow-card); 
  margin-bottom: var(--spacing-2xl); 
}

.header-left { 
  display: flex; 
  align-items: center; 
  gap: var(--spacing-md); 
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.back-btn { 
  font-size: 14px; 
  color: var(--text-regular); 
}

.header-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.linkage-badge { 
  font-size: 12px; 
  color: var(--color-success); 
  background: #f0f9eb; 
  padding: 2px var(--spacing-sm); 
  border-radius: var(--radius-sm); 
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.batch-tools { 
  display: flex; 
  gap: var(--spacing-xl); 
  align-items: center; 
}

/* ========================================
   指标卡片网格 - 统一卡片样式 (Requirements 2.1)
   ======================================== */
.cards-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr)); 
  gap: var(--spacing-2xl); 
}

.metric-card-wrapper { 
  position: relative; 
  transition: all var(--transition-normal); 
  height: 100%;
}

/* 指标卡片 - 统一卡片圆角、阴影 */
.metric-card { 
  background: var(--bg-white); 
  border-radius: var(--radius-lg); 
  border: 2px solid transparent; 
  box-shadow: var(--shadow-card); 
  overflow: hidden; 
  cursor: pointer;
  display: flex; 
  flex-direction: column; 
  height: 100%;
  min-height: 380px;
  transition: all var(--transition-normal);
}

.metric-card:hover {
  box-shadow: var(--shadow-hover);
}

/* 卡片头部 - 统一样式 */
.card-header { 
  padding: var(--spacing-xl) var(--spacing-2xl); 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border-bottom: 1px solid var(--border-color); 
  flex-shrink: 0;
  position: relative;
}

.header-main { 
  display: flex; 
  align-items: center; 
  gap: var(--spacing-md); 
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.card-subtitle {
  margin: var(--spacing-xs) 0 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.icon-wrapper { 
  width: 42px; 
  height: 42px; 
  border-radius: var(--radius-md); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: 800; 
  font-size: 14px; 
}

.blue-bg { 
  background: var(--color-primary-light); 
  color: var(--color-primary); 
}

.orange-bg { 
  background: #fdf6ec; 
  color: var(--color-warning); 
}

.current-value { 
  font-size: 28px; 
  font-weight: 700; 
}

.current-value .unit {
  font-size: 14px;
  font-weight: 400;
  margin-left: 2px;
}

.blue-text { 
  color: var(--color-primary); 
} 

.orange-text { 
  color: var(--color-warning); 
}

/* 卡片内容区域 */
.card-body { 
  padding: var(--spacing-xl) var(--spacing-2xl) var(--spacing-2xl); 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
}

/* 定量/定性标签 */
.type-tag {
  font-weight: normal;
  margin-bottom: var(--spacing-md);
  display: inline-block;
}

/* ========================================
   进度轨道样式 - 统一进度条样式 (Requirements 10.1)
   ======================================== */
.milestone-track-wrapper { 
  position: relative; 
  height: 60px; 
  margin: 0 var(--spacing-md) var(--spacing-xl); 
  display: flex; 
  align-items: center;
  flex-shrink: 0;
}

.track-bg { 
  position: absolute; 
  left: 0; 
  right: 0; 
  height: 6px; 
  background: var(--border-light); 
  border-radius: 100px; 
}

.track-fill { 
  position: absolute; 
  left: 0; 
  height: 6px; 
  border-radius: 100px; 
  transition: width var(--transition-slow); 
}

.blue-fill { 
  background: var(--color-primary); 
} 

.orange-fill { 
  background: var(--color-warning); 
}

.track-marker { 
  position: absolute; 
  width: 20px; 
  height: 100%; 
  top: 50%; 
  transform: translate(-50%, -50%); 
}

.marker-point { 
  width: 10px; 
  height: 10px; 
  background: var(--bg-white); 
  border: 2px solid var(--border-input); 
  border-radius: 50%; 
  position: absolute; 
  top: 50%; 
  left: 50%; 
  transform: translate(-50%,-50%);
  transition: all var(--transition-fast);
}

.marker-point.orange-mode {
  border-color: var(--border-input);
}

.track-marker.completed .marker-point {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.track-marker.completed .marker-point.orange-mode {
  border-color: var(--color-warning);
  background: #fdf6ec;
}

.marker-info { 
  position: absolute; 
  left: 50%; 
  transform: translateX(-50%); 
  font-size: 10px; 
  white-space: nowrap; 
  color: var(--text-secondary); 
}

.marker-top .marker-info { 
  bottom: 60%; 
} 

.marker-bottom .marker-info { 
  top: 60%; 
}

.marker-label {
  color: var(--text-secondary);
}

/* ========================================
   操作面板样式
   ======================================== */
.action-panel { 
  margin-top: auto;
  padding: var(--spacing-lg); 
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.blue-panel { 
  background: rgba(64, 158, 255, 0.06); 
  border: 1px dashed rgba(64, 158, 255, 0.3); 
}

.orange-panel { 
  background: rgba(230, 162, 60, 0.06); 
  border: 1px dashed rgba(230, 162, 60, 0.3); 
}

.panel-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-group .label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 定性指标检查列表 */
.checklist-grid { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: var(--spacing-sm); 
}

.check-card { 
  background: var(--bg-white); 
  border: 1px solid var(--border-color); 
  padding: var(--spacing-sm); 
  border-radius: var(--radius-sm); 
  font-size: 12px; 
  display: flex; 
  gap: var(--spacing-xs); 
  align-items: center; 
  cursor: pointer;
  transition: all var(--transition-fast);
}

.check-card:hover {
  border-color: var(--color-warning);
}

.check-card.is-active { 
  border-color: var(--color-warning); 
  color: var(--color-warning); 
  background: rgba(230, 162, 60, 0.06); 
}

.check-card.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.check-indicator { 
  width: 16px; 
  height: 16px; 
  border: 1px solid var(--border-input); 
  border-radius: 2px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  transition: all var(--transition-fast);
}

.is-active .check-indicator { 
  border-color: var(--color-warning); 
  background: var(--color-warning); 
  color: var(--bg-white); 
}

.check-icon {
  font-style: normal;
  font-size: 10px;
}

/* ========================================
   状态与印章样式 - 统一标签样式 (Requirements 9.1)
   ======================================== */
.metric-card-wrapper.is-submitted .metric-card { 
  filter: grayscale(0.8); 
  background: var(--bg-light); 
  cursor: default; 
}

.stamp-pending { 
  position: absolute; 
  top: 15px; 
  right: 100px; 
  color: var(--color-warning); 
  background: rgba(230, 162, 60, 0.1); 
  padding: var(--spacing-xs) var(--spacing-md); 
  border-radius: 20px; 
  font-size: 12px; 
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.metric-card-wrapper.is-approved .metric-card { 
  border-color: var(--color-success); 
}

.stamp-approved { 
  position: absolute; 
  top: 15px; 
  right: 100px; 
  color: var(--color-success); 
  font-weight: bold; 
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.metric-card-wrapper.is-rejected .metric-card { 
  border-color: var(--color-danger); 
}

.reject-reason-box { 
  position: absolute; 
  top: 55px; 
  left: var(--spacing-2xl); 
  right: var(--spacing-2xl); 
  z-index: 15; 
  background: #fef0f0; 
  border: 1px solid #fde2e2; 
  border-radius: var(--radius-md); 
  padding: var(--spacing-sm) var(--spacing-md); 
  color: var(--color-danger); 
}

.reason-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  font-size: 12px;
  margin-bottom: var(--spacing-xs);
}

.reason-content {
  font-size: 12px;
  font-style: italic;
}

.card-top-action { 
  position: absolute; 
  top: 18px; 
  right: var(--spacing-xl); 
  z-index: 20; 
}

.card-locked { 
  pointer-events: none; 
}

.card-locked .action-panel { 
  opacity: 0.6; 
}

/* ========================================
   操作按钮样式
   ======================================== */
.action-btn {
  font-size: 12px;
}

.revoke-btn {
  color: var(--color-warning);
}

.fix-btn {
  color: var(--color-danger);
}

/* ========================================
   自定义滑块样式
   ======================================== */
.custom-slider {
  width: 100%;
}

.custom-slider :deep(.el-slider__runway) {
  background: var(--border-light);
}

.custom-slider :deep(.el-slider__bar) {
  background: var(--color-primary);
}

/* ========================================
   响应式适配
   ======================================== */
@media (max-width: 1024px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
  
  .checklist-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: var(--spacing-md);
  }
  
  .month-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-start;
  }
  
  .batch-tools {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
