# Project Checklist

This checklist is now aligned to the functional requirements you provided.

## Overall Status Summary

### Mostly done

- document tracking backend
- chain of custody / online logbook
- document upload and file viewing
- admin user/department APIs

### Partly done

- overdue automation
- administrative management
- role-based access

### Not done

- DocuSign workflow
- Better-Auth
- dynamic permission-based RBAC
- automated tests

---

# 3. Functional Requirements

## 3.1 Document Tracking & Logbook

### Unique Tracking Number

- [x] Every document has a generated unique tracking number

### Division Staging

- [x] Track when a document enters a division
- [x] Track when a document leaves a division
- [x] Store timestamps in `Document_Logs`
- [x] Show timestamps in the tracker/details UI
- [ ] Add stricter validation so every move always has complete staging data if required by your final rules

### Status Flags

#### Urgent

- [x] Manual urgent toggle exists in the UI
- [x] Urgent value is saved in the database

#### Overdue

- [x] Overdue backend logic exists
- [x] Overdue route exists
- [x] Overdue SQL/examples are documented
- [ ] Overdue checker is not yet scheduled automatically
- [ ] Overdue is not yet fully “automatic” until scheduler/cron is enabled

### Online Logbook / Chain of Custody

- [x] Digital history exists in backend
- [x] Chain of custody API exists
- [x] Movement log uses `Document_Logs`
- [x] Status history uses `Document_Status_History`
- [x] Frontend document details modal shows chain of custody
- [x] Visual tracker/timeline exists in the UI
- [x] Users can move documents between departments from the UI
- [x] Users can update status from the UI

## 3.2 Administrative Management

### Dynamic Role-Based Access Control (RAC)

- [x] Users can be assigned to an existing role
- [x] Roles can be fetched from backend API
- [ ] Admin cannot yet create new roles from the UI
- [ ] Admin cannot yet edit/delete roles from the UI
- [ ] Specific permissions per role are not yet implemented
- [ ] Permission management without code deployment is not yet implemented
- [ ] Real RBAC is only partial right now because role names exist, but permission rules are not dynamically configurable

### Department Limit

- [x] One active account per department is enforced in backend validation
- [x] SQL/index guidance exists for one-active-user-per-department
- [x] Admin page now uses backend APIs for user/department management

## 3.3 Payroll Integration

### DocuSign Workflow

- [ ] Send documents for digital signature is not implemented
- [ ] Track signing status is not implemented
- [ ] Store signed document references is not implemented
- [ ] Full Accounting-to-DocuSign workflow is not implemented

---

# 4. Technical Stack (Proposed)

## Frontend: Next.js (App Router) + TypeScript

- [x] Implemented

## UI Components: shadcn/ui + TanStack Table

- [x] shadcn/ui is being used
- [ ] TanStack Table is not yet implemented for the tracker/table flow

## Backend Logic: Services Folder (Data Access Layer)

- [x] Implemented
- [x] Document service exists
- [x] Admin service exists
- [x] Overdue service exists

## Database: Supabase

- [x] Implemented

## Auth: Better-Auth

- [ ] Not implemented
- [ ] App is still using a custom cookie/localStorage session flow

## API: DocuSign SDK

- [ ] Not implemented as a complete working integration

---

# Security / Access Control Reality Check

- [x] Middleware protects admin and logged-in routes at app level
- [x] More app logic now uses backend API routes instead of direct client writes
- [ ] RLS is currently disabled
- [ ] True database-level access control is not active
- [ ] Login still uses plain password comparison from the `Users` table
- [ ] Better-Auth is not active

---

# Testing / Stability

- [x] Lint/type-check were used during implementation
- [x] Debugging checklist doc exists
- [ ] Automated tests are not implemented
- [ ] End-to-end tests are not implemented
- [ ] Full QA pass across all flows is still needed

---

# Documentation Status

## Keep these

- [x] `docs/project-checklist.md`
- [x] `docs/api-structure.md`
- [x] `docs/document-tracking-api.md`
- [x] `docs/document-tracking.sql`
- [x] `docs/document-tracking-example-queries.sql`
- [x] `docs/status-flags.md`
- [x] `docs/admin-management.md`
- [x] `docs/testing-debugging.md`

## Optional

- [ ] `docs/rls.md`
  - optional if RLS stays disabled
  - useful if you plan to re-enable RLS later

## Still missing

- [ ] Real project `README.md`
- [ ] DocuSign integration documentation after implementation
- [ ] Better-Auth setup documentation if you migrate auth

---

# Biggest Remaining Gaps

These are the main unfinished parts of the system:

1. Overdue scheduler automation
2. Dynamic role and permission management
3. Full DocuSign integration
4. Better-Auth migration
5. Secure password/auth flow
6. Real RLS if you want DB-level enforcement
7. TanStack Table if that is a strict requirement
8. Automated testing
9. Proper README

---

# Recommended Next Priorities

If you want to finish the project in the most practical order:

1. Replace default README with a real project README
2. Decide security direction:
   - keep custom session temporarily
   - or migrate to Better-Auth
3. Automate overdue scheduler
4. Implement dynamic role/permission management
5. Implement DocuSign workflow
6. Add automated tests
