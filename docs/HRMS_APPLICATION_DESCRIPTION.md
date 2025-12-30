## HRMS Application (TGS HRMS) — Product & Module Description

This document describes the **TGS HRMS** frontend application at a product/module level: what the system is for, the main user roles, core concepts, and what each module does (including primary screens, typical workflows, and data it manages).

---

## What is an HRMS?

An **HRMS (Human Resource Management System)** is a software platform used to manage the end‑to‑end employee lifecycle and day‑to‑day HR operations. In practical terms, an HRMS helps an organization:

- **Organize** company structure (tenants/companies, departments, designations, teams)
- **Manage people** (employee onboarding, profiles, assignments, status)
- **Track time** (attendance check-in/out, timesheets)
- **Handle leave** (apply/approve/reject/withdraw, analytics and reporting)
- **Administer assets** (inventory, employee requests, approvals, lifecycle states)
- **Administer benefits** (benefit catalog, assignment to employees, reporting)
- **Run payroll** (salary configuration, payroll generation/records, payslips, reports)
- **Measure performance** (KPIs, trends, promotions/recognition tracking)
- **Audit activity** (system logs, filtering, export)

---

## Application Summary

TGS HRMS is a **multi-tenant HRMS web application** (SPA) with role-based access control (RBAC). The UI groups features into functional modules (Employees, Attendance, Leave, Assets, Benefits, Payroll, etc.) and exposes different views/permissions based on the logged-in user’s role.

### Key characteristics

- **Multi-tenant**: Supports managing multiple tenants/companies (especially for system-level roles).
- **Role-based access**: Routes and sidebar menus are restricted by role.
- **Session + token refresh**: Uses Bearer tokens and supports refresh-token retries.
- **Modern UI**: Material UI based layout, responsive design, dark mode, and reusable “App\*” components.
- **Reporting/export**: Several modules support CSV export (logs, attendance, benefits, payroll, etc.).

---

## Roles and Access Model (RBAC)

The app normalizes roles and uses allowlists to gate both:

- **Visible menu items** (Sidebar)
- **Accessible routes** (dashboard route guards)

### Roles seen in the frontend

- **system-admin**: System-wide administration across tenants; system dashboards, system audits, cross-tenant views.
- **network-admin**: Elevated admin (but more limited than system-admin).
- **hr-admin**: HR operations (attendance, leave, teams, some payroll and benefits operations).
- **admin**: Tenant admin (departments, employees, attendance, payroll, benefits, etc. within a tenant).
- **manager**: Team-centric views (team attendance/leaves, employee-level benefit details, own salary/payslips).
- **employee / user**: Self-service views (attendance, leave requests, asset requests, own salary/payslips, own benefits).

> Note: Exact menu visibility and route allowlists are controlled in `src/utils/permissions.ts` and can be adjusted without changing module implementations.

---

## Core Concepts & Data Entities (as represented in UI/API)

- **Tenant / Company**: The organization “container” that owns departments, employees, assets, and other HR data.
- **User**: The login identity (name/email/phone/role). A user may be linked to an employee record.
- **Employee**: The HR record for a person employed by a tenant (department/designation/team links, status, etc.).
- **Department**: Organizational unit (used for grouping employees and analytics).
- **Designation**: Role/title in org structure (usually linked to department).
- **Team**: Manager-led group of employees (used for team views and approvals).
- **Attendance**: Daily check‑in/out events and computed summaries (worked hours, attendance logs).
- **Leave**: Leave requests with types, dates, status, approvals/remarks.
- **Asset**: Items like laptops, phones, accessories, etc., with categories/subcategories and lifecycle status.
- **Benefit**: Benefits catalog entries and employee benefit assignments.
- **Payroll**: Salary configuration, payroll records per period, payroll statistics and payslips.
- **Audit logs**: Recorded system actions/events with filters and export.

---

## Navigation and URL Structure

### Public / auth routes

- `/` — Login
- `/Signup` — Signup (personal details)
- `/signup/company-details` — Company details (signup flow)
- `/signup/select-plan` — Plan selection (signup or payment-required login flow)
- `/signup/confirm-payment` — Payment confirmation (signup flow and employee-payment flow)
- `/signup/success` — Signup success
- `/forget`, `/reset-password`, `/confirm-password` — Auth helpers
- `/employees` — Stripe return handler that forwards to `/signup/confirm-payment`

