# Testing and Debugging Checklist

Use this when Supabase or the backend is not behaving correctly.

## 1. If tables are not showing

- Confirm you are in the correct Supabase project
- Check table names exactly:
  - `Documents`
  - `Document_Logs`
  - `Document_Status_History`
  - `Users`
  - `Departments`
  - `Roles`
- Refresh the Table Editor
- Verify the table was created in `public`

## 2. If data is not inserting

- Open browser dev tools and inspect the failing request
- Check the API response body for `error`
- Confirm `.env.local` contains:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Restart the dev server after changing env values
- Confirm required columns exist
- Check bucket/policy issues if the failure involves file upload

## 3. If file upload fails

- Confirm the bucket name is exactly `documents`
- Confirm the bucket exists in Supabase Storage
- Confirm Storage policies allow:
  - insert
  - select
- Confirm file type is allowed
- Confirm file size is below the bucket limit

## 4. If RLS blocks queries

- Read the exact error message
- Confirm whether the request comes from:
  - browser using anon key
  - server using service role key
- If it comes from the browser, confirm the table policy allows it
- If it comes from the server using service role, RLS is usually not the blocker
- Remember: your custom cookie does not power Supabase RLS

## 5. If login behaves strangely

- Confirm the user exists in `Users`
- Confirm `status = true`
- Confirm the password matches the plain text value in your current table
- Check that `dpwh_session` is being written to:
  - localStorage
  - cookies
- Check middleware redirects in [middleware.ts](/c:/Users/berme/OneDrive/Desktop/dpwh_project-main/middleware.ts)

## 6. If document tracking looks wrong

- Check `Documents.status`
- Check the related `Document_Logs` rows
- Check the related `Document_Status_History` rows
- Open `/api/documents/:id/chain-of-custody`
- Confirm the latest log matches the expected current department

## 7. Useful direct tests

### Test documents API

```bash
GET /api/documents
POST /api/documents
GET /api/documents/:id/chain-of-custody
```

### Test movement

```bash
POST /api/documents/:id/logs
```

### Test status

```bash
POST /api/documents/:id/status
```

### Test overdue checker

```bash
POST /api/internal/documents/mark-overdue
```

### Test admin APIs

```bash
GET /api/admin/users
POST /api/admin/users
GET /api/admin/departments
GET /api/admin/roles
```

## 8. Common errors and fixes

### `new row violates row-level security policy`

Fix:

- add the correct table or storage policy
- or move the action behind a backend API route

### `relation does not exist`

Fix:

- wrong table name
- table not created in `public`
- migration SQL not applied

### `column does not exist`

Fix:

- schema drift between code and database
- add the missing column
- update code to match actual schema

### `Email is already in use`

Fix:

- use a different email
- or edit the existing user instead of creating a new one

### `Department already has an active user`

Fix:

- deactivate the current active user in that department
- or assign the new user to a different department
