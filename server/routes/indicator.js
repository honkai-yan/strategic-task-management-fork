import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 将数据库行转换为驼峰格式的 VO
function convertToIndicatorVO(row) {
  return {
    indicatorId: parseInt(row.indicator_id),
    taskId: parseInt(row.task_id),
    taskName: row.task_name,
    parentIndicatorId: row.parent_indicator_id ? parseInt(row.parent_indicator_id) : null,
    parentIndicatorDesc: row.parent_desc || null,
    level: row.level,
    ownerOrgId: parseInt(row.owner_org_id),
    ownerOrgName: row.owner_org,
    targetOrgId: parseInt(row.target_org_id),
    targetOrgName: row.target_org,
    indicatorDesc: row.indicator_desc,
    weightPercent: parseFloat(row.weight_percent),
    sortOrder: row.sort_order,
    year: row.year,
    status: row.status,
    remark: row.remark,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // 新增字段 (前端数据对齐 2026-01-19)
    isQualitative: row.is_qualitative ?? false,
    type1: row.type1 ?? '定量',
    type2: row.type2 ?? '基础性',
    canWithdraw: row.can_withdraw ?? false,
    targetValue: row.target_value ? parseFloat(row.target_value) : null,
    actualValue: row.actual_value ? parseFloat(row.actual_value) : null,
    unit: row.unit ?? '%',
    responsiblePerson: row.responsible_person ?? '',
    progress: row.progress ?? 0,
    statusAudit: row.status_audit ?? '[]',
    progressApprovalStatus: row.progress_approval_status ?? 'NONE',
    pendingProgress: row.pending_progress,
    pendingRemark: row.pending_remark,
    pendingAttachments: row.pending_attachments ?? '[]',
    // 派生字段
    isStrategic: row.level === 'STRAT_TO_FUNC',
    responsibleDept: row.target_org,
    ownerDept: row.owner_org
  };
}

