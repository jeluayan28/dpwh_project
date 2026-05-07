# Admin Management

## API structure

### Users

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

### Roles

- `GET /api/admin/roles`

### Departments

- `GET /api/admin/departments`
- `POST /api/admin/departments`
- `PATCH /api/admin/departments/:id`
- `DELETE /api/admin/departments/:id`

## Validation logic

The backend now validates:

- `name`, `email`, and `password` are required when creating a user
- `email` must be valid and unique
- `role_id` must exist
- `department_id` must exist
- only one active user per department is allowed

The service lives in:

- [services/adminService.ts](/c:/Users/berme/OneDrive/Desktop/dpwh_project-main/services/adminService.ts)

## Example request bodies

### Create user

```json
{
  "name": "Maria Santos",
  "email": "maria@dpwh.gov.ph",
  "password": "secret123",
  "status": true,
  "role_id": 2,
  "department_id": 3
}
```

### Update user

```json
{
  "role_id": 1,
  "department_id": 4,
  "status": false
}
```

### Create department

```json
{
  "department_name": "Accounting Division",
  "description": "Handles accounting reviews and approvals."
}
```

## SQL queries

### List users with role and department

```sql
select
  u.user_id,
  u.name,
  u.email,
  u.status,
  u.role_id,
  r.role_name,
  u.department_id,
  d.department_name
from public."Users" u
left join public."Roles" r
  on r.role_id = u.role_id
left join public."Departments" d
  on d.department_id = u.department_id
order by u.user_id desc;
```

### Insert user

```sql
insert into public."Users" (
  name,
  email,
  password,
  status,
  role_id,
  department_id
) values (
  'Maria Santos',
  'maria@dpwh.gov.ph',
  'secret123',
  true,
  2,
  3
);
```

### Update user role or department

```sql
update public."Users"
set
  role_id = 1,
  department_id = 4,
  status = false
where user_id = 12;
```

### Delete user

```sql
delete from public."Users"
where user_id = 12;
```

### List departments with active-user counts

```sql
select
  d.department_id,
  d.department_name,
  count(u.user_id) filter (where u.status = true) as active_users
from public."Departments" d
left join public."Users" u
  on u.department_id = d.department_id
group by d.department_id, d.department_name
order by d.department_name asc;
```

## Enforce one active user per department

Use both:

- backend validation in `adminService.ts`
- a database-level partial unique index

SQL:

```sql
create unique index if not exists users_one_active_per_department_idx
  on public."Users"(department_id)
  where status = true;
```

This prevents race conditions and guarantees the rule even if someone bypasses the API.
