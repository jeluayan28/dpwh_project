"use client";

import { useState, useRef, useEffect } from "react";
import {
  User, KeyRound, Palette, Bell, Camera, Check,
  Sun, Moon, Mail, Smartphone, Lock, Trash2,
  Globe, Save, Plus, Loader2, X,
} from "lucide-react";
import { useSession } from "@/lib/useSession";
import { useTheme, type Theme } from "@/lib/useTheme";

/* ─── Design tokens — use CSS vars so dark mode works automatically ─── */
const C = {
  primary:   "var(--dp-primary)",
  primaryLt: "var(--dp-primary-lt)",
  primaryBg: "var(--dp-primary-bg)",
  primaryBd: "var(--dp-primary-bd)",
  accent:    "#FCC61D",
  white:     "var(--dp-card-bg)",
  bg:        "var(--dp-page-bg)",
  border:    "var(--dp-card-border)",
  borderLt:  "var(--dp-divider)",
  text1:     "var(--dp-text-1)",
  text2:     "var(--dp-text-2)",
  text3:     "var(--dp-text-3)",
  text4:     "var(--dp-text-4)",
  dangerBg:  "rgba(220,38,38,0.08)",
  dangerBd:  "rgba(220,38,38,0.25)",
  dangerTxt: "#f87171",
  dangerBtn: "#DC2626",
};

/* ─── Shared input style (same as roles / payroll pages) ─── */
const inputCls = "w-full rounded-xl border px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-blue-200";
const inputStyle: React.CSSProperties = { borderColor: "var(--dp-input-border)", backgroundColor: "var(--dp-input-bg)", color: "var(--dp-input-text)" };

/* ─── Nav tabs — same shape as Users / Departments tab bar ─── */
const tabs = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "account",       label: "Account",       icon: KeyRound },
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
];

/* ─── Reusable sub-components ─── */

function SectionTitle({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: C.primaryBg, color: C.primary }}>
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.text4 }}>{label}</p>
    </div>
  );
}

function FieldGroup({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div
      className="grid items-start py-4 border-b last:border-0"
      style={{ gridTemplateColumns: "180px 1fr", gap: "1.5rem", borderColor: C.borderLt }}
    >
      <div className="pt-0.5">
        <p className="text-sm font-medium" style={{ color: C.text2 }}>{label}</p>
        {description && <p className="mt-0.5 text-xs leading-relaxed" style={{ color: C.text4 }}>{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
      style={{ backgroundColor: checked ? C.primary : "#D1D5DB" }}
      role="switch"
      aria-checked={checked}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function RadioCard({ label, description, selected, onClick }: {
  label: string; description: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 w-full hover:bg-slate-50/80"
      style={{
        borderColor: selected ? C.primary : C.border,
        backgroundColor: selected ? C.primaryBg : C.white,
        boxShadow: selected ? "0 2px 8px rgba(51,56,160,0.14)" : "none",
      }}
    >
      <div
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{ borderColor: selected ? C.primary : "#D1D5DB", backgroundColor: selected ? C.primary : "transparent" }}
      >
        {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: C.text1 }}>{label}</p>
        <p className="mt-0.5 text-xs" style={{ color: C.text3 }}>{description}</p>
      </div>
    </button>
  );
}

function SaveButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90 hover:-translate-y-px"
      style={{ backgroundColor: C.primary, color: C.white, boxShadow: "0 4px 14px rgba(51,56,160,0.28)" }}
    >
      {icon}{label}
    </button>
  );
}

