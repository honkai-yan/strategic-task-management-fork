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
- `src/stores/` - Pinia stores: `auth.ts` (authentication), `strategic.ts` (tasks/indicators), `dashboard.ts` (dashboard state), `auditLog.ts`
- `src/types/index.ts` - All TypeScript interfaces and types centralized
- `src/api/index.ts` - Axios instance with interceptors
- `src/router/index.ts` - Routes with auth guards

### User Roles
Three roles with different permissions defined in `src/stores/auth.ts`:
- `strategic_dept` - Full CRUD on tasks/indicators, approval capabilities
- `functional_dept` - Limited indicator updates, report creation, partial approvals
- `secondary_college` - Report creation/viewing only

### API Configuration
- Dev server proxies `/api` to `http://localhost:8080`
- API service in `src/api/index.ts` handles auth tokens and error transformation
- Expects a backend PostgreSQL database (port 5432, database: `strategic`)

### Key Domain Types
Defined in `src/types/index.ts`:
- `StrategicTask` - Main task entity with indicators
- `StrategicIndicator` - KPIs with milestones, progress tracking
- `Milestone` - Time-bound checkpoints within indicators
- `ApprovalRequest/ApprovalHistory` - Workflow management
- `DashboardData/DepartmentProgress` - Analytics structures

## Testing

Tests use Vitest with the pattern `src/**/*.{test,spec,property.test}.{js,ts}`. Property-based tests use `fast-check`.
