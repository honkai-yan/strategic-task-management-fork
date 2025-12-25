/**
 * 部门配置文件
 * 统一管理全校所有院系和职能部门
 *
 * 系统三级权限结构：
 * 1. 战略发展部 (strategic_dept) - 系统管理员，最高权限
 * 2. 职能部门 (functional_dept) - 中层管理，指标发布与审批
 * 3. 二级学院 (secondary_college) - 基层单位，进度填报
 */

// 战略发展部（系统管理员，不属于职能部门）
export const STRATEGIC_DEPT = '战略发展部' as const

// 二级学院列表
export const COLLEGES = [
  '马克思主义学院',
  '工学院',
  '计算机学院',
  '商学院',
  '文理学院',
  '艺术与科技学院',
  '航空学院',
  '国际教育学院'
] as const

// 职能部门列表（不包含战略发展部）
export const FUNCTIONAL_DEPARTMENTS = [
  '党委办公室 | 党委统战部',
  '纪委办公室 | 监察处',
  '党委宣传部 | 宣传策划部',
  '党委组织部 | 党委教师工作部',
  '人力资源部',
  '党委学工部 | 学生工作处',
  '党委保卫部 | 保卫处',
  '学校综合办公室',
  '教务处',
  '科技处',
  '财务部',
  '招生工作处',
  '就业创业指导中心',
  '实验室建设管理处',
  '数字校园建设办公室',
  '图书馆 | 档案馆',
  '后勤资产处',
  '继续教育部',
  '国际合作与交流处'
] as const

// 所有部门（包括战略发展部、职能部门和学院）
export const ALL_DEPARTMENTS = [STRATEGIC_DEPT, ...FUNCTIONAL_DEPARTMENTS, ...COLLEGES] as const

// 类型定义
export type College = typeof COLLEGES[number]
export type FunctionalDepartment = typeof FUNCTIONAL_DEPARTMENTS[number]
export type Department = typeof ALL_DEPARTMENTS[number]

/**
 * 获取战略发展部名称
 */
export function getStrategicDept(): string {
  return STRATEGIC_DEPT
}

/**
 * 获取所有二级学院
 */
export function getAllColleges(): string[] {
  return [...COLLEGES]
}

/**
 * 获取所有职能部门（不含战略发展部）
 */
export function getAllFunctionalDepartments(): string[] {
  return [...FUNCTIONAL_DEPARTMENTS]
}

/**
 * 获取所有部门（含战略发展部）
 */
export function getAllDepartments(): string[] {
  return [...ALL_DEPARTMENTS]
}

/**
 * 判断是否为战略发展部
 */
export function isStrategicDept(dept: string): boolean {
  return dept === STRATEGIC_DEPT
}

/**
 * 判断是否为职能部门
 */
export function isFunctionalDept(dept: string): boolean {
  return FUNCTIONAL_DEPARTMENTS.includes(dept as FunctionalDepartment)
}

/**
 * 判断是否为二级学院
 */
export function isCollege(dept: string): boolean {
  return COLLEGES.includes(dept as College)
}

/**
 * 判断是否为有效的部门
 */
export function isValidDepartment(dept: string): boolean {
  return ALL_DEPARTMENTS.includes(dept as Department)
}
