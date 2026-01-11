# 战略指标管理系统 - 数据库表结构文档

> 版本: 1.0.0  
> 更新时间: 2026-01-11  
> 数据库: PostgreSQL 18.0

## 数据库连接信息

| 配置项 | 值 |
|--------|-----|
| 主机地址 | `175.24.139.148` |
| 端口 | `8386` |
| 数据库名 | `strategic` |
| 用户名 | `postgres` |

---

## 表结构概览

| 表名 | 说明 | 状态 |
|------|------|------|
| `org` | 组织机构表 | ✅ 已存在 |
| `app_user` | 用户表 | ✅ 已存在 |
| `assessment_cycle` | 考核周期表 | ✅ 已存在 |
| `strategic_task` | 战略任务表 | ✅ 已存在 |
| `indicator` | 指标表 | ✅ 已存在 |
| `milestone` | 里程碑表 | ✅ 已存在 |
| `progress_report` | 进度报告表 | ✅ 已存在 |
| `approval_record` | 审批记录表 | ✅ 已存在 |
| `audit_log` | 审计日志表 | ✅ 已存在 |
| `alert_rule` | 预警规则表 | ✅ 已存在 |
| `alert_event` | 预警事件表 | ✅ 已存在 |
| `adhoc_task` | 临时任务表 | ✅ 已存在 |

---

## 1. 组织机构表 (org)

存储部门/学院信息，支持层级结构。

