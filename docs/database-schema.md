# 战略指标管理系统 - 数据库表结构文档

> 版本: 3.0.0  
> 更新时间: 2026-01-19  
> 数据库: PostgreSQL 15+  
> 初始化脚本: `strategic-task-management/database/init.sql`

---

## 📊 数据库连接信息

| 配置项 | 值 |
|--------|-----|
| 主机地址 | `175.24.139.148` |
| 端口 | `8386` |
| 数据库名 | `strategic` |
| 用户名 | `postgres` |
| 字符集 | UTF-8 |

---

## 📋 表结构概览

| 序号 | 表名 | 说明 | 更新状态 |
|------|------|------|----------|
| 1 | `org` | 组织机构表 | ✅ 稳定 |
| 2 | `app_user` | 用户表 | ✅ 稳定 |
| 3 | `assessment_cycle` | 考核周期表 | ✅ 稳定 |
| 4 | `strategic_task` | 战略任务表 | ✅ 稳定 |
| 5 | `indicator` | 指标表 | 🆕 2026-01-19 新增14个字段 |
| 6 | `milestone` | 里程碑表 | 🆕 2026-01-19 新增2个字段 |
| 7 | `progress_report` | 进度报告表 | ✅ 稳定 |
| 8 | `approval_record` | 审批记录表 | ✅ 稳定 |
| 9 | `audit_log` | 审计日志表 | ✅ 稳定 |
| 10 | `alert_window` | 预警窗口表 | ✅ 稳定 |
| 11 | `alert_rule` | 预警规则表 | ✅ 稳定 |
| 12 | `alert_event` | 预警事件表 | ✅ 稳定 |
| 13 | `adhoc_task` | 临时任务表 | ✅ 稳定 |
| 14 | `adhoc_task_target` | 临时任务目标组织表 | ✅ 稳定 |
| 15 | `adhoc_task_indicator_map` | 临时任务指标映射表 | ✅ 稳定 |

---

## 枚举类型

PostgreSQL 中定义的枚举类型必须与 Java 后端 `com.sism.enums` 包中的定义保持一致。

| 枚举名 | 值列表 |
|--------|--------|
| `org_type` | SCHOOL, FUNCTIONAL_DEPT, FUNCTION_DEPT, COLLEGE, STRATEGY_DEPT, DIVISION, OTHER |
| `task_type` | BASIC, REGULAR, KEY, SPECIAL, QUANTITATIVE, DEVELOPMENT |
| `indicator_level` | STRAT_TO_FUNC, FUNC_TO_COLLEGE |
| `indicator_status` | ACTIVE, ARCHIVED |
| `milestone_status` | NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED, CANCELED |
| `report_status` | DRAFT, SUBMITTED, RETURNED, APPROVED, REJECTED |
| `approval_action` | APPROVE, REJECT, RETURN |
| `alert_severity` | INFO, WARNING, CRITICAL |
| `alert_status` | OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| `adhoc_scope_type` | ALL_ORGS, BY_DEPT_ISSUED_INDICATORS, CUSTOM |
| `adhoc_task_status` | DRAFT, OPEN, CLOSED, ARCHIVED |
| `audit_action` | CREATE, UPDATE, DELETE, APPROVE, ARCHIVE, RESTORE |
| `audit_entity_type` | ORG, USER, CYCLE, TASK, INDICATOR, MILESTONE, REPORT, ADHOC_TASK, ALERT |

---

## 核心表结构

### 1. org - 组织机构表

