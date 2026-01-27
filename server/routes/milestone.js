import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/milestones
router.get('/', async (req, res) => {
  try {
    const { indicatorId, status } = req.query;
    let query = `SELECT m.*, i.indicator_desc FROM milestone m JOIN indicator i ON m.indicator_id = i.indicator_id WHERE 1=1`;
    const params = [];
    let idx = 1;
    
    // 修复：使用 $${idx++} 而不是 ${idx++} 作为 PostgreSQL 参数占位符
    if (indicatorId) { query += ` AND m.indicator_id = $${idx++}`; params.push(indicatorId); }
    if (status) { query += ` AND m.status = $${idx++}`; params.push(status); }
    query += ' ORDER BY m.indicator_id, m.sort_order';
    
    console.log('[Milestone API] Query:', query, 'Params:', params);
    const result = await db.query(query, params);
    console.log('[Milestone API] Found', result.rows.length, 'milestones');
    res.json(result.rows);
  } catch (err) {
    console.error('Get milestones error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/milestones/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`SELECT m.*, i.indicator_desc FROM milestone m JOIN indicator i ON m.indicator_id = i.indicator_id WHERE m.milestone_id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '里程碑不存在' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get milestone error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/milestones
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { indicatorId, milestoneName, milestoneDesc, dueDate, weightPercent, sortOrder } = req.body;
    const result = await db.query(`
      INSERT INTO milestone (indicator_id, milestone_name, milestone_desc, due_date, weight_percent, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [indicatorId, milestoneName, milestoneDesc, dueDate, weightPercent || 0, sortOrder || 0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create milestone error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// PUT /api/milestones/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { milestoneName, milestoneDesc, dueDate, weightPercent, status, sortOrder } = req.body;
    const result = await db.query(`
      UPDATE milestone SET milestone_name=$1, milestone_desc=$2, due_date=$3, weight_percent=$4, status=$5, sort_order=$6
      WHERE milestone_id=$7 RETURNING *
    `, [milestoneName, milestoneDesc, dueDate, weightPercent, status, sortOrder, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '里程碑不存在' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update milestone error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
