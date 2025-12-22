import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from './dashboard'
import { useAuthStore } from './auth'
import { useStrategicStore } from './strategic'
import { isSecondaryCollege } from '@/utils/colors'

describe('Dashboard Store - Three-tier Drilldown', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Role-based data filtering', () => {
    it('strategic_dept should see all indicators', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()
      const strategicStore = useStrategicStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      const visibleCount = dashboardStore.visibleIndicators.length
      const totalCount = strategicStore.indicators.length

      expect(visibleCount).toBe(totalCount)
      expect(visibleCount).toBeGreaterThan(0)
    })

    it('functional_dept should only see own department and colleges', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '2',
        username: 'func_user',
        name: '就业处李四',
        role: 'functional_dept',
        department: '就业创业指导中心',
        email: 'li@example.com'
      }

      const visible = dashboardStore.visibleIndicators

      // Should include functional department's own indicators
      expect(visible.some(i => i.responsibleDept === '就业创业指导中心')).toBe(true)

      // Should include college indicators assigned by this department
      expect(visible.some(i => i.ownerDept === '就业创业指导中心' && isSecondaryCollege(i.responsibleDept))).toBe(true)

      // Should NOT include other functional departments
      expect(visible.every(i =>
        i.responsibleDept === '就业创业指导中心' ||
        i.ownerDept === '就业创业指导中心'
      )).toBe(true)
    })

    it('secondary_college should only see own indicators', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '3',
        username: 'college_user',
        name: '计算机学院王五',
        role: 'secondary_college',
        department: '计算机学院',
        email: 'wang@example.com'
      }

      const visible = dashboardStore.visibleIndicators

      // All visible indicators should belong to this college
      expect(visible.every(i => i.responsibleDept === '计算机学院')).toBe(true)
      expect(visible.length).toBeGreaterThan(0)
    })
  })

  describe('Drill-down functionality', () => {
    it('should drill down to functional department', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      dashboardStore.drillDownToDepartment('就业创业指导中心', 'functional')

      expect(dashboardStore.currentOrgLevel).toBe('functional')
      expect(dashboardStore.selectedFunctionalDept).toBe('就业创业指导中心')
      expect(dashboardStore.breadcrumbs.length).toBe(2)
      expect(dashboardStore.breadcrumbs[1].label).toBe('就业创业指导中心')
    })

    it('should drill down to college', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      // First drill down to functional department
      dashboardStore.drillDownToDepartment('就业创业指导中心', 'functional')

      // Then drill down to college
      dashboardStore.drillDownToDepartment('计算机学院', 'college')

      expect(dashboardStore.currentOrgLevel).toBe('college')
      expect(dashboardStore.selectedCollege).toBe('计算机学院')
      expect(dashboardStore.breadcrumbs.length).toBe(3)
      expect(dashboardStore.breadcrumbs[2].label).toBe('计算机学院')
    })

    it('should filter indicators after drill-down', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      const beforeDrillDown = dashboardStore.visibleIndicators.length

      dashboardStore.drillDownToDepartment('计算机学院', 'college')

      const afterDrillDown = dashboardStore.visibleIndicators.length

      expect(afterDrillDown).toBeLessThan(beforeDrillDown)
      expect(dashboardStore.visibleIndicators.every(i =>
        i.responsibleDept === '计算机学院'
      )).toBe(true)
    })
  })

  describe('Department comparison calculation', () => {
    it('should compute department comparison correctly', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      const comparison = dashboardStore.departmentComparison

      expect(comparison.length).toBeGreaterThan(0)

      // Each item should have required fields
      comparison.forEach(item => {
        expect(item).toHaveProperty('dept')
        expect(item).toHaveProperty('progress')
        expect(item).toHaveProperty('score')
        expect(item).toHaveProperty('completionRate')
        expect(item).toHaveProperty('totalIndicators')
        expect(item).toHaveProperty('completedIndicators')
        expect(item).toHaveProperty('alertCount')
        expect(item).toHaveProperty('rank')
        expect(item).toHaveProperty('status')
      })
    })

    it('should rank departments correctly (highest progress first)', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      const comparison = dashboardStore.departmentComparison

      if (comparison.length >= 2) {
        // First department should have rank 1
        expect(comparison[0].rank).toBe(1)

        // Progress should be in descending order
        for (let i = 0; i < comparison.length - 1; i++) {
          expect(comparison[i].progress).toBeGreaterThanOrEqual(comparison[i + 1].progress)
        }

        // Ranks should be sequential
        comparison.forEach((item, index) => {
          expect(item.rank).toBe(index + 1)
        })
      }
    })

    it('should calculate status based on progress thresholds', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      const comparison = dashboardStore.departmentComparison

      comparison.forEach(item => {
        if (item.progress >= 90) {
          expect(item.status).toBe('success')
        } else if (item.progress >= 70) {
          expect(item.status).toBe('warning')
        } else {
          expect(item.status).toBe('danger')
        }
      })
    })
  })

  describe('Breadcrumb navigation', () => {
    it('should navigate back to organization level', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      // Drill down to functional department
      dashboardStore.drillDownToDepartment('就业创业指导中心', 'functional')
      expect(dashboardStore.breadcrumbs.length).toBe(2)

      // Navigate back to organization level
      dashboardStore.navigateToBreadcrumb(0)

      expect(dashboardStore.currentOrgLevel).toBe('strategy')
      expect(dashboardStore.selectedFunctionalDept).toBeUndefined()
      expect(dashboardStore.breadcrumbs.length).toBe(1)
    })

    it('should reset filters when navigating to higher level', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      // Apply some filters
      dashboardStore.applyFilter({
        department: '就业创业指导中心',
        indicatorType: '定量'
      })

      // Drill down to college
      dashboardStore.drillDownToDepartment('计算机学院', 'college')

      // Navigate back to organization level
      dashboardStore.navigateToBreadcrumb(0)

      // Filters should be reset
      expect(dashboardStore.filters).toEqual({})
      expect(dashboardStore.selectedFunctionalDept).toBeUndefined()
      expect(dashboardStore.selectedCollege).toBeUndefined()
    })
  })

  describe('Sankey data generation', () => {
    it('should generate sankey data with nodes and links', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      const sankeyData = dashboardStore.sankeyData

      expect(sankeyData).toHaveProperty('nodes')
      expect(sankeyData).toHaveProperty('links')
      expect(Array.isArray(sankeyData.nodes)).toBe(true)
      expect(Array.isArray(sankeyData.links)).toBe(true)
    })

    it('should have correct link structure (source -> target -> value)', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      const sankeyData = dashboardStore.sankeyData

      sankeyData.links.forEach(link => {
        expect(link).toHaveProperty('source')
        expect(link).toHaveProperty('target')
        expect(link).toHaveProperty('value')
        expect(typeof link.source).toBe('string')
        expect(typeof link.target).toBe('string')
        expect(typeof link.value).toBe('number')
        expect(link.value).toBeGreaterThan(0)
      })
    })

    it('should reflect task flow from functional dept to colleges', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()
      const strategicStore = useStrategicStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      const sankeyData = dashboardStore.sankeyData

      // Check if there are links from functional depts to colleges
      const collegeIndicators = strategicStore.indicators.filter(i =>
        isSecondaryCollege(i.responsibleDept) && i.ownerDept
      )

      if (collegeIndicators.length > 0) {
        // There should be at least one link where target is a college
        const hasCollegeLink = sankeyData.links.some(link =>
          isSecondaryCollege(link.target)
        )
        expect(hasCollegeLink).toBe(true)
      }
    })
  })

  describe('Task source distribution (for colleges)', () => {
    it('should calculate task source distribution for college role', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '3',
        username: 'college_user',
        name: '计算机学院王五',
        role: 'secondary_college',
        department: '计算机学院',
        email: 'wang@example.com'
      }

      const sourceDistribution = dashboardStore.taskSourceDistribution

      expect(Array.isArray(sourceDistribution)).toBe(true)

      sourceDistribution.forEach(item => {
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('value')
        expect(item).toHaveProperty('percentage')
        expect(typeof item.name).toBe('string')
        expect(typeof item.value).toBe('number')
        expect(typeof item.percentage).toBe('number')
        expect(item.value).toBeGreaterThan(0)
      })
    })

    it('should sum to 100% for percentages', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '3',
        username: 'college_user',
        name: '计算机学院王五',
        role: 'secondary_college',
        department: '计算机学院',
        email: 'wang@example.com'
      }

      const sourceDistribution = dashboardStore.taskSourceDistribution

      if (sourceDistribution.length > 0) {
        const totalPercentage = sourceDistribution.reduce((sum, item) => sum + item.percentage, 0)
        expect(totalPercentage).toBeCloseTo(100, 1) // Allow 0.1% tolerance for rounding
      }
    })
  })

  describe('Filter functionality', () => {
    it('should apply filters correctly', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      const beforeFilter = dashboardStore.visibleIndicators.length

      dashboardStore.applyFilter({ indicatorType: '定量' })

      const afterFilter = dashboardStore.visibleIndicators.length

      expect(afterFilter).toBeLessThanOrEqual(beforeFilter)
      expect(dashboardStore.visibleIndicators.every(i => i.type1 === '定量')).toBe(true)
    })

    it('should reset filters correctly', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()
      const strategicStore = useStrategicStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      // Apply filter
      dashboardStore.applyFilter({ indicatorType: '定量' })
      expect(dashboardStore.filters.indicatorType).toBe('定量')

      // Reset filters
      dashboardStore.resetFilters()

      expect(dashboardStore.filters).toEqual({})
      expect(dashboardStore.visibleIndicators.length).toBe(strategicStore.indicators.length)
    })

    it('should handle alert level filter', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      dashboardStore.applyFilter({ alertLevel: 'severe' })

      // All visible indicators should have progress < 30%
      dashboardStore.visibleIndicators.forEach(i => {
        expect(i.progress).toBeLessThan(30)
      })
    })
  })

  describe('Department summary', () => {
    it('should generate department summary with progress data', () => {
      const authStore = useAuthStore()
      const dashboardStore = useDashboardStore()

      authStore.user = {
        id: '1',
        username: 'strategy_user',
        name: '战略部张三',
        role: 'strategic_dept',
        department: '战略发展部',
        email: 'zhang@example.com'
      }

      const summary = dashboardStore.departmentSummary

      expect(Array.isArray(summary)).toBe(true)

      summary.forEach(dept => {
        expect(dept).toHaveProperty('name')
        expect(dept).toHaveProperty('progress')
        expect(typeof dept.name).toBe('string')
        expect(typeof dept.progress).toBe('number')
        expect(dept.progress).toBeGreaterThanOrEqual(0)
        expect(dept.progress).toBeLessThanOrEqual(100)
      })
    })
  })
})
