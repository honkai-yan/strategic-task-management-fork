# 战略指标管理系统 - 前端

Strategic Indicator Management System - Vue 3 前端应用

## 项目简介

战略指标管理系统前端是一个基于 Vue 3 的单页应用，提供：

- **数据看板** - 可视化展示战略任务完成情况、指标进度、部门对比
- **指标管理** - 指标的创建、分配、填报、审批全流程
- **里程碑跟踪** - 按时间节点跟踪指标完成进度
- **多角色权限** - 战略发展部、职能部门、二级学院分级管理
- **审计日志** - 完整记录所有操作历史

## 技术栈

- **前端框架**: Vue 3 + TypeScript + Vite
- **UI 组件库**: Element Plus
- **图表库**: ECharts
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP 客户端**: Axios
- **测试**: Vitest + fast-check

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
copy .env.example .env
# 编辑 .env 文件，配置后端 API 地址
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 即可使用系统。

> 注意：需要先启动后端服务（sism-backend），前端才能正常工作。

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run build:check` | 类型检查 + 构建 |
| `npm run preview` | 预览生产构建 |
| `npm run test` | 运行测试 |
| `npm run test:watch` | 监听模式测试 |
| `npm run lint` | 代码检查并修复 |
| `npm run format` | 代码格式化 |

## 项目结构

```
src/
├── api/                # API 请求层
│   ├── index.ts       # Axios 实例和拦截器
│   ├── fallback.ts    # 降级服务
│   ├── indicator.ts   # 指标 API
│   ├── milestone.ts   # 里程碑 API
│   ├── org.ts         # 组织机构 API
│   └── strategic.ts   # 战略任务 API
├── components/         # Vue 组件
│   ├── approval/      # 审批相关组件
│   ├── charts/        # ECharts 图表组件
│   ├── common/        # 通用组件
│   ├── dashboard/     # 仪表盘组件
│   ├── indicator/     # 指标组件
│   ├── milestone/     # 里程碑组件
│   ├── profile/       # 个人中心组件
│   └── task/          # 任务组件
├── views/              # 页面视图
├── stores/             # Pinia 状态管理
│   ├── auth.ts        # 认证状态
│   ├── dashboard.ts   # 仪表盘状态
│   ├── org.ts         # 组织机构状态
│   ├── strategic.ts   # 战略任务状态
│   ├── auditLog.ts    # 审计日志状态
│   └── timeContext.ts # 时间上下文
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── config/             # 配置文件
├── data/               # 静态数据和模拟数据
└── router/             # 路由配置

tests/                  # 测试文件
├── property/          # 属性测试（fast-check）
└── unit/              # 单元测试（vitest）
```

## 用户角色

| 角色 | 说明 |
|------|------|
| `strategic_dept` | 战略发展部 - 系统管理员 |
| `functional_dept` | 职能部门 - 中层管理 |
| `secondary_college` | 二级学院 - 执行层 |

## API 配置

开发环境下，Vite 会将 `/api` 请求代理到后端服务器（默认 `http://localhost:8080`）。

生产环境需要在 `.env.production` 中配置正确的后端 API 地址。

## 开发规范

1. 使用 Vue 3 Composition API + `<script setup>` 语法
2. 使用 TypeScript 进行类型检查
3. 遵循 ESLint 和 Prettier 代码规范
4. 组件命名使用 PascalCase
5. 使用 Pinia 进行状态管理
6. API 调用统一通过 `src/api/` 目录
7. 编写单元测试和属性测试

## 相关文档

- 后端项目：[sism-backend](../sism-backend/README.md)
- Vue 3 文档：https://vuejs.org/
- Element Plus 文档：https://element-plus.org/
- ECharts 文档：https://echarts.apache.org/

## License

Private - All Rights Reserved
