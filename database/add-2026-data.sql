-- ============================================
-- SISM 2026年度数据补充脚本
-- 基于2025年数据结构，目标值提升5-10%
-- 执行时间：2026年1月
-- ============================================

-- 插入2026年考核周期
INSERT INTO assessment_cycle (cycle_name, year, start_date, end_date, description) VALUES
('2026年度考核周期', 2026, '2026-01-01', '2026-12-31', '2026年度战略指标考核周期');

-- 获取2026年周期ID（假设为2，如果数据库中已有其他周期，请调整）
-- 在实际执行时，可以用 SELECT cycle_id FROM assessment_cycle WHERE year = 2026; 获取

-- 插入战略任务（复制2025年任务结构，更新年份）
INSERT INTO strategic_task (cycle_id, task_name, task_desc, task_type, org_id, created_by_org_id, sort_order) VALUES
(2, '全力促进毕业生多元化高质量就业创业', '围绕毕业生就业质量提升，多措并举促进高质量就业创业', 'DEVELOPMENT', 2, 1, 1),
(2, '推进校友工作提质增效，赋能校友成长', '建立完善校友工作机制，提升校友服务质量', 'DEVELOPMENT', 2, 1, 2),
(2, '根据学校整体部署', '按照学校整体战略部署推进信息化建设等相关工作', 'BASIC', 2, 1, 3),
(2, '深化教学改革，提升人才培养质量', '全面提升教学质量，推进课程改革与教学创新', 'DEVELOPMENT', 2, 1, 4),
(2, '提升科研水平，增强学术影响力', '加强科研平台建设，提升科研产出质量', 'DEVELOPMENT', 3, 1, 5);

-- 插入一级指标（战略发展部→职能部门）
-- 注意：task_id 需要根据实际插入后的ID调整，这里假设从5开始

-- 就业创业指导中心指标
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(5, NULL, 'STRAT_TO_FUNC', 1, 2, '毕业生就业率不低于90%', 35.00, 1, 2026),
(5, NULL, 'STRAT_TO_FUNC', 1, 2, '优质就业比例达15%', 22.00, 2, 2026);

-- 教务处指标
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(7, NULL, 'STRAT_TO_FUNC', 1, 2, '课程优良率达85%以上', 30.00, 1, 2026),
(7, NULL, 'STRAT_TO_FUNC', 1, 2, '新增省级一流课程5门', 25.00, 2, 2026);

-- 科技处指标
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(8, NULL, 'STRAT_TO_FUNC', 1, 3, '发表高水平论文50篇以上', 25.00, 1, 2026),
(8, NULL, 'STRAT_TO_FUNC', 1, 3, '获批省部级科研项目7项', 22.00, 2, 2026);

-- 人力资源部指标
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(8, NULL, 'STRAT_TO_FUNC', 1, 4, '引进高层次人才15人', 25.00, 1, 2026);

-- 党委学工部指标
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(7, NULL, 'STRAT_TO_FUNC', 1, 5, '学生满意度达90%以上', 25.00, 1, 2026);

-- 财务部指标
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(7, NULL, 'STRAT_TO_FUNC', 1, 11, '预算执行率达97%以上', 15.00, 1, 2026);

-- 图书馆指标
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(7, NULL, 'STRAT_TO_FUNC', 1, 16, '新增电子资源数据库7个', 12.00, 1, 2026);

-- 党委办公室指标
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(7, NULL, 'STRAT_TO_FUNC', 1, 1, '党员发展质量达标率97%以上', 20.00, 1, 2026);

-- 插入二级指标（职能部门→二级学院）
-- 注意：parent_indicator_id 需要根据上面插入的一级指标ID调整

