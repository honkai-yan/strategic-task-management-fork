import { Router } from 'express';
import db from '../db.js';

const router = Router();

/**
 * 将数据库行转换为驼峰格式的 OrgVO
 * @param {Object} row - 数据库查询结果行 (snake_case)
 * @returns {OrgVO} - 驼峰格式的组织 VO
 */
function convertToOrgVO(row) {
  if (!row) {
    return null;
  }
  
  return {
    orgId: row.org_id != null ? parseInt(row.org_id, 10) : null,
    orgName: row.org_name ?? null,
    orgType: row.org_type ?? null,
    parentOrgId: row.parent_org_id != null ? parseInt(row.parent_org_id, 10) : null,
    isActive: row.is_active ?? true,
    sortOrder: row.sort_order != null ? parseInt(row.sort_order, 10) : 0,
    remark: row.remark ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null
  };
}

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
    
    // 使用 convertToOrgVO 转换每条记录为 camelCase 格式
    const data = result.rows.map(row => convertToOrgVO(row));
    
    // 返回标准 ApiResponse 格式
    res.json({
      success: true,
      data: data,
      message: 'OK',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Get orgs error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器错误',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/orgs/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM org WHERE org_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '组织不存在',
        timestamp: new Date().toISOString()
      });
    }
    
    // 使用 convertToOrgVO 转换单条记录为 camelCase 格式
    const data = convertToOrgVO(result.rows[0]);
    
    // 返回标准 ApiResponse 格式
    res.json({
      success: true,
      data: data,
      message: 'OK',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Get org error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器错误',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
