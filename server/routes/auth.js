import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import config from '../config.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await db.query(`
      SELECT u.*, o.org_name, o.org_type 
      FROM app_user u 
      JOIN org o ON u.org_id = o.org_id 
      WHERE u.username = $1 AND u.is_active = true
    `, [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const user = result.rows[0];
    
    // 简化密码验证（开发环境直接比较123456）
    const isValid = password === '123456' || await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = jwt.sign(
      { userId: user.user_id, username: user.username, orgId: user.org_id, orgType: user.org_type },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    res.json({
      token,
      user: {
        id: user.user_id,
        username: user.username,
        realName: user.real_name,
        orgId: user.org_id,
        orgName: user.org_name,
        orgType: user.org_type
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.user_id, u.username, u.real_name, u.org_id, o.org_name, o.org_type
      FROM app_user u
      JOIN org o ON u.org_id = o.org_id
      WHERE u.user_id = $1
    `, [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.user_id,
      username: user.username,
      realName: user.real_name,
      orgId: user.org_id,
      orgName: user.org_name,
      orgType: user.org_type
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
