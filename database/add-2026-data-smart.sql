-- ============================================
-- SISM 2026年度数据补充脚本（智能版）
-- 使用动态查询避免硬编码ID
-- 执行时间：2026年1月
-- ============================================

-- 步骤1：插入2026年考核周期
DO $$
DECLARE
    v_cycle_id BIGINT;
BEGIN
    -- 插入考核周期
    INSERT INTO assessment_cycle (cycle_name, year, start_date, end_date, description)
    VALUES ('2026年度考核周期', 2026, '2026-01-01', '2026-12-31', '2026年度战略指标考核周期')
    RETURNING cycle_id INTO v_cycle_id;
    
    RAISE NOTICE '2026年考核周期已创建，ID: %', v_cycle_id;
    
    -- 插入预警规则
    INSERT INTO alert_rule (cycle_id, name, severity, gap_threshold, is_enabled) VALUES
    (v_cycle_id, '轻度预警', 'INFO', 10.00, TRUE),
    (v_cycle_id, '中度预警', 'WARNING', 20.00, TRUE),
    (v_cycle_id, '严重预警', 'CRITICAL', 30.00, TRUE);
    
    -- 插入预警窗口
    INSERT INTO alert_window (cycle_id, name, cutoff_date, is_default) VALUES
    (v_cycle_id, 'Q1季度检查', '2026-03-31', FALSE),
    (v_cycle_id, 'Q2季度检查', '2026-06-30', FALSE),
    (v_cycle_id, 'Q3季度检查', '2026-09-30', FALSE),
    (v_cycle_id, '年度终检', '2026-12-31', TRUE);
    
    RAISE NOTICE '预警规则和窗口已创建';
END $$;

-- 步骤2：插入战略任务
DO $$
DECLARE
    v_cycle_id BIGINT;
    v_task_id_1 BIGINT;
    v_task_id_2 BIGINT;
    v_task_id_3 BIGINT;
    v_task_id_4 BIGINT;
    v_task_id_5 BIGINT;
BEGIN
    -- 获取2026年周期ID
    SELECT cycle_id INTO v_cycle_id FROM assessment_cycle WHERE year = 2026;
    
    -- 插入任务1：就业创业
    INSERT INTO strategic_task (cycle_id, task_name, task_desc, task_type, org_id, created_by_org_id, sort_order)
    VALUES (v_cycle_id, '全力促进毕业生多元化高质量就业创业', 
            '围绕毕业生就业质量提升，多措并举促进高质量就业创业', 
            'DEVELOPMENT', 2, 1, 1)
    RETURNING task_id INTO v_task_id_1;
    
    -- 插入任务2：校友工作
    INSERT INTO strategic_task (cycle_id, task_name, task_desc, task_type, org_id, created_by_org_id, sort_order)
    VALUES (v_cycle_id, '推进校友工作提质增效，赋能校友成长', 
            '建立完善校友工作机制，提升校友服务质量', 
            'DEVELOPMENT', 2, 1, 2)
    RETURNING task_id INTO v_task_id_2;
    
    -- 插入任务3：整体部署
    INSERT INTO strategic_task (cycle_id, task_name, task_desc, task_type, org_id, created_by_org_id, sort_order)
    VALUES (v_cycle_id, '根据学校整体部署', 
            '按照学校整体战略部署推进信息化建设等相关工作', 
            'BASIC', 2, 1, 3)
    RETURNING task_id INTO v_task_id_3;
    
    -- 插入任务4：教学改革
    INSERT INTO strategic_task (cycle_id, task_name, task_desc, task_type, org_id, created_by_org_id, sort_order)
    VALUES (v_cycle_id, '深化教学改革，提升人才培养质量', 
            '全面提升教学质量，推进课程改革与教学创新', 
            'DEVELOPMENT', 2, 1, 4)
    RETURNING task_id INTO v_task_id_4;
    
    -- 插入任务5：科研提升
    INSERT INTO strategic_task (cycle_id, task_name, task_desc, task_type, org_id, created_by_org_id, sort_order)
    VALUES (v_cycle_id, '提升科研水平，增强学术影响力', 
            '加强科研平台建设，提升科研产出质量', 
            'DEVELOPMENT', 3, 1, 5)
    RETURNING task_id INTO v_task_id_5;
    
    RAISE NOTICE '战略任务已创建，IDs: %, %, %, %, %', v_task_id_1, v_task_id_2, v_task_id_3, v_task_id_4, v_task_id_5;
    
    -- 存储到临时表供后续使用
    CREATE TEMP TABLE IF NOT EXISTS temp_task_ids (
        task_name TEXT,
        task_id BIGINT
    );
    
    INSERT INTO temp_task_ids VALUES
    ('就业创业', v_task_id_1),
    ('校友工作', v_task_id_2),
    ('整体部署', v_task_id_3),
    ('教学改革', v_task_id_4),
    ('科研提升', v_task_id_5);
