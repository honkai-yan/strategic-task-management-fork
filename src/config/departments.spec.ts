import { describe, it, expect } from 'vitest'
import {
  COLLEGES,
  FUNCTIONAL_DEPARTMENTS,
  ALL_DEPARTMENTS,
  getAllColleges,
  getAllFunctionalDepartments,
  getAllDepartments,
  isValidDepartment
} from './departments'
import { isSecondaryCollege } from '@/utils/colors'

describe('Department Configuration', () => {
  describe('Constants', () => {
    it('should have correct number of colleges', () => {
      expect(COLLEGES).toHaveLength(8)
      expect(COLLEGES).toContain('马克思主义学院')
      expect(COLLEGES).toContain('计算机学院')
      expect(COLLEGES).toContain('工学院')
    })

    it('should have correct number of functional departments', () => {
      expect(FUNCTIONAL_DEPARTMENTS).toHaveLength(20)
      expect(FUNCTIONAL_DEPARTMENTS).toContain('战略发展部')
      expect(FUNCTIONAL_DEPARTMENTS).toContain('招生工作处')
      expect(FUNCTIONAL_DEPARTMENTS).toContain('就业创业指导中心')
    })

    it('should have all departments combined', () => {
      expect(ALL_DEPARTMENTS).toHaveLength(28) // 8 colleges + 20 functional depts
    })
  })

  describe('Getter Functions', () => {
    it('getAllColleges should return all colleges', () => {
      const colleges = getAllColleges()
      expect(colleges).toHaveLength(8)
      expect(colleges).toEqual([...COLLEGES])
    })

    it('getAllFunctionalDepartments should return all functional departments', () => {
      const depts = getAllFunctionalDepartments()
      expect(depts).toHaveLength(20)
      expect(depts).toEqual([...FUNCTIONAL_DEPARTMENTS])
    })

    it('getAllDepartments should return all departments', () => {
      const depts = getAllDepartments()
      expect(depts).toHaveLength(28)
      expect(depts).toEqual([...ALL_DEPARTMENTS])
    })
  })

  describe('Validation', () => {
    it('should validate college names correctly', () => {
      expect(isValidDepartment('计算机学院')).toBe(true)
      expect(isValidDepartment('商学院')).toBe(true)
      expect(isValidDepartment('不存在的学院')).toBe(false)
    })

    it('should validate functional department names correctly', () => {
      expect(isValidDepartment('招生工作处')).toBe(true)
      expect(isValidDepartment('战略发展部')).toBe(true)
      expect(isValidDepartment('不存在的部门')).toBe(false)
    })
  })

  describe('Integration with isSecondaryCollege', () => {
    it('should correctly identify colleges', () => {
      COLLEGES.forEach(college => {
        expect(isSecondaryCollege(college)).toBe(true)
      })
    })

    it('should correctly identify functional departments as not colleges', () => {
      FUNCTIONAL_DEPARTMENTS.forEach(dept => {
        expect(isSecondaryCollege(dept)).toBe(false)
      })
    })

    it('招生工作处 should not be identified as college', () => {
      expect(isSecondaryCollege('招生工作处')).toBe(false)
      expect(isValidDepartment('招生工作处')).toBe(true)
    })
  })

  describe('Department List Completeness', () => {
    it('should include all required colleges', () => {
      const requiredColleges = [
        '马克思主义学院',
        '工学院',
        '计算机学院',
        '商学院',
        '文理学院',
        '艺术与科技学院',
        '航空学院',
        '国际教育学院'
      ]

      requiredColleges.forEach(college => {
        expect(COLLEGES).toContain(college)
      })
    })

    it('should include all required functional departments', () => {
      const requiredDepts = [
        '党委办公室 | 党委统战部',
        '战略发展部',
        '教务处',
        '招生工作处',
        '就业创业指导中心'
      ]

      requiredDepts.forEach(dept => {
        expect(FUNCTIONAL_DEPARTMENTS).toContain(dept)
      })
    })
  })
})
