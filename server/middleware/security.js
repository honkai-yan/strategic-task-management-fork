/**
 * 安全中间件
 * 提供请求验证、频率限制、日志记录等功能
 */

import crypto from 'crypto';
import config from '../config.js';

// 请求频率限制存储
const rateLimitStore = new Map();

/**
 * 请求签名验证中间件
 * 用于敏感操作的额外安全验证
 */
export function signatureVerify(req, res, next) {
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];
  
  // 跳过不需要签名的请求
  if (!signature) {
    return next();
  }
  
  // 验证时间戳（5分钟有效期）
  const now = Date.now();
  if (!timestamp || Math.abs(now - parseInt(timestamp)) > 5 * 60 * 1000) {
    return res.status(400).json({ error: '请求已过期' });
  }
  
  // 验证签名
  const payload = JSON.stringify(req.body || {});
  const expectedSignature = crypto
    .createHmac('sha256', config.jwt.secret)
    .update(`${timestamp}:${payload}`)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(400).json({ error: '签名验证失败' });
  }
  
  next();
}

/**
 * 请求频率限制中间件
 * 防止恶意请求和DDoS攻击
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 60 * 1000,  // 时间窗口（默认1分钟）
    maxRequests = 100,      // 最大请求数
    message = '请求过于频繁，请稍后再试'
  } = options;
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    
    // 获取或初始化请求记录
    let record = rateLimitStore.get(key);
    if (!record || now - record.startTime > windowMs) {
      record = { count: 0, startTime: now };
    }
    
    record.count++;
    rateLimitStore.set(key, record);
    
    // 设置响应头
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', record.startTime + windowMs);
    
    if (record.count > maxRequests) {
      return res.status(429).json({ error: message });
    }
    
    next();
  };
}

/**
 * 操作日志记录中间件
 */
export function auditLog(req, res, next) {
  const startTime = Date.now();
  
  // 响应完成后记录日志
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userId: req.user?.userId || 'anonymous',
      orgId: req.user?.orgId || null,
      ip: req.ip || req.connection.remoteAddress,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent']
    };
    
    // 敏感操作详细记录
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      log.body = sanitizeBody(req.body);
    }
    
    // 输出日志（生产环境可改为写入数据库或日志服务）
    if (res.statusCode >= 400) {
      console.error('[AUDIT ERROR]', JSON.stringify(log));
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('[AUDIT]', JSON.stringify(log));
    }
  });
  
  next();
}

/**
 * 敏感数据脱敏
 */
function sanitizeBody(body) {
  if (!body) return null;
  
  const sensitiveFields = ['password', 'token', 'secret', 'credential'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

/**
 * 请求体大小限制
 */
export function bodyLimit(maxSize = '1mb') {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      return res.status(413).json({ error: '请求体过大' });
    }
    
    next();
  };
}

function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/);
  if (!match) return 1024 * 1024; // 默认1MB
  return parseInt(match[1]) * (units[match[2]] || 1);
}

/**
 * 清理过期的频率限制记录（定时任务）
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.startTime > 5 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000);