END $$;

-- 步骤3：插入一级指标（战略发展部→职能部门）
DO $$
DECLARE
    v_task_id_employment BIGINT;
    v_task_id_teaching BIGINT;
    v_task_id_research BIGINT;
    v_indicator_id BIGINT;
BEGIN
    -- 获取任务ID
    SELECT task_id INTO v_task_id_employment FROM temp_task_ids WHERE task_name = '就业创业';
    SELECT task_id INTO v_task_id_teaching FROM temp_task_ids WHERE task_name = '教学改革';
    SELECT task_id INTO v_task_id_research FROM temp_task_ids WHERE task_name = '科研提升';
    
    -- 就业创业指导中心指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_employment, NULL, 'STRAT_TO_FUNC', 1, 2, '毕业生就业率不低于90%', 35.00, 1, 2026),
    (v_task_id_employment, NULL, 'STRAT_TO_FUNC', 1, 2, '优质就业比例达15%', 22.00, 2, 2026);
    
    -- 教务处指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_teaching, NULL, 'STRAT_TO_FUNC', 1, 2, '课程优良率达85%以上', 30.00, 1, 2026),
    (v_task_id_teaching, NULL, 'STRAT_TO_FUNC', 1, 2, '新增省级一流课程5门', 25.00, 2, 2026);
    
    -- 科技处指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_research, NULL, 'STRAT_TO_FUNC', 1, 3, '发表高水平论文50篇以上', 25.00, 1, 2026),
    (v_task_id_research, NULL, 'STRAT_TO_FUNC', 1, 3, '获批省部级科研项目7项', 22.00, 2, 2026);
    
    -- 人力资源部指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_research, NULL, 'STRAT_TO_FUNC', 1, 4, '引进高层次人才15人', 25.00, 1, 2026);
    
    -- 党委学工部指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_teaching, NULL, 'STRAT_TO_FUNC', 1, 5, '学生满意度达90%以上', 25.00, 1, 2026);
    
    -- 财务部指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_teaching, NULL, 'STRAT_TO_FUNC', 1, 11, '预算执行率达97%以上', 15.00, 1, 2026);
    
    -- 图书馆指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_teaching, NULL, 'STRAT_TO_FUNC', 1, 16, '新增电子资源数据库7个', 12.00, 1, 2026);
    
    -- 党委办公室指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_teaching, NULL, 'STRAT_TO_FUNC', 1, 1, '党员发展质量达标率97%以上', 20.00, 1, 2026);
    
    RAISE NOTICE '一级指标已创建';
END $$;

-- 步骤4：插入二级指标（职能部门→二级学院）
DO $$
DECLARE
    v_task_id_employment BIGINT;
    v_task_id_teaching BIGINT;
    v_task_id_research BIGINT;
    v_parent_employment BIGINT;
    v_parent_teaching BIGINT;
    v_parent_research BIGINT;
BEGIN
    -- 获取任务ID
    SELECT task_id INTO v_task_id_employment FROM temp_task_ids WHERE task_name = '就业创业';
    SELECT task_id INTO v_task_id_teaching FROM temp_task_ids WHERE task_name = '教学改革';
    SELECT task_id INTO v_task_id_research FROM temp_task_ids WHERE task_name = '科研提升';
    
    -- 获取父指标ID
    SELECT indicator_id INTO v_parent_employment 
    FROM indicator 
    WHERE year = 2026 AND indicator_desc = '毕业生就业率不低于90%';
    
    SELECT indicator_id INTO v_parent_teaching 
    FROM indicator 
    WHERE year = 2026 AND indicator_desc = '课程优良率达85%以上';
    
    SELECT indicator_id INTO v_parent_research 
    FROM indicator 
    WHERE year = 2026 AND indicator_desc = '发表高水平论文50篇以上';
    
    -- 计算机学院指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_employment, v_parent_employment, 'FUNC_TO_COLLEGE', 2, 6, '计算机学院就业率达93%', 30.00, 1, 2026),
    (v_task_id_teaching, v_parent_teaching, 'FUNC_TO_COLLEGE', 2, 6, '计算机学院课程优良率达88%', 25.00, 1, 2026),
    (v_task_id_research, v_parent_research, 'FUNC_TO_COLLEGE', 3, 6, '计算机学院发表高水平论文16篇', 22.00, 1, 2026);
    
    -- 商学院指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_employment, v_parent_employment, 'FUNC_TO_COLLEGE', 2, 7, '商学院就业率达90%', 28.00, 2, 2026),
    (v_task_id_teaching, v_parent_teaching, 'FUNC_TO_COLLEGE', 2, 7, '商学院课程优良率达82%', 23.00, 2, 2026);
    
    -- 工学院指标
    INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year)
    VALUES 
    (v_task_id_teaching, v_parent_teaching, 'FUNC_TO_COLLEGE', 2, 10, '工学院课程优良率达84%', 24.00, 3, 2026),
    (v_task_id_research, v_parent_research, 'FUNC_TO_COLLEGE', 3, 10, '工学院发表高水平论文12篇', 20.00, 2, 2026);
    
    RAISE NOTICE '二级指标已创建';
