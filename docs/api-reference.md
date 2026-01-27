# 战略指标管理系统 - API 接口文档

> 版本: 4.0.0  
> 更新时间: 2026-01-19  
> 基础路径: `http://localhost:8080/api`  
> 数据库: PostgreSQL 15+ 

---

## 📋 文档说明

本文档描述了 SISM (Strategic Indicator Management System) 的完整 REST API 接口规范。

### 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 4.0.0 | 2026-01-19 | 新增指标/里程碑多个字段，完善API端点，重构文档结构 |
| 3.0.0 | 2026-01-15 | 重构指标模块，新增下发功能 |
| 2.0.0 | 2025-12-01 | 新增临时任务模块 |
| 1.0.0 | 2025-11-01 | 初始版本 |

---

## 目录

1. [认证模块](#1-认证模块)
2. [组织机构模块](#2-组织机构模块)
3. [战略任务模块](#3-战略任务模块)
4. [指标模块](#4-指标模块-核心)
5. [里程碑模块](#5-里程碑模块)
6. [进度报告模块](#6-进度报告模块)
7. [审批记录模块](#7-审批记录模块)
8. [审计日志模块](#8-审计日志模块)
9. [预警模块](#9-预警模块)
10. [临时任务模块](#10-临时任务模块)
11. [通用规范](#11-通用规范)
12. [枚举值参考](#12-枚举值参考)

---

## 🔐 认证说明

所有 API 请求（除登录外）需要在 Header 中携带 JWT Token：

```http
Authorization: Bearer <your_jwt_token>
```

### 权限角色

| 角色 | 组织类型 | 权限范围 |
|------|----------|----------|
| 战略发展部 | STRATEGY_DEPT | 创建战略任务、发布战略指标、查看全局数据 |
| 职能部门 | FUNCTIONAL_DEPT | 管理本部门指标、下发至二级学院、审批报告 |
| 二级学院 | COLLEGE | 填报进度、提交报告 |

---

## 1. 认证模块

**基础路径:** `/api/auth`

### 1.1 用户登录

```http
POST /api/auth/login
Content-Type: application/json
```

**请求体:**
```json
{
  "username": "zhanlue",
  "password": "123456"
}
```

**响应:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "username": "zhanlue",
      "realName": "张战略",
      "orgId": 1,
      "orgName": "战略发展部",
      "orgType": "STRATEGY_DEPT"
    }
  }
}
```

### 1.2 获取当前用户信息

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 1.3 用户登出

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

## 2. 组织机构模块

**基础路径:** `/api/orgs`

### 2.1 获取所有组织

```http
GET /api/orgs
```

### 2.2 获取组织层级树

```http
GET /api/orgs/hierarchy
```

### 2.3 获取单个组织详情

```http
GET /api/orgs/{id}
```

### 2.4 按类型获取组织

```http
GET /api/orgs/type/{orgType}
```

**示例:** `GET /api/orgs/type/COLLEGE` 获取所有二级学院

---

## 3. 战略任务模块

**基础路径:** `/api/tasks`

### 3.1 获取所有任务

```http
GET /api/tasks
```

### 3.2 按考核周期获取任务

```http
GET /api/tasks/cycle/{cycleId}
```

### 3.3 获取单个任务详情

```http
GET /api/tasks/{id}
```

### 3.4 创建战略任务

```http
POST /api/tasks
Content-Type: application/json
```

**请求体:**
```json
{
  "cycleId": 1,
  "taskName": "新战略任务",
  "taskDesc": "任务描述",
  "taskType": "KEY",
  "orgId": 1,
  "createdByOrgId": 1,
  "sortOrder": 0
}
```

---

## 4. 指标模块 ⭐ 核心模块

**基础路径:** `/api/indicators`

### 4.1 获取所有活跃指标

```http
GET /api/indicators
```

**响应示例:** (2026-01-19 更新)
```json
{
  "success": true,
  "data": [
    {
      "indicatorId": 101,
      "taskId": 1,
      "taskName": "全力促进毕业生多元化高质量就业创业",
      "parentIndicatorId": null,
      "level": "STRAT_TO_FUNC",
      "ownerOrgId": 1,
      "ownerOrgName": "战略发展部",
      "ownerDept": "战略发展部",
      "targetOrgId": 2,
      "targetOrgName": "就业创业指导中心",
      "responsibleDept": "就业创业指导中心",
      "indicatorDesc": "优质就业比例不低于15%",
      "weightPercent": 20,
      "year": 2026,
      "status": "ACTIVE",
      "isQualitative": false,
      "type1": "定量",
      "type2": "基础性",
      "targetValue": 15.00,
      "unit": "%",
      "responsiblePerson": "张三",
      "progress": 0,
      "progressApprovalStatus": "NONE",
      "isStrategic": true
    }
  ]
}
```

### 4.2 指标字段说明

#### 基础字段

| 字段 | 类型 | 说明 |
|------|------|------|
| indicatorId | Long | 指标ID |
| taskId | Long | 关联战略任务ID |
| parentIndicatorId | Long | 父指标ID |
| level | Enum | STRAT_TO_FUNC / FUNC_TO_COLLEGE |
| ownerOrgId | Long | 发布方组织ID |
| targetOrgId | Long | 责任方组织ID |
| indicatorDesc | String | 指标描述 |
| weightPercent | BigDecimal | 权重百分比 |
| year | Integer | 年份 |
| status | Enum | ACTIVE / ARCHIVED |

#### 新增字段 (2026-01-19)

| 字段 | 类型 | 说明 |
|------|------|------|
| isQualitative | Boolean | 是否定性指标 |
| type1 | String | 定性/定量 |
| type2 | String | 发展性/基础性 |
| targetValue | BigDecimal | 目标值 |
| actualValue | BigDecimal | 实际值 |
| unit | String | 单位 |
| responsiblePerson | String | 责任人 |
| progress | Integer | 当前进度 0-100 |
| progressApprovalStatus | Enum | NONE/PENDING/APPROVED/REJECTED |
| pendingProgress | Integer | 待审批进度 |

### 4.3 获取单个指标

```http
GET /api/indicators/{id}
```

### 4.4 按任务获取指标

```http
GET /api/indicators/task/{taskId}
```

### 4.5 按责任方组织获取

```http
GET /api/indicators/target/{targetOrgId}
```

### 4.6 搜索指标

```http
GET /api/indicators/search?keyword={keyword}
```

### 4.7 创建指标

```http
POST /api/indicators
```

### 4.8 更新指标

```http
PUT /api/indicators/{id}
```

### 4.9 删除（归档）指标

```http
DELETE /api/indicators/{id}
```

### 4.10 下发指标

```http
POST /api/indicators/{id}/distribute?targetOrgId={orgId}
```

### 4.11 批量下发

```http
POST /api/indicators/{id}/distribute/batch
Content-Type: application/json
```

**请求体:** `[6, 7, 8]` (目标组织ID数组)

### 4.12 按类型过滤

```http
GET /api/indicators/filter?type1={type1}&type2={type2}
```

### 4.13 获取定性指标

```http
GET /api/indicators/qualitative
```

### 4.14 获取定量指标

```http
GET /api/indicators/quantitative
```

---

## 5. 里程碑模块

**基础路径:** `/api/milestones`

### 5.1 获取单个里程碑

```http
GET /api/milestones/{id}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "milestoneId": 1001,
    "indicatorId": 101,
    "milestoneName": "Q1: 就业数据摸底",
    "dueDate": "2026-03-31",
    "weightPercent": 25,
    "status": "NOT_STARTED",
    "targetProgress": 25,
    "isPaired": false
  }
}
```

### 5.2 里程碑字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| milestoneId | Long | 里程碑ID |
| indicatorId | Long | 关联指标ID |
| milestoneName | String | 里程碑名称 |
| dueDate | Date | 截止日期 |
| weightPercent | BigDecimal | 权重百分比 |
| status | Enum | NOT_STARTED/IN_PROGRESS/COMPLETED/DELAYED/CANCELED |
| targetProgress | Integer | 目标进度 0-100 (新增) |
| isPaired | Boolean | 是否已配对 (新增) |

### 5.3 按指标获取里程碑

```http
GET /api/milestones/indicator/{indicatorId}
```

### 5.4 获取逾期里程碑

```http
GET /api/milestones/overdue
```

### 5.5 获取即将到期里程碑

```http
GET /api/milestones/upcoming?days=7
```

### 5.6 验证里程碑权重

```http
GET /api/milestones/indicator/{indicatorId}/weight-validation
```

### 5.7 创建里程碑

```http
POST /api/milestones
```

### 5.8 更新里程碑

```http
PUT /api/milestones/{id}
```

### 5.9 更新状态

```http
PATCH /api/milestones/{id}/status?status={status}
```

### 5.10 删除里程碑

```http
DELETE /api/milestones/{id}
```

### 5.11 获取下一个待填报里程碑

```http
GET /api/milestones/indicator/{indicatorId}/next-to-report
```

### 5.12 获取未配对里程碑

```http
GET /api/milestones/indicator/{indicatorId}/unpaired
```

### 5.13 检查是否已配对

```http
GET /api/milestones/{id}/is-paired
```

### 5.14 获取配对状态摘要

```http
GET /api/milestones/indicator/{indicatorId}/pairing-status
```

---

## 6. 进度报告模块

**基础路径:** `/api/reports`

### 6.1 获取单个报告

```http
GET /api/reports/{id}
```

### 6.2 按指标获取报告

```http
GET /api/reports/indicator/{indicatorId}
```

### 6.3 获取待审批报告

```http
GET /api/reports/pending-approval
```

### 6.4 创建报告

```http
POST /api/reports
```

### 6.5 更新报告

```http
PUT /api/reports/{id}
```

---

## 7. 审批记录模块

**基础路径:** `/api/approvals`

### 7.1 审批报告

```http
POST /api/approvals/approve
```

**请求体:**
```json
{
  "reportId": 1,
  "approverId": 3,
  "action": "APPROVE",
  "comment": "审批通过"
}
```

---

## 8. 审计日志模块

**基础路径:** `/api/audit-logs`

### 8.1 查询审计日志

```http
GET /api/audit-logs?entityType={type}&action={action}&page=0&size=20
```

### 8.2 获取实体审计轨迹

```http
GET /api/audit-logs/trail/{entityType}/{entityId}
```

---

## 9. 预警模块

**基础路径:** `/api/alerts`

### 9.1 获取未处理预警

```http
GET /api/alerts/open?page=0&size=10
```

### 9.2 获取预警统计

```http
GET /api/alerts/statistics
```

### 9.3 处理预警

```http
POST /api/alerts/{id}/handle?handledById=2&handledNote=已处理
```

---

## 10. 临时任务模块

**基础路径:** `/api/adhoc-tasks`

### 10.1 获取单个临时任务

```http
GET /api/adhoc-tasks/{id}
```

### 10.2 按考核周期获取

```http
GET /api/adhoc-tasks/cycle/{cycleId}
```

### 10.3 创建临时任务

```http
POST /api/adhoc-tasks
```

---

## 11. 通用规范

### 11.1 统一响应格式

**成功响应:**
```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

**错误响应:**
```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### 11.2 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 0 | 页码（从0开始） |
| size | number | 10 | 每页数量 |

**分页响应:**
```json
{
  "success": true,
  "data": {
    "content": [],
    "total": 100,
    "page": 0,
    "size": 20
  }
}
```

### 11.3 错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| CONFLICT | 409 | 资源冲突 |
| BUSINESS_ERROR | 400 | 业务逻辑错误 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 12. 枚举值参考

### 12.1 组织类型 (org_type)

| 值 | 说明 |
|----|------|
| SCHOOL | 学校级别 |
| STRATEGY_DEPT | 战略发展部 |
| FUNCTIONAL_DEPT | 职能部门 |
| COLLEGE | 二级学院 |
| DIVISION | 系部 |

### 12.2 指标层级 (indicator_level)

| 值 | 说明 |
|----|------|
| STRAT_TO_FUNC | 战略部→职能部门 |
| FUNC_TO_COLLEGE | 职能部门→二级学院 |

### 12.3 指标状态 (indicator_status)

| 值 | 说明 |
|----|------|
| ACTIVE | 活跃 |
| ARCHIVED | 已归档 |

### 12.4 里程碑状态 (milestone_status)

| 值 | 说明 |
|----|------|
| NOT_STARTED | 未开始 |
| IN_PROGRESS | 进行中 |
| COMPLETED | 已完成 |
| DELAYED | 已延期 |
| CANCELED | 已取消 |

### 12.5 报告状态 (report_status)

| 值 | 说明 |
|----|------|
| DRAFT | 草稿 |
| SUBMITTED | 已提交 |
| RETURNED | 已退回 |
| APPROVED | 已通过 |
| REJECTED | 已驳回 |

### 12.6 审批动作 (approval_action)

| 值 | 说明 |
|----|------|
| APPROVE | 通过 |
| REJECT | 驳回 |
| RETURN | 退回修改 |

### 12.7 进度审批状态 (progress_approval_status)

| 值 | 说明 |
|----|------|
| NONE | 无待审批 |
| PENDING | 待审批 |
| APPROVED | 已通过 |
| REJECTED | 已驳回 |

### 12.8 预警严重程度 (alert_severity)

| 值 | 说明 |
|----|------|
| INFO | 提示 |
| WARNING | 警告 |
| CRITICAL | 严重 |

### 12.9 预警状态 (alert_status)

| 值 | 说明 |
|----|------|
| OPEN | 待处理 |
| IN_PROGRESS | 处理中 |
| RESOLVED | 已解决 |
| CLOSED | 已关闭 |

---

## 测试账号

| 用户名 | 密码 | 角色 | 所属组织 |
|--------|------|------|----------|
| zhanlue | 123456 | 战略发展部 | 战略发展部 |
| jiaowu | 123456 | 职能部门 | 教务处 |
| computer | 123456 | 二级学院 | 计算机学院 |

---

*文档版本: 4.0.0 | 最后更新: 2026-01-19*
