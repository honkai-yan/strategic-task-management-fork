-- ============================================
-- SISM 2026年度数据增强脚本
-- 增加更多学院、任务和指标数据
-- 执行时间：2026年1月
-- ============================================

-- 为每个学院增加更多子指标和里程碑
DO $$
DECLARE
    v_cycle_id BIGINT;
    v_indicator_id BIGINT;
    v_college_id BIGINT;
    v_task_id BIGINT;
    v_milestone_id BIGINT;
BEGIN
    -- 获取2026年周期ID
    SELECT cycle_id INTO v_cycle_id FROM assessment_cycle WHERE year = 2026;
    
    IF v_cycle_id IS NULL THEN
        RAISE EXCEPTION '2026年考核周期不存在，请先执行 add-2026-data-smart.sql';
    END IF;
    
    RAISE NOTICE '开始为2026年度增加数据...';
    
    -- ========== 马克思主义学院 ==========
    SELECT org_id INTO v_college_id FROM org WHERE org_name = '马克思主义学院';
    
    -- 获取教学改革任务ID
    SELECT task_id INTO v_task_id FROM strategic_task 
    WHERE cycle_id = v_cycle_id AND task_name LIKE '%教学改革%' LIMIT 1;
    
    -- 新增指标：思政课程建设
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '思政课程建设质量提升', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        15.00, 2026, 100, '%', '定量', '发展性', '提升思政课程教学质量'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    -- 添加季度里程碑
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 课程大纲修订', 25, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 教学资源建设', 50, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 教学实践开展', 75, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 质量评估总结', 100, '2026-12-31', 'NOT_STARTED');
    
    -- 新增指标：学生思想引领
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '学生思想政治教育覆盖率', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        10.00, 2026, 95, '%', '定量', '基础性', '全面覆盖学生思政教育'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 教育方案制定', 25, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 活动组织实施', 50, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 效果跟踪评估', 75, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 年度总结提升', 100, '2026-12-31', 'NOT_STARTED');
    
    RAISE NOTICE '马克思主义学院数据已增加';
    
    -- ========== 工学院 ==========
    SELECT org_id INTO v_college_id FROM org WHERE org_name = '工学院';
    
    -- 新增指标：实验室建设
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '实验室设备更新率', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        12.00, 2026, 80, '%', '定量', '发展性', '提升实验教学条件'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 设备需求调研', 20, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 采购计划执行', 50, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 设备安装调试', 80, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 验收投入使用', 100, '2026-12-31', 'NOT_STARTED');
    
    -- 新增指标：学科竞赛
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '学生学科竞赛获奖数', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        15.00, 2026, 30, '项', '定量', '发展性', '提升学生创新能力'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 竞赛组织筹备', 15, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 省级竞赛参与', 40, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 国家级竞赛参与', 70, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 获奖统计总结', 100, '2026-12-31', 'NOT_STARTED');
    
    RAISE NOTICE '工学院数据已增加';
    
    -- ========== 计算机学院 ==========
    SELECT org_id INTO v_college_id FROM org WHERE org_name = '计算机学院';
    
    -- 新增指标：产学研合作
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '校企合作项目数', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        18.00, 2026, 15, '项', '定量', '发展性', '深化产学研合作'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 企业对接洽谈', 20, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 合作协议签订', 45, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 项目启动实施', 75, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 项目成果验收', 100, '2026-12-31', 'NOT_STARTED');
    
    -- 新增指标：师资队伍建设
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '高层次人才引进数', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        10.00, 2026, 5, '人', '定量', '发展性', '优化师资结构'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 人才需求分析', 15, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 招聘宣传启动', 40, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 面试考核选拔', 70, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 人才引进到位', 100, '2026-12-31', 'NOT_STARTED');
    
    RAISE NOTICE '计算机学院数据已增加';
    
    -- ========== 商学院 ==========
    SELECT org_id INTO v_college_id FROM org WHERE org_name = '商学院';
    
    -- 新增指标：国际化办学
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '国际交流项目数', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        14.00, 2026, 8, '项', '定量', '发展性', '提升国际化水平'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 国际合作洽谈', 25, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 交流协议签署', 50, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 项目组织实施', 75, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 成果总结评估', 100, '2026-12-31', 'NOT_STARTED');
    
    -- 新增指标：创新创业教育
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '学生创业项目孵化数', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        16.00, 2026, 12, '项', '定量', '发展性', '培养创新创业能力'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 创业培训开展', 20, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 项目筛选立项', 45, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 孵化支持服务', 75, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 项目成果展示', 100, '2026-12-31', 'NOT_STARTED');
    
    RAISE NOTICE '商学院数据已增加';
    
    -- ========== 文理学院 ==========
    SELECT org_id INTO v_college_id FROM org WHERE org_name = '文理学院';
    
    -- 新增指标：通识教育改革
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '通识课程优化率', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        13.00, 2026, 85, '%', '定量', '发展性', '提升通识教育质量'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 课程体系梳理', 25, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 课程内容优化', 50, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 教学方法改进', 75, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 效果评估反馈', 100, '2026-12-31', 'NOT_STARTED');
    
    -- 新增指标：学术讲座活动
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '学术讲座举办场次', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        11.00, 2026, 24, '场', '定量', '基础性', '营造学术氛围'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 讲座计划制定', 20, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 上半年讲座实施', 50, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 下半年讲座实施', 80, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 年度总结评估', 100, '2026-12-31', 'NOT_STARTED');
    
    RAISE NOTICE '文理学院数据已增加';
    
    -- ========== 艺术与科技学院 ==========
    SELECT org_id INTO v_college_id FROM org WHERE org_name = '艺术与科技学院';
    
    -- 新增指标：艺术作品创作
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '师生艺术作品展览数', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        17.00, 2026, 10, '场', '定量', '发展性', '提升艺术创作水平'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 作品创作筹备', 20, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 春季作品展览', 45, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 秋季作品展览', 75, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 年度汇报展览', 100, '2026-12-31', 'NOT_STARTED');
    
    -- 新增指标：校企合作工作室
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '校企合作工作室建设数', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        12.00, 2026, 6, '个', '定量', '发展性', '深化产教融合'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 企业对接洽谈', 25, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 工作室筹建', 50, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 工作室运营', 75, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 成果展示总结', 100, '2026-12-31', 'NOT_STARTED');
    
    RAISE NOTICE '艺术与科技学院数据已增加';
    
    -- ========== 航空学院 ==========
    SELECT org_id INTO v_college_id FROM org WHERE org_name = '航空学院';
    
    -- 新增指标：飞行训练质量
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '飞行训练合格率', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        20.00, 2026, 95, '%', '定量', '基础性', '确保飞行训练质量'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 训练计划制定', 20, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 春季训练实施', 50, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 秋季训练实施', 80, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 年度考核评估', 100, '2026-12-31', 'NOT_STARTED');
    
    -- 新增指标：航空安全管理
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '安全事故零发生率', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        15.00, 2026, 100, '%', '定量', '基础性', '确保航空训练安全'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 安全检查落实', 25, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 安全培训强化', 50, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 隐患排查整改', 75, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 安全总结评估', 100, '2026-12-31', 'NOT_STARTED');
    
    RAISE NOTICE '航空学院数据已增加';
    
    -- ========== 国际教育学院 ==========
    SELECT org_id INTO v_college_id FROM org WHERE org_name = '国际教育学院';
    
    -- 新增指标：留学生招生
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '留学生招生人数', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        18.00, 2026, 150, '人', '定量', '发展性', '扩大国际教育规模'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 招生宣传启动', 15, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 春季招生完成', 40, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 秋季招生完成', 80, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 年度招生总结', 100, '2026-12-31', 'NOT_STARTED');
    
    -- 新增指标：中外合作项目
    INSERT INTO indicator (
        task_id, name, level, org_id, parent_indicator_id, 
        weight_percent, year, target_value, unit, type1, type2, remark
    ) VALUES (
        v_task_id, '中外合作办学项目数', 'FUNC_TO_COLLEGE', v_college_id, NULL,
        14.00, 2026, 5, '项', '定量', '发展性', '深化国际合作'
    ) RETURNING indicator_id INTO v_indicator_id;
    
    INSERT INTO milestone (indicator_id, name, target_progress, deadline, status) VALUES
    (v_indicator_id, 'Q1: 合作意向洽谈', 20, '2026-03-31', 'NOT_STARTED'),
    (v_indicator_id, 'Q2: 项目方案制定', 50, '2026-06-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q3: 项目审批报备', 75, '2026-09-30', 'NOT_STARTED'),
    (v_indicator_id, 'Q4: 项目启动实施', 100, '2026-12-31', 'NOT_STARTED');
    
    RAISE NOTICE '国际教育学院数据已增加';
    
    RAISE NOTICE '=== 2026年度数据增强完成 ===';
END $$;

-- 验证新增数据
SELECT '=== 2026年指标统计（增强后） ===' AS section;
SELECT 
    o.org_name as 学院,
    COUNT(i.indicator_id) as 指标数量,
    SUM(i.weight_percent) as 总权重
FROM indicator i
JOIN org o ON i.org_id = o.org_id
WHERE i.year = 2026 AND o.org_type = 'COLLEGE'
GROUP BY o.org_name
ORDER BY o.org_name;

SELECT '=== 2026年里程碑统计（增强后） ===' AS section;
SELECT 
    COUNT(*) as 总里程碑数,
    SUM(CASE WHEN status = 'NOT_STARTED' THEN 1 ELSE 0 END) as 未开始,
    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as 进行中,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as 已完成
FROM milestone m
JOIN indicator i ON m.indicator_id = i.indicator_id
WHERE i.year = 2026;

-- ============================================
-- 执行说明：
-- 1. 本脚本需要在 add-2026-data-smart.sql 之后执行
-- 2. 为每个学院增加了2-3个新指标
-- 3. 每个指标包含4个季度里程碑
-- 4. 总计新增约16个指标，64个里程碑
-- ============================================
