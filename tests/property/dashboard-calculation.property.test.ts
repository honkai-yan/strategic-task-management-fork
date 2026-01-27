/**
 * Dashboard 数据计算属性测试
 * 
 * 测试 Dashboard 的数据计算逻辑，包括部门汇总和预警分布
 * 
 * **Feature: page-data-verification**
 * - **Property 2: Filter Logic Correctness** (部门汇总计算)
 * 
 * **Validates: Requirements 1.2, 1.3**
 */
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import { setActivePinia, createPinia } from 'pinia'
import type { StrategicIndicator, Milestone, ProgressApprovalStatus } from '@/types'
import {
  PROGRESS_APPROVAL_STATUS_VALUES,
  MILESTONE_STATUS_VALUES
} from '@/config/validationRules'

// ============================================================================
// 测试环境设置 - Mock localStorage
// ============================================================================

/**
 * 创建 localStorage mock
 */
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }
}

// 全局 localStorage mock
const localStorageMock = createLocalStorageMock()

// 在所有测试之前设置 localStorage mock
beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
  })
})

// ============================================================================
// 测试数据生成器 (Arbitraries)
// ============================================================================

/**
 * 生成非空白字符串
 */
const nonEmptyStringArbitrary = (maxLength: number = 50) =>
  fc.string({ minLength: 1, maxLength })
    .filter(s => s.trim().length > 0)

/**
 * 生成有效的部门名称
 * 包括职能部门和二级学院
 */
const departmentNameArbitrary = fc.constantFrom(
  '战略发展部',
  '教务处',
  '科研处',
  '人事处',
  '财务处',
  '信息中心',
  '计算机学院',
  '机械工程学院',
  '电子信息学院',
  '经济管理学院',
  '外国语学院',
  '艺术设计学院'
)

/**
 * 生成有效的年份
 */
const validYearArbitrary = fc.integer({ min: 2023, max: 2026 })

/**
 * 生成有效的进度值 (0-100)
 */
const validProgressArbitrary = fc.integer({ min: 0, max: 100 })

/**
 * 生成有效的权重值 (0-100)
 */
const validWeightArbitrary = fc.float({ min: 0, max: 100, noNaN: true })

/**
 * 生成有效的日期字符串 (YYYY-MM-DD 格式)
 */
const validDateStringArbitrary = fc.tuple(
  fc.integer({ min: 2023, max: 2026 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 }) // 使用28避免月份天数问题
).map(([year, month, day]) => 
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
)

/**
 * 生成有效的里程碑对象
 */
const validMilestoneArbitrary: fc.Arbitrary<Milestone> = fc.record({
  id: nonEmptyStringArbitrary(50),
  name: nonEmptyStringArbitrary(100),
  targetProgress: fc.integer({ min: 0, max: 100 }),
  deadline: validDateStringArbitrary,
  status: fc.constantFrom(...MILESTONE_STATUS_VALUES)
})

/**
 * 生成有效的指标对象（用于过滤测试）
 */
const validIndicatorArbitrary: fc.Arbitrary<StrategicIndicator> = fc.record({
  id: nonEmptyStringArbitrary(50),
  name: nonEmptyStringArbitrary(200),
  isQualitative: fc.boolean(),
  type1: fc.constantFrom('定量', '定性') as fc.Arbitrary<'定量' | '定性'>,
  type2: fc.constantFrom('发展性', '基础性') as fc.Arbitrary<'发展性' | '基础性'>,
  progress: validProgressArbitrary,
  createTime: fc.constant('2025年01月01日'),
  weight: validWeightArbitrary,
  remark: fc.string({ maxLength: 200 }),
  canWithdraw: fc.boolean(),
  taskContent: nonEmptyStringArbitrary(200),
  milestones: fc.array(validMilestoneArbitrary, { minLength: 0, maxLength: 4 }),
  targetValue: fc.integer({ min: 0, max: 100 }),
  unit: fc.constantFrom('%', '个', '项', '家/专业'),
  responsibleDept: departmentNameArbitrary,
  responsiblePerson: nonEmptyStringArbitrary(50),
  status: fc.constantFrom('active', 'pending', 'approved', 'draft', 'archived', 'distributed') as fc.Arbitrary<'active' | 'pending' | 'approved' | 'draft' | 'archived' | 'distributed'>,
  isStrategic: fc.boolean(),
  ownerDept: departmentNameArbitrary,
  year: validYearArbitrary,
  progressApprovalStatus: fc.constantFrom(...PROGRESS_APPROVAL_STATUS_VALUES) as fc.Arbitrary<ProgressApprovalStatus>
})

