"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  ShieldCheck,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const tabs = [
  { id: "users", label: "Users", icon: Users },
  { id: "departments", label: "Departments", icon: Building2 },
];

const AVATAR_COLORS = ["#3338A0", "#0891B2", "#7C3AED", "#059669", "#D97706", "#DC2626"];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function getColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

type UserRow = {
  user_id: number;
  name: string;
  email: string;
  status: boolean;
  role_id: number;
  department_id: number;
  Departments?: { department_name: string };
  Roles?: { role_name: string };
};

type DeptRow = {
  department_id: number;
  department_name: string;
  description: string;
  member_count?: number;
};

type RoleRow = { role_id: number; role_name: string };

// ─── Shared field ─────────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium" style={{ color: "#374151" }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-200";
const inputStyle = { borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", color: "#111827" };

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
      style={{ backgroundColor: checked ? "#3338A0" : "#D1D5DB" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>{title}</h2>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 transition-colors hover:bg-gray-100" style={{ color: "#9CA3AF" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Add Department Modal ─────────────────────────────────────────────────────
function AddDepartmentModal({ onClose, onAdded }: {
  onClose: () => void;
  onAdded: (dept: DeptRow & { member_count: number }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { data, error: err } = await supabase
      .from("Departments").insert({ department_name: name, description }).select("*").single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded({ ...data, member_count: 0 });
    onClose();
  }

  return (
    <Modal title="Add New Department" subtitle="Fill in the details to create a department." onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Field label="Department Name" required>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Finance Division" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Description">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description…" className={`${inputCls} resize-none`} style={inputStyle} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#3338A0", color: "#fff" }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
            {saving ? "Saving…" : "Add Department"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────
function AddUserModal({ roles, departments, onClose, onAdded }: {
  roles: RoleRow[]; departments: DeptRow[];
  onClose: () => void; onAdded: (user: UserRow) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(roles[0]?.role_id ?? 1);
  const [deptId, setDeptId] = useState<number>(departments[0]?.department_id ?? 1);
  const [status, setStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { data, error: err } = await supabase
      .from("Users").insert({ name, email, password, role_id: roleId, department_id: deptId, status })
      .select("*, Departments(department_name), Roles(role_name)").single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded(data as UserRow);
    onClose();
  }

  return (
    <Modal title="Add New User" subtitle="Fill in the details to create a user account." onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Field label="Full Name" required>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maria Santos" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Email" required>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. maria@dpwh.gov.ph" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Password" required>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a password" className={inputCls} style={inputStyle} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role" required>
            <select required value={roleId} onChange={(e) => setRoleId(Number(e.target.value))} className={inputCls} style={inputStyle}>
              {roles.map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
            </select>
          </Field>
          <Field label="Department" required>
            <select required value={deptId} onChange={(e) => setDeptId(Number(e.target.value))} className={inputCls} style={inputStyle}>
              {departments.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
          <div>
            <p className="text-xs font-medium" style={{ color: "#374151" }}>Account Status</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>{status ? "User can log in" : "User cannot log in"}</p>
          </div>
          <Toggle checked={status} onChange={() => setStatus((s) => !s)} />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#3338A0", color: "#fff" }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {saving ? "Saving…" : "Add User"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, roles, departments, onClose, onUpdated }: {
  user: UserRow; roles: RoleRow[]; departments: DeptRow[];
  onClose: () => void; onUpdated: (updated: UserRow) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(user.role_id);
  const [deptId, setDeptId] = useState<number>(user.department_id);
  const [status, setStatus] = useState(user.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const updates: Record<string, unknown> = { name, email, role_id: roleId, department_id: deptId, status };
    if (password) updates.password = password;

    const { data, error: err } = await supabase
      .from("Users").update(updates).eq("user_id", user.user_id)
      .select("*, Departments(department_name), Roles(role_name)").single();

    setSaving(false);
    if (err) { setError(err.message); return; }
    onUpdated(data as UserRow);
    onClose();
  }

  return (
    <Modal title="Edit User" subtitle={`Editing account for ${user.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Field label="Full Name" required>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Email" required>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={inputStyle} />
        </Field>
        <Field label="New Password">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" className={inputCls} style={inputStyle} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role" required>
            <select required value={roleId} onChange={(e) => setRoleId(Number(e.target.value))} className={inputCls} style={inputStyle}>
              {roles.map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
            </select>
          </Field>
          <Field label="Department" required>
            <select required value={deptId} onChange={(e) => setDeptId(Number(e.target.value))} className={inputCls} style={inputStyle}>
              {departments.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
          <div>
            <p className="text-xs font-medium" style={{ color: "#374151" }}>Account Status</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>{status ? "User can log in" : "User cannot log in"}</p>
          </div>
          <Toggle checked={status} onChange={() => setStatus((s) => !s)} />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#3338A0", color: "#fff" }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Edit Department Modal ────────────────────────────────────────────────────
function EditDepartmentModal({ dept, onClose, onUpdated }: {
  dept: DeptRow; onClose: () => void; onUpdated: (updated: DeptRow) => void;
}) {
  const [name, setName] = useState(dept.department_name);
  const [description, setDescription] = useState(dept.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { data, error: err } = await supabase
      .from("Departments")
      .update({ department_name: name, description })
      .eq("department_id", dept.department_id)
      .select("*")
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onUpdated(data as DeptRow);
    onClose();
  }

  return (
    <Modal title="Edit Department" subtitle={`Editing ${dept.department_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Field label="Department Name" required>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Description">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#3338A0", color: "#fff" }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({ name, onClose, onConfirm, deleting }: {
  name: string; onClose: () => void; onConfirm: () => void; deleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-xl shadow-2xl" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: "#FEF2F2" }}>
            <AlertTriangle className="h-6 w-6" style={{ color: "#DC2626" }} />
          </div>
          <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>Remove User</h2>
          <p className="mt-1.5 text-sm" style={{ color: "#6B7280" }}>
            Are you sure you want to remove <span className="font-semibold" style={{ color: "#111827" }}>{name}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#DC2626", color: "#fff" }}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<(DeptRow & { member_count: number })[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddDept, setShowAddDept] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingDept, setEditingDept] = useState<DeptRow | null>(null);
  const [deletingDept, setDeletingDept] = useState<DeptRow | null>(null);
  const [deleteDeptLoading, setDeleteDeptLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from("Users").select("*, Departments(department_name), Roles(role_name)");
      if (error) console.error(error.message);
      else setUsers(data ?? []);
      setLoadingUsers(false);
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchRoles() {
      const { data } = await supabase.from("Roles").select("role_id, role_name");
      setRoles(data ?? []);
    }
    fetchRoles();
  }, []);

  useEffect(() => {
    async function fetchDepartments() {
      const { data, error } = await supabase.from("Departments").select("*");
      if (error) { setLoadingDepts(false); return; }
      const { data: userCounts } = await supabase.from("Users").select("department_id");
      const countMap: Record<number, number> = {};
      (userCounts ?? []).forEach((u) => { countMap[u.department_id] = (countMap[u.department_id] ?? 0) + 1; });
      setDepartments((data ?? []).map((dept) => ({ ...dept, member_count: countMap[dept.department_id] ?? 0 })));
      setLoadingDepts(false);
    }
    fetchDepartments();
  }, []);

  async function handleDeleteUser() {
    if (!deletingUser) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("Users").delete().eq("user_id", deletingUser.user_id);
    setDeleteLoading(false);
    if (error) { alert(error.message); return; }
    setUsers((prev) => prev.filter((u) => u.user_id !== deletingUser.user_id));
    setDeletingUser(null);
  }

  async function handleDeleteDept() {
    if (!deletingDept) return;
    setDeleteDeptLoading(true);
    const { error } = await supabase.from("Departments").delete().eq("department_id", deletingDept.department_id);
    setDeleteDeptLoading(false);
    if (error) { alert(error.message); return; }
    setDepartments((prev) => prev.filter((d) => d.department_id !== deletingDept.department_id));
    setDeletingDept(null);
  }

  return (
    <main className="min-h-screen p-6 sm:p-8" style={{ backgroundColor: "#F7F7F7" }}>

      {showAddUser && (
        <AddUserModal roles={roles} departments={departments} onClose={() => setShowAddUser(false)}
          onAdded={(u) => setUsers((prev) => [u, ...prev])} />
      )}

      {showAddDept && (
        <AddDepartmentModal onClose={() => setShowAddDept(false)}
          onAdded={(d) => setDepartments((prev) => [d, ...prev])} />
      )}

      {editingUser && (
        <EditUserModal user={editingUser} roles={roles} departments={departments}
          onClose={() => setEditingUser(null)}
          onUpdated={(updated) => {
            setUsers((prev) => prev.map((u) => u.user_id === updated.user_id ? updated : u));
            setEditingUser(null);
          }} />
      )}

      {deletingUser && (
        <DeleteConfirmModal name={deletingUser.name} deleting={deleteLoading}
          onClose={() => setDeletingUser(null)} onConfirm={handleDeleteUser} />
      )}

      {editingDept && (
        <EditDepartmentModal dept={editingDept}
          onClose={() => setEditingDept(null)}
          onUpdated={(updated) => {
            setDepartments((prev) => prev.map((d) =>
              d.department_id === updated.department_id
                ? { ...updated, member_count: d.member_count ?? 0 }
                : d
            ));
            setEditingDept(null);
          }} />
      )}

      {deletingDept && (
        <DeleteConfirmModal name={deletingDept.department_name} deleting={deleteDeptLoading}
          onClose={() => setDeletingDept(null)} onConfirm={handleDeleteDept} />
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1E1E2E" }}>User Management</h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>Manage users, departments, and access roles</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-0 border-b" style={{ borderColor: "#E5E7EB" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-200 relative"
            style={{ color: activeTab === id ? "#3338A0" : "#9CA3AF", borderBottom: activeTab === id ? "2px solid #3338A0" : "2px solid transparent", marginBottom: "-1px", background: "transparent" }}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="rounded-xl overflow-visible" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>Users</h2>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{loadingUsers ? "Loading…" : `${users.length} registered users`}</p>
            </div>
            <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-90" style={{ backgroundColor: "#3338A0", color: "#fff" }}>
              <ShieldCheck className="h-3.5 w-3.5" />Add User
            </button>
          </div>

          <div className="grid gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ gridTemplateColumns: "2fr 2fr 2fr 1fr auto", backgroundColor: "#F9FAFB", color: "#9CA3AF", borderBottom: "1px solid #F3F4F6" }}>
            <span>Name</span><span>Department</span><span>Role</span>
            <span className="text-center">Status</span><span className="text-right">Actions</span>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3338A0" }} /></div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: "#9CA3AF" }}>No users found.</div>
          ) : (
            users.map((user, i) => (
              <div key={user.user_id} className="grid gap-4 items-center px-5 py-4 transition-colors hover:bg-gray-50"
                style={{ gridTemplateColumns: "2fr 2fr 2fr 1fr auto", borderBottom: i < users.length - 1 ? "1px solid #F3F4F6" : "none" }}>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: getColor(user.user_id) }}>
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>{user.name}</p>
                    <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{user.email}</p>
                  </div>
                </div>

                <span className="text-sm truncate" style={{ color: "#6B7280" }}>{user.Departments?.department_name ?? "—"}</span>
                <span className="text-sm truncate" style={{ color: "#6B7280" }}>{user.Roles?.role_name ?? "—"}</span>

                <div className="flex justify-center">
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: user.status ? "#F0FDF4" : "#F3F4F6", color: user.status ? "#16A34A" : "#9CA3AF" }}>
                    {user.status ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="relative flex justify-end">
                  <button onClick={() => setOpenMenu(openMenu === user.user_id ? null : user.user_id)}
                    className="rounded-md p-1.5 transition-colors hover:bg-gray-100" style={{ color: "#9CA3AF" }}>
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === user.user_id && (
                    <div className="absolute right-0 top-8 z-50 w-36 rounded-lg py-1 shadow-lg" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50"
                        style={{ color: "#374151" }}
                        onClick={() => { setEditingUser(user); setOpenMenu(null); }}
                      >
                        <Pencil className="h-3.5 w-3.5" style={{ color: "#3338A0" }} />Edit User
                      </button>
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50"
                        style={{ color: "#DC2626" }}
                        onClick={() => { setDeletingUser(user); setOpenMenu(null); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />Remove User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === "departments" && (
        <div className="rounded-xl overflow-visible" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>Departments</h2>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{loadingDepts ? "Loading…" : `${departments.length} divisions`}</p>
            </div>
            <button onClick={() => setShowAddDept(true)} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-90" style={{ backgroundColor: "#3338A0", color: "#fff" }}>
              <Building2 className="h-3.5 w-3.5" />Add Department
            </button>
          </div>

          <div className="grid gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ gridTemplateColumns: "2fr 3fr auto auto", backgroundColor: "#F9FAFB", color: "#9CA3AF", borderBottom: "1px solid #F3F4F6" }}>
            <span>Department</span><span>Description</span>
            <span className="text-right">Members</span><span className="text-right">Actions</span>
          </div>

          {loadingDepts ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3338A0" }} /></div>
          ) : departments.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: "#9CA3AF" }}>No departments found.</div>
          ) : (
            departments.map((dept, i) => (
              <div key={dept.department_id} className="grid gap-4 items-center px-5 py-4 transition-colors hover:bg-gray-50"
                style={{ gridTemplateColumns: "2fr 3fr auto auto", borderBottom: i < departments.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: getColor(dept.department_id) }}>
                    {getInitials(dept.department_name)}
                  </div>
                  <span className="text-sm font-medium truncate" style={{ color: "#111827" }}>{dept.department_name}</span>
                </div>
                <span className="text-sm truncate" style={{ color: "#6B7280" }}>{dept.description ?? "—"}</span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: "#EEF0FB", color: "#3338A0" }}>
                  {dept.member_count} members
                </span>
                <div className="relative flex justify-end">
                  <button onClick={() => setOpenMenu(openMenu === dept.department_id + 1000 ? null : dept.department_id + 1000)}
                    className="rounded-md p-1.5 transition-colors hover:bg-gray-100" style={{ color: "#9CA3AF" }}>
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === dept.department_id + 1000 && (
                    <div className="absolute right-0 top-8 z-20 w-40 rounded-lg py-1 shadow-lg" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-gray-50" style={{ color: "#374151" }}
                        onClick={() => { setEditingDept(dept); setOpenMenu(null); }}>
                        <Pencil className="h-3.5 w-3.5" style={{ color: "#3338A0" }} />Edit Department
                      </button>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-gray-50" style={{ color: "#DC2626" }}
                        onClick={() => { setDeletingDept(dept); setOpenMenu(null); }}>
                        <Trash2 className="h-3.5 w-3.5" />Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
