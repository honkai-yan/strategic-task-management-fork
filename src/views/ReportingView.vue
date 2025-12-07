<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { 
  RefreshLeft, CircleCheck, Warning, Edit, 
  Timer, Document, Calendar, ArrowLeft, FolderOpened
} from '@element-plus/icons-vue'

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
const currentUser = '教务处-李老师'
const currentView = ref<'list' | 'detail'>('list')
const activeMonthId = ref<string | null>(null)

const createDefaultIndicators = (monthPrefix: string): IndicatorItem[] => [
  {
    id: Date.now() + 1,
    type: 'quantitative',
    title: `${monthPrefix} - 教学质量提升`,
    subtitle: '数据驱动 • 目标达成率',
    status: 'draft',
    isChecked: false,
    percentage: 0,
    submitter: currentUser,
    dept: '教务处',
    auditLogs: [],
    quantMilestones: [
      { name: '阶段一：启动', target: 30 },
      { name: '阶段二：实施', target: 60 },
      { name: '阶段三：验收', target: 100 }
    ]
  },
  {
    id: Date.now() + 2,
    type: 'qualitative',
    title: `${monthPrefix} - 课程体系优化`,
    subtitle: '任务驱动 • 关键节点确认',
    status: 'draft',
    isChecked: false,
    submitter: currentUser,
    dept: '教务处',
    auditLogs: [],
    qualMilestones: [
      { name: '调研', weight: 30, completed: false },
      { name: '方案', weight: 40, completed: false },
      { name: '落地', weight: 30, completed: false }
    ]
  }
]

