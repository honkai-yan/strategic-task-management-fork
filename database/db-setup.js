/**
 * SISM 数据库初始化脚本
 * 用法: node db-setup.js [--reset] [--seed]
 *   --reset: 清空并重建数据库
 *   --seed:  插入示例数据
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: 'localhost',
  port: 5432,
  database: 'strategic',
  user: 'postgres',
  password: '64378561huaW'
};

async function run() {
  const args = process.argv.slice(2);
  const doReset = args.includes('--reset');
  const doSeed = args.includes('--seed');
  
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✓ Connected to database');
    
    if (doReset) {
      console.log('→ Dropping existing objects...');
      const dropSql = fs.readFileSync(path.join(__dirname, 'drop-all.sql'), 'utf8');
      await client.query(dropSql);
      console.log('✓ Cleanup done');
      
      console.log('→ Creating tables...');
      const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
      await client.query(initSql);
      console.log('✓ Tables created');
    }
    
    if (doSeed) {
      console.log('→ Inserting seed data...');
      const seedSql = fs.readFileSync(path.join(__dirname, 'seed-data.sql'), 'utf8');
      await client.query(seedSql);
      console.log('✓ Seed data inserted');
    }
    
    // 显示统计
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM org) as orgs,
        (SELECT COUNT(*) FROM app_user) as users,
        (SELECT COUNT(*) FROM strategic_task) as tasks,
        (SELECT COUNT(*) FROM indicator) as indicators,
        (SELECT COUNT(*) FROM milestone) as milestones
    `);
    console.log('\n📊 Database summary:', stats.rows[0]);
    
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