### Authenticated area

All primary modules live under:

- `/dashboard/*` — Protected routes rendered inside the main Layout (Navbar + Sidebar + Outlet)

---

## Modules (Detailed Descriptions)

Each module below includes: purpose, key capabilities, and typical screens/routes.

---

### 1) Authentication & Account Access

**Purpose**: Securely authenticate users and establish a role-based session.

**Key capabilities**

- Login with session persistence (stored tokens + user payload).
- Signup flow (personal details, company details, plan selection, payment, completion).
- Password recovery/reset screens.
- Optional Google signup initialization (via backend) if enabled.
- Refresh-token based silent session renewal.

**Primary screens**

- Login: `/`
- Signup: `/Signup`
- Forgot/Reset: `/forget`, `/reset-password`, `/confirm-password`

**Notes**

- Tokens are attached via Axios interceptors (Bearer auth).
- When access tokens expire, the app attempts refresh and retries queued requests.

---

### 2) Company / Tenant Onboarding (Signup + Subscription)

**Purpose**: Onboard a new company/tenant into the HRMS with a subscription plan and payment.

**Key capabilities**

- Capture personal details (admin/owner).
- Capture company details (company name, domain, logo).
- Fetch subscription plans from backend; optionally enrich with Stripe price info.
- Start checkout and confirm payment.
- Complete signup and initialize the tenant.

**Primary screens**

- Company details: `/signup/company-details`
- Plan selection: `/signup/select-plan`
- Confirm payment: `/signup/confirm-payment`
- Signup success: `/signup/success`

---

### 3) Dashboard (System/Tenant Insights)

**Purpose**: Provide high-level metrics and operational visibility.

**Key capabilities**

- KPI cards (e.g., tenants/employees, uptime, trends).
- Charts for employee growth and tenant growth (system-level).
- Recent activity logs and export.

**Primary screen**

- Dashboard home: `/dashboard`

**Notes**

- The system dashboard view is primarily shown to **system-admin** users.

---

### 4) Tenant Management (System Admin)

**Purpose**: Manage the lifecycle of tenants/companies at a system level.

**Key capabilities**

- View tenants with **status filtering** (active/suspended/deleted).
- Create tenant (including admin name/email and optional logo upload).
- Edit tenant details and logo.
- View tenant detail modal (with safe logo fallback).
- Soft delete / restore flows and status transitions (as supported by API).

**Primary screen**

- `/dashboard/tenant`

---

### 5) Organization Setup (Departments & Designations)

#### 5.1 Departments

**Purpose**: Maintain the department catalog that employees and analytics reference.

**Key capabilities**

- Create, edit, delete departments.
- System-admin may filter by tenant (multi-tenant department view).
- Localization-aware labels in UI.

**Primary screen**

- `/dashboard/departments`

#### 5.2 Designations

**Purpose**: Maintain job titles/designations, typically linked to a department.

**Key capabilities**

- List designations by department.
- Create/edit/delete designations.
- Filters: department filter and (for system-admin) tenant filter.

**Primary screen**

- `/dashboard/Designations`

---

### 6) Employee Management

**Purpose**: Manage employee records, assignments, and profile details.

**Key capabilities**

- Employee list with pagination and filters (department, designation).
- Create/edit employee records (including attachments where supported).
- View employee details modal.
- Delete confirmation flows.
- CSV export of employee datasets.
- Handles Stripe employee-payment return flow (redirect to confirmation).

**Primary screens**

- Employee list/CRUD: `/dashboard/EmployeeManager`
- Tenant employees (system-level, cross-tenant list): `/dashboard/TenantEmployees`
- Employee profile view (self/employee-centric): `/dashboard/EmployeeProfileView`

---

### 7) Team Management

**Purpose**: Organize employees into teams and support manager/team operations.

**Key capabilities**

- Role-based views:
  - System-admin: view all tenants with teams.
  - Admin/HR admin: view all teams in tenant.
  - Manager: view “My Teams” and team members.
- Create team (admin/manager flows as supported by role checks).
- Event-driven refresh (listens for `teamUpdated`).

**Primary screen**

- `/dashboard/teams`

---

### 8) Attendance & Timesheets

#### 8.1 Attendance Check-in/out

**Purpose**: Allow employees to record their daily attendance and view today’s status.

**Key capabilities**