/* ─── Profile tab ─── */
function ProfilePanel() {
  const { user } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageKey = user ? `dpwh_avatar_${user.user_id}` : null;
  const initials = user
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* load saved avatar on mount */
  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) setAvatarSrc(stored);
  }, [storageKey]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, GIF, etc.).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("File is too large. Max size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!preview || !storageKey) return;
    setSaving(true);
    /* simulate a brief async save so it feels real */
    setTimeout(() => {
      localStorage.setItem(storageKey, preview);
      setAvatarSrc(preview);
      setPreview(null);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 600);
  }

  function handleDiscard() {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const displaySrc = preview ?? avatarSrc;

  return (
    <div>
      <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: C.borderLt }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: C.text1 }}>Profile</h2>
          <p className="mt-0.5 text-xs" style={{ color: C.text4 }}>This is how others will see you on the site.</p>
        </div>
      </div>

      <div className="px-6 py-5">
        {/* Avatar row */}
        <div className="flex items-start gap-5 mb-6 pb-5 border-b" style={{ borderColor: C.borderLt }}>
          {/* Avatar circle */}
          <div className="relative shrink-0">
            {displaySrc ? (
              <img
                src={displaySrc}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover"
                style={{ border: `2px solid ${preview ? C.accent : C.primaryBd}` }}
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLt} 100%)` }}
              >
                {initials}
              </div>
            )}

            {/* Camera button triggers file picker */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow transition-transform hover:scale-110"
              style={{ backgroundColor: C.accent }}
              title="Change photo"
            >
              <Camera className="h-3 w-3 text-black" />
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Info + actions */}
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: C.text1 }}>Profile Photo</p>
            <p className="mt-0.5 text-xs" style={{ color: C.text4 }}>JPG, GIF or PNG. Max size 2MB.</p>

            {error && (
              <p className="mt-1.5 text-xs font-medium" style={{ color: C.dangerBtn }}>{error}</p>
            )}

            {/* Show save/discard only when a new photo is staged */}
            {preview ? (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: C.primary, color: C.white }}
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  {saving ? "Saving…" : "Save photo"}
                </button>
                <button
                  onClick={handleDiscard}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-100"
                  style={{ color: C.text3 }}
                >
                  <X className="h-3 w-3" /> Discard
                </button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: C.primary }}
                >
                  Upload new photo
                </button>
                {avatarSrc && (
                  <button
                    onClick={() => {
                      if (!storageKey) return;
                      localStorage.removeItem(storageKey);
                      setAvatarSrc(null);
                    }}
                    className="text-xs font-medium hover:underline"
                    style={{ color: C.text4 }}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}

            {saved && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium" style={{ color: "#15803D" }}>
                <Check className="h-3 w-3" /> Photo saved!
              </p>
            )}
          </div>
        </div>

        <FieldGroup label="Full Name" description="Your display name visible to others.">
          <input className={inputCls} style={inputStyle} defaultValue={user?.name ?? ""} />
        </FieldGroup>
        <FieldGroup label="Username" description="Your unique username.">
          <input className={inputCls} style={inputStyle} defaultValue={user?.email?.split("@")[0] ?? ""} />
        </FieldGroup>
        <FieldGroup label="Bio" description="A brief description about yourself.">
          <textarea
            className={`${inputCls} resize-none min-h-[80px]`}
            style={inputStyle}
            defaultValue="Accounting Clerk II, Finance Division — DPWH Regional Office XIII"
          />
        </FieldGroup>
        <FieldGroup label="URLs" description="Add links to your website or social profiles.">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: C.primaryBg }}>
                <Globe className="h-3.5 w-3.5" style={{ color: C.primary }} />
              </div>
              <input className={inputCls} style={inputStyle} placeholder="https://example.com" />
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: C.primary }}>
              <Plus className="h-3 w-3" /> Add another URL
            </button>
          </div>
        </FieldGroup>

        <div className="pt-5 flex justify-end">
          <SaveButton label="Update profile" icon={<Save className="h-3.5 w-3.5" />} />
        </div>
      </div>
    </div>
  );
}

/* ─── Account tab ─── */
function AccountPanel() {
  const { user } = useSession();

  return (
    <div>
      <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: C.borderLt }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: C.text1 }}>Account</h2>
          <p className="mt-0.5 text-xs" style={{ color: C.text4 }}>Update your account settings and change your password.</p>
        </div>
      </div>

      <div className="px-6 py-5">
        <FieldGroup label="Email Address" description="Your login email.">
          <input type="email" className={inputCls} style={inputStyle} value={user?.email ?? ""} readOnly />
        </FieldGroup>

        <div className="pt-2 pb-1">
          <SectionTitle label="Change Password" icon={<Lock className="h-3.5 w-3.5" />} />
        </div>
        <FieldGroup label="Current Password" description="Enter your current password.">
          <input type="password" className={inputCls} style={inputStyle} placeholder="••••••••" />
        </FieldGroup>
        <FieldGroup label="New Password" description="At least 8 characters.">
          <input type="password" className={inputCls} style={inputStyle} placeholder="••••••••" />
        </FieldGroup>
        <FieldGroup label="Confirm Password" description="Re-enter your new password.">
          <input type="password" className={inputCls} style={inputStyle} placeholder="••••••••" />
        </FieldGroup>

        {/* Danger Zone */}
        <div
          className="mt-6 rounded-xl border p-4"
          style={{ backgroundColor: C.dangerBg, borderColor: C.dangerBd }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="h-3.5 w-3.5" style={{ color: C.dangerBtn }} />
            <p className="text-sm font-semibold" style={{ color: C.dangerTxt }}>Danger Zone</p>
          </div>
          <p className="text-xs mb-3" style={{ color: "#EF4444" }}>Once you delete your account, there is no going back.</p>
          <button
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-100"
            style={{ borderColor: "#FECACA", color: C.dangerBtn }}
          >
            Delete Account
          </button>
        </div>

        <div className="pt-5 flex justify-end">
          <SaveButton label="Save changes" icon={<Save className="h-3.5 w-3.5" />} />
        </div>
      </div>
    </div>
  );
}

/* ─── Appearance tab ─── */
function AppearancePanel() {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState("system");

  const themes: { id: Theme; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: "light", label: "Light", desc: "Clean white interface", icon: <Sun className="h-4 w-4" /> },
    { id: "dark",  label: "Dark",  desc: "Easy on the eyes",      icon: <Moon className="h-4 w-4" /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: C.borderLt }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: C.text1 }}>Appearance</h2>
          <p className="mt-0.5 text-xs" style={{ color: C.text4 }}>Customize the look and feel of your interface.</p>
        </div>
      </div>

      <div className="px-6 py-5">
        <FieldGroup label="Theme" description="Changes apply instantly across all pages and persist on reload.">
          <div className="grid grid-cols-2 gap-2.5">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-150"
                style={{
                  borderColor: theme === t.id ? C.primary : C.border,
                  backgroundColor: theme === t.id ? C.primaryBg : C.white,
                  boxShadow: theme === t.id ? "0 2px 8px rgba(51,56,160,0.14)" : "none",
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: theme === t.id ? C.primary : C.borderLt,
                    color: theme === t.id ? C.white : C.text3,
                  }}
                >
                  {t.icon}
                </div>
                <p className="text-xs font-semibold" style={{ color: theme === t.id ? C.primary : C.text2 }}>{t.label}</p>
                <p className="text-xs leading-tight" style={{ color: C.text4 }}>{t.desc}</p>
                {theme === t.id && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: C.primary }}>
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Font Size" description="Choose your preferred reading size.">
          <div className="space-y-2">
            {[
              { id: "system",      label: "Default (System)", desc: "Inherits from browser" },
              { id: "compact",     label: "Compact",          desc: "Smaller, denser layout" },
              { id: "comfortable", label: "Comfortable",      desc: "More breathing room" },
            ].map((f) => (
              <RadioCard key={f.id} label={f.label} description={f.desc} selected={fontSize === f.id} onClick={() => setFontSize(f.id)} />
            ))}
          </div>
        </FieldGroup>

        <div className="pt-5 flex justify-end">
          <SaveButton label="Save font size" icon={<Check className="h-3.5 w-3.5" />} />
        </div>
      </div>
    </div>
  );
}

/* ─── Notifications tab ─── */
function NotificationsPanel() {
  const [s, setS] = useState({
    email_docs: true, email_overdue: true, email_digest: false,
    push_docs: true, push_alerts: true, push_mentions: false,
  });
  const toggle = (key: keyof typeof s) => setS((p) => ({ ...p, [key]: !p[key] }));

  const emailItems = [
    { key: "email_docs" as const,    label: "Document Updates", desc: "Notify when a document status changes." },
    { key: "email_overdue" as const, label: "Overdue Alerts",   desc: "Send email when documents are overdue." },
    { key: "email_digest" as const,  label: "Weekly Digest",    desc: "A summary of activity every Monday." },
  ];
  const pushItems = [
    { key: "push_docs" as const,     label: "Document Activity", desc: "In-app alerts for document changes." },
    { key: "push_alerts" as const,   label: "Urgent Alerts",     desc: "Immediate push for flagged documents." },
    { key: "push_mentions" as const, label: "Mentions",          desc: "Notify when someone mentions you." },
  ];

  return (
    <div>
      <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: C.borderLt }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: C.text1 }}>Notifications</h2>
          <p className="mt-0.5 text-xs" style={{ color: C.text4 }}>Configure how you receive notifications.</p>
        </div>
      </div>

      <div className="px-6 py-5">
        <SectionTitle label="Email Notifications" icon={<Mail className="h-3.5 w-3.5" />} />
        {emailItems.map(({ key, label, desc }) => (
          <FieldGroup key={key} label={label} description={desc}>
            <Toggle checked={s[key]} onChange={() => toggle(key)} />
          </FieldGroup>
        ))}

        <div className="mt-6">
          <SectionTitle label="Push Notifications" icon={<Smartphone className="h-3.5 w-3.5" />} />
        </div>
        {pushItems.map(({ key, label, desc }) => (
          <FieldGroup key={key} label={label} description={desc}>
            <Toggle checked={s[key]} onChange={() => toggle(key)} />
          </FieldGroup>
        ))}

        <div className="pt-5 flex justify-end">
          <SaveButton label="Save preferences" icon={<Save className="h-3.5 w-3.5" />} />
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function UserAccountPage() {
  const [active, setActive] = useState("profile");
  /* useSession here ensures the page re-renders once localStorage loads,
     so child panels (AccountPanel, ProfilePanel) get the real user data. */
  useSession();

  const panelContent: Record<string, React.ReactNode> = {
    profile:       <ProfilePanel />,
    account:       <AccountPanel />,
    appearance:    <AppearancePanel />,
    notifications: <NotificationsPanel />,
  };

  return (
    <main className="min-h-screen p-6 sm:p-8" style={{ backgroundColor: C.bg }}>

      {/* Page header — same as User Management */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: C.text1 }}>Settings</h1>
        <p className="mt-0.5 text-sm" style={{ color: C.text3 }}>Manage your account settings and set e-mail preferences.</p>
      </div>

      {/* Tab bar — exact same pattern as Users / Departments tabs */}
      <div className="mb-6 flex items-center gap-0 border-b" style={{ borderColor: C.border }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-200 relative"
            style={{
              color: active === id ? C.primary : C.text4,
              borderBottom: active === id ? `2px solid ${C.primary}` : "2px solid transparent",
              marginBottom: "-1px",
              background: "transparent",
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content card — same as Users / Departments card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}
      >
        {panelContent[active]}
      </div>

    </main>
  );
}