-- 计算机学院指标（假设就业率指标ID为23）
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(5, 23, 'FUNC_TO_COLLEGE', 2, 6, '计算机学院就业率达93%', 30.00, 1, 2026),
(7, 25, 'FUNC_TO_COLLEGE', 2, 6, '计算机学院课程优良率达88%', 25.00, 1, 2026),
(8, 27, 'FUNC_TO_COLLEGE', 3, 6, '计算机学院发表高水平论文16篇', 22.00, 1, 2026);

-- 商学院指标
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(5, 23, 'FUNC_TO_COLLEGE', 2, 7, '商学院就业率达90%', 28.00, 2, 2026),
(7, 25, 'FUNC_TO_COLLEGE', 2, 7, '商学院课程优良率达82%', 23.00, 2, 2026);

-- 工学院指标
INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year) VALUES
(7, 25, 'FUNC_TO_COLLEGE', 2, 10, '工学院课程优良率达84%', 24.00, 3, 2026),
(8, 27, 'FUNC_TO_COLLEGE', 3, 10, '工学院发表高水平论文12篇', 20.00, 2, 2026);

-- 插入里程碑（为部分指标添加季度里程碑）
-- 注意：indicator_id 需要根据实际插入的指标ID调整

-- 示例：为就业率指标添加里程碑（假设indicator_id为23）
INSERT INTO milestone (indicator_id, milestone_name, milestone_desc, due_date, weight_percent, sort_order) VALUES
(23, 'Q1-就业数据摸底', '完成就业数据收集与分析', '2026-03-31', 20.00, 1),
(23, 'Q2-就业指导强化', '开展就业指导培训与咨询', '2026-06-30', 30.00, 2),
(23, 'Q3-就业推进冲刺', '加强就业困难学生帮扶', '2026-09-30', 30.00, 3),
(23, 'Q4-目标达成验收', '完成年度就业率目标', '2026-12-31', 20.00, 4);

-- 示例：为课程优良率指标添加里程碑（假设indicator_id为25）
INSERT INTO milestone (indicator_id, milestone_name, milestone_desc, due_date, weight_percent, sort_order) VALUES
(25, 'Q1-教学质量调研', '完成教学质量现状调研', '2026-03-31', 20.00, 1),
(25, 'Q2-课程改革试点', '启动课程改革试点工作', '2026-06-30', 30.00, 2),
(25, 'Q3-质量提升推进', '全面推进教学质量提升', '2026-09-30', 30.00, 3),
(25, 'Q4-达标验收', '完成年度课程优良率目标', '2026-12-31', 20.00, 4);

-- 插入预警规则（复制2025年规则）
INSERT INTO alert_rule (cycle_id, name, severity, gap_threshold, is_enabled) VALUES
(2, '轻度预警', 'INFO', 10.00, TRUE),
(2, '中度预警', 'WARNING', 20.00, TRUE),
(2, '严重预警', 'CRITICAL', 30.00, TRUE);

-- 插入预警窗口（2026年季度检查）
INSERT INTO alert_window (cycle_id, name, cutoff_date, is_default) VALUES
(2, 'Q1季度检查', '2026-03-31', FALSE),
(2, 'Q2季度检查', '2026-06-30', FALSE),
(2, 'Q3季度检查', '2026-09-30', FALSE),
(2, '年度终检', '2026-12-31', TRUE);

-- ============================================
-- 执行说明
-- ============================================
-- 1. 本脚本假设2026年考核周期ID为2，实际执行时请根据数据库情况调整
-- 2. task_id、indicator_id 等外键需要根据实际插入后的ID进行调整
-- 3. 建议在测试环境先执行，验证无误后再在生产环境执行
-- 4. 执行前请备份数据库
-- 5. 可以使用以下查询验证插入结果：
--    SELECT * FROM assessment_cycle WHERE year = 2026;
--    SELECT * FROM strategic_task WHERE cycle_id = 2;
--    SELECT * FROM indicator WHERE year = 2026;

-- ============================================
-- 完成
-- ============================================
-- 2026年度数据补充完成
-- 日期: 2026-01-04