END $$;

-- 步骤5：为关键指标添加里程碑
DO $$
DECLARE
    v_indicator_id BIGINT;
BEGIN
    -- 为就业率指标添加里程碑
    SELECT indicator_id INTO v_indicator_id 
    FROM indicator 
    WHERE year = 2026 AND indicator_desc = '毕业生就业率不低于90%';
    
    IF v_indicator_id IS NOT NULL THEN
        INSERT INTO milestone (indicator_id, milestone_name, milestone_desc, due_date, weight_percent, sort_order) VALUES
        (v_indicator_id, 'Q1-就业数据摸底', '完成就业数据收集与分析', '2026-03-31', 20.00, 1),
        (v_indicator_id, 'Q2-就业指导强化', '开展就业指导培训与咨询', '2026-06-30', 30.00, 2),
        (v_indicator_id, 'Q3-就业推进冲刺', '加强就业困难学生帮扶', '2026-09-30', 30.00, 3),
        (v_indicator_id, 'Q4-目标达成验收', '完成年度就业率目标', '2026-12-31', 20.00, 4);
    END IF;
    
    -- 为课程优良率指标添加里程碑
    SELECT indicator_id INTO v_indicator_id 
    FROM indicator 
    WHERE year = 2026 AND indicator_desc = '课程优良率达85%以上';
    
    IF v_indicator_id IS NOT NULL THEN
        INSERT INTO milestone (indicator_id, milestone_name, milestone_desc, due_date, weight_percent, sort_order) VALUES
        (v_indicator_id, 'Q1-教学质量调研', '完成教学质量现状调研', '2026-03-31', 20.00, 1),
        (v_indicator_id, 'Q2-课程改革试点', '启动课程改革试点工作', '2026-06-30', 30.00, 2),
        (v_indicator_id, 'Q3-质量提升推进', '全面推进教学质量提升', '2026-09-30', 30.00, 3),
        (v_indicator_id, 'Q4-达标验收', '完成年度课程优良率目标', '2026-12-31', 20.00, 4);
    END IF;
    
    -- 为科研论文指标添加里程碑
    SELECT indicator_id INTO v_indicator_id 
    FROM indicator 
    WHERE year = 2026 AND indicator_desc = '发表高水平论文50篇以上';
    
    IF v_indicator_id IS NOT NULL THEN
        INSERT INTO milestone (indicator_id, milestone_name, milestone_desc, due_date, weight_percent, sort_order) VALUES
        (v_indicator_id, 'Q1-科研项目推进', '推进在研项目，培育成果', '2026-03-31', 20.00, 1),
        (v_indicator_id, 'Q2-论文撰写指导', '组织论文撰写培训', '2026-06-30', 30.00, 2),
        (v_indicator_id, 'Q3-论文投稿冲刺', '完成论文投稿', '2026-09-30', 30.00, 3),
        (v_indicator_id, 'Q4-发表目标达成', '完成年度论文发表目标', '2026-12-31', 20.00, 4);
    END IF;
    
    RAISE NOTICE '里程碑已创建';
END $$;

-- 清理临时表
DROP TABLE IF EXISTS temp_task_ids;

-- 验证查询
SELECT '=== 2026年考核周期 ===' AS section;
SELECT * FROM assessment_cycle WHERE year = 2026;

SELECT '=== 2026年战略任务 ===' AS section;
SELECT task_id, task_name, task_type FROM strategic_task WHERE cycle_id = (SELECT cycle_id FROM assessment_cycle WHERE year = 2026);

SELECT '=== 2026年指标统计 ===' AS section;
SELECT 
    level,
    COUNT(*) as indicator_count,
    SUM(weight_percent) as total_weight
FROM indicator 
WHERE year = 2026 
GROUP BY level;

SELECT '=== 2026年里程碑统计 ===' AS section;
SELECT 
    COUNT(*) as milestone_count
FROM milestone m
JOIN indicator i ON m.indicator_id = i.indicator_id
WHERE i.year = 2026;

-- ============================================
-- 执行说明
-- ============================================
-- 1. 本脚本使用动态查询，无需手动调整ID
-- 2. 执行前请确保数据库中已有组织数据（org表）
-- 3. 建议在测试环境先执行，验证无误后再在生产环境执行
-- 4. 执行前请备份数据库
-- 5. 脚本执行完成后会自动显示验证查询结果

-- ============================================
-- 完成
-- ============================================
-- 2026年度数据补充完成
-- 日期: 2026-01-04
