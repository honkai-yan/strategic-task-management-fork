import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const { cycleId } = req.query;
    let query = `
      SELECT t.*, c.cycle_name, o.org_name as assigned_org, co.org_name as created_by_org
      FROM strategic_task t
      JOIN assessment_cycle c ON t.cycle_id = c.cycle_id
      JOIN org o ON t.org_id = o.org_id
      JOIN org co ON t.created_by_org_id = co.org_id
    `;
    const params = [];
    
    if (cycleId) {
      query += ' WHERE t.cycle_id = $1';
      params.push(cycleId);
    }
    query += ' ORDER BY t.sort_order';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, c.cycle_name, o.org_name as assigned_org
      FROM strategic_task t
      JOIN assessment_cycle c ON t.cycle_id = c.cycle_id
      JOIN org o ON t.org_id = o.org_id
      WHERE t.task_id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/tasks
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { cycleId, taskName, taskDesc, taskType, orgId, sortOrder, remark } = req.body;
    const result = await db.query(`
      INSERT INTO strategic_task (cycle_id, task_name, task_desc, task_type, org_id, created_by_org_id, sort_order, remark)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [cycleId, taskName, taskDesc, taskType || 'BASIC', orgId, req.user.orgId, sortOrder || 0, remark]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { taskName, taskDesc, taskType, orgId, sortOrder, remark } = req.body;
    const result = await db.query(`
      UPDATE strategic_task 
      SET task_name = $1, task_desc = $2, task_type = $3, org_id = $4, sort_order = $5, remark = $6
      WHERE task_id = $7
      RETURNING *
    `, [taskName, taskDesc, taskType, orgId, sortOrder, remark, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
