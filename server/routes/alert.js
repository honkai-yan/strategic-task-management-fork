import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/alerts/events
router.get('/events', async (req, res) => {
  try {
    const { status, severity } = req.query;
    let query = `
      SELECT ae.*, i.indicator_desc, aw.name as window_name, ar.name as rule_name, u.real_name as handler_name
      FROM alert_event ae
      JOIN indicator i ON ae.indicator_id = i.indicator_id
      JOIN alert_window aw ON ae.window_id = aw.window_id
      JOIN alert_rule ar ON ae.rule_id = ar.rule_id
      LEFT JOIN app_user u ON ae.handled_by = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    if (status) { query += ` AND ae.status = $${idx++}`; params.push(status); }
    if (severity) { query += ` AND ae.severity = $${idx++}`; params.push(severity); }
    query += ' ORDER BY ae.created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get alert events error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/alerts/rules
router.get('/rules', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM alert_rule ORDER BY gap_threshold');
    res.json(result.rows);
  } catch (err) {
    console.error('Get alert rules error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/alerts/windows
router.get('/windows', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM alert_window ORDER BY cutoff_date');
    res.json(result.rows);
  } catch (err) {
    console.error('Get alert windows error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/alerts/events/:id/handle
router.post('/events/:id/handle', authMiddleware, async (req, res) => {
  try {
    const { note } = req.body;
    const result = await db.query(`
      UPDATE alert_event SET status='CLOSED', handled_by=$1, handled_note=$2
      WHERE event_id=$3 RETURNING *
    `, [req.user.userId, note, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '预警事件不存在' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Handle alert error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
