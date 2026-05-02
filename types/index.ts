export type DocumentRecord = {
  document_id: number;
  tracking_num: number;
  title: string;
  status: string;
  is_urgent: boolean;
  created_at: string;
  type: string;
  created_by: number | null;
  file_url?: string | null;
};

export type DocumentLogRecord = {
  log_id: number;
  date_received: string | null;
  date_released: string | null;
  remarks: string | null;
  document_id: number;
  from_department_id: number | null;
  to_department_id: number | null;
  received_by: number | null;
  released_by: number | null;
};

export type DocumentStatusHistoryRecord = {
  status_id: number;
  status: string;
  updated_at: string;
  document_id: number;
};

export type DepartmentRecord = {
  department_id: number;
  department_name: string;
  description?: string | null;
};

export type UserRecord = {
  user_id: number;
  name: string;
  email?: string;
  department_id?: number | null;
};

export type CreateDocumentInput = {
  title: string;
  type: string;
  status?: string;
  is_urgent?: boolean;
  created_by?: number | null;
  file_url?: string | null;
  initial_department_id?: number | null;
  initial_remarks?: string | null;
  received_by?: number | null;
  created_at?: string;
};

export type UpdateDocumentInput = Partial<
  Pick<
    DocumentRecord,
    "title" | "type" | "status" | "is_urgent" | "created_by" | "file_url"
  >
>;

export type CreateLogInput = {
  from_department_id?: number | null;
  to_department_id?: number | null;
  received_by?: number | null;
  released_by?: number | null;
  date_received?: string | null;
  date_released?: string | null;
  remarks?: string | null;
  status?: string;
};

export type UpdateLogInput = Partial<CreateLogInput>;

export type CreateStatusInput = {
  status: string;
  updated_at?: string;
};

export type UpdateStatusInput = Partial<CreateStatusInput>;

export type ChainOfCustodyStep = DocumentLogRecord & {
  from_department_name: string | null;
  to_department_name: string | null;
  received_by_name: string | null;
  released_by_name: string | null;
};

export type ChainOfCustodyResponse = {
  document: DocumentRecord;
  current_department_id: number | null;
  current_department_name: string | null;
  latest_status: string;
  status_history: DocumentStatusHistoryRecord[];
  logs: ChainOfCustodyStep[];
};

export type RoleRecord = {
  role_id: number;
  role_name: string;
  description?: string | null;
};

export type AdminUserRecord = {
  user_id: number;
  name: string;
  email: string;
  password: string;
  status: boolean;
  role_id: number;
  department_id: number;
  Departments?: { department_name: string } | null;
  Roles?: { role_name: string } | null;
};

export type CreateAdminUserInput = {
  name: string;
  email: string;
  password: string;
  status?: boolean;
  role_id: number;
  department_id: number;
};

export type UpdateAdminUserInput = Partial<CreateAdminUserInput>;

export type CreateDepartmentInput = {
  department_name: string;
  description?: string | null;
};

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

export type OverdueCheckResult = {
  checked_at: string;
  updated_count: number;
  document_ids: number[];
};
