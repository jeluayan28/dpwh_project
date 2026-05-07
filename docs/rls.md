# Row Level Security (RLS)

This guide is written for **your current app**.

## Important reality first

Your app currently logs users in with:

- a custom `dpwh_session` cookie
- `localStorage`
- direct `Users` table lookup in the frontend

That means **Supabase RLS cannot automatically know who the user is**, because RLS normally depends on a **Supabase Auth JWT**.

So you currently have **2 possible paths**:

## Path A: Recommended for your current project

Keep sensitive database access behind your **Next.js API routes** and use the **service role key** there.

This is already the direction your app is moving:

- documents use API routes
- admin page now uses API routes
- server code uses `SUPABASE_SERVICE_ROLE_KEY`

In this path:

- RLS can still be enabled for extra safety
- but most real authorization decisions happen in your backend routes
- you do not need to migrate login immediately

## Path B: True Supabase RLS per logged-in user

If you want the database itself to know:

- user department
- admin role
- assigned document access

then you must migrate login to **Supabase Auth** so `auth.uid()` and JWT claims are available inside policies.

## Best advice for you now

Use **Path A now**, and plan **Path B later** if needed.

That means:

1. Keep using backend API routes for reads/writes
2. Do not let pages write directly to tables from the browser
3. Add RLS policies that block direct anonymous access
4. Optionally migrate to Supabase Auth later for advanced per-user DB rules

---

# Practical RLS setup now

## Goal

- browser should not freely query tables
- app backend can still work through the service role key
- anonymous/public access is blocked

## Step 1: Enable RLS

```sql
alter table public."Documents" enable row level security;
alter table public."Document_Logs" enable row level security;
alter table public."Document_Status_History" enable row level security;
alter table public."Users" enable row level security;
alter table public."Departments" enable row level security;
alter table public."Roles" enable row level security;
alter table public."Signatures" enable row level security;
```

## Step 2: Block public table access by default

Do not add broad `to public using (true)` table policies.

Because your backend uses the service role key, it bypasses RLS already.

So if your frontend no longer queries these tables directly, you can keep policies very strict.

## Example strict policies

### Documents

```sql
create policy "deny direct document reads from anon"
on public."Documents"
for select
to anon
using (false);

create policy "deny direct document writes from anon"
on public."Documents"
for all
to anon
using (false)
with check (false);
```

### Document logs

```sql
create policy "deny direct log reads from anon"
on public."Document_Logs"
for select
to anon
using (false);

create policy "deny direct log writes from anon"
on public."Document_Logs"
for all
to anon
using (false)
with check (false);
```

### Status history

```sql
create policy "deny direct status reads from anon"
on public."Document_Status_History"
for select
to anon
using (false);

create policy "deny direct status writes from anon"
on public."Document_Status_History"
for all
to anon
using (false)
with check (false);
```

Repeat this pattern for `Users`, `Departments`, `Roles`, and `Signatures` if the browser should not read them directly.

---

# If you later migrate to Supabase Auth

Then you can implement the exact rules from your requirement:

- users can only see documents related to their department
- admin can see everything
- staff can only update assigned documents

For that, you should first add a bridge from auth user to your `Users` table.

Example additional column:

```sql
alter table public."Users"
add column if not exists auth_user_id uuid unique;
```

Then each logged-in Supabase Auth user is linked to `Users.auth_user_id`.

## Helper function examples

```sql
create or replace function public.current_app_user_role()
returns text
language sql
stable
as $$
  select r.role_name
  from public."Users" u
  join public."Roles" r on r.role_id = u.role_id
  where u.auth_user_id = auth.uid()
  limit 1
$$;
```

```sql
create or replace function public.current_app_user_department_id()
returns bigint
language sql
stable
as $$
  select u.department_id
  from public."Users" u
  where u.auth_user_id = auth.uid()
  limit 1
$$;
```

## Example policy: admin can see everything

```sql
create policy "admins can read all documents"
on public."Documents"
for select
to authenticated
using (public.current_app_user_role() = 'Admin');
```

## Example policy: department users can read their related documents

Because your current schema derives current department from `Document_Logs`, a clean production setup would usually store `current_department_id` in `Documents`.

If you add that column later:

```sql
alter table public."Documents"
add column if not exists current_department_id bigint references public."Departments"(department_id);
```

Then:

```sql
create policy "department users can read own department documents"
on public."Documents"
for select
to authenticated
using (
  public.current_app_user_role() = 'Admin'
  or current_department_id = public.current_app_user_department_id()
);
```

## Example policy: staff can only update assigned documents

This requires an explicit assignment field or table. Example:

```sql
alter table public."Documents"
add column if not exists assigned_user_id bigint references public."Users"(user_id);
```

Then:

```sql
create or replace function public.current_app_user_id()
returns bigint
language sql
stable
as $$
  select u.user_id
  from public."Users" u
  where u.auth_user_id = auth.uid()
  limit 1
$$;
```

```sql
create policy "assigned staff can update their documents"
on public."Documents"
for update
to authenticated
using (
  public.current_app_user_role() = 'Admin'
  or assigned_user_id = public.current_app_user_id()
)
with check (
  public.current_app_user_role() = 'Admin'
  or assigned_user_id = public.current_app_user_id()
);
```

---

# Common mistakes to avoid

## 1. Expecting custom cookies to power RLS

RLS does not read your custom `dpwh_session` cookie.

## 2. Mixing browser writes with strict RLS

If the browser still writes directly to tables, strict RLS will block it unless the user has a valid Supabase JWT and matching policy.

## 3. Forgetting that service role bypasses RLS

Your server-side API routes using the service role key are not restricted by RLS. That is normal.

## 4. Trying to derive complex permissions inside every policy

If your current department is derived from `Document_Logs`, policies become more complex. For long-term simplicity, consider storing `current_department_id` in `Documents`.

## 5. Turning on RLS before moving frontend access behind APIs

That causes confusing failures. Your app is safer now because most critical areas already use API routes.

---

# Recommendation for your project right now

Do this now:

1. Enable RLS on core tables
2. Block direct `anon` access
3. Keep using backend API routes

Do this later:

4. Migrate login to Supabase Auth
5. Add true user/department-aware RLS

That is the cleanest and least risky path for your current system.
