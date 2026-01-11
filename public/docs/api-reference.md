# 战略指标管理系统 - API 接口文档

> 版本: 1.0.0  
> 更新时间: 2026-01-11  
> 基础路径: `http://localhost:8080/api`

---

## 认证

所有 API 请求需要在 Header 中携带 JWT Token：

```
Authorization: Bearer <token>
```

---

## 1. 认证模块 `/api/auth`

### 1.1 用户登录

```http
POST /api/auth/login
```

**请求体:**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "userId": 1,
      "username": "admin",
      "realName": "管理员",
      "orgId": 1,
      "orgName": "战略发展部",
      "orgType": "STRATEGIC_DEPT"
    }
  }
}
```

### 1.2 获取当前用户信息

```http
GET /api/auth/me
```

---

## 2. 组织机构模块 `/api/orgs`

### 2.1 获取组织列表

```http
GET /api/orgs
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 组织类型: STRATEGIC_DEPT, FUNCTIONAL_DEPT, SECONDARY_COLLEGE |
| isActive | boolean | 是否启用 |

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "orgId": 1,
      "orgName": "战略发展部",
      "orgType": "STRATEGIC_DEPT",
      "parentOrgId": null,
      "isActive": true,
      "sortOrder": 0
    },
    {
      "orgId": 2,
      "orgName": "就业创业指导中心",
      "orgType": "FUNCTIONAL_DEPT",
      "parentOrgId": null,
      "isActive": true,
      "sortOrder": 1
    }
  ]
}
```

### 2.2 获取单个组织

```http
GET /api/orgs/:orgId
```

---

## 3. 战略任务模块 `/api/tasks`

### 3.1 获取任务列表

```http
GET /api/tasks
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| year | number | 年份 |
| taskType | string | 任务类型: BASIC, DEVELOPMENT |
| cycleId | number | 考核周期ID |

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "taskId": 1,
      "cycleId": 1,
      "taskName": "全力促进毕业生多元化高质量就业创业",
      "taskDesc": "围绕毕业生就业质量提升，多措并举促进高质量就业创业",
      "taskType": "DEVELOPMENT",
      "orgId": 1,
      "createdByOrgId": 1,
      "sortOrder": 0,
      "remark": null,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### 3.2 创建任务

```http
POST /api/tasks
```

**请求体:**
```json
{
  "cycleId": 1,
  "taskName": "新战略任务",
  "taskDesc": "任务描述",
  "taskType": "DEVELOPMENT",
  "orgId": 1,
  "remark": "备注"
}
```

### 3.3 更新任务

```http
PUT /api/tasks/:taskId
```

### 3.4 删除任务

```http
DELETE /api/tasks/:taskId
```

---

## 4. 指标模块 `/api/indicators`

### 4.1 获取指标列表

```http
GET /api/indicators
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| year | number | 年份 |
| taskId | number | 战略任务ID |
| level | string | 指标层级: STRATEGIC, FUNCTIONAL, COLLEGE |
| ownerOrgId | number | 发布方组织ID |
| targetOrgId | number | 责任方组织ID |
| status | string | 状态: DRAFT, ACTIVE, ARCHIVED, DISTRIBUTED |
| parentIndicatorId | number | 父指标ID |

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "indicatorId": 101,
      "taskId": 1,
      "parentIndicatorId": null,
      "level": "STRATEGIC",
      "ownerOrgId": 1,
      "ownerOrgName": "战略发展部",
      "targetOrgId": 2,
      "targetOrgName": "就业创业指导中心",
      "indicatorDesc": "优质就业比例不低于15%",
      "weightPercent": 20,
      "sortOrder": 0,
      "year": 2026,
      "status": "ACTIVE",
      "remark": "力争突破",
      "taskName": "全力促进毕业生多元化高质量就业创业",
      "taskType": "DEVELOPMENT",
      "progress": 45,
      "milestones": [...],
      "latestReport": {...}
    }
  ]
}
```

### 4.2 获取单个指标详情

```http
GET /api/indicators/:indicatorId
```

**响应包含:**
- 指标基本信息
- 关联的里程碑列表
- 最新进度报告
- 审批历史 (statusAudit)

### 4.3 创建指标

```http
POST /api/indicators
```

**请求体:**
```json
{
  "taskId": 1,
  "parentIndicatorId": null,
  "level": "STRATEGIC",
  "ownerOrgId": 1,
  "targetOrgId": 2,
  "indicatorDesc": "新指标描述",
  "weightPercent": 20,
  "year": 2026,
  "remark": "备注",
  "milestones": [
    {
      "milestoneName": "Q1: 阶段目标",
      "dueDate": "2026-03-31",
      "weightPercent": 25
    }
  ]
}
```

### 4.4 更新指标

```http
PUT /api/indicators/:indicatorId
```

### 4.5 删除指标

```http
DELETE /api/indicators/:indicatorId
```

### 4.6 下发指标 (分解到下级)

```http
POST /api/indicators/:indicatorId/distribute
```

