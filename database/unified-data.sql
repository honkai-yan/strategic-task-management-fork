-- ============================================
-- SISM 统一数据管理脚本
-- 包含完整的组织结构和历史数据（2023/2024/2026年）
-- 基于 src/data/historicalIndicators.ts 生成
-- 生成时间：2026-01-04
-- ============================================

-- ============================================
-- 第一部分：组织结构数据
-- ============================================

-- 清理现有数据（可选，谨慎使用）
-- TRUNCATE TABLE audit_log, adhoc_task_indicator_map, adhoc_task_target, adhoc_task, 
--   alert_event, alert_rule, alert_window, approval_record, progress_report, 
--   milestone, indicator, strategic_task, assessment_cycle, app_user, org CASCADE;

-- 插入战略发展部
INSERT INTO org (org_id, org_name, org_type, parent_org_id, is_active, sort_order) VALUES
(1, '战略发展部', 'STRATEGY_DEPT', NULL, TRUE, 1)
ON CONFLICT (org_id) DO NOTHING;

-- 插入职能部门（19个）
INSERT INTO org (org_id, org_name, org_type, parent_org_id, is_active, sort_order) VALUES
(2, '教务处', 'FUNCTION_DEPT', NULL, TRUE, 2),
(3, '科技处', 'FUNCTION_DEPT', NULL, TRUE, 3),
(4, '人力资源部', 'FUNCTION_DEPT', NULL, TRUE, 4),
(5, '党委学工部 | 学生工作处', 'FUNCTION_DEPT', NULL, TRUE, 5),
(6, '就业创业指导中心', 'FUNCTION_DEPT', NULL, TRUE, 6),
(7, '财务部', 'FUNCTION_DEPT', NULL, TRUE, 7),
(8, '招生工作处', 'FUNCTION_DEPT', NULL, TRUE, 8),
(9, '数字校园建设办公室', 'FUNCTION_DEPT', NULL, TRUE, 9),
(10, '图书馆 | 档案馆', 'FUNCTION_DEPT', NULL, TRUE, 10),
(11, '国际合作与交流处', 'FUNCTION_DEPT', NULL, TRUE, 11),
(12, '党委办公室 | 党委统战部', 'FUNCTION_DEPT', NULL, TRUE, 12),
(13, '纪委办公室 | 监察处', 'FUNCTION_DEPT', NULL, TRUE, 13),
(14, '党委宣传部 | 宣传策划部', 'FUNCTION_DEPT', NULL, TRUE, 14),
(15, '党委组织部 | 党委教师工作部', 'FUNCTION_DEPT', NULL, TRUE, 15),
(16, '党委保卫部 | 保卫处', 'FUNCTION_DEPT', NULL, TRUE, 16),
(17, '学校综合办公室', 'FUNCTION_DEPT', NULL, TRUE, 17),
(18, '实验室建设管理处', 'FUNCTION_DEPT', NULL, TRUE, 18),
(19, '后勤资产处', 'FUNCTION_DEPT', NULL, TRUE, 19),
(20, '继续教育部', 'FUNCTION_DEPT', NULL, TRUE, 20)
ON CONFLICT (org_id) DO NOTHING;

-- 插入二级学院（8个）
INSERT INTO org (org_id, org_name, org_type, parent_org_id, is_active, sort_order) VALUES
(21, '马克思主义学院', 'COLLEGE', NULL, TRUE, 21),
(22, '工学院', 'COLLEGE', NULL, TRUE, 22),
(23, '计算机学院', 'COLLEGE', NULL, TRUE, 23),
(24, '商学院', 'COLLEGE', NULL, TRUE, 24),
(25, '文理学院', 'COLLEGE', NULL, TRUE, 25),
(26, '艺术与科技学院', 'COLLEGE', NULL, TRUE, 26),
(27, '航空学院', 'COLLEGE', NULL, TRUE, 27),
(28, '国际教育学院', 'COLLEGE', NULL, TRUE, 28)
ON CONFLICT (org_id) DO NOTHING;

-- 重置序列（确保后续插入不冲突）
SELECT setval('org_org_id_seq', 100, false);