- Check-in / check-out actions.
- Displays today’s check-in/out times.
- Integrates a “MyTimeCard” style view for quick time summary.

**Primary screen**

- `/dashboard/AttendanceCheck`

#### 8.2 Daily Attendance (Tables)

**Purpose**: Provide detailed attendance logs and summaries with role-based views.

**Key capabilities**

- My attendance vs team attendance (manager view) vs all attendance (admin views).
- Date range filtering and navigation.
- Optional tenant filter for system-level views.
- CSV export based on current filters.

**Primary screen**

- `/dashboard/AttendanceTable`

#### 8.3 Attendance Summary Report

**Purpose**: Aggregate attendance into a reportable summary for a time range.

**Key capabilities**

- Time filters (this month / previous month / 60 days / 90 days).
- Summary rows (working days, presents, absents, informed leaves).
- CSV export.

**Primary screen**

- `/dashboard/attendance-summary`

#### 8.4 Timesheets

**Purpose**: Show a user’s timesheets (task/time entries) as a complementary time tracking view.

**Primary screen**

- `/dashboard/AttendanceCheck/TimesheetLayout`

---

### 9) Leave Management & Leave Analytics

#### 9.1 Leave Requests

**Purpose**: Enable employees to apply for leave and enable managers/admins to approve/reject.

**Key capabilities**

- Apply leave (leave types, date ranges, reason).
- Leave history list.
- Approvals/rejections (role-based), manager response handling.
- Withdraw leave requests (where allowed).
- “My” vs “Team” views for managers; admins can see all leaves.

**Primary screen**

- `/dashboard/leaves`

#### 9.2 Leave Analytics / Reports

**Purpose**: Provide analytics around leave consumption and balances.

**Key capabilities**

- Monthly and year-to-date aggregation per employee and leave type.
- Admin views can load all employees for filters.
- CSV export.

**Primary screen**

- `/dashboard/Reports`

#### 9.3 Cross-Tenant Leave Management

**Purpose**: System-wide leave overview and analytics across tenants (system admin) and tenant-level consolidated leave analytics (tenant admins).

**Key capabilities**

- Tenant filter (system-admin can switch; non-system-admin locked to their tenant).
- Department filter, status filter, date range filters.
- Summary charts (ApexCharts) plus detailed table.
- Pagination and export patterns as supported by the API layer.

**Primary screen**

- `/dashboard/cross-tenant-leaves`

---

### 10) Asset Management

**Purpose**: Track company assets and manage employee asset requests and approvals.

#### 10.1 Asset Inventory

**Key capabilities**

- CRUD for assets (create/edit/delete).
- Category/subcategory structure.
- Status tracking (available/assigned/retired/maintenance/pending).
- Search and filter.
- Role-based action visibility (e.g., HR admin restrictions in UI).

**Primary screen**

- `/dashboard/assets` (also aliased as `/dashboard/assets/inventory`)

#### 10.2 Asset Requests (Employee Self-Service)

**Key capabilities**

- Employees request assets by category/subcategory with remarks.
- Tabs by status (pending/approved/rejected/cancelled).
- Cancel request workflow.
- Pagination + search.

**Primary screen**

- `/dashboard/assets/requests`

#### 10.3 Request Management (Approvals / Assignment)

**Key capabilities**

- Approve/reject requests.
- On approval, assign a specific asset to a request (where supported).
- View request details and requester information.
- Tabbed views for pending/approved/rejected and global search.

**Primary screen**

- `/dashboard/assets/request-management`

#### 10.4 System Admin Assets (Cross-Tenant Overview)

**Key capabilities**

- System-wide asset list with filters: tenant, category, assigned/unassigned.
- Summary cards (system asset summary by tenant/category).
- Search across asset/tenant/assignee/category/subcategory.

**Primary screen**

- `/dashboard/assets/system-admin`

---

### 11) Benefits Management

**Purpose**: Maintain benefits catalog, assign benefits to employees, and report coverage.

#### 11.1 Benefits Catalog

**Key capabilities**

- Create/edit/delete benefits (name/type/description/eligibility/status).
- Filter by type/status.
- CSV export of catalog.

**Primary screen**

- `/dashboard/benefits-list`

#### 11.2 Employee Benefits (Assignments)

**Key capabilities**

- View employees with assigned benefits.
- Assign benefits to employees.
- View benefit details (per employee assignment).
- Cancel an employee benefit assignment.
- Filter by assignment status (active/expired/cancelled) and export.

