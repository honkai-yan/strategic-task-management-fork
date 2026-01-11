# 数据同步方案

> 版本: 1.0.0  
> 更新时间: 2026-01-11

## 现状分析

### 前端数据 (Pinia Store / localStorage)
- 战略任务: 3 条 (2025-2026年度)
- 指标: 约 50+ 条 (含多年度数据)
- 里程碑: 每个指标 4-12 个
- 组织机构: 27 个部门/学院

### 数据库现有数据
| 表 | 数量 | 说明 |
|----|------|------|
| org | 10 | 基础组织数据 |
| app_user | 10 | 测试用户 |
| assessment_cycle | 1 | 2025年度 |
| strategic_task | 4 | 测试任务 |
| indicator | 19 | 测试指标 |
| milestone | 14 | 测试里程碑 |
| progress_report | 2 | 测试报告 |
| audit_log | 22406 | 审计日志 |

---

## 同步策略

### 方案选择: 增量同步 (推荐)

保留现有数据库结构和基础数据，仅同步前端新增/修改的数据。

**优点:**
- 风险低，不影响现有数据
- 可逐步验证
- 支持回滚

**步骤:**

#### 第一阶段: 组织机构同步
1. 对比前端 `FUNCTIONAL_DEPARTMENTS` 与数据库 `org` 表
2. 新增缺失的部门/学院
3. 不修改已存在的记录

#### 第二阶段: 战略任务同步
1. 创建 2026 年度考核周期
2. 同步前端战略任务到数据库
3. 建立 task_id 映射关系

#### 第三阶段: 指标同步
1. 按年度同步指标数据
2. 建立 indicator_id 映射
3. 同步里程碑数据

#### 第四阶段: 进度数据同步
1. 同步进度报告
2. 同步审批状态
3. 同步审计日志

---

## 字段映射详情

### 组织机构 (org)

| 前端部门名称 | 数据库 org_type | 需新增 |
|-------------|-----------------|--------|
| 战略发展部 | STRATEGY_DEPT | ❌ 已存在 |
| 就业创业指导中心 | FUNCTION_DEPT | ✅ 需新增 |
| 招生工作处 | FUNCTION_DEPT | ✅ 需新增 |
| 学校综合办公室 | FUNCTION_DEPT | ✅ 需新增 |
| 数字校园建设办公室 | FUNCTION_DEPT | ✅ 需新增 |
| 教务处 | FUNCTION_DEPT | ❌ 已存在 |
| 计算机学院 | COLLEGE | ❌ 已存在 |
| 商学院 | COLLEGE | ❌ 已存在 |
| 工学院 | COLLEGE | ✅ 需新增 |
| 文理学院 | COLLEGE | ✅ 需新增 |
| 艺术与科技学院 | COLLEGE | ✅ 需新增 |
| 航空学院 | COLLEGE | ✅ 需新增 |
| 国际教育学院 | COLLEGE | ✅ 需新增 |
| 马克思主义学院 | COLLEGE | ✅ 需新增 |

### 指标状态映射

| 前端 status | 数据库 indicator_status |
|-------------|------------------------|
| draft | DRAFT |
| active | ACTIVE |
| archived | ARCHIVED |
| distributed | DISTRIBUTED |

### 里程碑状态映射

| 前端 status | 数据库 milestone_status |
|-------------|------------------------|
| pending | NOT_STARTED |
| completed | COMPLETED |
| overdue | OVERDUE |

### 审批状态映射

| 前端 progressApprovalStatus | 数据库 report_status |
|----------------------------|---------------------|
| none / draft | DRAFT |
| pending | PENDING |
| approved | APPROVED |
| rejected | REJECTED |

---

## 执行脚本

### 1. 新增组织机构

```sql
-- 职能部门
INSERT INTO org (org_name, org_type, sort_order) VALUES
('就业创业指导中心', 'FUNCTION_DEPT', 20),
('招生工作处', 'FUNCTION_DEPT', 21),
('学校综合办公室', 'FUNCTION_DEPT', 22),
('数字校园建设办公室', 'FUNCTION_DEPT', 23),
('党委办公室 | 党委统战部', 'FUNCTION_DEPT', 24),
('纪委办公室 | 监察处', 'FUNCTION_DEPT', 25),
('党委宣传部 | 宣传策划部', 'FUNCTION_DEPT', 26),
('党委组织部 | 党委教师工作部', 'FUNCTION_DEPT', 27),
('人力资源部', 'FUNCTION_DEPT', 28),
('党委学工部 | 学生工作处', 'FUNCTION_DEPT', 29),
('党委保卫部 | 保卫处', 'FUNCTION_DEPT', 30),
('科技处', 'FUNCTION_DEPT', 31),
('财务部', 'FUNCTION_DEPT', 32),
('实验室建设管理处', 'FUNCTION_DEPT', 33),
('图书馆 | 档案馆', 'FUNCTION_DEPT', 34),
('后勤资产处', 'FUNCTION_DEPT', 35),
('继续教育部', 'FUNCTION_DEPT', 36),
('国际合作与交流处', 'FUNCTION_DEPT', 37)
ON CONFLICT DO NOTHING;

-- 二级学院
INSERT INTO org (org_name, org_type, sort_order) VALUES
('工学院', 'COLLEGE', 50),
('文理学院', 'COLLEGE', 51),
('艺术与科技学院', 'COLLEGE', 52),
('航空学院', 'COLLEGE', 53),
('国际教育学院', 'COLLEGE', 54),
('马克思主义学院', 'COLLEGE', 55)
ON CONFLICT DO NOTHING;
```

### 2. 创建 2026 年度考核周期

```sql
INSERT INTO assessment_cycle (cycle_name, year, start_date, end_date, is_active)
VALUES ('2026年度考核', 2026, '2026-01-01', '2026-12-31', true)
ON CONFLICT DO NOTHING;
```

---

## 注意事项

1. **数据备份**: 执行任何修改前先备份数据库
2. **ID 映射**: 前端使用字符串 ID (如 "101-1")，数据库使用 BIGINT，需建立映射表
3. **事务处理**: 批量操作使用事务，确保原子性
4. **审计日志**: 所有数据变更需记录到 audit_log
5. **渐进式迁移**: 先在测试环境验证，再同步生产数据

---

## 下一步行动

1. ✅ 完成数据库表结构文档
2. ✅ 完成 API 接口文档
3. ✅ 完成数据同步方案
4. ⏳ 等待确认后执行组织机构同步
5. ⏳ 实现前端 API 调用层
6. ⏳ 替换 localStorage 为数据库存储