const defaultMonths: MonthModule[] = [
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
  item.auditLogs.push({ timestamp: new Date().toLocaleString(), action, operator: currentUser, comment })
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
  if (saved) { try { monthList.value = JSON.parse(saved) } catch { monthList.value = JSON.parse(JSON.stringify(defaultMonths)) } } 
  else { monthList.value = JSON.parse(JSON.stringify(defaultMonths)); saveToLocal() }
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
              <el-tag size="small" :type="month.status === 'completed' ? 'success' : 'warning'" style="margin-left: 8px;">
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
      <div class="cards-grid">
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
    </div>
  </div>
</template>

<style scoped>
/* 基础布局 */
.dashboard-container { padding: 20px; background: #f5f7fa; min-height: 100vh; }

/* VIEW 1: 月度概览样式 */
.month-overview { max-width: 1200px; margin: 0 auto; }
.overview-header { margin-bottom: 32px; text-align: center; }
.overview-header h3 { font-size: 28px; color: #303133; margin-bottom: 8px; }
.overview-header .desc { color: #909399; font-size: 14px; }
.month-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
.month-card {
  background: #fff; border-radius: 16px; padding: 24px;
  display: flex; align-items: center; gap: 20px;
  cursor: pointer; transition: all 0.3s ease;
  border: 2px solid transparent; box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}
.month-card:hover {
  transform: translateY(-5px); box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  border-color: #409EFF;
}
.month-icon-box { width: 60px; height: 60px; background: #ecf5ff; color: #409EFF; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.month-info { flex: 1; }
.month-info h4 { margin: 0 0 4px 0; font-size: 18px; color: #303133; }
.deadline { color: #F56C6C; font-size: 12px; margin-bottom: 8px; }
.enter-btn { font-size: 12px; color: #909399; display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: 0; transition: opacity 0.3s; }
.month-card:hover .enter-btn { opacity: 1; color: #409EFF; }

/* VIEW 2: 详情页样式 */
.detail-header { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 16px 24px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.03); margin-bottom: 24px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn { font-size: 14px; color: #606266; }
.linkage-badge { font-size: 12px; color: #67C23A; background: #f0f9eb; padding: 2px 8px; border-radius: 4px; }
.batch-tools { display: flex; gap: 20px; align-items: center; }

/* === 卡片等高布局核心样式 === */
.cards-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr)); 
  gap: 24px; 
  /* Grid默认会align-items: stretch，保证wrapper高度一致 */
}

.metric-card-wrapper { 
  position: relative; 
  transition: all 0.3s; 
  height: 100%; /* 填满 grid cell */
}

.metric-card { 
  background: #fff; 
  border-radius: 16px; 
  border: 2px solid transparent; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
  overflow: hidden; 
  cursor: pointer;
  
  /* Flex列布局，确保高度充满 */
  display: flex; 
  flex-direction: column; 
  height: 100%; 
}

.card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f2f6fc; flex-shrink: 0; }
.header-main { display: flex; align-items: center; gap: 12px; }
.icon-wrapper { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
.blue-bg { background: #ecf5ff; color: #409EFF; }
.orange-bg { background: #fdf6ec; color: #E6A23C; }
.current-value { font-size: 28px; font-weight: 700; }
.blue-text { color: #409EFF; } .orange-text { color: #E6A23C; }

/* 内容区域：占据剩余空间，且将底部操作区推到底部 */
.card-body { 
  padding: 20px 24px 24px; 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
}

.type-tag {
  font-weight: normal;
  margin-bottom: 12px;
  display: inline-block;
}

/* 状态与印章 */
.metric-card-wrapper.is-submitted .metric-card { filter: grayscale(0.8); background: #fafafa; cursor: default; }
.stamp-pending { position: absolute; top: 15px; right: 100px; color: #E6A23C; background: #fdf6ec; padding: 4px 12px; border-radius: 20px; font-size: 12px; z-index: 10; }
.metric-card-wrapper.is-approved .metric-card { border-color: #67C23A; }
.stamp-approved { position: absolute; top: 15px; right: 100px; color: #67C23A; font-weight: bold; z-index: 10; }
.metric-card-wrapper.is-rejected .metric-card { border-color: #F56C6C; }
.reject-reason-box { position: absolute; top: 55px; left: 24px; right: 24px; z-index: 15; background: #fef0f0; border: 1px solid #fde2e2; border-radius: 8px; padding: 8px 12px; color: #F56C6C; }
.card-top-action { position: absolute; top: 18px; right: 20px; z-index: 20; }
.card-locked { pointer-events: none; }
.card-locked .action-panel { opacity: 0.6; }

/* 轨道与面板 */
.action-panel { 
  margin-top: auto; /* === 核心：自动推到底部 === */
  padding: 16px; 
  border-radius: 8px; 
}
.blue-panel { background: #f0f7ff; border: 1px dashed #c6e2ff; }
.orange-panel { background: #fdf6ec; border: 1px dashed #f5dab1; }

.milestone-track-wrapper { position: relative; height: 60px; margin: 0 10px 20px; display: flex; align-items: center; }
.track-bg { position: absolute; left: 0; right: 0; height: 6px; background: #e4e7ed; border-radius: 3px; }
.track-fill { position: absolute; left: 0; height: 6px; border-radius: 3px; transition: width 0.5s; }
.blue-fill { background: #409EFF; } .orange-fill { background: #E6A23C; }
.track-marker { position: absolute; width: 20px; height: 100%; top: 50%; transform: translate(-50%, -50%); }
.marker-point { width: 10px; height: 10px; background: #fff; border: 2px solid #dcdfe6; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); }
.marker-info { position: absolute; left: 50%; transform: translateX(-50%); font-size: 10px; white-space: nowrap; color: #909399; }
.marker-top .marker-info { bottom: 60%; } .marker-bottom .marker-info { top: 60%; }

.checklist-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.check-card { background: #fff; border: 1px solid #ebeef5; padding: 8px; border-radius: 4px; font-size: 12px; display: flex; gap: 4px; align-items: center; cursor: pointer; }
.check-card.is-active { border-color: #E6A23C; color: #E6A23C; background: #fdf6ec; }
.check-indicator { width: 16px; height: 16px; border: 1px solid #dcdfe6; border-radius: 2px; display: flex; align-items: center; justify-content: center; }
.is-active .check-indicator { border-color: #E6A23C; background: #E6A23C; color: #fff; }
</style>