**请求体:**
```json
{
  "targetOrgIds": [10, 11, 12],
  "childIndicators": [
    {
      "targetOrgId": 10,
      "indicatorDesc": "计算机学院优质就业比例不低于18%",
      "weightPercent": 25,
      "remark": "工科学院就业质量要求更高"
    }
  ]
}
```

---

## 5. 里程碑模块 `/api/milestones`

### 5.1 获取指标的里程碑列表

```http
GET /api/milestones?indicatorId=101
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "milestoneId": 1001,
      "indicatorId": 101,
      "milestoneName": "Q1: 就业数据摸底",
      "milestoneDesc": null,
      "dueDate": "2026-03-31",
      "weightPercent": 25,
      "status": "COMPLETED",
      "sortOrder": 0
    }
  ]
}
```

### 5.2 更新里程碑状态

```http
PUT /api/milestones/:milestoneId
```

**请求体:**
```json
{
  "status": "COMPLETED"
}
```

---

## 6. 进度报告模块 `/api/reports`

### 6.1 获取进度报告列表

```http
GET /api/reports
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| indicatorId | number | 指标ID |
| status | string | 状态: DRAFT, PENDING, APPROVED, REJECTED |
| reporterId | number | 报告人ID |

### 6.2 提交进度报告

```http
POST /api/reports
```

**请求体:**
```json
{
  "indicatorId": 101,
  "milestoneId": 1001,
  "progressValue": 55,
  "reportContent": "本季度优质就业企业对接工作进展顺利",
  "attachments": ["url1", "url2"]
}
```

### 6.3 撤回进度报告

```http
POST /api/reports/:reportId/revoke
```

---

## 7. 审批模块 `/api/approvals`

### 7.1 获取待审批列表

```http
GET /api/approvals/pending
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| orgId | number | 组织ID (审批人所属) |

### 7.2 审批通过

```http
POST /api/approvals/:reportId/approve
```

**请求体:**
```json
{
  "comment": "审批通过，进度达标"
}
```

### 7.3 审批驳回

```http
POST /api/approvals/:reportId/reject
```

**请求体:**
```json
{
  "comment": "进度偏低，请加强跟进"
}
```

---

## 8. 审计日志模块 `/api/audit-logs`

### 8.1 获取审计日志

```http
GET /api/audit-logs
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| entityType | string | 实体类型: TASK, INDICATOR, MILESTONE, REPORT |
| entityId | number | 实体ID |
| action | string | 操作类型 |
| actorUserId | number | 操作人ID |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "logId": 1,
      "entityType": "INDICATOR",
      "entityId": 101,
      "action": "SUBMIT",
      "beforeJson": {"progress": 25},
      "afterJson": {"progress": 45},
      "changedFields": ["progress"],
      "reason": "提交Q1进度",
      "actorUserId": 2,
      "actorUserName": "张老师",
      "actorOrgId": 2,
      "actorOrgName": "就业创业指导中心",
      "createdAt": "2026-03-01T10:00:00Z"
    }
  ]
}
```

---

## 9. 预警模块 `/api/alerts`

### 9.1 获取预警事件列表

```http
GET /api/alerts
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| level | string | 预警级别: SEVERE, MODERATE, NORMAL |
| orgId | number | 组织ID |
| isResolved | boolean | 是否已解决 |

### 9.2 处理预警

```http
POST /api/alerts/:alertId/resolve
```

---

## 10. 看板数据模块 `/api/dashboard`

### 10.1 获取看板汇总数据

```http
GET /api/dashboard/summary
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| year | number | 年份 |
| month | number | 月份 |
| orgId | number | 组织ID (可选，用于部门视角) |

**响应:**
```json
{
  "success": true,
  "data": {
    "totalScore": 85,
    "basicScore": 40,
    "developmentScore": 45,
    "completionRate": 65,
    "warningCount": 5,
    "totalIndicators": 44,
    "completedIndicators": 28,
    "alertIndicators": {
      "severe": 3,
      "moderate": 8,
      "normal": 33
    }
  }
}
```

### 10.2 获取部门进度排名

```http
GET /api/dashboard/ranking
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| year | number | 年份 |
| month | number | 月份 |
| ownerOrgId | number | 来源部门ID (可选) |
| orgType | string | 组织类型筛选 |

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "orgId": 10,
      "orgName": "计算机学院",
      "score": 92,
      "progress": 78,
      "completionRate": 85,
      "totalIndicators": 8,
      "completedIndicators": 6,
      "alertCount": 1,
      "rank": 1
    }
  ]
}
```

### 10.3 获取指标完成情况分布

```http
GET /api/dashboard/distribution
```

---

## 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "field": "indicatorDesc",
      "message": "指标描述不能为空"
    }
  }
}
```

**错误码:**
| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 分页参数

支持分页的接口可使用以下参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| pageSize | number | 20 | 每页数量 |
| sortBy | string | - | 排序字段 |
| sortOrder | string | asc | 排序方向: asc, desc |

**分页响应:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
