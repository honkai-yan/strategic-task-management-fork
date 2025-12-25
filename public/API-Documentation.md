# SISM API Documentation

**Strategic Indicator Management System API Reference**

| Version | Author | Date |
|---------|--------|------|
| V1.0 | System Design Team | 2025-12-22 |

---

## Table of Contents

1. [Overview](#1-overview)
2. [General Conventions](#2-general-conventions)
3. [API Endpoints](#3-api-endpoints)
   - [3.1 Authentication](#31-authentication)
   - [3.2 Organization Management](#32-organization-management)
   - [3.3 User Management](#33-user-management)
   - [3.4 Assessment Cycle](#34-assessment-cycle)
   - [3.5 Strategic Task](#35-strategic-task)
   - [3.6 Indicator Management](#36-indicator-management)
   - [3.7 Milestone](#37-milestone)
   - [3.8 Progress Report](#38-progress-report)
   - [3.9 Approval Workflow](#39-approval-workflow)
   - [3.10 Alert Management](#310-alert-management)
   - [3.11 Adhoc Task](#311-adhoc-task)
   - [3.12 Audit Log](#312-audit-log)
   - [3.13 Dashboard](#313-dashboard)
   - [3.14 File Management](#314-file-management)
   - [3.15 Message & Notification](#315-message--notification)
4. [Appendix](#4-appendix)

---

## 1. Overview

### 1.1 Introduction

This document describes the RESTful API for the Strategic Indicator Management System (SISM). The system supports three-tier organizational hierarchy management:

- **Strategic Department** (战略发展部) - Full system administration
- **Functional Department** (职能部门) - Indicator publishing and approval
- **Secondary College** (二级学院) - Progress reporting

### 1.2 Base URL

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:8080/api` |
| Production | `https://api.example.com/api` |

### 1.3 Version History

| Version | Date | Changes |
|---------|------|---------|
| V1.0 | 2025-12-22 | Initial release |

---

## 2. General Conventions

### 2.1 Authentication

All API endpoints (except `/auth/login`) require Bearer Token authentication.

```http
Authorization: Bearer <token>
```

**Token Structure (JWT):**
- `user_id`: User identifier
- `username`: Login name
- `role`: User role (strategic_dept | functional_dept | secondary_college)
- `org_id`: Organization identifier
- `exp`: Expiration timestamp

**Token Lifetime:** 24 hours

### 2.2 Request Format

```yaml
Content-Type: application/json
Accept: application/json
Character Encoding: UTF-8
```

**Date/Time Formats:**
- DateTime: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- Date only: `YYYY-MM-DD`

### 2.3 Response Format

#### Success Response

```typescript
interface ApiResponse<T> {
  success: true
  data: T
  message: string
  timestamp: string  // ISO 8601
}
```

#### Paginated Response

```typescript
interface PaginatedResponse<T> {
  success: true
  data: T[]
  message: string
  timestamp: string
  pagination: {
    page: number        // Current page (1-based)
    pageSize: number    // Items per page
    total: number       // Total items
    totalPages: number  // Total pages
  }
}
```

#### Error Response

```typescript
interface ApiError {
  success: false
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}
```

### 2.4 Pagination

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-based) |
| pageSize | number | 20 | Items per page (max: 100) |
| sortBy | string | - | Sort field |
| sortOrder | string | desc | Sort direction (asc/desc) |

**Example:**
```http
GET /api/indicators?page=1&pageSize=20&sortBy=createTime&sortOrder=desc
```

### 2.5 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 204 | No Content - Deletion successful |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 422 | Unprocessable Entity - Business rule violation |
| 500 | Internal Server Error |

### 2.6 Error Codes

**Authentication Errors:**
| Code | Description |
|------|-------------|
| AUTH_001 | Token missing |
| AUTH_002 | Token invalid or expired |
| AUTH_003 | Insufficient permissions |

**Business Errors:**
| Code | Description |
|------|-------------|
| BIZ_001 | Resource not found |
| BIZ_002 | Resource already exists |
| BIZ_003 | Operation not allowed in current state |
| BIZ_004 | Validation failed |
| BIZ_005 | Cannot delete: has dependencies |
| BIZ_006 | Milestone weights must sum to 100% |

**System Errors:**
| Code | Description |
|------|-------------|
| SYS_001 | Internal server error |
| SYS_002 | Database error |
| SYS_003 | Network timeout |

### 2.7 Enumerations

```typescript
// Organization Type
type OrgType = 'STRATEGY_DEPT' | 'FUNCTION_DEPT' | 'COLLEGE' | 'DIVISION'

// Task Type
type TaskType = 'BASIC' | 'DEVELOPMENT'

// Indicator Level
type IndicatorLevel = 'STRAT_TO_FUNC' | 'FUNC_TO_COLLEGE'

// Milestone Status
type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELED'

// Report Status
type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'RETURNED' | 'APPROVED' | 'REJECTED'

// Approval Action
type ApprovalAction = 'APPROVE' | 'REJECT' | 'RETURN'

// Alert Severity
type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

// Alert Status
type AlertStatus = 'OPEN' | 'CLOSED'

// Adhoc Task Scope
type AdhocScopeType = 'ALL_ORGS' | 'BY_DEPT_ISSUED_INDICATORS' | 'CUSTOM'

// Audit Action
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'ARCHIVE' | 'RESTORE'
```

---

## 3. API Endpoints

### 3.1 Authentication

#### 3.1.1 User Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400,
    "user": {
      "id": "u001",
      "username": "admin",
      "name": "Administrator",
      "role": "strategic_dept",
      "department": "Strategic Development",
      "avatar": "https://..."
    }
  },
  "message": "Login successful",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "code": "AUTH_002",
  "message": "Invalid username or password",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.1.2 Get Current User

```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "u001",
    "username": "admin",
    "name": "Administrator",
    "role": "strategic_dept",
    "department": "Strategic Development",
    "avatar": "https://...",
    "permissions": ["strategic_tasks:create", "strategic_tasks:read", "..."],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-12-22T00:00:00.000Z"
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.1.3 Refresh Token

```http
POST /api/auth/refresh
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400
  },
  "message": "Token refreshed",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.1.4 Logout

```http
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <token>`

**Response (204 No Content)**

---

### 3.2 Organization Management

#### 3.2.1 List Organizations

```http
GET /api/organizations
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| orgType | OrgType | Filter by type |
| parentOrgId | string | Filter by parent |
| isActive | boolean | Filter active status |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "org_id": "org001",
      "org_name": "Strategic Development Department",
      "org_type": "STRATEGY_DEPT",
      "parent_org_id": null,
      "is_active": true,
      "sort_order": 1
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

**Permissions:**
- `strategic_dept`: Full access
- `functional_dept`: Own and subordinate organizations
- `secondary_college`: Own organization only

#### 3.2.2 Get Organization Details

```http
GET /api/organizations/{orgId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "org_id": "org001",
    "org_name": "Strategic Development Department",
    "org_type": "STRATEGY_DEPT",
    "parent_org_id": null,
    "parent_org": null,
    "is_active": true,
    "sort_order": 1,
    "children": []
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.2.3 Create Organization

```http
POST /api/organizations
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "org_name": "string (required)",
  "org_type": "OrgType (required)",
  "parent_org_id": "string (optional)",
  "sort_order": "number (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "org_id": "org002",
    "org_name": "New Department",
    "org_type": "FUNCTION_DEPT",
    "parent_org_id": "org001",
    "is_active": true,
    "sort_order": 2
  },
  "message": "Organization created",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.2.4 Update Organization

```http
PUT /api/organizations/{orgId}
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "org_name": "string (optional)",
  "is_active": "boolean (optional)",
  "sort_order": "number (optional)"
}
```

**Response (200 OK):** Updated organization object

---

### 3.3 User Management

#### 3.3.1 List Users

```http
GET /api/users
```

**Permission:** `strategic_dept`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| orgId | string | Filter by organization |
| role | UserRole | Filter by role |
| isActive | boolean | Filter active status |
| page | number | Page number |
| pageSize | number | Items per page |

**Response (200 OK - Paginated):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "u001",
      "username": "zhangsan",
      "real_name": "Zhang San",
      "org_id": "org001",
      "org_name": "Strategic Development",
      "role": "strategic_dept",
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 50,
    "totalPages": 3
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.3.2 Get User Details

```http
GET /api/users/{userId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user_id": "u001",
    "username": "zhangsan",
    "real_name": "Zhang San",
    "org_id": "org001",
    "organization": {
      "org_id": "org001",
      "org_name": "Strategic Development",
      "org_type": "STRATEGY_DEPT"
    },
    "is_active": true,
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.3.3 Create User

```http
POST /api/users
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "username": "string (required)",
  "real_name": "string (required)",
  "password": "string (required)",
  "org_id": "string (required)"
}
```

**Response (201 Created):** User object

#### 3.3.4 Update User

```http
PUT /api/users/{userId}
```

**Permission:** `strategic_dept` or self

**Request Body:**
```json
{
  "real_name": "string (optional)",
  "org_id": "string (optional)",
  "is_active": "boolean (optional)"
}
```

**Response (200 OK):** Updated user object

#### 3.3.5 Change Password

```http
PUT /api/users/{userId}/password
```

**Permission:** Self or `strategic_dept`

**Request Body:**
```json
{
  "oldPassword": "string (required for self)",
  "newPassword": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

---

### 3.4 Assessment Cycle

#### 3.4.1 List Assessment Cycles

```http
GET /api/assessment-cycles
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| year | number | Filter by year |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "cycle_id": "cycle2025",
      "cycle_name": "2025 Annual Assessment",
      "year": 2025,
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "description": "Annual strategic indicator assessment",
      "is_current": true
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.4.2 Get Current Assessment Cycle

```http
GET /api/assessment-cycles/current
```

**Response (200 OK):** Single cycle object with `is_current: true`

#### 3.4.3 Create Assessment Cycle

```http
POST /api/assessment-cycles
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "cycle_name": "string (required)",
  "year": "number (required)",
  "start_date": "string (required, YYYY-MM-DD)",
  "end_date": "string (required, YYYY-MM-DD)",
  "description": "string (optional)"
}
```

**Response (201 Created):** Cycle object

#### 3.4.4 Update Assessment Cycle

```http
PUT /api/assessment-cycles/{cycleId}
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "cycle_name": "string (optional)",
  "description": "string (optional)",
  "end_date": "string (optional)"
}
```

**Response (200 OK):** Updated cycle object

#### 3.4.5 Clone Assessment Cycle

```http
POST /api/assessment-cycles/{cycleId}/clone
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "new_year": "number (required)",
  "new_cycle_name": "string (required)",
  "include_tasks": "boolean (default: true)",
  "include_indicators": "boolean (default: true)"
}
```

**Response (201 Created):** New cycle object with cloned tasks/indicators

---

### 3.5 Strategic Task

#### 3.5.1 List Strategic Tasks

```http
GET /api/strategic-tasks
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cycleId | string | Filter by cycle |
| taskType | TaskType | BASIC or DEVELOPMENT |
| orgId | string | Filter by assigned department |
| status | string | Task status |
| page | number | Page number |
| pageSize | number | Items per page |

**Response (200 OK - Paginated):**
```json
{
  "success": true,
  "data": [
    {
      "task_id": "task001",
      "cycle_id": "cycle2025",
      "task_name": "Improve Teaching Quality",
      "task_desc": "Enhance overall teaching quality indicators",
      "task_type": "DEVELOPMENT",
      "org_id": "org002",
      "org_name": "Academic Affairs",
      "created_by_org_id": "org001",
      "created_by_org_name": "Strategic Development",
      "sort_order": 1,
      "remark": null,
      "indicator_count": 5,
      "completion_rate": 60.5
    }
  ],
  "pagination": {...},
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.5.2 Get Strategic Task Details

```http
GET /api/strategic-tasks/{taskId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "task_id": "task001",
    "cycle_id": "cycle2025",
    "assessment_cycle": {...},
    "task_name": "Improve Teaching Quality",
    "task_desc": "...",
    "task_type": "DEVELOPMENT",
    "org_id": "org002",
    "organization": {...},
    "created_by_org_id": "org001",
    "created_by_org": {...},
    "sort_order": 1,
    "remark": null,
    "indicators": [...]
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.5.3 Create Strategic Task

```http
POST /api/strategic-tasks
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "cycle_id": "string (required)",
  "task_name": "string (required)",
  "task_desc": "string (optional)",
  "task_type": "TaskType (required)",
  "org_id": "string (required)",
  "sort_order": "number (optional)",
  "remark": "string (optional)"
}
```

**Response (201 Created):** Task object

#### 3.5.4 Update Strategic Task

```http
PUT /api/strategic-tasks/{taskId}
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "task_name": "string (optional)",
  "task_desc": "string (optional)",
  "task_type": "TaskType (optional)",
  "org_id": "string (optional)",
  "sort_order": "number (optional)",
  "remark": "string (optional)"
}
```

**Response (200 OK):** Updated task object

#### 3.5.5 Delete Strategic Task

```http
DELETE /api/strategic-tasks/{taskId}
```

**Permission:** `strategic_dept`

**Business Rules:**
- Cannot delete if has child indicators (BIZ_005)

**Response (204 No Content)**

---

### 3.6 Indicator Management

#### 3.6.1 List Indicators

```http
GET /api/indicators
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| taskId | string | Filter by task |
| cycleId | string | Filter by cycle |
| level | IndicatorLevel | STRAT_TO_FUNC or FUNC_TO_COLLEGE |
| ownerOrgId | string | Filter by publisher |
| targetOrgId | string | Filter by assignee |
| parentIndicatorId | string | Filter by parent indicator |
| status | string | ACTIVE or ARCHIVED |
| year | number | Filter by year |
| page | number | Page number |
| pageSize | number | Items per page |
| sortBy | string | Sort field |
| sortOrder | string | asc or desc |

**Response (200 OK - Paginated):**
```json
{
  "success": true,
  "data": [
    {
      "indicator_id": "ind001",
      "task_id": "task001",
      "task_name": "Improve Teaching Quality",
      "parent_indicator_id": null,
      "level": "STRAT_TO_FUNC",
      "owner_org_id": "org001",
      "owner_org_name": "Strategic Development",
      "target_org_id": "org002",
      "target_org_name": "Academic Affairs",
      "indicator_desc": "Course satisfaction rate >= 90%",
      "weight_percent": 20,
      "sort_order": 1,
      "year": 2025,
      "status": "ACTIVE",
      "remark": null,
      "progress": 75.5,
      "milestone_count": 4,
      "completed_milestones": 3
    }
  ],
  "pagination": {...},
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.6.2 Get Indicator Details

```http
GET /api/indicators/{indicatorId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "indicator_id": "ind001",
    "task_id": "task001",
    "strategic_task": {...},
    "parent_indicator_id": null,
    "parent_indicator": null,
    "level": "STRAT_TO_FUNC",
    "owner_org_id": "org001",
    "owner_organization": {...},
    "target_org_id": "org002",
    "target_organization": {...},
    "indicator_desc": "Course satisfaction rate >= 90%",
    "weight_percent": 20,
    "sort_order": 1,
    "year": 2025,
    "status": "ACTIVE",
    "remark": null,
    "milestones": [...],
    "children_indicators": [...],
    "latest_report": {...}
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.6.3 Create Indicator

```http
POST /api/indicators
```

**Permission:** `strategic_dept` or `functional_dept`

**Request Body:**
```json
{
  "task_id": "string (required)",
  "parent_indicator_id": "string (optional, required for FUNC_TO_COLLEGE)",
  "level": "IndicatorLevel (required)",
  "target_org_id": "string (required)",
  "indicator_desc": "string (required)",
  "weight_percent": "number (required, 0-100)",
  "sort_order": "number (optional)",
  "year": "number (required)",
  "remark": "string (optional)"
}
```

**Business Rules:**
- `functional_dept` can only create FUNC_TO_COLLEGE level indicators
- `owner_org_id` is automatically set to current user's organization

**Response (201 Created):** Indicator object

#### 3.6.4 Update Indicator

```http
PUT /api/indicators/{indicatorId}
```

**Permission:** `strategic_dept` or `functional_dept` (own indicators only)

**Request Body:**
```json
{
  "indicator_desc": "string (optional)",
  "weight_percent": "number (optional)",
  "sort_order": "number (optional)",
  "remark": "string (optional)"
}
```

**Business Rules:**
- R1: Updating parent indicator does NOT automatically cascade to children

**Response (200 OK):** Updated indicator object

#### 3.6.5 Delete Indicator

```http
DELETE /api/indicators/{indicatorId}
```

**Permission:** `strategic_dept` or `functional_dept` (own indicators only)

**Business Rules:**
- R8: Cannot delete if has children, milestones, reports, or alerts
- Deletion is recorded in audit log

**Response (204 No Content)**

**Error Response (422):**
```json
{
  "success": false,
  "code": "BIZ_005",
  "message": "Cannot delete: indicator has dependencies",
  "details": {
    "children_count": 3,
    "milestone_count": 2
  },
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.6.6 Archive Indicator

```http
PUT /api/indicators/{indicatorId}/archive
```

**Permission:** `strategic_dept` or `functional_dept`

**Response (200 OK):** Indicator with `status: ARCHIVED`

#### 3.6.7 Restore Indicator

```http
PUT /api/indicators/{indicatorId}/restore
```

**Permission:** `strategic_dept` or `functional_dept`

**Response (200 OK):** Indicator with `status: ACTIVE`

#### 3.6.8 Distribute Indicators (Batch)

```http
POST /api/indicators/distribute
```

**Permission:** `strategic_dept` or `functional_dept`

**Request Body:**
```json
{
  "indicator_ids": ["string (required)"],
  "target_org_ids": ["string (required)"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "distributed_count": 6,
    "created_indicators": [...]
  },
  "message": "Indicators distributed successfully",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

---

### 3.7 Milestone

#### 3.7.1 List Milestones for Indicator

```http
GET /api/indicators/{indicatorId}/milestones
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "milestone_id": "ms001",
      "indicator_id": "ind001",
      "milestone_name": "Q1 Target",
      "milestone_desc": "Complete 25% by end of Q1",
      "due_date": "2025-03-31",
      "weight_percent": 25,
      "status": "COMPLETED",
      "sort_order": 1,
      "inherited_from": null,
      "progress_report": {...}
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.7.2 Create Milestone

```http
POST /api/indicators/{indicatorId}/milestones
```

**Permission:** `strategic_dept` or `functional_dept` (indicator owner)

**Request Body:**
```json
{
  "milestone_name": "string (required)",
  "milestone_desc": "string (optional)",
  "due_date": "string (required, YYYY-MM-DD)",
  "weight_percent": "number (required, 0-100)",
  "sort_order": "number (optional)"
}
```

**Business Rules:**
- R2: Total weight of all milestones for an indicator must equal 100%

**Response (201 Created):** Milestone object

**Error Response (422):**
```json
{
  "success": false,
  "code": "BIZ_006",
  "message": "Milestone weights must sum to 100%",
  "details": {
    "current_total": 75,
    "new_weight": 30,
    "expected_total": 100
  },
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.7.3 Batch Create Milestones

```http
POST /api/indicators/{indicatorId}/milestones/batch
```

**Permission:** `strategic_dept` or `functional_dept`

**Request Body:**
```json
{
  "milestones": [
    {
      "milestone_name": "string",
      "milestone_desc": "string",
      "due_date": "string",
      "weight_percent": "number",
      "sort_order": "number"
    }
  ]
}
```

**Business Rules:**
- Validates that total weights equal 100%

**Response (201 Created):** Array of milestone objects

#### 3.7.4 Update Milestone

```http
PUT /api/milestones/{milestoneId}
```

**Permission:** `strategic_dept` or `functional_dept` (indicator owner)

**Request Body:**
```json
{
  "milestone_name": "string (optional)",
  "milestone_desc": "string (optional)",
  "due_date": "string (optional)",
  "weight_percent": "number (optional)",
  "sort_order": "number (optional)"
}
```

**Response (200 OK):** Updated milestone object

#### 3.7.5 Delete Milestone

```http
DELETE /api/milestones/{milestoneId}
```

**Permission:** `strategic_dept` or `functional_dept` (indicator owner)

**Business Rules:**
- Cannot delete if has associated progress reports

**Response (204 No Content)**

#### 3.7.6 Update Milestone Status

```http
PATCH /api/milestones/{milestoneId}/status
```

**Permission:** System (auto) or `strategic_dept`

**Request Body:**
```json
{
  "status": "MilestoneStatus (required)"
}
```

**Business Rules:**
- Status automatically changes to COMPLETED when report is approved with `achieved_milestone: true`

**Response (200 OK):** Updated milestone object

---

### 3.8 Progress Report

#### 3.8.1 List Progress Reports

```http
GET /api/progress-reports
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| indicatorId | string | Filter by indicator |
| milestoneId | string | Filter by milestone |
| adhocTaskId | string | Filter by adhoc task |
| reporterId | string | Filter by reporter |
| status | ReportStatus | Filter by status |
| isFinal | boolean | Filter final reports |
| page | number | Page number |
| pageSize | number | Items per page |

**Response (200 OK - Paginated):**
```json
{
  "success": true,
  "data": [
    {
      "report_id": "rpt001",
      "indicator_id": "ind001",
      "indicator_name": "Course satisfaction rate",
      "milestone_id": "ms001",
      "milestone_name": "Q1 Target",
      "adhoc_task_id": null,
      "percent_complete": 85,
      "achieved_milestone": true,
      "narrative": "Exceeded Q1 target with 85% completion",
      "reporter_id": "u002",
      "reporter_name": "Li Si",
      "status": "APPROVED",
      "is_final": true,
      "version_no": 1,
      "reported_at": "2025-03-28T10:00:00.000Z"
    }
  ],
  "pagination": {...},
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.8.2 Get Progress Report Details

```http
GET /api/progress-reports/{reportId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "report_id": "rpt001",
    "indicator_id": "ind001",
    "indicator": {...},
    "milestone_id": "ms001",
    "milestone": {...},
    "adhoc_task_id": null,
    "adhoc_task": null,
    "percent_complete": 85,
    "achieved_milestone": true,
    "narrative": "Exceeded Q1 target...",
    "reporter_id": "u002",
    "reporter": {...},
    "status": "APPROVED",
    "is_final": true,
    "version_no": 1,
    "reported_at": "2025-03-28T10:00:00.000Z",
    "attachments": [...],
    "approval_records": [...]
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.8.3 Create Progress Report (Draft)

```http
POST /api/progress-reports
```

**Permission:** `functional_dept` or `secondary_college`

**Request Body:**
```json
{
  "indicator_id": "string (required)",
  "milestone_id": "string (optional)",
  "adhoc_task_id": "string (optional)",
  "percent_complete": "number (required, 0-100)",
  "achieved_milestone": "boolean (optional)",
  "narrative": "string (required)",
  "attachments": ["string (optional, file IDs)"]
}
```

**Business Rules:**
- R3: `milestone_id` and `adhoc_task_id` cannot both be present

**Response (201 Created):** Report with `status: DRAFT`

#### 3.8.4 Update Progress Report

```http
PUT /api/progress-reports/{reportId}
```

**Permission:** Reporter (only DRAFT or RETURNED status)

**Request Body:**
```json
{
  "percent_complete": "number (optional)",
  "achieved_milestone": "boolean (optional)",
  "narrative": "string (optional)",
  "attachments": ["string (optional)"]
}
```

**Response (200 OK):** Updated report object

#### 3.8.5 Submit Progress Report

```http
POST /api/progress-reports/{reportId}/submit
```

**Permission:** Reporter

**Business Rules:**
- Only DRAFT or RETURNED status can be submitted
- Status changes to SUBMITTED

**Response (200 OK):** Report with `status: SUBMITTED`

#### 3.8.6 Withdraw Progress Report

```http
POST /api/progress-reports/{reportId}/withdraw
```

**Permission:** Reporter

**Business Rules:**
- Only SUBMITTED status (not yet processed) can be withdrawn
- Status changes to DRAFT

**Response (200 OK):** Report with `status: DRAFT`

#### 3.8.7 Delete Progress Report

```http
DELETE /api/progress-reports/{reportId}
```

**Permission:** Reporter

**Business Rules:**
- Only DRAFT status can be deleted

**Response (204 No Content)**

#### 3.8.8 Get Latest Report for Indicator

```http
GET /api/indicators/{indicatorId}/latest-report
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {...} // Report object or null
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

---

### 3.9 Approval Workflow

#### 3.9.1 List Pending Approvals

```http
GET /api/approvals/pending
```

**Permission:** `strategic_dept` or `functional_dept`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| indicatorLevel | IndicatorLevel | Filter by level |
| page | number | Page number |
| pageSize | number | Items per page |

**Response (200 OK - Paginated):**
```json
{
  "success": true,
  "data": [
    {
      "report_id": "rpt002",
      "indicator_id": "ind002",
      "indicator_name": "Research output",
      "indicator_level": "FUNC_TO_COLLEGE",
      "milestone_name": "Q2 Target",
      "percent_complete": 70,
      "narrative": "On track for Q2...",
      "reporter_name": "Wang Wu",
      "reporter_dept": "Computer Science",
      "submitted_at": "2025-06-15T10:00:00.000Z",
      "priority": "high"
    }
  ],
  "pagination": {...},
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.9.2 List Approval History

```http
GET /api/approvals/history
```

**Permission:** `strategic_dept` or `functional_dept`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| action | ApprovalAction | APPROVE, REJECT, or RETURN |
| startDate | string | Start date filter |
| endDate | string | End date filter |
| page | number | Page number |
| pageSize | number | Items per page |

**Response (200 OK - Paginated):**
```json
{
  "success": true,
  "data": [
    {
      "approval_id": "apr001",
      "report_id": "rpt001",
      "indicator_name": "Course satisfaction rate",
      "action": "APPROVE",
      "comment": "Good progress",
      "acted_at": "2025-03-30T10:00:00.000Z",
      "reporter_name": "Li Si",
      "reporter_dept": "Academic Affairs"
    }
  ],
  "pagination": {...},
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.9.3 Approve/Reject/Return Report

```http
POST /api/progress-reports/{reportId}/approve
```

**Permission:** `strategic_dept` or `functional_dept`

**Request Body:**
```json
{
  "action": "ApprovalAction (required)",
  "comment": "string (required for REJECT/RETURN)"
}
```

**Business Rules:**
- R4: Only one APPROVED & is_final=true report per milestone
- When approved, previous final report's is_final becomes false
- If `achieved_milestone: true` and approved, milestone status changes to COMPLETED

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "report": {...},
    "approval_record": {...}
  },
  "message": "Report approved successfully",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.9.4 Batch Approval

```http
POST /api/approvals/batch
```

**Permission:** `strategic_dept` or `functional_dept`

**Request Body:**
```json
{
  "report_ids": ["string (required)"],
  "action": "ApprovalAction (required)",
  "comment": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "success_count": 5,
    "failed_count": 1,
    "failed_reports": ["rpt003"]
  },
  "message": "Batch approval completed",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.9.5 Get Approval Records for Report

```http
GET /api/progress-reports/{reportId}/approval-records
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "approval_id": "apr001",
      "approver_id": "u001",
      "approver_name": "Zhang San",
      "approver_dept": "Strategic Development",
      "action": "APPROVE",
      "comment": "Good progress",
      "acted_at": "2025-03-30T10:00:00.000Z"
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

---

### 3.10 Alert Management

#### 3.10.1 List Alert Events

```http
GET /api/alerts
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cycleId | string | Filter by cycle |
| indicatorId | string | Filter by indicator |
| severity | AlertSeverity | INFO, WARNING, CRITICAL |
| status | AlertStatus | OPEN or CLOSED |
| page | number | Page number |
| pageSize | number | Items per page |

**Response (200 OK - Paginated):**
```json
{
  "success": true,
  "data": [
    {
      "event_id": "evt001",
      "indicator_id": "ind002",
      "indicator_name": "Research output",
      "target_org_name": "Computer Science",
      "window_id": "win001",
      "window_name": "Q2 Checkpoint",
      "rule_id": "rule001",
      "rule_name": "Progress Gap Warning",
      "expected_percent": 50,
      "actual_percent": 30,
      "gap_percent": 20,
      "severity": "WARNING",
      "status": "OPEN",
      "handled_by": null,
      "handled_by_name": null,
      "handled_note": null,
      "created_at": "2025-06-30T10:00:00.000Z"
    }
  ],
  "pagination": {...},
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.10.2 Get Alert Event Details

```http
GET /api/alerts/{eventId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "event_id": "evt001",
    "indicator_id": "ind002",
    "indicator": {...},
    "window_id": "win001",
    "alert_window": {...},
    "rule_id": "rule001",
    "alert_rule": {...},
    "expected_percent": 50,
    "actual_percent": 30,
    "gap_percent": 20,
    "severity": "WARNING",
    "status": "OPEN",
    "handled_by": null,
    "handler": null,
    "handled_note": null,
    "detail_json": {...},
    "created_at": "2025-06-30T10:00:00.000Z"
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.10.3 Handle Alert Event

```http
POST /api/alerts/{eventId}/handle
```

**Permission:** `strategic_dept` or `functional_dept`

**Request Body:**
```json
{
  "handled_note": "string (required)"
}
```

**Response (200 OK):** Alert with `status: CLOSED`

#### 3.10.4 Get Alert Summary

```http
GET /api/alerts/summary
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cycleId | string | Filter by cycle |
| orgId | string | Filter by organization |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "open": 10,
    "closed": 15,
    "by_severity": {
      "INFO": 5,
      "WARNING": 12,
      "CRITICAL": 8
    },
    "by_org": [
      {"org_name": "Computer Science", "count": 8},
      {"org_name": "Business School", "count": 6}
    ]
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.10.5 List Alert Rules

```http
GET /api/alert-rules
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cycleId | string | Filter by cycle |
| isEnabled | boolean | Filter enabled status |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "rule_id": "rule001",
      "cycle_id": "cycle2025",
      "name": "Progress Gap Warning",
      "severity": "WARNING",
      "gap_threshold": 15,
      "is_enabled": true
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.10.6 Create Alert Rule

```http
POST /api/alert-rules
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "cycle_id": "string (required)",
  "name": "string (required)",
  "severity": "AlertSeverity (required)",
  "gap_threshold": "number (required)",
  "is_enabled": "boolean (optional, default: true)"
}
```

**Response (201 Created):** Rule object

#### 3.10.7 List Alert Windows

```http
GET /api/alert-windows
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cycleId | string | Filter by cycle |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "window_id": "win001",
      "cycle_id": "cycle2025",
      "name": "Q2 Checkpoint",
      "cutoff_date": "2025-06-30",
      "is_default": false
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.10.8 Create Alert Window

```http
POST /api/alert-windows
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "cycle_id": "string (required)",
  "name": "string (required)",
  "cutoff_date": "string (required, YYYY-MM-DD)",
  "is_default": "boolean (optional)"
}
```

**Response (201 Created):** Window object

#### 3.10.9 Trigger Alert Calculation

```http
POST /api/alerts/calculate
```

**Permission:** `strategic_dept`

**Request Body:**
```json
{
  "cycle_id": "string (required)",
  "window_id": "string (optional, uses default if omitted)"
}
```

**Business Rules:**
- R5: Calculate order: Level 2 (Functional→College) first, then Level 1 (Strategic→Functional)
- R6: Actual % = latest valid report before window; Expected % = cumulative milestone weights before cutoff
- R7: Missing report + overdue triggers "missing report alert"

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "calculated_at": "2025-12-22T10:00:00.000Z",
    "new_alerts_count": 5,
    "updated_alerts_count": 3
  },
  "message": "Alert calculation completed",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

---

### 3.11 Adhoc Task

#### 3.11.1 List Adhoc Tasks

```http
GET /api/adhoc-tasks
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cycleId | string | Filter by cycle |
| creatorOrgId | string | Filter by creator |
| status | string | DRAFT, OPEN, CLOSED, ARCHIVED |
| page | number | Page number |
| pageSize | number | Items per page |

**Response (200 OK - Paginated):**
```json
{
  "success": true,
  "data": [
    {
      "adhoc_task_id": "adhoc001",
      "cycle_id": "cycle2025",
      "creator_org_id": "org002",
      "creator_org_name": "Academic Affairs",
      "scope_type": "BY_DEPT_ISSUED_INDICATORS",
      "indicator_id": null,
      "indicator_name": null,
      "task_title": "Mid-year Progress Survey",
      "task_desc": "Submit mid-year progress for all indicators",
      "open_at": "2025-06-01",
      "due_at": "2025-06-15",
      "include_in_alert": true,
      "require_indicator_report": true,
      "status": "OPEN",
      "target_count": 8,
      "report_count": 5
    }
  ],
  "pagination": {...},
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.11.2 Get Adhoc Task Details

```http
GET /api/adhoc-tasks/{taskId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "adhoc_task_id": "adhoc001",
    "cycle_id": "cycle2025",
    "assessment_cycle": {...},
    "creator_org_id": "org002",
    "creator_organization": {...},
    "scope_type": "BY_DEPT_ISSUED_INDICATORS",
    "indicator_id": null,
    "indicator": null,
    "task_title": "Mid-year Progress Survey",
    "task_desc": "...",
    "open_at": "2025-06-01",
    "due_at": "2025-06-15",
    "include_in_alert": true,
    "require_indicator_report": true,
    "status": "OPEN",
    "target_organizations": [...],
    "mapped_indicators": [...],
    "reports": [...]
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.11.3 Create Adhoc Task

```http
POST /api/adhoc-tasks
```

**Permission:** `strategic_dept` or `functional_dept`

**Request Body:**
```json
{
  "cycle_id": "string (required)",
  "scope_type": "AdhocScopeType (required)",
  "indicator_id": "string (optional)",
  "task_title": "string (required)",
  "task_desc": "string (optional)",
  "open_at": "string (required, YYYY-MM-DD)",
  "due_at": "string (required, YYYY-MM-DD)",
  "include_in_alert": "boolean (optional)",
  "require_indicator_report": "boolean (optional)",
  "target_org_ids": ["string (required for CUSTOM)"],
  "indicator_ids": ["string (optional for CUSTOM)"]
}
```

**Business Rules:**
- R10: scope_type defaults based on creator's department
- R11: ALL_ORGS - each target org submits one report
- R12: BY_DEPT_ISSUED_INDICATORS - auto-selects indicators issued by functional dept
- R13: CUSTOM - manually select organizations or indicators

**Response (201 Created):** Adhoc task object

#### 3.11.4 Update Adhoc Task

```http
PUT /api/adhoc-tasks/{taskId}
```

**Permission:** Creator

**Request Body:**
```json
{
  "task_title": "string (optional)",
  "task_desc": "string (optional)",
  "due_at": "string (optional)",
  "include_in_alert": "boolean (optional)"
}
```

**Business Rules:**
- Only DRAFT or OPEN status can be updated

**Response (200 OK):** Updated adhoc task object

#### 3.11.5 Publish Adhoc Task

```http
POST /api/adhoc-tasks/{taskId}/publish
```

**Permission:** Creator

**Business Rules:**
- Only DRAFT status can be published
- Status changes to OPEN

**Response (200 OK):** Adhoc task with `status: OPEN`

#### 3.11.6 Close Adhoc Task

```http
POST /api/adhoc-tasks/{taskId}/close
```

**Permission:** Creator

**Business Rules:**
- Only OPEN status can be closed
- Status changes to CLOSED

**Response (200 OK):** Adhoc task with `status: CLOSED`

#### 3.11.7 Archive Adhoc Task

```http
POST /api/adhoc-tasks/{taskId}/archive
```

**Permission:** Creator

**Response (200 OK):** Adhoc task with `status: ARCHIVED`

---

### 3.12 Audit Log

#### 3.12.1 List Audit Logs

```http
GET /api/audit-logs
```

**Permission:** `strategic_dept`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| entityType | string | task, indicator, approval, milestone, report |
| entityId | string | Filter by entity ID |
| action | AuditAction | Filter by action |
| actorUserId | string | Filter by actor |
| actorOrgId | string | Filter by actor's org |
| startDate | string | Start date |
| endDate | string | End date |
| page | number | Page number |
| pageSize | number | Items per page |

**Response (200 OK - Paginated):**
```json
{
  "success": true,
  "data": [
    {
      "log_id": "log001",
      "entity_type": "indicator",
      "entity_id": "ind001",
      "entity_name": "Course satisfaction rate",
      "action": "UPDATE",
      "actor_user_id": "u001",
      "actor_user_name": "Zhang San",
      "actor_org_id": "org001",
      "actor_org_name": "Strategic Development",
      "reason": null,
      "changed_fields": {
        "weight_percent": {"old": 15, "new": 20}
      },
      "created_at": "2025-12-22T10:00:00.000Z"
    }
  ],
  "pagination": {...},
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.12.2 Get Audit Log Details

```http
GET /api/audit-logs/{logId}
```

**Permission:** `strategic_dept`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "log_id": "log001",
    "entity_type": "indicator",
    "entity_id": "ind001",
    "entity_name": "Course satisfaction rate",
    "action": "UPDATE",
    "before_json": {...},
    "after_json": {...},
    "changed_fields": {...},
    "reason": null,
    "actor_user_id": "u001",
    "actor": {...},
    "actor_org_id": "org001",
    "actor_organization": {...},
    "created_at": "2025-12-22T10:00:00.000Z"
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.12.3 Get Entity History

```http
GET /api/audit-logs/entity/{entityType}/{entityId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "log_id": "log001",
      "action": "CREATE",
      "actor_user_name": "Zhang San",
      "changed_fields": null,
      "created_at": "2025-01-15T10:00:00.000Z"
    },
    {
      "log_id": "log002",
      "action": "UPDATE",
      "actor_user_name": "Zhang San",
      "changed_fields": {"weight_percent": {"old": 15, "new": 20}},
      "created_at": "2025-03-20T10:00:00.000Z"
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

---

### 3.13 Dashboard

#### 3.13.1 Get Dashboard Overview

```http
GET /api/dashboard
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalScore": 85.5,
    "basicScore": 90.2,
    "developmentScore": 80.8,
    "completionRate": 72.3,
    "warningCount": 12,
    "totalIndicators": 150,
    "completedIndicators": 108,
    "alertIndicators": {
      "severe": 3,
      "moderate": 9,
      "normal": 138
    }
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.13.2 Get Department Progress

```http
GET /api/dashboard/department-progress
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cycleId | string | Filter by cycle |
| orgLevel | OrgType | Filter by organization level |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "dept": "Academic Affairs",
      "progress": 78.5,
      "score": 82.3,
      "status": "success",
      "totalIndicators": 25,
      "completedIndicators": 20,
      "alertCount": 2
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.13.3 Get Recent Activities

```http
GET /api/dashboard/recent-activities
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Max items (default: 10) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "act001",
      "type": "report_submitted",
      "title": "Progress Report Submitted",
      "description": "Q3 progress report for indicator...",
      "actor": "Li Si",
      "actorDept": "Computer Science",
      "timestamp": "2025-12-22T09:30:00.000Z"
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.13.4 Get Task Flow Data (Sankey)

```http
GET /api/dashboard/task-flow
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cycleId | string | Filter by cycle |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {"name": "Strategic Development", "depth": 0},
      {"name": "Academic Affairs", "depth": 1},
      {"name": "Computer Science", "depth": 2}
    ],
    "links": [
      {"source": "Strategic Development", "target": "Academic Affairs", "value": 15},
      {"source": "Academic Affairs", "target": "Computer Science", "value": 8}
    ]
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.13.5 Get Department Comparison

```http
GET /api/dashboard/department-comparison
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cycleId | string | Filter by cycle |
| compareBy | string | progress, score, or completionRate |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "dept": "Computer Science",
      "progress": 85.2,
      "score": 88.5,
      "completionRate": 80.0,
      "totalIndicators": 20,
      "completedIndicators": 16,
      "alertCount": 1,
      "status": "success",
      "rank": 1
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.13.6 Get Task Source Distribution

```http
GET /api/dashboard/task-source
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| targetOrgId | string | Filter by target organization |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "name": "Academic Affairs",
      "value": 25,
      "percentage": 45.5
    },
    {
      "name": "Research Office",
      "value": 18,
      "percentage": 32.7
    }
  ],
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.13.7 Export Dashboard Report

```http
GET /api/dashboard/export/{format}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | excel or pdf |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cycleId | string | Filter by cycle |

**Response (200 OK):**
```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="dashboard-report-2025-12-22.xlsx"

[Binary file content]
```

---

### 3.14 File Management

#### 3.14.1 Upload File

```http
POST /api/files/upload
```

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Description |
|-------|------|-------------|
| file | File | File to upload (required) |
| type | string | attachment or avatar (optional) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "file001",
    "name": "report-evidence.pdf",
    "url": "https://storage.example.com/files/file001.pdf",
    "size": 1048576,
    "type": "application/pdf",
    "uploadedAt": "2025-12-22T10:00:00.000Z"
  },
  "message": "File uploaded successfully",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.14.2 Get File Info

```http
GET /api/files/{fileId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "file001",
    "name": "report-evidence.pdf",
    "url": "https://storage.example.com/files/file001.pdf",
    "size": 1048576,
    "type": "application/pdf",
    "uploadedAt": "2025-12-22T10:00:00.000Z"
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.14.3 Download File

```http
GET /api/files/{fileId}/download
```

**Response (200 OK):**
```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="report-evidence.pdf"

[Binary file content]
```

#### 3.14.4 Delete File

```http
DELETE /api/files/{fileId}
```

**Permission:** Uploader or `strategic_dept`

**Response (204 No Content)**

---

### 3.15 Message & Notification

#### 3.15.1 List Messages

```http
GET /api/messages
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | alert, approval, or system |
| isRead | boolean | Filter by read status |
| page | number | Page number |
| pageSize | number | Items per page |

**Response (200 OK - Paginated):**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg001",
      "type": "alert",
      "title": "Progress Alert",
      "content": "Indicator 'Course satisfaction' is behind schedule",
      "severity": "WARNING",
      "recipientId": "u002",
      "isRead": false,
      "createdAt": "2025-12-22T10:00:00.000Z",
      "relatedId": "ind001"
    }
  ],
  "pagination": {...},
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.15.2 Get Unread Count

```http
GET /api/messages/unread-count
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "byType": {
      "alert": 5,
      "approval": 8,
      "system": 2
    }
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.15.3 Mark Message as Read

```http
PUT /api/messages/{messageId}/read
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "msg001",
    "isRead": true
  },
  "message": "Message marked as read",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.15.4 Mark All Messages as Read

```http
PUT /api/messages/read-all
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Optional: filter by type |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "markedCount": 15
  },
  "message": "All messages marked as read",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.15.5 Get Notification Settings

```http
GET /api/notification-settings
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "u001",
    "emailNotifications": true,
    "alertNotifications": true,
    "approvalNotifications": true,
    "systemNotifications": false
  },
  "message": "Success",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

#### 3.15.6 Update Notification Settings

```http
PUT /api/notification-settings
```

**Request Body:**
```json
{
  "emailNotifications": "boolean (optional)",
  "alertNotifications": "boolean (optional)",
  "approvalNotifications": "boolean (optional)",
  "systemNotifications": "boolean (optional)"
}
```

**Response (200 OK):** Updated notification settings object

---

## 4. Appendix

### 4.1 Business Rules Reference

| Rule | Description | Module |
|------|-------------|--------|
| R1 | Updating parent indicator does NOT cascade to children | Indicator |
| R2 | Milestone weights for an indicator must sum to 100% | Milestone |
| R3 | milestone_id and adhoc_task_id cannot both be present in a report | Progress Report |
| R4 | Only one APPROVED & is_final=true report per milestone | Approval |
| R5 | Alert calculation order: Level 2 first, then Level 1 | Alert |
| R6 | Actual % = latest valid report; Expected % = cumulative milestone weights | Alert |
| R7 | Missing report + overdue triggers "missing report" alert | Alert |
| R8 | Cannot delete indicator/milestone with dependencies; must log deletion | Indicator/Milestone |
| R9 | Soft delete via status=ARCHIVED | All |
| R10 | Adhoc task scope defaults based on creator's department | Adhoc Task |
| R11 | ALL_ORGS: each target org submits one report | Adhoc Task |
| R12 | BY_DEPT_ISSUED_INDICATORS: auto-select functional dept's indicators | Adhoc Task |
| R13 | CUSTOM: manually select organizations or indicators | Adhoc Task |
| R14 | All critical operations logged to audit_log | Audit Log |
| R15 | Tasks and indicators sorted by sort_order | All |

### 4.2 State Transition Diagrams

#### Progress Report Status Flow

```
DRAFT ──submit──> SUBMITTED ──approve──> APPROVED (is_final=true)
  ^                   |
  |                   ├──reject──> REJECTED
  |                   |
  └──withdraw/return──┴──return──> RETURNED ──resubmit──> SUBMITTED
```

#### Milestone Status Flow

```
NOT_STARTED ──start──> IN_PROGRESS ──complete──> COMPLETED
                           |
                           ├──overdue──> DELAYED
                           |
                           └──cancel──> CANCELED
```

#### Adhoc Task Status Flow

```
DRAFT ──publish──> OPEN ──close──> CLOSED ──archive──> ARCHIVED
```

### 4.3 Permission Matrix

| Resource / Action | strategic_dept | functional_dept | secondary_college |
|-------------------|----------------|-----------------|-------------------|
| Strategic Task CRUD | CRUD | R | R |
| Level 1 Indicator CRUD | CRUD | R | - |
| Level 2 Indicator CRUD | CRUD | CRUD (own) | R |
| Milestone CRUD | CRUD | CRUD (own) | R |
| Progress Report | R | CRU (own) | CRU (own) |
| Approval | All | Subordinate | - |
| Alert Management | CRUD | R | R (own) |
| Adhoc Task | CRUD | CRUD (own) | R |
| Audit Log | R | - | - |
| User Management | CRUD | R (subordinate) | R (self) |
| Organization Management | CRUD | R | R |

**Legend:**
- C: Create
- R: Read
- U: Update
- D: Delete
- (own): Only own resources
- (subordinate): Only subordinate resources

---

### 4.4 Frontend Type Mapping

The frontend TypeScript types may use simplified values. Backend should accept both formats:

| Backend (Database) | Frontend (TypeScript) | Description |
|--------------------|----------------------|-------------|
| NOT_STARTED | pending | Milestone initial state |
| IN_PROGRESS | - | Milestone active state |
| COMPLETED | completed | Milestone done state |
| DELAYED | overdue | Milestone overdue |
| INFO | normal | Alert level low |
| WARNING | moderate | Alert level medium |
| CRITICAL | severe | Alert level high |
| RETURN | - | Report sent back for revision |

### 4.5 API Endpoint Summary

| Module | Count | Description |
|--------|-------|-------------|
| Authentication | 4 | Login, logout, token management |
| Organization | 4 | Organization CRUD |
| User | 5 | User CRUD + password |
| Assessment Cycle | 5 | Cycle CRUD + clone |
| Strategic Task | 5 | Task CRUD |
| Indicator | 8 | Indicator CRUD + archive/distribute |
| Milestone | 6 | Milestone CRUD + status |
| Progress Report | 8 | Report CRUD + workflow |
| Approval | 5 | Approval operations |
| Alert | 9 | Alert events + rules + windows |
| Adhoc Task | 7 | Adhoc task lifecycle |
| Audit Log | 3 | Audit log queries |
| Dashboard | 7 | Dashboard data + export |
| File | 4 | File upload/download |
| Message | 6 | Messages + notifications |
| **Total** | **86** | |

---

**Document Version:** V1.0
**Last Updated:** 2025-12-22
**Author:** System Design Team