/**
 * 生成过滤条件
 */
const filterCriteriaArbitrary = fc.record({
  year: fc.option(validYearArbitrary, { nil: undefined }),
  department: fc.option(departmentNameArbitrary, { nil: undefined }),
  status: fc.option(
    fc.constantFrom('pending', 'approved', 'rejected') as fc.Arbitrary<'pending' | 'approved' | 'rejected'>,
    { nil: undefined }
  )
})

// ============================================================================
// 纯函数：过滤逻辑（从 dashboard store 提取）
// ============================================================================

/**
 * 获取预警级别
 * 根据进度值返回预警级别
 * - severe: 进度 < 30%
 * - moderate: 30% <= 进度 < 60%
 * - normal: 进度 >= 60%
 */
const getAlertLevel = (progress: number): 'severe' | 'moderate' | 'normal' => {
  if (progress < 30) return 'severe'
  if (progress < 60) return 'moderate'
  return 'normal'
}

/**
 * 按年份过滤指标
 * @param indicators 指标列表
 * @param year 目标年份
 * @param defaultYear 默认年份（用于没有 year 字段的指标）
 */
const filterByYear = (
  indicators: StrategicIndicator[],
  year: number | undefined,
  defaultYear: number = 2025
): StrategicIndicator[] => {
  if (year === undefined) return indicators
  return indicators.filter(i => {
    const indicatorYear = i.year || defaultYear
    return indicatorYear === year
  })
}

/**
 * 按部门过滤指标
 * @param indicators 指标列表
 * @param department 目标部门
 */
const filterByDepartment = (
  indicators: StrategicIndicator[],
  department: string | undefined
): StrategicIndicator[] => {
  if (department === undefined) return indicators
  return indicators.filter(i => i.responsibleDept === department)
}

/**
 * 按审批状态过滤指标
 * @param indicators 指标列表
 * @param status 目标状态
 */
const filterByApprovalStatus = (
  indicators: StrategicIndicator[],
  status: string | undefined
): StrategicIndicator[] => {
  if (status === undefined) return indicators
  return indicators.filter(i => i.progressApprovalStatus === status)
}

/**
 * 按预警级别过滤指标
 * @param indicators 指标列表
 * @param alertLevel 目标预警级别
 */
const filterByAlertLevel = (
  indicators: StrategicIndicator[],
  alertLevel: 'severe' | 'moderate' | 'normal' | undefined
): StrategicIndicator[] => {
  if (alertLevel === undefined) return indicators
  return indicators.filter(i => getAlertLevel(i.progress) === alertLevel)
}

/**
 * 组合过滤函数
 * 应用所有过滤条件
 */
const applyFilters = (
  indicators: StrategicIndicator[],
  filters: {
    year?: number
    department?: string
    status?: string
    alertLevel?: 'severe' | 'moderate' | 'normal'
  },
  defaultYear: number = 2025
): StrategicIndicator[] => {
  let result = [...indicators]
  
  result = filterByYear(result, filters.year, defaultYear)
  result = filterByDepartment(result, filters.department)
  result = filterByApprovalStatus(result, filters.status)
  result = filterByAlertLevel(result, filters.alertLevel)
  
  return result
}

/**
 * 计算预警分布
 * @param indicators 指标列表
 */
const calculateAlertDistribution = (indicators: StrategicIndicator[]) => {
  const severe = indicators.filter(i => i.progress < 30).length
  const moderate = indicators.filter(i => i.progress >= 30 && i.progress < 60).length
  const normal = indicators.filter(i => i.progress >= 60).length
  
  return { severe, moderate, normal, total: indicators.length }
}

/**
 * 计算部门汇总
 * @param indicators 指标列表
 */
const calculateDepartmentSummary = (indicators: StrategicIndicator[]) => {
  const deptMap = new Map<string, {
    total: number
    progress: number
    count: number
    alerts: number
  }>()
  
  indicators.forEach(indicator => {
    const dept = indicator.responsibleDept || '未分配'
    
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { total: 0, progress: 0, count: 0, alerts: 0 })
    }
    
    const data = deptMap.get(dept)!
    data.total += indicator.weight
    data.progress += indicator.progress
    data.count += 1
    if (indicator.progress < 60) data.alerts += 1
  })
  
  const result: Array<{
    dept: string
    progress: number
    totalIndicators: number
    alertCount: number
  }> = []
  
  deptMap.forEach((data, dept) => {
    const avgProgress = data.count > 0 ? Math.round(data.progress / data.count) : 0
    result.push({
      dept,
      progress: avgProgress,
      totalIndicators: data.count,
      alertCount: data.alerts
    })
  })
  
  return result.sort((a, b) => b.progress - a.progress)
}

