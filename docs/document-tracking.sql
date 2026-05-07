-- Safe, additive SQL for the existing schema shown in Supabase.
-- This does not recreate your tables. It only adds constraints, indexes,
-- and a convenience view on top of:
--   "Documents"
--   "Document_Logs"
--   "Document_Status_History"
--   "Departments"
--   "Users"

create unique index if not exists documents_tracking_num_idx
  on public."Documents"(tracking_num);

create index if not exists documents_created_by_idx
  on public."Documents"(created_by);

create index if not exists document_logs_document_idx
  on public."Document_Logs"(document_id, date_received);

create index if not exists document_logs_from_department_idx
  on public."Document_Logs"(from_department_id);

create index if not exists document_logs_to_department_idx
  on public."Document_Logs"(to_department_id);

create index if not exists document_logs_received_by_idx
  on public."Document_Logs"(received_by);

create index if not exists document_logs_released_by_idx
  on public."Document_Logs"(released_by);

create index if not exists document_status_history_document_idx
  on public."Document_Status_History"(document_id, updated_at);

create unique index if not exists users_one_active_per_department_idx
  on public."Users"(department_id)
  where status = true;

create or replace view public.document_chain_of_custody as
select
  d.document_id,
  d.tracking_num,
  d.title,
  d.status as current_status,
  d.is_urgent,
  d.type,
  d.created_at as document_created_at,
  creator.name as created_by_name,
  l.log_id,
  l.date_received,
  l.date_released,
  l.remarks,
  from_dept.department_name as from_department_name,
  to_dept.department_name as to_department_name,
  received_user.name as received_by_name,
  released_user.name as released_by_name
from public."Documents" d
left join public."Users" creator
  on creator.user_id = d.created_by
left join public."Document_Logs" l
  on l.document_id = d.document_id
left join public."Departments" from_dept
  on from_dept.department_id = l.from_department_id
left join public."Departments" to_dept
  on to_dept.department_id = l.to_department_id
left join public."Users" received_user
  on received_user.user_id = l.received_by
left join public."Users" released_user
  on released_user.user_id = l.released_by;
