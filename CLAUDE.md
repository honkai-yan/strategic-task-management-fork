# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Strategic Task Management System** (战略任务管理系统) - a Vue 3 frontend application for managing university strategic tasks, indicators, and approval workflows. It's designed for Chinese higher education institutions with role-based access control.

## Development Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Type-check (vue-tsc) then build with Vite
npm run type-check   # Run vue-tsc --noEmit
npm run lint         # ESLint with auto-fix
npm run test         # Run vitest once
npm run test:watch   # Run vitest in watch mode
```

## Architecture

### Tech Stack
- **Vue 3** with Composition API and `<script setup>`
- **TypeScript** with strict typing
- **Pinia** for state management
- **Vue Router** with role-based navigation guards
- **Element Plus** as UI component library
- **ECharts** (via vue-echarts) for data visualization
- **Axios** for API communication
- **dayjs** for date manipulation
- **lodash-es** for utility functions

### Path Aliases
Configured in `vite.config.ts`:
- `@` → `src/`
- `@components` → `src/components/`
- `@views` → `src/views/`
- `@stores` → `src/stores/`
- `@types` → `src/types/`
- `@utils` → `src/utils/`
- `@api` → `src/api/`

### Directory Structure
- `src/views/` - Page-level components (Dashboard, Login, Approval, etc.)
- `src/components/` - Reusable components organized by domain (charts/, profile/, approval/, indicator/, task/, common/)
- `src/stores/` - Pinia stores: `auth.ts` (authentication), `strategic.ts` (tasks/indicators), `dashboard.ts` (dashboard state), `auditLog.ts`, `timeContext.ts`
- `src/types/index.ts` - All TypeScript interfaces and types centralized
- `src/api/index.ts` - Axios instance with interceptors
- `src/router/index.ts` - Routes with auth guards
- `src/config/` - Configuration data (departments, constants)
- `src/data/` - Mock data for development

### User Roles & Permissions
Three roles with different permissions defined in `src/stores/auth.ts`:
- **`strategic_dept`** (战略发展部) - Full CRUD on tasks/indicators, approval capabilities, view-as-role functionality
- **`functional_dept`** (职能部门) - Limited indicator updates, report creation, partial approvals, can distribute tasks to colleges
- **`secondary_college`** (二级学院) - Report creation/viewing only, receive distributed tasks

**Important**: Strategic dept has a special "view as" feature (`setViewingAs()`) to inspect other departments' perspectives.

### API Configuration
- Dev server proxies `/api` to `http://localhost:8080`
- API service in `src/api/index.ts` handles auth tokens and error transformation
- Expects a backend PostgreSQL database (port 5432, database: `strategic`)
- Environment variables in `.env` (see `.env.example` for template)

### Key Domain Types
Defined in `src/types/index.ts`:
- `StrategicTask` - Main task entity with indicators, supports multi-year recurring tasks
- `StrategicIndicator` - KPIs with milestones, progress tracking, approval workflow
- `Milestone` - Time-bound checkpoints within indicators
- `ApprovalRequest/ApprovalHistory` - Workflow management
- `DashboardData/DepartmentProgress` - Analytics structures
- `StatusAuditEntry` - Audit trail for indicator status changes

### Store Architecture

**Authentication Store (`auth.ts`)**
- Manages user session and JWT tokens in localStorage
- `hasPermission()` method for RBAC checks
- `effectiveRole`/`effectiveDepartment` computed properties support view-as functionality
- Auto-restores session from localStorage on app initialization

**Strategic Store (`strategic.ts`)**
- Central store for tasks and indicators with extensive mock data
- Contains comprehensive Chinese university strategic planning examples
- `addStatusAuditEntry()` for tracking approval history
- Filtered getters support year-based and role-based access

**Dashboard Store (`dashboard.ts`)**
- Complex multi-level drill-down system (organization → department → indicator)
- Three-tier linkage: strategic dept → functional dept → college
- Computed properties handle filtering, aggregation, and chart data transformation
- `visibleIndicatorsWithHistory` supports historical year snapshots

**Time Context Store (`timeContext.ts`)**
- Global year selector for historical vs current vs future year views
- `isReadOnly` flag prevents edits in historical years
- Triggers data reloads across stores when year changes

### Role-Based Data Visibility

**Strategic Dept View:**
- Sees all departments and their indicators
- Can drill down: Organization → Functional Dept → College
- Can "view as" other roles to inspect their perspective

**Functional Dept View:**
- Sees indicators they own (created) and indicators they're responsible for
- Can see which colleges they've distributed tasks to
- Dashboard shows comparison of colleges receiving their tasks

**Secondary College View:**
- Only sees indicators assigned to them (`responsibleDept === userDept`)
- Sees which functional departments sent tasks (via `ownerDept` field)
- Can view task source distribution via pie chart

### Testing

Tests use Vitest with the pattern `src/**/*.{test,spec,property.test}.{js,ts}`. Property-based tests use `fast-check`.
