# 战略指标管理系统 (SISM)

Strategic Indicator Management System - 高校战略任务与指标管理平台

## 项目简介

战略指标管理系统是一个面向高校的战略任务与指标管理平台，支持：

- **数据看板** - 可视化展示战略任务完成情况、指标进度、部门对比
- **指标管理** - 指标的创建、分配、填报、审批全流程
- **里程碑跟踪** - 按时间节点跟踪指标完成进度
- **多角色权限** - 战略发展部、职能部门、二级学院分级管理
- **审计日志** - 完整记录所有操作历史

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite + Element Plus + ECharts
- **后端**: Node.js + Express + PostgreSQL
- **状态管理**: Pinia
- **测试**: Vitest + fast-check

## 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm >= 9.0.0

## 快速开始

### 1. 安装依赖

```bash
npm install
cd server && npm install && cd ..
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入数据库配置
```

### 3. 初始化数据库

```bash
npm run sync-db
```

### 4. 启动服务

```bash
# 启动后端 API 服务器 (端口 8080)
npm run server

# 新开终端，启动前端开发服务器
npm run dev
```

访问 http://localhost:5173 即可使用系统。

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器 |
| `npm run server` | 启动后端 API 服务器 |
| `npm run sync-db` | 执行数据同步脚本 |
| `npm run build` | 构建生产版本 |
| `npm run test` | 运行测试 |

## 项目结构

```
strategic-task-management/
├── src/                    # 前端源码
│   ├── api/               # API 请求层
│   ├── components/        # Vue 组件
│   ├── views/             # 页面视图
│   ├── stores/            # Pinia 状态管理
│   └── types/             # TypeScript 类型定义
├── server/                 # 后端 API 服务
├── scripts/                # 数据同步脚本
├── database/               # 数据库脚本
└── tests/                  # 测试文件
```

## 用户角色

| 角色 | 说明 |
|------|------|
| `strategic_dept` | 战略发展部 - 系统管理员 |
| `functional_dept` | 职能部门 - 中层管理 |
| `secondary_college` | 二级学院 - 执行层 |

## 相关文档

- [API 接口文档](docs/api-reference.md)
- [数据库设计](docs/database-schema.md)

## License

Private - All Rights Reserved
