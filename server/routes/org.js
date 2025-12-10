import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/orgs
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM org WHERE is_active = true';
    const params = [];
    
    if (type) {
      query += ' AND org_type = $1';
      params.push(type);
    }
    query += ' ORDER BY sort_order';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get orgs error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/orgs/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM org WHERE org_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '组织不存在' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get org error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
