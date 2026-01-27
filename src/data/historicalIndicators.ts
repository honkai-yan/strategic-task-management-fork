/**
 * 历史年份指标数据 - 兼容性导出
 * 
 * @deprecated 此文件已废弃，请使用以下导入方式：
 * - 完整数据：import { indicators2023, ... } from '@/data/indicators'
 * - 降级数据：import { allMockIndicators, ... } from '@/data/mockIndicators'
 * 
 * 降级机制使用 mockIndicators.ts 中的精简数据
 */

// 从原位置重新导出（保持向后兼容）
export {
  indicators2023,
  indicators2024,
  indicators2025,
  indicators2026,
  allHistoricalIndicators,
  allIndicators,
  generateQuarterlyMilestones,
  generateHistoricalMilestones,
} from './indicators'

// 从新的统一模拟数据文件导出
export {
  allMockIndicators,
  mockIndicators2026,
  mockIndicators2025,
  mockDashboardData,
  mockDepartmentProgress,
  mockOrgTree,
  getMockIndicatorsByYear,
  getCurrentYearMockIndicators
} from './mockIndicators'