```sql
CREATE TABLE org (
    org_id          BIGSERIAL PRIMARY KEY,
    org_name        VARCHAR(100) NOT NULL,
    org_type        org_type NOT NULL,  -- ENUM: STRATEGIC_DEPT, FUNCTIONAL_DEPT, SECONDARY_COLLEGE
    parent_org_id   BIGINT REFERENCES org(org_id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 枚举类型
CREATE TYPE org_type AS ENUM ('STRATEGIC_DEPT', 'FUNCTIONAL_DEPT', 'SECONDARY_COLLEGE');
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| org_id | BIGINT | 是 | 主键，自增 |
| org_name | VARCHAR(100) | 是 | 组织名称 |
| org_type | ENUM | 是 | 组织类型：战略发展部/职能部门/二级学院 |
| parent_org_id | BIGINT | 否 | 父组织ID |
| is_active | BOOLEAN | 是 | 是否启用 |
| sort_order | INTEGER | 是 | 排序序号 |

### 前端字段映射

| 前端字段 | 数据库字段 | 说明 |
|----------|------------|------|
| `responsibleDept` | `org_name` (target_org) | 责任部门 |
| `ownerDept` | `org_name` (owner_org) | 发布方部门 |

---

## 2. 用户表 (app_user)

```sql
CREATE TABLE app_user (
    user_id         BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    real_name       VARCHAR(50) NOT NULL,
    org_id          BIGINT NOT NULL REFERENCES org(org_id),
    password_hash   VARCHAR(255) NOT NULL,
    sso_id          VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | BIGINT | 是 | 主键，自增 |
| username | VARCHAR(50) | 是 | 登录用户名 |
| real_name | VARCHAR(50) | 是 | 真实姓名 |
| org_id | BIGINT | 是 | 所属组织ID |
| password_hash | VARCHAR(255) | 是 | 密码哈希 |
| sso_id | VARCHAR(100) | 否 | SSO单点登录ID |
| is_active | BOOLEAN | 是 | 是否启用 |

---

## 3. 考核周期表 (assessment_cycle)

```sql
CREATE TABLE assessment_cycle (
    cycle_id        BIGSERIAL PRIMARY KEY,
    cycle_name      VARCHAR(50) NOT NULL,
    year            INTEGER NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. 战略任务表 (strategic_task)

```sql
CREATE TABLE strategic_task (
    task_id         BIGSERIAL PRIMARY KEY,
    cycle_id        BIGINT NOT NULL REFERENCES assessment_cycle(cycle_id),
    task_name       VARCHAR(200) NOT NULL,
    task_desc       TEXT,
    task_type       task_type NOT NULL DEFAULT 'BASIC',  -- ENUM: BASIC, DEVELOPMENT
    org_id          BIGINT NOT NULL REFERENCES org(org_id),
    created_by_org_id BIGINT NOT NULL REFERENCES org(org_id),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    remark          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 枚举类型
CREATE TYPE task_type AS ENUM ('BASIC', 'DEVELOPMENT');
```

### 前端字段映射

| 前端字段 | 数据库字段 | 说明 |
|----------|------------|------|
| `id` | `task_id` | 任务ID |
| `title` | `task_name` | 任务名称 |
| `desc` | `task_desc` | 任务描述 |
| `type2` | `task_type` | 任务类型 (BASIC=基础性, DEVELOPMENT=发展性) |
| `year` | `cycle.year` | 年份 (通过 cycle_id 关联) |
| `taskContent` | `task_name` | 战略任务内容 |

---

## 5. 指标表 (indicator)

核心表，存储所有层级的指标数据。

```sql
CREATE TABLE indicator (
    indicator_id        BIGSERIAL PRIMARY KEY,
    task_id             BIGINT NOT NULL REFERENCES strategic_task(task_id),
    parent_indicator_id BIGINT REFERENCES indicator(indicator_id),
    level               indicator_level NOT NULL,  -- ENUM: STRATEGIC, FUNCTIONAL, COLLEGE
    owner_org_id        BIGINT NOT NULL REFERENCES org(org_id),
    target_org_id       BIGINT NOT NULL REFERENCES org(org_id),
    indicator_desc      TEXT NOT NULL,
    weight_percent      NUMERIC(5,2) NOT NULL DEFAULT 0,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    year                INTEGER NOT NULL,
    status              indicator_status NOT NULL DEFAULT 'ACTIVE',
    remark              TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 枚举类型
CREATE TYPE indicator_level AS ENUM ('STRATEGIC', 'FUNCTIONAL', 'COLLEGE');
CREATE TYPE indicator_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DISTRIBUTED');
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| indicator_id | BIGINT | 是 | 主键，自增 |
| task_id | BIGINT | 是 | 关联战略任务ID |
| parent_indicator_id | BIGINT | 否 | 父指标ID（用于层级下发） |
| level | ENUM | 是 | 指标层级：战略级/职能级/学院级 |
| owner_org_id | BIGINT | 是 | 发布方组织ID |
| target_org_id | BIGINT | 是 | 责任方组织ID |
| indicator_desc | TEXT | 是 | 指标描述/名称 |
| weight_percent | NUMERIC | 是 | 权重百分比 |
| year | INTEGER | 是 | 年份 |
| status | ENUM | 是 | 状态 |
| remark | TEXT | 否 | 备注 |

### 前端字段映射

| 前端字段 | 数据库字段 | 说明 |
|----------|------------|------|
| `id` | `indicator_id` | 指标ID |
| `name` | `indicator_desc` | 指标名称/描述 |
| `weight` | `weight_percent` | 权重 |
| `responsibleDept` | `target_org.org_name` | 责任部门 |
| `ownerDept` | `owner_org.org_name` | 发布方部门 |
| `parentIndicatorId` | `parent_indicator_id` | 父指标ID |
| `year` | `year` | 年份 |
| `status` | `status` | 状态 |
| `remark` | `remark` | 备注 |
| `type2` | `task.task_type` | 任务类型 (通过 task_id 关联) |
| `taskContent` | `task.task_name` | 战略任务内容 |
| `progress` | 计算字段 | 从 milestone 或 progress_report 计算 |

---

## 6. 里程碑表 (milestone)

```sql
CREATE TABLE milestone (
    milestone_id    BIGSERIAL PRIMARY KEY,
    indicator_id    BIGINT NOT NULL REFERENCES indicator(indicator_id),
    milestone_name  VARCHAR(200) NOT NULL,
    milestone_desc  TEXT,
    due_date        DATE NOT NULL,
    weight_percent  NUMERIC(5,2) NOT NULL DEFAULT 0,
    status          milestone_status NOT NULL DEFAULT 'NOT_STARTED',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    inherited_from  BIGINT REFERENCES milestone(milestone_id),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 枚举类型
CREATE TYPE milestone_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');
```

### 前端字段映射

| 前端字段 | 数据库字段 | 说明 |
|----------|------------|------|
| `id` | `milestone_id` | 里程碑ID |
| `name` | `milestone_name` | 里程碑名称 |
| `targetProgress` | `weight_percent` | 目标进度/权重 |
| `deadline` | `due_date` | 截止日期 |
| `status` | `status` | 状态映射: NOT_STARTED→pending, COMPLETED→completed, OVERDUE→overdue |

---

## 7. 进度报告表 (progress_report)

```sql
CREATE TABLE progress_report (
    report_id       BIGSERIAL PRIMARY KEY,
    indicator_id    BIGINT NOT NULL REFERENCES indicator(indicator_id),
    milestone_id    BIGINT REFERENCES milestone(milestone_id),
    reporter_id     BIGINT NOT NULL REFERENCES app_user(user_id),
    progress_value  NUMERIC(5,2) NOT NULL,
    report_content  TEXT,
    attachments     JSONB,
    status          report_status NOT NULL DEFAULT 'DRAFT',
    submitted_at    TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 枚举类型
CREATE TYPE report_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
```

### 前端字段映射

| 前端字段 | 数据库字段 | 说明 |
|----------|------------|------|
| `progressApprovalStatus` | `status` | 审批状态映射 |
| `pendingProgress` | `progress_value` | 待审批进度值 |
| `pendingRemark` | `report_content` | 待审批说明 |
| `pendingAttachments` | `attachments` | 附件列表 (JSONB) |

---

## 8. 审批记录表 (approval_record)

```sql
CREATE TABLE approval_record (
    approval_id     BIGSERIAL PRIMARY KEY,
    report_id       BIGINT NOT NULL REFERENCES progress_report(report_id),
    approver_id     BIGINT NOT NULL REFERENCES app_user(user_id),
    action          approval_action NOT NULL,  -- ENUM: APPROVE, REJECT
    comment         TEXT,
    acted_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 枚举类型
CREATE TYPE approval_action AS ENUM ('APPROVE', 'REJECT');
```

---

## 9. 审计日志表 (audit_log)

```sql
CREATE TABLE audit_log (
    log_id          BIGSERIAL PRIMARY KEY,
    entity_type     audit_entity_type NOT NULL,
    entity_id       BIGINT NOT NULL,
    action          audit_action NOT NULL,
    before_json     JSONB,
    after_json      JSONB,
    changed_fields  JSONB,
    reason          TEXT,
    actor_user_id   BIGINT REFERENCES app_user(user_id),
    actor_org_id    BIGINT REFERENCES org(org_id),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 枚举类型
CREATE TYPE audit_entity_type AS ENUM ('TASK', 'INDICATOR', 'MILESTONE', 'REPORT');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT', 'REVOKE', 'DISTRIBUTE');
```

### 前端字段映射 (StatusAuditEntry)

| 前端字段 | 数据库字段 | 说明 |
|----------|------------|------|
| `id` | `log_id` | 日志ID |
| `timestamp` | `created_at` | 操作时间 |
| `operator` | `actor_user.username` | 操作人用户名 |
| `operatorName` | `actor_user.real_name` | 操作人姓名 |
| `operatorDept` | `actor_org.org_name` | 操作人部门 |
| `action` | `action` | 操作类型 |
| `comment` | `reason` | 操作备注 |
| `previousStatus` | `before_json.status` | 变更前状态 |
| `newStatus` | `after_json.status` | 变更后状态 |
| `previousProgress` | `before_json.progress` | 变更前进度 |
| `newProgress` | `after_json.progress` | 变更后进度 |

---

## 10. 视图 (Views)

### v_indicator_latest_report
获取指标最新进度报告

### v_milestone_weight_sum
里程碑权重汇总

### v_overdue_milestones
逾期里程碑视图

---

## 数据关系图

```
assessment_cycle (考核周期)
    │
    └── strategic_task (战略任务)
            │
            └── indicator (指标) ←──┐ parent_indicator_id (自关联)
                    │               │
                    ├── milestone (里程碑)
                    │
                    └── progress_report (进度报告)
                            │
                            └── approval_record (审批记录)

org (组织机构) ←── app_user (用户)
    │
    ├── indicator.owner_org_id (发布方)
    └── indicator.target_org_id (责任方)
```

---

## 枚举类型汇总

| 枚举名 | 值 | 说明 |
|--------|-----|------|
| org_type | STRATEGIC_DEPT, FUNCTIONAL_DEPT, SECONDARY_COLLEGE | 组织类型 |
| task_type | BASIC, DEVELOPMENT | 任务类型 |
| indicator_level | STRATEGIC, FUNCTIONAL, COLLEGE | 指标层级 |
| indicator_status | DRAFT, ACTIVE, ARCHIVED, DISTRIBUTED | 指标状态 |
| milestone_status | NOT_STARTED, IN_PROGRESS, COMPLETED, OVERDUE | 里程碑状态 |
| report_status | DRAFT, PENDING, APPROVED, REJECTED | 报告状态 |
| approval_action | APPROVE, REJECT | 审批动作 |
| audit_action | CREATE, UPDATE, DELETE, SUBMIT, APPROVE, REJECT, REVOKE, DISTRIBUTE | 审计动作 |
