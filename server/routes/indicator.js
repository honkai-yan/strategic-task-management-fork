import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/indicators
router.get('/', async (req, res) => {
  try {
    const { taskId, level, targetOrgId, status } = req.query;
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
    if (status) { query += ` AND i.status = $${paramIndex++}`; params.push(status); }
    else { query += ` AND i.status = 'ACTIVE'`; }
    
    query += ' ORDER BY i.task_id, i.sort_order';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get indicators error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/indicators/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, t.task_name, oo.org_name as owner_org, to2.org_name as target_org
      FROM indicator i
      JOIN strategic_task t ON i.task_id = t.task_id
      JOIN org oo ON i.owner_org_id = oo.org_id
      JOIN org to2 ON i.target_org_id = to2.org_id
      WHERE i.indicator_id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '指标不存在' });
    }
    res.json(result.rows[0]);
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
