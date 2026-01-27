import { Router } from 'express';
import db from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard
router.get('/', optionalAuth, async (req, res) => {
  try {
    // 统计数据
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM strategic_task) as total_tasks,
        (SELECT COUNT(*) FROM indicator WHERE status = 'ACTIVE') as total_indicators,
        (SELECT COUNT(*) FROM milestone WHERE status NOT IN ('COMPLETED', 'CANCELED')) as pending_milestones,
        (SELECT COUNT(*) FROM alert_event WHERE status = 'OPEN') as open_alerts
    `);
    
    // 任务完成率
    const completionRate = await db.query(`
      SELECT 
        COALESCE(AVG(pr.percent_complete), 0) as avg_completion
      FROM indicator i
      LEFT JOIN progress_report pr ON i.indicator_id = pr.indicator_id AND pr.is_final = true
      WHERE i.status = 'ACTIVE'
    `);
    
    res.json({
      totalTasks: parseInt(stats.rows[0].total_tasks),
      totalIndicators: parseInt(stats.rows[0].total_indicators),
      pendingMilestones: parseInt(stats.rows[0].pending_milestones),
      openAlerts: parseInt(stats.rows[0].open_alerts),
      avgCompletion: parseFloat(completionRate.rows[0].avg_completion || 0).toFixed(1)
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/dashboard/department-progress
router.get('/department-progress', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        o.org_id,
        o.org_name,
        o.org_type,
        COUNT(DISTINCT i.indicator_id) as indicator_count,
        COALESCE(AVG(pr.percent_complete), 0) as avg_progress
      FROM org o
      LEFT JOIN indicator i ON o.org_id = i.target_org_id AND i.status = 'ACTIVE'
      LEFT JOIN progress_report pr ON i.indicator_id = pr.indicator_id AND pr.is_final = true
      WHERE o.org_type IN ('FUNCTION_DEPT', 'COLLEGE')
      GROUP BY o.org_id, o.org_name, o.org_type
      ORDER BY o.sort_order
    `);
    
    res.json(result.rows.map(r => ({
      orgId: r.org_id,
      orgName: r.org_name,
      orgType: r.org_type,
      indicatorCount: parseInt(r.indicator_count),
      avgProgress: parseFloat(r.avg_progress).toFixed(1)
    })));
  } catch (err) {
    console.error('Department progress error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/dashboard/recent-activities
router.get('/recent-activities', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        al.log_id,
        al.entity_type,
        al.action,
        al.created_at,
        u.real_name as actor_name,
        o.org_name as actor_org
      FROM audit_log al
      LEFT JOIN app_user u ON al.actor_user_id = u.user_id
      LEFT JOIN org o ON al.actor_org_id = o.org_id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);
    
    res.json(result.rows.map(r => ({
      id: r.log_id,
      entityType: r.entity_type,
      action: r.action,
      actorName: r.actor_name,
      actorOrg: r.actor_org,
      createdAt: r.created_at
    })));
  } catch (err) {
    console.error('Recent activities error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/dashboard/export/excel
router.get('/export/excel', async (req, res) => {
  res.json({ message: '导出Excel功能待实现', downloadUrl: null });
});

// GET /api/dashboard/export/pdf
router.get('/export/pdf', async (req, res) => {
  res.json({ message: '导出PDF功能待实现', downloadUrl: null });
});

export default router;