-- 插入用户数据（密码为 123456 的 bcrypt 哈希）
INSERT INTO app_user (user_id, username, real_name, org_id, password_hash) VALUES
(1, 'admin', '系统管理员', 1, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(2, 'jiaowu', '陈处长', 2, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(3, 'keyan', '林处长', 3, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(4, 'renshi', '赵主任', 4, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(5, 'xuesheng', '王部长', 5, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(6, 'jiuye', '张老师', 6, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(7, 'computer', '赵院长', 23, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(8, 'business', '钱院长', 24, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(9, 'engineering', '李院长', 22, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(10, 'marxism', '马院长', 21, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(11, 'liberal', '文院长', 25, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(12, 'art', '艺院长', 26, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(13, 'aviation', '航院长', 27, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi'),
(14, 'international', '国院长', 28, '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe/YnHOl4EKMry1xLzJypGGi')
ON CONFLICT (user_id) DO NOTHING;

SELECT setval('app_user_user_id_seq', 100, false);

-- ============================================
-- 第二部分：2023年度数据
-- ============================================

-- 插入2023年考核周期
INSERT INTO assessment_cycle (cycle_id, cycle_name, year, start_date, end_date, description) VALUES
(1, '2023年度考核周期', 2023, '2023-01-01', '2023-12-31', '2023年度战略指标考核周期')
ON CONFLICT (cycle_id) DO NOTHING;

-- 插入2023年战略任务
INSERT INTO strategic_task (task_id, cycle_id, task_name, task_desc, task_type, org_id, created_by_org_id, sort_order) VALUES
(1, 1, '推进教学质量提升工程', '全面提升本科教学质量，推进课程改革与教学创新', 'DEVELOPMENT', 2, 1, 1),
(2, 1, '加强科研创新能力建设', '加强科研平台建设，提升科研产出质量', 'DEVELOPMENT', 3, 1, 2),
(3, 1, '深化产教融合校企合作', '围绕毕业生就业质量提升，多措并举促进高质量就业', 'DEVELOPMENT', 6, 1, 3)
ON CONFLICT (task_id) DO NOTHING;

-- 插入2023年一级指标（职能部门）
INSERT INTO indicator (indicator_id, task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year, status) VALUES
-- 教务处指标
(101, 1, NULL, 'STRAT_TO_FUNC', 1, 2, '课程优良率达80%以上', 30.00, 1, 2023, 'ARCHIVED'),
(102, 1, NULL, 'STRAT_TO_FUNC', 1, 2, '新增省级一流课程3门', 25.00, 2, 2023, 'ARCHIVED'),
-- 科技处指标
(201, 2, NULL, 'STRAT_TO_FUNC', 1, 3, '发表高水平论文40篇以上', 25.00, 1, 2023, 'ARCHIVED'),
(202, 2, NULL, 'STRAT_TO_FUNC', 1, 3, '获批省部级科研项目5项', 20.00, 2, 2023, 'ARCHIVED'),
-- 就业创业指导中心指标
(301, 3, NULL, 'STRAT_TO_FUNC', 1, 6, '毕业生就业率达88%以上', 35.00, 1, 2023, 'ARCHIVED'),
(302, 3, NULL, 'STRAT_TO_FUNC', 1, 6, '新增校企合作单位20家', 20.00, 2, 2023, 'ARCHIVED'),
-- 党委学工部指标
(401, 1, NULL, 'STRAT_TO_FUNC', 1, 5, '学生满意度达85%以上', 25.00, 1, 2023, 'ARCHIVED'),
-- 招生工作处指标
(501, 1, NULL, 'STRAT_TO_FUNC', 1, 8, '一志愿录取率达70%以上', 22.00, 1, 2023, 'ARCHIVED'),
-- 人力资源部指标
(601, 2, NULL, 'STRAT_TO_FUNC', 1, 4, '引进高层次人才10人', 20.00, 1, 2023, 'ARCHIVED'),
-- 财务部指标
(701, 1, NULL, 'STRAT_TO_FUNC', 1, 7, '预算执行率达95%以上', 15.00, 1, 2023, 'ARCHIVED'),
-- 数字校园建设办公室指标
(801, 1, NULL, 'STRAT_TO_FUNC', 1, 9, '完成智慧校园一期建设', 18.00, 1, 2023, 'ARCHIVED')
ON CONFLICT (indicator_id) DO NOTHING;

-- 插入2023年二级指标（学院）
INSERT INTO indicator (indicator_id, task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year, status) VALUES
-- 计算机学院
(1001, 1, 101, 'FUNC_TO_COLLEGE', 2, 23, '计算机学院课程优良率达82%', 25.00, 1, 2023, 'ARCHIVED'),
(1002, 2, 201, 'FUNC_TO_COLLEGE', 3, 23, '计算机学院发表高水平论文12篇', 20.00, 2, 2023, 'ARCHIVED'),
(1003, 3, 301, 'FUNC_TO_COLLEGE', 6, 23, '计算机学院就业率达90%', 30.00, 3, 2023, 'ARCHIVED'),
-- 商学院
(1004, 1, 101, 'FUNC_TO_COLLEGE', 2, 24, '商学院课程优良率达78%', 22.00, 1, 2023, 'ARCHIVED'),
(1005, 3, 301, 'FUNC_TO_COLLEGE', 6, 24, '商学院就业率达86%', 28.00, 2, 2023, 'ARCHIVED'),
-- 工学院
(1006, 1, 101, 'FUNC_TO_COLLEGE', 2, 22, '工学院课程优良率达80%', 24.00, 1, 2023, 'ARCHIVED'),
(1007, 2, 201, 'FUNC_TO_COLLEGE', 3, 22, '工学院发表高水平论文8篇', 18.00, 2, 2023, 'ARCHIVED'),
-- 马克思主义学院
(1008, 1, 101, 'FUNC_TO_COLLEGE', 2, 21, '马克思主义学院课程优良率达75%', 22.00, 1, 2023, 'ARCHIVED'),
-- 文理学院
(1009, 1, 101, 'FUNC_TO_COLLEGE', 2, 25, '文理学院课程优良率达76%', 20.00, 1, 2023, 'ARCHIVED'),
(1010, 3, 301, 'FUNC_TO_COLLEGE', 6, 25, '文理学院就业率达84%', 26.00, 2, 2023, 'ARCHIVED'),
-- 艺术与科技学院
(1011, 1, 101, 'FUNC_TO_COLLEGE', 2, 26, '艺术与科技学院课程优良率达74%', 21.00, 1, 2023, 'ARCHIVED'),
(1012, 3, 301, 'FUNC_TO_COLLEGE', 6, 26, '艺术与科技学院就业率达82%', 25.00, 2, 2023, 'ARCHIVED'),
-- 航空学院
(1013, 1, 101, 'FUNC_TO_COLLEGE', 2, 27, '航空学院课程优良率达81%', 24.00, 1, 2023, 'ARCHIVED'),
(1014, 3, 301, 'FUNC_TO_COLLEGE', 6, 27, '航空学院就业率达89%', 29.00, 2, 2023, 'ARCHIVED'),
-- 国际教育学院
(1015, 1, 101, 'FUNC_TO_COLLEGE', 2, 28, '国际教育学院课程优良率达73%', 20.00, 1, 2023, 'ARCHIVED'),
(1016, 3, 301, 'FUNC_TO_COLLEGE', 6, 28, '国际教育学院就业率达80%', 24.00, 2, 2023, 'ARCHIVED')
ON CONFLICT (indicator_id) DO NOTHING;

-- 插入2023年预警规则
INSERT INTO alert_rule (cycle_id, name, severity, gap_threshold, is_enabled) VALUES
(1, '轻度预警', 'INFO', 10.00, TRUE),
(1, '中度预警', 'WARNING', 20.00, TRUE),
(1, '严重预警', 'CRITICAL', 30.00, TRUE)
ON CONFLICT DO NOTHING;

-- 插入2023年预警窗口
INSERT INTO alert_window (cycle_id, name, cutoff_date, is_default) VALUES
(1, 'Q1季度检查', '2023-03-31', FALSE),
(1, 'Q2季度检查', '2023-06-30', FALSE),
(1, 'Q3季度检查', '2023-09-30', FALSE),
(1, '年度终检', '2023-12-31', TRUE)
ON CONFLICT DO NOTHING;


-- ============================================
-- 第三部分：2024年度数据
-- ============================================

-- 插入2024年考核周期
INSERT INTO assessment_cycle (cycle_id, cycle_name, year, start_date, end_date, description) VALUES
(2, '2024年度考核周期', 2024, '2024-01-01', '2024-12-31', '2024年度战略指标考核周期')
ON CONFLICT (cycle_id) DO NOTHING;

-- 插入2024年战略任务
INSERT INTO strategic_task (task_id, cycle_id, task_name, task_desc, task_type, org_id, created_by_org_id, sort_order) VALUES
(4, 2, '实施人才培养质量提升计划', '全面提升教学质量，推进课程改革与教学创新', 'DEVELOPMENT', 2, 1, 1),
(5, 2, '加强科研创新能力建设', '加强科研平台建设，提升科研产出质量', 'DEVELOPMENT', 3, 1, 2),
(6, 2, '深化产教融合校企合作', '围绕毕业生就业质量提升，多措并举促进高质量就业', 'DEVELOPMENT', 6, 1, 3)
ON CONFLICT (task_id) DO NOTHING;

-- 插入2024年一级指标（职能部门）
INSERT INTO indicator (indicator_id, task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year, status) VALUES
-- 教务处指标
(2101, 4, NULL, 'STRAT_TO_FUNC', 1, 2, '课程优良率达82%以上', 30.00, 1, 2024, 'ARCHIVED'),
(2102, 4, NULL, 'STRAT_TO_FUNC', 1, 2, '新增省级一流课程4门', 25.00, 2, 2024, 'ARCHIVED'),
-- 科技处指标
(2201, 5, NULL, 'STRAT_TO_FUNC', 1, 3, '发表高水平论文45篇以上', 25.00, 1, 2024, 'ARCHIVED'),
(2202, 5, NULL, 'STRAT_TO_FUNC', 1, 3, '获批省部级科研项目6项', 22.00, 2, 2024, 'ARCHIVED'),
-- 就业创业指导中心指标
(2301, 6, NULL, 'STRAT_TO_FUNC', 1, 6, '毕业生就业率达89%以上', 35.00, 1, 2024, 'ARCHIVED'),
(2302, 6, NULL, 'STRAT_TO_FUNC', 1, 6, '优质就业比例达12%', 22.00, 2, 2024, 'ARCHIVED'),
-- 人力资源部指标
(2401, 5, NULL, 'STRAT_TO_FUNC', 1, 4, '引进高层次人才12人', 25.00, 1, 2024, 'ARCHIVED'),
-- 党委学工部指标
(2501, 4, NULL, 'STRAT_TO_FUNC', 1, 5, '学生满意度达88%以上', 25.00, 1, 2024, 'ARCHIVED'),
-- 财务部指标
(2601, 4, NULL, 'STRAT_TO_FUNC', 1, 7, '预算执行率达96%以上', 15.00, 1, 2024, 'ARCHIVED')
ON CONFLICT (indicator_id) DO NOTHING;

-- 插入2024年二级指标（学院）
INSERT INTO indicator (indicator_id, task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year, status) VALUES
-- 计算机学院
(2001, 4, 2101, 'FUNC_TO_COLLEGE', 2, 23, '计算机学院课程优良率达85%', 25.00, 1, 2024, 'ARCHIVED'),
(2002, 5, 2201, 'FUNC_TO_COLLEGE', 3, 23, '计算机学院发表高水平论文14篇', 22.00, 2, 2024, 'ARCHIVED'),
(2003, 6, 2301, 'FUNC_TO_COLLEGE', 6, 23, '计算机学院就业率达91%', 30.00, 3, 2024, 'ARCHIVED'),
-- 商学院
(2004, 4, 2101, 'FUNC_TO_COLLEGE', 2, 24, '商学院课程优良率达80%', 23.00, 1, 2024, 'ARCHIVED'),
(2005, 6, 2301, 'FUNC_TO_COLLEGE', 6, 24, '商学院就业率达88%', 28.00, 2, 2024, 'ARCHIVED'),
-- 工学院
(2006, 4, 2101, 'FUNC_TO_COLLEGE', 2, 22, '工学院课程优良率达82%', 24.00, 1, 2024, 'ARCHIVED'),
(2007, 5, 2201, 'FUNC_TO_COLLEGE', 3, 22, '工学院发表高水平论文10篇', 20.00, 2, 2024, 'ARCHIVED'),
-- 马克思主义学院
(2008, 4, 2101, 'FUNC_TO_COLLEGE', 2, 21, '马克思主义学院课程优良率达77%', 22.00, 1, 2024, 'ARCHIVED'),
-- 文理学院
(2009, 4, 2101, 'FUNC_TO_COLLEGE', 2, 25, '文理学院课程优良率达78%', 21.00, 1, 2024, 'ARCHIVED'),
(2010, 6, 2301, 'FUNC_TO_COLLEGE', 6, 25, '文理学院就业率达86%', 27.00, 2, 2024, 'ARCHIVED'),
-- 艺术与科技学院
(2011, 4, 2101, 'FUNC_TO_COLLEGE', 2, 26, '艺术与科技学院课程优良率达76%', 22.00, 1, 2024, 'ARCHIVED'),
(2012, 6, 2301, 'FUNC_TO_COLLEGE', 6, 26, '艺术与科技学院就业率达84%', 26.00, 2, 2024, 'ARCHIVED'),
-- 航空学院
(2013, 4, 2101, 'FUNC_TO_COLLEGE', 2, 27, '航空学院课程优良率达83%', 25.00, 1, 2024, 'ARCHIVED'),
(2014, 6, 2301, 'FUNC_TO_COLLEGE', 6, 27, '航空学院就业率达91%', 30.00, 2, 2024, 'ARCHIVED'),
-- 国际教育学院
(2015, 4, 2101, 'FUNC_TO_COLLEGE', 2, 28, '国际教育学院课程优良率达75%', 21.00, 1, 2024, 'ARCHIVED'),
(2016, 6, 2301, 'FUNC_TO_COLLEGE', 6, 28, '国际教育学院就业率达82%', 25.00, 2, 2024, 'ARCHIVED')
ON CONFLICT (indicator_id) DO NOTHING;

-- 插入2024年预警规则
INSERT INTO alert_rule (cycle_id, name, severity, gap_threshold, is_enabled) VALUES
(2, '轻度预警', 'INFO', 10.00, TRUE),
(2, '中度预警', 'WARNING', 20.00, TRUE),
(2, '严重预警', 'CRITICAL', 30.00, TRUE)
ON CONFLICT DO NOTHING;

-- 插入2024年预警窗口
INSERT INTO alert_window (cycle_id, name, cutoff_date, is_default) VALUES
(2, 'Q1季度检查', '2024-03-31', FALSE),
(2, 'Q2季度检查', '2024-06-30', FALSE),
(2, 'Q3季度检查', '2024-09-30', FALSE),
(2, '年度终检', '2024-12-31', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- 第四部分：2026年度数据
-- ============================================

-- 插入2026年考核周期
INSERT INTO assessment_cycle (cycle_id, cycle_name, year, start_date, end_date, description) VALUES
(3, '2026年度考核周期', 2026, '2026-01-01', '2026-12-31', '2026年度战略指标考核周期')
ON CONFLICT (cycle_id) DO NOTHING;

-- 插入2026年战略任务
INSERT INTO strategic_task (task_id, cycle_id, task_name, task_desc, task_type, org_id, created_by_org_id, sort_order) VALUES
(7, 3, '深化教学改革，提升人才培养质量', '全面提升教学质量，推进课程改革与教学创新', 'DEVELOPMENT', 2, 1, 1),
(8, 3, '提升科研水平，增强学术影响力', '加强科研平台建设，提升科研产出质量', 'DEVELOPMENT', 3, 1, 2),
(9, 3, '全力促进毕业生高质量就业', '围绕毕业生就业质量提升，多措并举促进高质量就业', 'DEVELOPMENT', 6, 1, 3)
ON CONFLICT (task_id) DO NOTHING;

-- 插入2026年一级指标（职能部门）
INSERT INTO indicator (indicator_id, task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year, status) VALUES
-- 教务处指标
(3101, 7, NULL, 'STRAT_TO_FUNC', 1, 2, '课程优良率达85%以上', 30.00, 1, 2026, 'ARCHIVED'),
(3102, 7, NULL, 'STRAT_TO_FUNC', 1, 2, '新增省级一流课程5门', 25.00, 2, 2026, 'ARCHIVED'),
-- 科技处指标
(3201, 8, NULL, 'STRAT_TO_FUNC', 1, 3, '发表高水平论文50篇以上', 25.00, 1, 2026, 'ARCHIVED'),
(3202, 8, NULL, 'STRAT_TO_FUNC', 1, 3, '获批省部级科研项目7项', 22.00, 2, 2026, 'ARCHIVED'),
-- 就业创业指导中心指标
(3301, 9, NULL, 'STRAT_TO_FUNC', 1, 6, '毕业生就业率不低于90%', 35.00, 1, 2026, 'ARCHIVED'),
(3302, 9, NULL, 'STRAT_TO_FUNC', 1, 6, '优质就业比例达15%', 22.00, 2, 2026, 'ARCHIVED'),
-- 人力资源部指标
(3401, 8, NULL, 'STRAT_TO_FUNC', 1, 4, '引进高层次人才15人', 25.00, 1, 2026, 'ARCHIVED'),
-- 党委学工部指标
(3501, 7, NULL, 'STRAT_TO_FUNC', 1, 5, '学生满意度达90%以上', 25.00, 1, 2026, 'ARCHIVED'),
-- 财务部指标
(3601, 7, NULL, 'STRAT_TO_FUNC', 1, 7, '预算执行率达97%以上', 15.00, 1, 2026, 'ARCHIVED'),
-- 图书馆指标
(3701, 7, NULL, 'STRAT_TO_FUNC', 1, 10, '新增电子资源数据库7个', 12.00, 1, 2026, 'ARCHIVED'),
-- 党委办公室指标
(3801, 7, NULL, 'STRAT_TO_FUNC', 1, 12, '党员发展质量达标率97%以上', 20.00, 1, 2026, 'ARCHIVED')
ON CONFLICT (indicator_id) DO NOTHING;

-- 插入2026年二级指标（学院）
INSERT INTO indicator (indicator_id, task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year, status) VALUES
-- 计算机学院
(3001, 7, 3101, 'FUNC_TO_COLLEGE', 2, 23, '计算机学院课程优良率达88%', 25.00, 1, 2026, 'ARCHIVED'),
(3002, 8, 3201, 'FUNC_TO_COLLEGE', 3, 23, '计算机学院发表高水平论文16篇', 22.00, 2, 2026, 'ARCHIVED'),
(3003, 9, 3301, 'FUNC_TO_COLLEGE', 6, 23, '计算机学院就业率达93%', 30.00, 3, 2026, 'ARCHIVED'),
-- 商学院
(3004, 7, 3101, 'FUNC_TO_COLLEGE', 2, 24, '商学院课程优良率达82%', 23.00, 1, 2026, 'ARCHIVED'),
(3005, 9, 3301, 'FUNC_TO_COLLEGE', 6, 24, '商学院就业率达90%', 28.00, 2, 2026, 'ARCHIVED'),
-- 工学院
(3006, 7, 3101, 'FUNC_TO_COLLEGE', 2, 22, '工学院课程优良率达84%', 24.00, 1, 2026, 'ARCHIVED'),
(3007, 8, 3201, 'FUNC_TO_COLLEGE', 3, 22, '工学院发表高水平论文12篇', 20.00, 2, 2026, 'ARCHIVED'),
-- 马克思主义学院
(3008, 7, 3101, 'FUNC_TO_COLLEGE', 2, 21, '马克思主义学院课程优良率达79%', 23.00, 1, 2026, 'ARCHIVED'),
-- 文理学院
(3009, 7, 3101, 'FUNC_TO_COLLEGE', 2, 25, '文理学院课程优良率达80%', 22.00, 1, 2026, 'ARCHIVED'),
(3010, 9, 3301, 'FUNC_TO_COLLEGE', 6, 25, '文理学院就业率达88%', 27.00, 2, 2026, 'ARCHIVED'),
-- 艺术与科技学院
(3011, 7, 3101, 'FUNC_TO_COLLEGE', 2, 26, '艺术与科技学院课程优良率达78%', 23.00, 1, 2026, 'ARCHIVED'),
(3012, 9, 3301, 'FUNC_TO_COLLEGE', 6, 26, '艺术与科技学院就业率达86%', 26.00, 2, 2026, 'ARCHIVED'),
-- 航空学院
(3013, 7, 3101, 'FUNC_TO_COLLEGE', 2, 27, '航空学院课程优良率达85%', 26.00, 1, 2026, 'ARCHIVED'),
(3014, 9, 3301, 'FUNC_TO_COLLEGE', 6, 27, '航空学院就业率达93%', 31.00, 2, 2026, 'ARCHIVED'),
-- 国际教育学院
(3015, 7, 3101, 'FUNC_TO_COLLEGE', 2, 28, '国际教育学院课程优良率达77%', 22.00, 1, 2026, 'ARCHIVED'),
(3016, 9, 3301, 'FUNC_TO_COLLEGE', 6, 28, '国际教育学院就业率达84%', 25.00, 2, 2026, 'ARCHIVED')
ON CONFLICT (indicator_id) DO NOTHING;

-- 插入2026年预警规则
INSERT INTO alert_rule (cycle_id, name, severity, gap_threshold, is_enabled) VALUES
(3, '轻度预警', 'INFO', 10.00, TRUE),
(3, '中度预警', 'WARNING', 20.00, TRUE),
(3, '严重预警', 'CRITICAL', 30.00, TRUE)
ON CONFLICT DO NOTHING;

-- 插入2026年预警窗口
INSERT INTO alert_window (cycle_id, name, cutoff_date, is_default) VALUES
(3, 'Q1季度检查', '2026-03-31', FALSE),
(3, 'Q2季度检查', '2026-06-30', FALSE),
(3, 'Q3季度检查', '2026-09-30', FALSE),
(3, '年度终检', '2026-12-31', TRUE)
ON CONFLICT DO NOTHING;

-- 重置序列
SELECT setval('assessment_cycle_cycle_id_seq', 10, false);
SELECT setval('strategic_task_task_id_seq', 100, false);
SELECT setval('indicator_indicator_id_seq', 10000, false);

-- ============================================
-- 数据验证查询
-- ============================================

-- 查看组织统计
SELECT '=== 组织统计 ===' AS section;
SELECT 
    org_type,
    COUNT(*) as count
FROM org
GROUP BY org_type
ORDER BY org_type;

-- 查看各年度指标统计
SELECT '=== 年度指标统计 ===' AS section;
SELECT 
    year,
    level,
    COUNT(*) as indicator_count
FROM indicator
GROUP BY year, level
ORDER BY year, level;

-- 查看各学院指标数量
SELECT '=== 学院指标统计 ===' AS section;
SELECT 
    o.org_name,
    COUNT(i.indicator_id) as indicator_count
FROM org o
LEFT JOIN indicator i ON o.org_id = i.target_org_id
WHERE o.org_type = 'COLLEGE'
GROUP BY o.org_name
ORDER BY indicator_count DESC;

-- ============================================
-- 执行说明
-- ============================================
-- 1. 本脚本包含完整的组织结构和历史数据（2023/2024/2026年）
-- 2. 使用 ON CONFLICT DO NOTHING 避免重复插入
-- 3. 2025年数据由前端 strategic.ts 管理（当前工作年份）
-- 4. 执行前请备份数据库
-- 5. 建议在测试环境先执行验证

-- ============================================
-- 完成
-- ============================================
-- 统一数据管理脚本生成完成
-- 数据源：src/data/historicalIndicators.ts
-- 生成时间：2026-01-04
