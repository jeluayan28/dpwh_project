# Project Checklist

This is the clean status of the project based on the work currently in the repo.

Important current note:

- RLS is currently **disabled** in Supabase
- that means the app is relying mainly on:
  - backend API routes
  - middleware
  - frontend session checks
- the RLS documentation is still useful as a future reference, but it is **not active right now**

## What Was Already In The Repo Before

- basic Next.js app structure
- landing page and login page
- custom login using `Users` table and local cookie/localStorage session
- dashboard/documents/admin pages with direct frontend Supabase usage
- Supabase client setup
- basic database tables already existing in Supabase:
  - `Documents`
  - `Document_Logs`
  - `Document_Status_History`
  - `Users`
  - `Departments`
  - `Roles`
  - `Signatures`

## What You Achieved Since Pulling From GitHub

### Document tracking backend

- [x] Create document with unique tracking number
- [x] Move documents between departments
- [x] Record movement in `Document_Logs`
- [x] Record status changes in `Document_Status_History`
- [x] Build chain-of-custody backend response
- [x] Add backend services for document logic
- [x] Add backend routes for documents, logs, status, and custody view

### Document tracking frontend

- [x] Switch documents page from direct Supabase writes to backend API
- [x] Upload document attachment to Supabase Storage
- [x] Save uploaded file URL in `Documents.file_url`
- [x] Show `View File` link on documents page
- [x] Open document details modal
- [x] Show chain of custody in UI
- [x] Show status history in UI
- [x] Add visual tracker/timeline in UI
- [x] Add move-document form in UI
- [x] Add change-status form in UI

### Status flags

- [x] Support manual `Urgent` flag
- [x] Add overdue detection backend logic
- [x] Add overdue internal API route
- [x] Add SQL/examples for overdue handling

### Admin management

- [x] Build backend APIs for users
- [x] Build backend APIs for departments
- [x] Build backend API for roles list
- [x] Validate unique email
- [x] Validate role existence
- [x] Validate department existence
- [x] Enforce one active user per department in backend logic
- [x] Add partial unique index guidance for one-active-user-per-department
- [x] Convert admin page from direct Supabase usage to backend APIs

### API structure and docs

- [x] Add master API structure documentation
- [x] Add document tracking API doc
- [x] Add SQL query examples
- [x] Add admin management doc
- [x] Add status flags doc
- [x] Add testing/debugging doc
- [x] Add RLS planning doc

## What Is Partially Done

### Status flags

- [x] overdue logic exists
- [ ] overdue logic is not yet scheduled automatically
- [ ] overdue indicator can still be improved in the UI

### Security

- [x] backend routes now protect a lot of data flow
- [x] middleware protects route access at app level
- [ ] true database-level per-user RLS is not active
- [ ] current login is still custom, not Supabase Auth

### Testing

- [x] main edited files passed lint/type-check while being developed
- [ ] no automated test suite was added
- [ ] no e2e tests were added

## What Is Still Lacking / Not Completed

### 5. Status Flags

- [ ] schedule overdue checker automatically
  - example: Vercel Cron, Supabase scheduled function, GitHub Actions, or `pg_cron`
- [ ] optionally add clearer overdue badge/explanation in more pages

### 8. DocuSign Integration

- [ ] send documents for signing
- [ ] track signing status
- [ ] store signed document references
- [ ] implement backend DocuSign handling
- [ ] write integration guide with real project flow

### 9. Row Level Security (RLS)

- [ ] decide whether you really want RLS enabled now
- [ ] if yes, re-enable it and apply matching policies
- [ ] migrate to Supabase Auth if you want real per-user database RLS
- [ ] add document assignment/current department fields if you want simpler future RLS

### 10. Testing & Debugging

- [ ] add actual automated tests
- [ ] add deployment/runtime checklist
- [ ] test all main flows end-to-end in the browser

### Project cleanup / polish

- [ ] replace the default README with a real project README
- [ ] decide whether to keep old compatibility routes if not needed
- [ ] clean up any remaining direct frontend Supabase access if you want a strict backend-only architecture
- [ ] review plain-text password handling in login/users flow
- [ ] add better success/error toasts or notifications

## Most Important Functional Risks Still Present

- [ ] login still uses plain password comparison from the `Users` table
- [ ] RLS is disabled, so database-level access control is not enforced right now
- [ ] overdue auto-check is not scheduled yet
- [ ] DocuSign is not implemented
- [ ] no automated testing safety net exists

## Recommended Next Priorities

Do these in this order if you want the strongest progress:

1. Replace default README with real project documentation
2. Decide security direction:
   - keep backend-route model for now
   - or migrate toward Supabase Auth + RLS
3. Schedule overdue checker
4. Implement DocuSign
5. Add automated tests

## Are All Docs Necessary?

### Keep these

- [x] `docs/project-checklist.md`
  - keep, this is your status tracker
- [x] `docs/api-structure.md`
  - keep, useful as your main backend overview
- [x] `docs/document-tracking-api.md`
  - keep, useful for document routes specifically
- [x] `docs/document-tracking.sql`
  - keep, useful for schema/index guidance
- [x] `docs/document-tracking-example-queries.sql`
  - keep, useful for testing and reporting
- [x] `docs/status-flags.md`
  - keep, useful because overdue scheduling is still unfinished
- [x] `docs/admin-management.md`
  - keep, useful for admin API and validation logic
- [x] `docs/testing-debugging.md`
  - keep, useful during development

### Optional / keep only as reference

- [ ] `docs/rls.md`
  - optional right now because RLS is disabled
  - keep only if you plan to re-enable RLS later

## Docs You Are Still Missing

- [ ] a real root `README.md` for the actual project
- [ ] DocuSign integration doc after implementation
- [ ] deployment/setup guide for env vars, storage bucket, cron setup, and Supabase SQL steps
