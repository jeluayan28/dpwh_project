import { createServerSupabaseClient } from "@/lib/supabase-server";
import type {
  AdminUserRecord,
  CreateAdminUserInput,
  CreateDepartmentInput,
  DepartmentRecord,
  RoleRecord,
  UpdateAdminUserInput,
  UpdateDepartmentInput,
} from "@/types";

const USERS_TABLE = "Users";
const ROLES_TABLE = "Roles";
const DEPARTMENTS_TABLE = "Departments";

class AdminServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AdminServiceError";
    this.status = status;
  }
}

function assertNonEmptyString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AdminServiceError(`${field} is required.`);
  }
}

function parsePositiveInteger(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AdminServiceError(`${field} must be a valid positive number.`);
  }
  return parsed;
}

function validateEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new AdminServiceError("email must be a valid email address.");
  }
  return normalizedEmail;
}

async function getUserOrThrow(userId: number) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("*, Departments(department_name), Roles(role_name)")
    .eq("user_id", userId)
    .maybeSingle<AdminUserRecord>();

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  if (!data) {
    throw new AdminServiceError("User not found.", 404);
  }

  return data;
}

async function getDepartmentOrThrow(departmentId: number) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(DEPARTMENTS_TABLE)
    .select("*")
    .eq("department_id", departmentId)
    .maybeSingle<DepartmentRecord>();

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  if (!data) {
    throw new AdminServiceError("Department not found.", 404);
  }

  return data;
}

async function ensureRoleExists(roleId: number) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(ROLES_TABLE)
    .select("role_id")
    .eq("role_id", roleId)
    .maybeSingle();

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  if (!data) {
    throw new AdminServiceError("Role not found.", 404);
  }
}

async function ensureUniqueEmail(email: string, excludeUserId?: number) {
  const supabase = createServerSupabaseClient();
  let query = supabase.from(USERS_TABLE).select("user_id").eq("email", email);
  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }
  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  if (data) {
    throw new AdminServiceError("Email is already in use.");
  }
}

async function ensureSingleActiveUserPerDepartment(
  departmentId: number,
  status: boolean,
  excludeUserId?: number,
) {
  if (!status) return;

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from(USERS_TABLE)
    .select("user_id, name")
    .eq("department_id", departmentId)
    .eq("status", true);

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  if (data) {
    throw new AdminServiceError(
      `Department already has an active user (${data.name ?? "existing user"}).`,
      409,
    );
  }
}

export function toAdminApiError(error: unknown) {
  if (error instanceof AdminServiceError) {
    return {
      message: error.message,
      status: error.status,
    };
  }

  if (error instanceof Error && /^Invalid .+ id\.$/.test(error.message)) {
    return {
      message: error.message,
      status: 400,
    };
  }

  return {
    message: "Unexpected server error.",
    status: 500,
  };
}

export async function listAdminUsers() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("*, Departments(department_name), Roles(role_name)")
    .order("user_id", { ascending: false });

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  return (data ?? []) as AdminUserRecord[];
}

export async function createAdminUser(input: CreateAdminUserInput) {
  assertNonEmptyString(input.name, "name");
  assertNonEmptyString(input.password, "password");
  const email = validateEmail(input.email);
  const roleId = parsePositiveInteger(input.role_id, "role_id");
  const departmentId = parsePositiveInteger(
    input.department_id,
    "department_id",
  );
  const status = Boolean(input.status);

  await ensureRoleExists(roleId);
  await getDepartmentOrThrow(departmentId);
  await ensureUniqueEmail(email);
  await ensureSingleActiveUserPerDepartment(departmentId, status);

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .insert({
      name: input.name.trim(),
      email,
      password: input.password,
      status,
      role_id: roleId,
      department_id: departmentId,
    })
    .select("*, Departments(department_name), Roles(role_name)")
    .single<AdminUserRecord>();

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  return data;
}

export async function updateAdminUser(
  userId: number,
  input: UpdateAdminUserInput,
) {
  const existingUser = await getUserOrThrow(userId);
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    assertNonEmptyString(input.name, "name");
    updates.name = input.name.trim();
  }

  if (input.email !== undefined) {
    const email = validateEmail(input.email);
    await ensureUniqueEmail(email, userId);
    updates.email = email;
  }

  if (input.password !== undefined) {
    assertNonEmptyString(input.password, "password");
    updates.password = input.password;
  }

  const roleId =
    input.role_id !== undefined
      ? parsePositiveInteger(input.role_id, "role_id")
      : existingUser.role_id;
  if (input.role_id !== undefined) {
    await ensureRoleExists(roleId);
    updates.role_id = roleId;
  }

  const departmentId =
    input.department_id !== undefined
      ? parsePositiveInteger(input.department_id, "department_id")
      : existingUser.department_id;
  if (input.department_id !== undefined) {
    await getDepartmentOrThrow(departmentId);
    updates.department_id = departmentId;
  }

  const status =
    input.status !== undefined ? Boolean(input.status) : existingUser.status;
  if (input.status !== undefined) {
    updates.status = status;
  }

  await ensureSingleActiveUserPerDepartment(departmentId, status, userId);

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update(updates)
    .eq("user_id", userId)
    .select("*, Departments(department_name), Roles(role_name)")
    .single<AdminUserRecord>();

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  return data;
}

export async function deleteAdminUser(userId: number) {
  await getUserOrThrow(userId);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from(USERS_TABLE).delete().eq("user_id", userId);

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  return { success: true };
}

export async function listRoles() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(ROLES_TABLE)
    .select("*")
    .order("role_name", { ascending: true });

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  return (data ?? []) as RoleRecord[];
}

export async function listDepartments() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(DEPARTMENTS_TABLE)
    .select("*")
    .order("department_name", { ascending: true });

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  return (data ?? []) as DepartmentRecord[];
}

export async function createDepartment(input: CreateDepartmentInput) {
  assertNonEmptyString(input.department_name, "department_name");
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from(DEPARTMENTS_TABLE)
    .insert({
      department_name: input.department_name.trim(),
      description: input.description?.trim() || null,
    })
    .select("*")
    .single<DepartmentRecord>();

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  return data;
}

export async function updateDepartment(
  departmentId: number,
  input: UpdateDepartmentInput,
) {
  await getDepartmentOrThrow(departmentId);
  const updates: Record<string, unknown> = {};

  if (input.department_name !== undefined) {
    assertNonEmptyString(input.department_name, "department_name");
    updates.department_name = input.department_name.trim();
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(DEPARTMENTS_TABLE)
    .update(updates)
    .eq("department_id", departmentId)
    .select("*")
    .single<DepartmentRecord>();

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  return data;
}

export async function deleteDepartment(departmentId: number) {
  await getDepartmentOrThrow(departmentId);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from(DEPARTMENTS_TABLE)
    .delete()
    .eq("department_id", departmentId);

  if (error) {
    throw new AdminServiceError(error.message, 500);
  }

  return { success: true };
}
