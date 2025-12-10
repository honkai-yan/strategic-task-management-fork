import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    const { indicatorId, milestoneId, status, reporterId } = req.query;
    let query = `
      SELECT pr.*, i.indicator_desc, m.milestone_name, u.real_name as reporter_name
      FROM progress_report pr
      JOIN indicator i ON pr.indicator_id = i.indicator_id
      LEFT JOIN milestone m ON pr.milestone_id = m.milestone_id
      JOIN app_user u ON pr.reporter_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    
    if (indicatorId) { query += ` AND pr.indicator_id = $${idx++}`; params.push(indicatorId); }
    if (milestoneId) { query += ` AND pr.milestone_id = $${idx++}`; params.push(milestoneId); }
    if (status) { query += ` AND pr.status = $${idx++}`; params.push(status); }
    if (reporterId) { query += ` AND pr.reporter_id = $${idx++}`; params.push(reporterId); }
    query += ' ORDER BY pr.created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/reports/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pr.*, i.indicator_desc, m.milestone_name, u.real_name as reporter_name
      FROM progress_report pr
      JOIN indicator i ON pr.indicator_id = i.indicator_id
      LEFT JOIN milestone m ON pr.milestone_id = m.milestone_id
      JOIN app_user u ON pr.reporter_id = u.user_id
      WHERE pr.report_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '汇报不存在' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/reports
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { indicatorId, milestoneId, adhocTaskId, percentComplete, achievedMilestone, narrative } = req.body;
    
    // R3: milestone_id 与 adhoc_task_id 不可同时存在
    if (milestoneId && adhocTaskId) {
      return res.status(400).json({ error: '里程碑和临时任务不能同时关联' });
    }
    
    const result = await db.query(`
      INSERT INTO progress_report (indicator_id, milestone_id, adhoc_task_id, percent_complete, achieved_milestone, narrative, reporter_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT') RETURNING *
    `, [indicatorId, milestoneId, adhocTaskId, percentComplete || 0, achievedMilestone || false, narrative, req.user.userId]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// PUT /api/reports/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { percentComplete, achievedMilestone, narrative } = req.body;
    const result = await db.query(`
      UPDATE progress_report SET percent_complete=$1, achieved_milestone=$2, narrative=$3
      WHERE report_id=$4 AND status='DRAFT' RETURNING *
    `, [percentComplete, achievedMilestone, narrative, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '汇报不存在或已提交' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/reports/:id/submit
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      UPDATE progress_report SET status='SUBMITTED', reported_at=CURRENT_TIMESTAMP
      WHERE report_id=$1 AND status='DRAFT' RETURNING *
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '汇报不存在或已提交' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/reports/:id/approve
router.post('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { action, comment } = req.body; // action: APPROVE, REJECT, RETURN
    
    const statusMap = { APPROVE: 'APPROVED', REJECT: 'REJECTED', RETURN: 'RETURNED' };
    const newStatus = statusMap[action];
    if (!newStatus) return res.status(400).json({ error: '无效的审批操作' });
    
    // 更新汇报状态
    const isFinal = action === 'APPROVE';
    const result = await db.query(`
      UPDATE progress_report SET status=$1, is_final=$2
      WHERE report_id=$3 AND status='SUBMITTED' RETURNING *
    `, [newStatus, isFinal, req.params.id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: '汇报不存在或状态不正确' });
    
    // 记录审批
    await db.query(`
      INSERT INTO approval_record (report_id, approver_id, action, comment) VALUES ($1, $2, $3, $4)
    `, [req.params.id, req.user.userId, action, comment]);
    
    // 如果审批通过且达成里程碑，更新里程碑状态
    if (action === 'APPROVE' && result.rows[0].achieved_milestone && result.rows[0].milestone_id) {
      await db.query(`UPDATE milestone SET status='COMPLETED' WHERE milestone_id=$1`, [result.rows[0].milestone_id]);
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Approve report error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
