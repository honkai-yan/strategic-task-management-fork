import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/adhoc-tasks
router.get('/', async (req, res) => {
  try {
    const { status, creatorOrgId } = req.query;
    let query = `
      SELECT at.*, o.org_name as creator_org, c.cycle_name
      FROM adhoc_task at
      JOIN org o ON at.creator_org_id = o.org_id
      JOIN assessment_cycle c ON at.cycle_id = c.cycle_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    if (status) { query += ` AND at.status = $${idx++}`; params.push(status); }
    if (creatorOrgId) { query += ` AND at.creator_org_id = $${idx++}`; params.push(creatorOrgId); }
    query += ' ORDER BY at.created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get adhoc tasks error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/adhoc-tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await db.query(`
      SELECT at.*, o.org_name as creator_org FROM adhoc_task at
      JOIN org o ON at.creator_org_id = o.org_id WHERE at.adhoc_task_id = $1
    `, [req.params.id]);
    if (task.rows.length === 0) return res.status(404).json({ error: '临时任务不存在' });
    
    const targets = await db.query(`
      SELECT o.* FROM adhoc_task_target att JOIN org o ON att.target_org_id = o.org_id WHERE att.adhoc_task_id = $1
    `, [req.params.id]);
    
    res.json({ ...task.rows[0], targets: targets.rows });
  } catch (err) {
    console.error('Get adhoc task error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/adhoc-tasks
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { cycleId, scopeType, indicatorId, taskTitle, taskDesc, openAt, dueAt, includeInAlert, requireIndicatorReport, targetOrgIds } = req.body;
    
    const result = await db.query(`
      INSERT INTO adhoc_task (cycle_id, creator_org_id, scope_type, indicator_id, task_title, task_desc, open_at, due_at, include_in_alert, require_indicator_report)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `, [cycleId, req.user.orgId, scopeType || 'ALL_ORGS', indicatorId, taskTitle, taskDesc, openAt, dueAt, includeInAlert || false, requireIndicatorReport || false]);
    
    const taskId = result.rows[0].adhoc_task_id;
    if (targetOrgIds && targetOrgIds.length > 0) {
      for (const orgId of targetOrgIds) {
        await db.query('INSERT INTO adhoc_task_target (adhoc_task_id, target_org_id) VALUES ($1, $2)', [taskId, orgId]);
      }
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create adhoc task error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// PUT /api/adhoc-tasks/:id/status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.query('UPDATE adhoc_task SET status=$1 WHERE adhoc_task_id=$2 RETURNING *', [status, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '临时任务不存在' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update adhoc task status error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
