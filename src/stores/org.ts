/**
 * 组织机构 Store
 * 管理部门数据，从数据库动态加载
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import orgApi, { type Department } from '@/api/org'

export const useOrgStore = defineStore('org', () => {
  // State
  const departments = ref<Department[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  // Getters
  const strategicDept = computed(() => 
    departments.value.find(d => d.type === 'strategic_dept')
  )

  const functionalDepartments = computed(() => 
    departments.value.filter(d => d.type === 'functional_dept')
      .sort((a, b) => a.sortOrder - b.sortOrder)
  )

  const colleges = computed(() => 
    departments.value.filter(d => d.type === 'secondary_college')
      .sort((a, b) => a.sortOrder - b.sortOrder)
  )

  const allDepartments = computed(() => 
    departments.value.sort((a, b) => {
      // 排序：战略发展部 > 职能部门 > 二级学院
      const typeOrder = { strategic_dept: 1, functional_dept: 2, secondary_college: 3 }
      const typeCompare = typeOrder[a.type] - typeOrder[b.type]
      if (typeCompare !== 0) return typeCompare
      return a.sortOrder - b.sortOrder
    })
  )

  // Actions
  const loadDepartments = async (retryCount = 0, maxRetries = 2) => {
    if (loaded.value && departments.value.length > 0) {
      console.log('📋 [Org Store] 部门数据已加载，跳过')
      return
    }
    
    loading.value = true
    const attemptNum = retryCount + 1
    console.log(`📋 [Org Store] 开始从API加载部门数据 (尝试 ${attemptNum}/${maxRetries + 1})...`)
    
    try {
      const depts = await orgApi.getAllDepartments()
      
      // 如果没有数据且还有重试次数，则重试
      if (depts.length === 0 && retryCount < maxRetries) {
        console.warn(`⚠️ [Org Store] 未获取到部门数据，${1000}ms后重试...`)
        loading.value = false
        await new Promise(resolve => setTimeout(resolve, 1000))
        return loadDepartments(retryCount + 1, maxRetries)
      }
      
      departments.value = depts
      loaded.value = true
      
      console.log(`✅ [Org Store] 成功加载 ${depts.length} 个部门`)
      console.log('📋 [Org Store] 战略发展部:', strategicDept.value?.name || '未找到')
      console.log('📋 [Org Store] 职能部门数量:', functionalDepartments.value.length)
      console.log('📋 [Org Store] 二级学院数量:', colleges.value.length)
      
      if (depts.length === 0) {
        console.warn('⚠️ [Org Store] 警告：未加载到任何部门数据')
      }
    } catch (error) {
      console.error(`❌ [Org Store] 加载部门数据失败 (尝试 ${attemptNum}/${maxRetries + 1}):`, error)
      
      // 如果还有重试次数，则重试
      if (retryCount < maxRetries) {
        console.log(`🔄 [Org Store] ${1000}ms后重试...`)
        loading.value = false
        await new Promise(resolve => setTimeout(resolve, 1000))
        return loadDepartments(retryCount + 1, maxRetries)
      }
      
      // 所有重试都失败，标记为已尝试
      console.error('❌ [Org Store] 所有重试均失败，停止加载')
      loaded.value = true
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  // 工具函数
  const isStrategicDept = (deptName: string): boolean => {
    return departments.value.some(d => d.name === deptName && d.type === 'strategic_dept')
  }

  const isFunctionalDept = (deptName: string): boolean => {
    return departments.value.some(d => d.name === deptName && d.type === 'functional_dept')
  }

  const isCollege = (deptName: string): boolean => {
    return departments.value.some(d => d.name === deptName && d.type === 'secondary_college')
  }

  const getDepartmentByName = (name: string): Department | undefined => {
    return departments.value.find(d => d.name === name)
  }

  // 获取部门名称列表（用于兼容旧代码）
  const getStrategicDeptName = (): string => {
    return strategicDept.value?.name || '战略发展部'
  }

  const getAllFunctionalDepartmentNames = (): string[] => {
    return functionalDepartments.value.map(d => d.name)
  }

  const getAllCollegeNames = (): string[] => {
    return colleges.value.map(d => d.name)
  }

  const getAllDepartmentNames = (): string[] => {
    return allDepartments.value.map(d => d.name)
  }

  return {
    // State
    departments,
    loading,
    loaded,

    // Getters
    strategicDept,
    functionalDepartments,
    colleges,
    allDepartments,

    // Actions
    loadDepartments,
    isStrategicDept,
    isFunctionalDept,
    isCollege,
    getDepartmentByName,

    // 兼容旧代码的辅助函数
    getStrategicDeptName,
    getAllFunctionalDepartmentNames,
    getAllCollegeNames,
    getAllDepartmentNames
  }
})