// ============================================================================
// Property 2: Filter Logic Correctness
// ============================================================================

describe('Property 2: Filter Logic Correctness', () => {
  /**
   * **Validates: Requirements 1.2, 1.3, 2.2, 2.3**
   * 
   * *For any* list of indicators and any filter criteria (year, department, status),
   * applying the filter SHALL return exactly those indicators where all specified
   * filter conditions match, and the result set SHALL be a subset of the original list.
   */

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Year Filter Correctness (Requirement 1.2)', () => {
    it('should return only indicators matching the specified year', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 1, maxLength: 50 }),
          validYearArbitrary,
          (indicators, targetYear) => {
            const result = filterByYear(indicators, targetYear)
            
            // 所有结果的年份应该匹配目标年份
            result.forEach(indicator => {
              const indicatorYear = indicator.year || 2025
              expect(indicatorYear).toBe(targetYear)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return subset of original list when filtering by year', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 0, maxLength: 50 }),
          validYearArbitrary,
          (indicators, targetYear) => {
            const result = filterByYear(indicators, targetYear)
            
            // 结果应该是原列表的子集
            expect(result.length).toBeLessThanOrEqual(indicators.length)
            
            // 结果中的每个元素都应该在原列表中
            result.forEach(r => {
              expect(indicators.some(i => i.id === r.id)).toBe(true)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return all indicators when year filter is undefined', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 0, maxLength: 50 }),
          (indicators) => {
            const result = filterByYear(indicators, undefined)
            
            // 无过滤时应返回所有指标
            expect(result.length).toBe(indicators.length)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Department Filter Correctness (Requirement 1.2)', () => {
    it('should return only indicators matching the specified department', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 1, maxLength: 50 }),
          departmentNameArbitrary,
          (indicators, targetDept) => {
            const result = filterByDepartment(indicators, targetDept)
            
            // 所有结果的部门应该匹配目标部门
            result.forEach(indicator => {
              expect(indicator.responsibleDept).toBe(targetDept)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return subset of original list when filtering by department', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 0, maxLength: 50 }),
          departmentNameArbitrary,
          (indicators, targetDept) => {
            const result = filterByDepartment(indicators, targetDept)
            
            // 结果应该是原列表的子集
            expect(result.length).toBeLessThanOrEqual(indicators.length)
            
            // 结果中的每个元素都应该在原列表中
            result.forEach(r => {
              expect(indicators.some(i => i.id === r.id)).toBe(true)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return all indicators when department filter is undefined', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 0, maxLength: 50 }),
          (indicators) => {
            const result = filterByDepartment(indicators, undefined)
            
            expect(result.length).toBe(indicators.length)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Combined Filter Correctness (Requirements 1.2, 1.3)', () => {
    it('should return indicators matching ALL specified filter criteria', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 1, maxLength: 50 }),
          filterCriteriaArbitrary,
          (indicators, filters) => {
            const result = applyFilters(indicators, filters)
            
            // 验证每个结果都满足所有过滤条件
            result.forEach(indicator => {
              // 年份条件
              if (filters.year !== undefined) {
                const indicatorYear = indicator.year || 2025
                expect(indicatorYear).toBe(filters.year)
              }
              
              // 部门条件
              if (filters.department !== undefined) {
                expect(indicator.responsibleDept).toBe(filters.department)
              }
              
              // 状态条件
              if (filters.status !== undefined) {
                expect(indicator.progressApprovalStatus).toBe(filters.status)
              }
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return subset of original list for any combination of filters', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 0, maxLength: 50 }),
          filterCriteriaArbitrary,
          (indicators, filters) => {
            const result = applyFilters(indicators, filters)
            
            // 结果应该是原列表的子集
            expect(result.length).toBeLessThanOrEqual(indicators.length)
            
            // 结果中的每个元素都应该在原列表中
            result.forEach(r => {
              expect(indicators.some(i => i.id === r.id)).toBe(true)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be idempotent - applying same filter twice yields same result', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 0, maxLength: 50 }),
          filterCriteriaArbitrary,
          (indicators, filters) => {
            const result1 = applyFilters(indicators, filters)
            const result2 = applyFilters(result1, filters)
            
            // 对已过滤的结果再次应用相同过滤，结果应该相同
            expect(result2.length).toBe(result1.length)
            expect(result2.map(r => r.id).sort()).toEqual(result1.map(r => r.id).sort())
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Alert Level Filter Correctness (Requirement 1.3)', () => {
    it('should correctly classify indicators by alert level', () => {
      fc.assert(
        fc.property(
          validProgressArbitrary,
          (progress) => {
            const level = getAlertLevel(progress)
            
            // 验证分类逻辑
            if (progress < 30) {
              expect(level).toBe('severe')
            } else if (progress < 60) {
              expect(level).toBe('moderate')
            } else {
              expect(level).toBe('normal')
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return only indicators matching the specified alert level', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 1, maxLength: 50 }),
          fc.constantFrom('severe', 'moderate', 'normal') as fc.Arbitrary<'severe' | 'moderate' | 'normal'>,
          (indicators, targetLevel) => {
            const result = filterByAlertLevel(indicators, targetLevel)
            
            // 所有结果的预警级别应该匹配目标级别
            result.forEach(indicator => {
              expect(getAlertLevel(indicator.progress)).toBe(targetLevel)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should partition indicators into exactly three alert levels', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 0, maxLength: 50 }),
          (indicators) => {
            const severe = filterByAlertLevel(indicators, 'severe')
            const moderate = filterByAlertLevel(indicators, 'moderate')
            const normal = filterByAlertLevel(indicators, 'normal')
            
            // 三个级别的总数应该等于原列表长度
            expect(severe.length + moderate.length + normal.length).toBe(indicators.length)
            
            // 每个指标应该只属于一个级别（无重叠）
            const allIds = [...severe, ...moderate, ...normal].map(i => i.id)
            const uniqueIds = new Set(allIds)
            expect(uniqueIds.size).toBe(allIds.length)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


// ============================================================================
// Alert Distribution Calculation Tests (Requirement 1.3)
// ============================================================================

describe('Alert Distribution Calculation (Requirement 1.3)', () => {
  /**
   * **Validates: Requirement 1.3**
   * 
   * WHEN 预警分布图表显示时, THE Page_Data_Checker SHALL 验证
   * alertDistribution 数据基于实际指标进度计算
   */

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Alert Distribution Correctness', () => {
    it('should calculate correct alert distribution based on progress values', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 0, maxLength: 100 }),
          (indicators) => {
            const distribution = calculateAlertDistribution(indicators)
            
            // 手动计算预期值
            const expectedSevere = indicators.filter(i => i.progress < 30).length
            const expectedModerate = indicators.filter(i => i.progress >= 30 && i.progress < 60).length
            const expectedNormal = indicators.filter(i => i.progress >= 60).length
            
            // 验证计算结果
            expect(distribution.severe).toBe(expectedSevere)
            expect(distribution.moderate).toBe(expectedModerate)
            expect(distribution.normal).toBe(expectedNormal)
            expect(distribution.total).toBe(indicators.length)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have total equal to sum of all alert levels', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 0, maxLength: 100 }),
          (indicators) => {
            const distribution = calculateAlertDistribution(indicators)
            
            // 总数应该等于各级别之和
            expect(distribution.severe + distribution.moderate + distribution.normal)
              .toBe(distribution.total)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return zeros for empty indicator list', () => {
      const distribution = calculateAlertDistribution([])
      
      expect(distribution.severe).toBe(0)
      expect(distribution.moderate).toBe(0)
      expect(distribution.normal).toBe(0)
      expect(distribution.total).toBe(0)
    })

    it('should correctly handle boundary values (0, 30, 60, 100)', () => {
      // 测试边界值
      const boundaryIndicators: StrategicIndicator[] = [
        { ...createMinimalIndicator('1'), progress: 0 },   // severe
        { ...createMinimalIndicator('2'), progress: 29 },  // severe
        { ...createMinimalIndicator('3'), progress: 30 },  // moderate
        { ...createMinimalIndicator('4'), progress: 59 },  // moderate
        { ...createMinimalIndicator('5'), progress: 60 },  // normal
        { ...createMinimalIndicator('6'), progress: 100 }, // normal
      ]
      
      const distribution = calculateAlertDistribution(boundaryIndicators)
      
      expect(distribution.severe).toBe(2)   // 0, 29
      expect(distribution.moderate).toBe(2) // 30, 59
      expect(distribution.normal).toBe(2)   // 60, 100
      expect(distribution.total).toBe(6)
    })
  })
})


// ============================================================================
// Department Summary Calculation Tests (Requirement 1.2)
// ============================================================================

describe('Department Summary Calculation (Requirement 1.2)', () => {
  /**
   * **Validates: Requirement 1.2**
   * 
   * WHEN 部门完成情况图表渲染时, THE Page_Data_Checker SHALL 验证
   * departmentSummary 数据从 strategicStore 正确获取
   */

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Department Summary Correctness', () => {
    it('should group indicators by department correctly', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 1, maxLength: 50 }),
          (indicators) => {
            const summary = calculateDepartmentSummary(indicators)
            
            // 汇总中的总指标数应该等于原列表长度
            const totalIndicators = summary.reduce((sum, s) => sum + s.totalIndicators, 0)
            expect(totalIndicators).toBe(indicators.length)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate correct indicator count per department', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 1, maxLength: 50 }),
          (indicators) => {
            const summary = calculateDepartmentSummary(indicators)
            
            // 验证每个部门的指标数量
            summary.forEach(deptSummary => {
              const expectedCount = indicators.filter(
                i => (i.responsibleDept || '未分配') === deptSummary.dept
              ).length
              
              expect(deptSummary.totalIndicators).toBe(expectedCount)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate correct average progress per department', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 1, maxLength: 50 }),
          (indicators) => {
            const summary = calculateDepartmentSummary(indicators)
            
            // 验证每个部门的平均进度
            summary.forEach(deptSummary => {
              const deptIndicators = indicators.filter(
                i => (i.responsibleDept || '未分配') === deptSummary.dept
              )
              
              if (deptIndicators.length > 0) {
                const totalProgress = deptIndicators.reduce((sum, i) => sum + i.progress, 0)
                const expectedAvg = Math.round(totalProgress / deptIndicators.length)
                
                expect(deptSummary.progress).toBe(expectedAvg)
              }
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate correct alert count per department', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 1, maxLength: 50 }),
          (indicators) => {
            const summary = calculateDepartmentSummary(indicators)
            
            // 验证每个部门的预警数量（进度 < 60%）
            summary.forEach(deptSummary => {
              const deptIndicators = indicators.filter(
                i => (i.responsibleDept || '未分配') === deptSummary.dept
              )
              
              const expectedAlerts = deptIndicators.filter(i => i.progress < 60).length
              expect(deptSummary.alertCount).toBe(expectedAlerts)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should sort departments by progress in descending order', () => {
      fc.assert(
        fc.property(
          fc.array(validIndicatorArbitrary, { minLength: 2, maxLength: 50 }),
          (indicators) => {
            const summary = calculateDepartmentSummary(indicators)
            
            // 验证排序（按进度降序）
            for (let i = 1; i < summary.length; i++) {
              const prev = summary[i - 1]
              const curr = summary[i]
              if (prev && curr) {
                expect(prev.progress).toBeGreaterThanOrEqual(curr.progress)
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty array for empty indicator list', () => {
      const summary = calculateDepartmentSummary([])
      expect(summary).toEqual([])
    })

    it('should handle indicators with missing responsibleDept', () => {
      const indicatorsWithMissingDept: StrategicIndicator[] = [
        { ...createMinimalIndicator('1'), responsibleDept: '' },
        { ...createMinimalIndicator('2'), responsibleDept: '教务处' },
      ]
      
      const summary = calculateDepartmentSummary(indicatorsWithMissingDept)
      
      // 应该有两个部门：'未分配' 和 '教务处'
      expect(summary.length).toBe(2)
      
      const unassigned = summary.find(s => s.dept === '未分配')
      const assigned = summary.find(s => s.dept === '教务处')
      
      expect(unassigned?.totalIndicators).toBe(1)
      expect(assigned?.totalIndicators).toBe(1)
    })
  })
})


// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 创建最小化的指标对象（用于边界测试）
 */
function createMinimalIndicator(id: string): StrategicIndicator {
  return {
    id,
    name: `Test Indicator ${id}`,
    isQualitative: false,
    type1: '定量',
    type2: '基础性',
    progress: 50,
    createTime: '2025年01月01日',
    weight: 10,
    remark: '',
    canWithdraw: false,
    taskContent: 'Test Task',
    milestones: [],
    targetValue: 100,
    unit: '%',
    responsibleDept: '教务处',
    responsiblePerson: 'Test Person',
    status: 'active',
    isStrategic: true,
    ownerDept: '战略发展部',
    year: 2025,
    progressApprovalStatus: 'none'
  }
}
