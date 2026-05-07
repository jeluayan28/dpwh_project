-- 1. Create a document manually in the existing Documents table
insert into public."Documents" (
  tracking_num,
  title,
  status,
  is_urgent,
  created_at,
  type,
  created_by
) values (
  202604240001,
  'Budget Realignment Request',
  'pending',
  false,
  timezone('utc', now()),
  'Payroll',
  7
);

-- 2. Write the first status history row
insert into public."Document_Status_History" (
  status,
  updated_at,
  document_id
) values (
  'pending',
  timezone('utc', now()),
  15
);

-- 3. Record a department handoff in the logbook
insert into public."Document_Logs" (
  date_received,
  date_released,
  remarks,
  document_id,
  from_department_id,
  to_department_id,
  received_by,
  released_by
) values (
  timezone('utc', now()),
  timezone('utc', now()),
  'Sent to accounting for budget validation.',
  15,
  2,
  5,
  12,
  7
);

-- 4. Update the main document status and track it in history
update public."Documents"
set status = 'in_transit'
where document_id = 15;

insert into public."Document_Status_History" (
  status,
  updated_at,
  document_id
) values (
  'in_transit',
  timezone('utc', now()),
  15
);

-- 5. Full chain of custody for one document
select *
from public.document_chain_of_custody
where document_id = 15
order by date_received asc nulls first, log_id asc;

-- 6. Current holder by latest document log
select distinct on (l.document_id)
  l.document_id,
  d.tracking_num,
  d.title,
  d.status,
  l.to_department_id as current_department_id,
  dept.department_name as current_department_name,
  l.date_received as last_received_at
from public."Document_Logs" l
join public."Documents" d
  on d.document_id = l.document_id
left join public."Departments" dept
  on dept.department_id = l.to_department_id
order by l.document_id, l.date_received desc nulls last, l.log_id desc;

-- 7. Full status timeline for one document
select
  s.status_id,
  s.status,
  s.updated_at,
  d.tracking_num,
  d.title
from public."Document_Status_History" s
join public."Documents" d
  on d.document_id = s.document_id
where s.document_id = 15
order by s.updated_at asc, s.status_id asc;

-- 8. Documents that have not moved in the last 3 days
select
  d.document_id,
  d.tracking_num,
  d.title,
  d.status,
  latest_log.to_department_id as current_department_id,
  dept.department_name as current_department_name,
  latest_log.date_received as last_received_at
from public."Documents" d
left join lateral (
  select l.*
  from public."Document_Logs" l
  where l.document_id = d.document_id
  order by l.date_received desc nulls last, l.log_id desc
  limit 1
) latest_log on true
left join public."Departments" dept
  on dept.department_id = latest_log.to_department_id
where coalesce(latest_log.date_received, d.created_at) < timezone('utc', now()) - interval '3 days'
order by last_received_at asc nulls first, d.created_at asc;