**Primary screen**

- `/dashboard/employee-benefit`

#### 11.3 My Benefits (Self-Service)

**Key capabilities**

- View the logged-in user’s assigned benefits and dates/status.
- View benefit details.
- CSV export.

**Primary screen**

- `/dashboard/benefit-details`

#### 11.4 Benefit Reporting

**Key capabilities**

- Summary statistics (active benefits, most common type, employees covered).
- Filters by tenant (system admin), department, designation.
- Flattened reporting table and CSV export.

**Primary screen**

- `/dashboard/benefit-report`

---

### 12) Payroll

**Purpose**: Configure payroll rules, manage employee salaries, generate payroll records, and provide payslips and payroll insights.

#### 12.1 Payroll Configuration

**Key capabilities**

- Configure salary cycle (monthly/weekly/biweekly).
- Configure base pay components and allowances.
- Configure deductions, overtime policy, leave deduction policy.
- Optional custom payroll fields.

**Primary screen**

- `/dashboard/payroll-configuration`

#### 12.2 Employee Salary Management

**Key capabilities**

- Admin views: list all employees and manage salary structures.
- Employee views: load “my salary” (where supported by role).
- Salary history view and active salary selection.
- Effective month/year, end date, status, notes, allowances/deductions.

**Primary screen**

- `/dashboard/employee-salary`

#### 12.3 Payroll Records (Generation + Status)

**Key capabilities**

- Filter payroll by period (month/year) and optional employee.
- Generate payroll (roles with permission).
- View payroll record details.
- Update payroll status (paid/unpaid) with remarks.
- Totals across the table (gross/deductions/bonuses/net).

**Primary screen**

- `/dashboard/payroll-records`

#### 12.4 Payroll Reports (Analytics)

**Key capabilities**

- Tenant-level statistics (system view selects tenant).
- Charts for monthly trends and department comparisons.

**Primary screen**

- `/dashboard/payroll-reports`

#### 12.5 My Salary / Payslips (Self-Service)

**Key capabilities**

- View payroll history for the employee.
- Open a payslip detail modal for a selected record.

**Primary screen**

- `/dashboard/my-salary`

---

### 13) Performance

**Purpose**: Provide performance monitoring and analytics across employees and tenants.

**Key capabilities**

- Tenant selector (system-level) with active tenant filtering.
- KPI overview grid, trend chart, and promotions list.

**Primary screen**

- `/dashboard/performance-dashboard`

---

### 14) Audit Logs (System Observability)

**Purpose**: Provide traceability of system actions and support audits/compliance.

**Key capabilities**

- Filter logs by user role, tenant, and HTTP method.
- Pagination pattern (estimated if backend does not provide totals).
- CSV export.

**Primary screen**

- `/dashboard/audit-logs`

---

### 15) Settings (Company Info)

**Purpose**: Allow tenant admins to manage company-level profile and branding.

**Key capabilities**

- View company name/domain/logo.
- Update company details and upload a new logo.
- Role-based edit gating (e.g., employees/managers are restricted from edits).

**Primary screen**

- `/dashboard/settings`

---

### 16) User Profile (Self-Service Profile)

**Purpose**: Let users view and update their own profile information.

**Key capabilities**

- View personal details (name/email/phone), role and tenant, joined date.
- Upload profile picture.
- Edit profile via modal.
- Employee/manager users can also see the employee profile view integration.

**Primary screen**

- `/dashboard/UserProfile`

---

### 17) HR Policies & Holiday Calendar (Current UI/Prototype)

These screens are present in the UI and routing, but in the current frontend implementation they are backed by **in-app mock data** (not the backend API layer).

#### HR Policies

- **Purpose**: Maintain HR policy documents/entries (types, effective dates).
- **Primary screen**: `/dashboard/policies`

#### Holiday Calendar

- **Purpose**: Maintain a list of holidays and show calendar/upcoming views.
- **Primary screen**: `/dashboard/holidays`

---

## Environment & Deployment Notes (Frontend)

### Required environment variables

- `VITE_API_BASE_URL` — Base URL of the backend API.
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth Client ID (if Google signup/login is used).

### Hosting

- Netlify build pipeline is configured (`netlify.toml`) to run `npm ci && npm run build` and publish `dist` with SPA redirects.
