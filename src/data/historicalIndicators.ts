/**
 * 历史年份指标数据 - 兼容性导出
 * 
 * 注意：数据已迁移到 src/data/indicators/ 目录
 * 每年数据独立一个文件，便于维护和读取
 * 
 * 此文件保留用于向后兼容，请使用新路径：
 * import { indicators2023, indicators2024, indicators2025, indicators2026 } from '@/data/indicators'
 */

// 从新位置重新导出
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
