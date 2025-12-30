// 权重分析脚本
import fs from 'fs'

// 读取strategic store文件
const storeContent = fs.readFileSync('./src/stores/strategic.ts', 'utf-8')

// 提取所有战略指标的权重和部门信息
const strategicIndicators = []
const lines = storeContent.split('\n')

let currentIndicator = {}
let inIndicator = false

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim()
  
  if (line.includes('id:') && line.includes("'")) {
    inIndicator = true
    currentIndicator = {}
    const idMatch = line.match(/'([^']+)'/)
    if (idMatch) currentIndicator.id = idMatch[1]
  }
  
  if (inIndicator) {
    if (line.includes('weight:')) {
      const weightMatch = line.match(/weight:\s*(\d+)/)
      if (weightMatch) currentIndicator.weight = parseInt(weightMatch[1])
    }
    
    if (line.includes('responsibleDept:')) {
      const deptMatch = line.match(/'([^']+)'/)
      if (deptMatch) currentIndicator.responsibleDept = deptMatch[1]
    }
    
    if (line.includes('isStrategic: true')) {
      currentIndicator.isStrategic = true
    }
    
    if (line === '    },') {
      if (currentIndicator.isStrategic && currentIndicator.weight && currentIndicator.responsibleDept) {
        strategicIndicators.push({...currentIndicator})
      }
      inIndicator = false
      currentIndicator = {}
    }
  }
}

// 按部门统计权重
const deptWeights = {}
strategicIndicators.forEach(indicator => {
  const dept = indicator.responsibleDept
  if (!deptWeights[dept]) {
    deptWeights[dept] = 0
  }
  deptWeights[dept] += indicator.weight
})

console.log('各部门战略指标权重统计：')
console.log('================================')
Object.entries(deptWeights).forEach(([dept, weight]) => {
  const status = weight === 100 ? '✅ 可下发' : '❌ 不可下发'
  console.log(`${dept}: ${weight} ${status}`)
})

console.log('\n详细指标列表：')
console.log('================================')
strategicIndicators.forEach(indicator => {
  console.log(`${indicator.id} - ${indicator.responsibleDept} - 权重: ${indicator.weight}`)
})