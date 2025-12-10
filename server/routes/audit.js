import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/audit-logs
router.get('/', async (req, res) => {
  try {
    const { entityType, action, actorUserId, limit = 50 } = req.query;
    let query = `
      SELECT al.*, u.real_name as actor_name, o.org_name as actor_org
      FROM audit_log al
      LEFT JOIN app_user u ON al.actor_user_id = u.user_id
      LEFT JOIN org o ON al.actor_org_id = o.org_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    if (entityType) { query += ` AND al.entity_type = $${idx++}`; params.push(entityType); }
    if (action) { query += ` AND al.action = $${idx++}`; params.push(action); }
    if (actorUserId) { query += ` AND al.actor_user_id = $${idx++}`; params.push(actorUserId); }
    query += ` ORDER BY al.created_at DESC LIMIT $${idx}`;
    params.push(parseInt(limit));
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/audit-logs (内部使用)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { entityType, entityId, action, beforeJson, afterJson, changedFields, reason } = req.body;
    const result = await db.query(`
      INSERT INTO audit_log (entity_type, entity_id, action, before_json, after_json, changed_fields, reason, actor_user_id, actor_org_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [entityType, entityId, action, beforeJson, afterJson, changedFields, reason, req.user.userId, req.user.orgId]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create audit log error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
