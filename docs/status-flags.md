# Status Flags

## Recommended approach

Use a mixed approach:

- `Urgent`: manual flag stored directly in `Documents.is_urgent`
- `Overdue`: automatic flag set by a scheduled job, not a trigger

## Why not a trigger for overdue?

Triggers only run when rows are inserted or updated. An overdue condition is time-based, so nothing may change in the database exactly at the 3-day mark. That makes triggers the wrong tool for this rule.

## Best option in Supabase

Use a scheduled function or scheduled HTTP call that runs every hour or every day and calls:

- `POST /api/internal/documents/mark-overdue`

This route is implemented in:

- [app/api/internal/documents/mark-overdue/route.ts](/c:/Users/berme/OneDrive/Desktop/dpwh_project-main/app/api/internal/documents/mark-overdue/route.ts)

The logic is implemented in:

- [services/overdueService.ts](/c:/Users/berme/OneDrive/Desktop/dpwh_project-main/services/overdueService.ts)

## SQL examples

### Manual urgent flag

```sql
update public."Documents"
set is_urgent = true
where document_id = 15;
```

### Find overdue candidates

This derives the current department from the latest `Document_Logs` row and flags documents that have stayed there for more than 3 days.

```sql
select
  d.document_id,
  d.tracking_num,
  d.title,
  d.status,
  latest_log.to_department_id as current_department_id,
  latest_log.date_received as entered_department_at
from public."Documents" d
join lateral (
  select l.*
  from public."Document_Logs" l
  where l.document_id = d.document_id
  order by l.date_received desc nulls last, l.log_id desc
  limit 1
) latest_log on true
where d.status <> 'overdue'
  and latest_log.date_received < timezone('utc', now()) - interval '3 days';
```

### Mark overdue directly in SQL

```sql
with overdue_docs as (
  select d.document_id
  from public."Documents" d
  join lateral (
    select l.*
    from public."Document_Logs" l
    where l.document_id = d.document_id
    order by l.date_received desc nulls last, l.log_id desc
    limit 1
  ) latest_log on true
  where d.status <> 'overdue'
    and latest_log.date_received < timezone('utc', now()) - interval '3 days'
)
update public."Documents" d
set status = 'overdue'
from overdue_docs o
where d.document_id = o.document_id;
```

### Append overdue status history

```sql
insert into public."Document_Status_History" (document_id, status, updated_at)
select d.document_id, 'overdue', timezone('utc', now())
from public."Documents" d
where d.status = 'overdue'
  and not exists (
    select 1
    from public."Document_Status_History" h
    where h.document_id = d.document_id
      and h.status = 'overdue'
      and h.updated_at > timezone('utc', now()) - interval '1 hour'
  );
```

## Scheduling options

### Option 1: Supabase Edge Function + scheduler

Call your own route or move the same logic into an Edge Function. This is the cleanest production option.

### Option 2: External cron

Use GitHub Actions, Vercel Cron, or another scheduler to call:

```bash
POST /api/internal/documents/mark-overdue
```

### Option 3: PostgreSQL cron

If `pg_cron` is available in your setup, you can schedule a SQL function directly. Example:

```sql
select cron.schedule(
  'mark-documents-overdue-hourly',
  '0 * * * *',
  $$
  with overdue_docs as (
    select d.document_id
    from public."Documents" d
    join lateral (
      select l.*
      from public."Document_Logs" l
      where l.document_id = d.document_id
      order by l.date_received desc nulls last, l.log_id desc
      limit 1
    ) latest_log on true
    where d.status <> 'overdue'
      and latest_log.date_received < timezone('utc', now()) - interval '3 days'
  )
  update public."Documents" d
  set status = 'overdue'
  from overdue_docs o
  where d.document_id = o.document_id;
  $$
);
```

## Practical recommendation

- Keep `is_urgent` manual in the UI
- Use a scheduled job for overdue checks every hour
- Write overdue changes into both `Documents.status` and `Document_Status_History`