// GET /api/indicators
router.get('/', async (req, res) => {
  try {
    const { taskId, level, targetOrgId, status, year } = req.query;
    let query = `
      SELECT i.*, t.task_name, oo.org_name as owner_org, to2.org_name as target_org,
             pi.indicator_desc as parent_desc
      FROM indicator i
      JOIN strategic_task t ON i.task_id = t.task_id
      JOIN org oo ON i.owner_org_id = oo.org_id
      JOIN org to2 ON i.target_org_id = to2.org_id
      LEFT JOIN indicator pi ON i.parent_indicator_id = pi.indicator_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (taskId) { query += ` AND i.task_id = $${paramIndex++}`; params.push(taskId); }
    if (level) { query += ` AND i.level = $${paramIndex++}`; params.push(level); }
    if (targetOrgId) { query += ` AND i.target_org_id = $${paramIndex++}`; params.push(targetOrgId); }
    if (year) { query += ` AND i.year = $${paramIndex++}`; params.push(year); }
    if (status) { query += ` AND i.status = $${paramIndex++}`; params.push(status); }
    else { query += ` AND i.status = 'ACTIVE'`; }
    
    query += ' ORDER BY i.year, i.task_id, i.sort_order';
    const result = await db.query(query, params);
    
    // 获取所有指标的 ID
    const indicatorIds = result.rows.map(r => r.indicator_id);
    
    // 批量获取里程碑数据
    let milestonesMap = {};
    if (indicatorIds.length > 0) {
      const milestonesResult = await db.query(`
        SELECT * FROM milestone 
        WHERE indicator_id = ANY($1)
        ORDER BY indicator_id, sort_order
      `, [indicatorIds]);
      
      // 按 indicator_id 分组
      milestonesResult.rows.forEach(m => {
        if (!milestonesMap[m.indicator_id]) {
          milestonesMap[m.indicator_id] = [];
        }
        milestonesMap[m.indicator_id].push({
          milestoneId: m.milestone_id,
          indicatorId: m.indicator_id,
          milestoneName: m.milestone_name,
          milestoneDesc: m.milestone_desc,
          dueDate: m.due_date,
          weightPercent: parseFloat(m.weight_percent || 0),
          status: m.status,
          sortOrder: m.sort_order,
          inheritedFromId: m.inherited_from,
          targetProgress: m.target_progress,
          isPaired: m.is_paired,
          createdAt: m.created_at,
          updatedAt: m.updated_at
        });
      });
    }
    
    // 转换为驼峰格式并附加里程碑
    const indicators = result.rows.map(row => {
      const vo = convertToIndicatorVO(row);
      vo.milestones = milestonesMap[row.indicator_id] || [];
      return vo;
    });
    
    console.log(`[Indicator API] Loaded ${indicators.length} indicators with milestones`);
    
    // 返回标准 ApiResponse 格式
    res.json({
      success: true,
      data: indicators,
      message: 'OK',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Get indicators error:', err);
    res.status(500).json({ success: false, data: null, message: '服务器错误', timestamp: new Date() });
  }
});

// GET /api/indicators/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, t.task_name, oo.org_name as owner_org, to2.org_name as target_org,
             pi.indicator_desc as parent_desc
      FROM indicator i
      JOIN strategic_task t ON i.task_id = t.task_id
      JOIN org oo ON i.owner_org_id = oo.org_id
      JOIN org to2 ON i.target_org_id = to2.org_id
      LEFT JOIN indicator pi ON i.parent_indicator_id = pi.indicator_id
      WHERE i.indicator_id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '指标不存在' });
    }
    
    // 获取里程碑
    const milestonesResult = await db.query(`
      SELECT * FROM milestone WHERE indicator_id = $1 ORDER BY sort_order
    `, [req.params.id]);
    
    const vo = convertToIndicatorVO(result.rows[0]);
    vo.milestones = milestonesResult.rows.map(m => ({
      milestoneId: m.milestone_id,
      indicatorId: m.indicator_id,
      milestoneName: m.milestone_name,
      milestoneDesc: m.milestone_desc,
      dueDate: m.due_date,
      weightPercent: parseFloat(m.weight_percent || 0),
      status: m.status,
      sortOrder: m.sort_order,
      inheritedFromId: m.inherited_from,
      targetProgress: m.target_progress,
      isPaired: m.is_paired,
      createdAt: m.created_at,
      updatedAt: m.updated_at
    }));
    
    res.json(vo);
  } catch (err) {
    console.error('Get indicator error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/indicators
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { taskId, parentIndicatorId, level, targetOrgId, indicatorDesc, weightPercent, sortOrder, year, remark } = req.body;
    const result = await db.query(`
      INSERT INTO indicator (task_id, parent_indicator_id, level, owner_org_id, target_org_id, indicator_desc, weight_percent, sort_order, year, remark)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [taskId, parentIndicatorId, level, req.user.orgId, targetOrgId, indicatorDesc, weightPercent || 0, sortOrder || 0, year || new Date().getFullYear(), remark]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create indicator error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// PUT /api/indicators/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { indicatorDesc, weightPercent, sortOrder, remark, status } = req.body;
    const result = await db.query(`
      UPDATE indicator SET indicator_desc = $1, weight_percent = $2, sort_order = $3, remark = $4, status = $5
      WHERE indicator_id = $6 RETURNING *
    `, [indicatorDesc, weightPercent, sortOrder, remark, status || 'ACTIVE', req.params.id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: '指标不存在' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update indicator error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// DELETE /api/indicators/:id (软删除)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // 检查是否有子指标
    const children = await db.query('SELECT COUNT(*) FROM indicator WHERE parent_indicator_id = $1 AND status = $2', [req.params.id, 'ACTIVE']);
    if (parseInt(children.rows[0].count) > 0) {
      return res.status(400).json({ error: '存在子指标，无法删除' });
    }
    
    const result = await db.query(`UPDATE indicator SET status = 'ARCHIVED' WHERE indicator_id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '指标不存在' });
    res.json({ message: '已归档', data: result.rows[0] });
  } catch (err) {
    console.error('Delete indicator error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