```sql
CREATE TABLE org (
    org_id          BIGSERIAL PRIMARY KEY,
    org_name        VARCHAR(100) NOT NULL,
    org_type        org_type NOT NULL,
    parent_org_id   BIGINT REFERENCES org(org_id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**索引:** `idx_org_parent`, `idx_org_type`

---

### 2. app_user - 用户表

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

**索引:** `idx_user_org`, `idx_user_username`

---

### 3. assessment_cycle - 考核周期表

```sql
CREATE TABLE assessment_cycle (
    cycle_id        BIGSERIAL PRIMARY KEY,
    cycle_name      VARCHAR(100) NOT NULL,
    year            INT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**索引:** `idx_cycle_year`

---

### 4. strategic_task - 战略任务表

```sql
CREATE TABLE strategic_task (
    task_id           BIGSERIAL PRIMARY KEY,
    cycle_id          BIGINT NOT NULL REFERENCES assessment_cycle(cycle_id),
    task_name         VARCHAR(200) NOT NULL,
    task_desc         TEXT,
    task_type         task_type NOT NULL DEFAULT 'BASIC',
    org_id            BIGINT NOT NULL REFERENCES org(org_id),
    created_by_org_id BIGINT NOT NULL REFERENCES org(org_id),
    sort_order        INT NOT NULL DEFAULT 0,
    remark            TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**索引:** `idx_task_cycle`, `idx_task_org`

---

### 5. indicator - 指标表 ⭐ 核心表

**2026-01-19 重大更新：新增14个字段**

```sql
CREATE TABLE indicator (
    indicator_id            BIGSERIAL PRIMARY KEY,
    task_id                 BIGINT NOT NULL REFERENCES strategic_task(task_id),
    parent_indicator_id     BIGINT REFERENCES indicator(indicator_id),
    level                   indicator_level NOT NULL,
    owner_org_id            BIGINT NOT NULL REFERENCES org(org_id),
    target_org_id           BIGINT NOT NULL REFERENCES org(org_id),
    indicator_desc          TEXT NOT NULL,
    weight_percent          NUMERIC(5,2) NOT NULL DEFAULT 0,
    sort_order              INT NOT NULL DEFAULT 0,
    year                    INT NOT NULL,
    status                  indicator_status NOT NULL DEFAULT 'ACTIVE',
    remark                  TEXT,
    
    -- 🆕 新增字段 (2026-01-19)
    is_qualitative          BOOLEAN DEFAULT FALSE,
    type1                   VARCHAR(20) DEFAULT '定量',
    type2                   VARCHAR(20) DEFAULT '基础性',
    target_value            DECIMAL(10,2),
    actual_value            DECIMAL(10,2),
    unit                    VARCHAR(50),
    responsible_person      VARCHAR(100),
    can_withdraw            BOOLEAN DEFAULT FALSE,
    progress                INTEGER DEFAULT 0,
    status_audit            JSONB DEFAULT '[]'::jsonb,
    progress_approval_status VARCHAR(20) DEFAULT 'NONE',
    pending_progress        INTEGER,
    pending_remark          TEXT,
    pending_attachments     JSONB DEFAULT '[]'::jsonb,
    
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| indicator_id | BIGSERIAL | 主键 |
| task_id | BIGINT | 关联战略任务 |
| parent_indicator_id | BIGINT | 父指标ID（层级下发） |
| level | ENUM | STRAT_TO_FUNC / FUNC_TO_COLLEGE |
| owner_org_id | BIGINT | 发布方组织 |
| target_org_id | BIGINT | 责任方组织 |
| indicator_desc | TEXT | 指标描述 |
| weight_percent | NUMERIC(5,2) | 权重百分比 |
| **is_qualitative** | BOOLEAN | 🆕 是否定性指标 |
| **type1** | VARCHAR(20) | 🆕 定性/定量 |
| **type2** | VARCHAR(20) | 🆕 发展性/基础性 |
| **target_value** | DECIMAL(10,2) | 🆕 目标值 |
| **actual_value** | DECIMAL(10,2) | 🆕 实际值 |
| **unit** | VARCHAR(50) | 🆕 单位 |
| **responsible_person** | VARCHAR(100) | 🆕 责任人 |
| **progress** | INTEGER | 🆕 当前进度 0-100 |
| **progress_approval_status** | VARCHAR(20) | 🆕 进度审批状态 |

**索引:** 10个索引，包括 type1, type2, is_qualitative, progress_approval_status

---

### 6. milestone - 里程碑表

**2026-01-19 更新：新增2个字段**

```sql
CREATE TABLE milestone (
    milestone_id    BIGSERIAL PRIMARY KEY,
    indicator_id    BIGINT NOT NULL REFERENCES indicator(indicator_id),
    milestone_name  VARCHAR(200) NOT NULL,
    milestone_desc  TEXT,
    due_date        DATE NOT NULL,
    weight_percent  NUMERIC(5,2) NOT NULL DEFAULT 0,
    status          milestone_status NOT NULL DEFAULT 'NOT_STARTED',
    sort_order      INT NOT NULL DEFAULT 0,
    inherited_from  BIGINT REFERENCES milestone(milestone_id),
    
    -- 🆕 新增字段 (2026-01-19)
    target_progress INTEGER DEFAULT 0,
    is_paired       BOOLEAN DEFAULT FALSE,
    
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| milestone_id | BIGSERIAL | 主键 |
| indicator_id | BIGINT | 关联指标 |
| milestone_name | VARCHAR(200) | 里程碑名称 |
| due_date | DATE | 截止日期 |
| weight_percent | NUMERIC(5,2) | 权重百分比 |
| status | ENUM | 状态 |
| **target_progress** | INTEGER | 🆕 目标进度 0-100 |
| **is_paired** | BOOLEAN | 🆕 是否已配对 |

**索引:** `idx_milestone_indicator`, `idx_milestone_status`, `idx_milestone_due`

**业务规则:**
- 同一指标下所有里程碑的 weight_percent 之和应为 100
- is_paired 为 true 表示该里程碑已有审核通过的进度报告

---

### 7-15. 其他表

其他表结构详见 `strategic-task-management/database/init.sql`

---

## 数据关系图

```
assessment_cycle
    │
    └── strategic_task
            │
            └── indicator ←──┐ (自关联)
                    │        │
                    ├── milestone
                    │
                    └── progress_report
                            │
                            └── approval_record

org ←── app_user
 │
 ├── indicator.owner_org_id
 └── indicator.target_org_id
```

---

## 数据校验视图

### v_milestone_weight_sum
校验每指标下里程碑权重合计是否为100%

### v_indicator_latest_report
获取各指标最新最终报告完成度

### v_overdue_milestones
逾期里程碑视图

---

*文档版本: 3.0.0 | 最后更新: 2026-01-19*
