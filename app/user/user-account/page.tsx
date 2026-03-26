"use client";

import { useState } from "react";
import { User, KeyRound, Palette, Bell, Monitor, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const navItems = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "account",       label: "Account",       icon: KeyRound },
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "display",       label: "Display",       icon: Monitor },
];

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      <h2 className="text-lg font-semibold" style={{ color: "#1E1E2E" }}>{title}</h2>
      <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>{description}</p>
    </div>
  );
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_2fr] gap-6 items-start py-4 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium" style={{ color: "#374151" }}>{label}</p>
        {description && <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
      style={{ backgroundColor: checked ? "#3338A0" : "#D1D5DB" }}
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

function RadioCard({ label, description, selected, onClick }: { label: string; description: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg border p-4 text-left transition-all duration-150 w-full"
      style={{ borderColor: selected ? "#3338A0" : "#E5E7EB", backgroundColor: selected ? "#EEF0FB" : "#fff" }}
    >
      <div
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{ borderColor: selected ? "#3338A0" : "#D1D5DB", backgroundColor: selected ? "#3338A0" : "transparent" }}
      >
        {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "#111827" }}>{label}</p>
        <p className="mt-0.5 text-xs" style={{ color: "#6B7280" }}>{description}</p>
      </div>
    </button>
  );
}

function ProfilePanel() {
  return (
    <div>
      <SectionHeader title="Profile" description="This is how others will see you on the site." />
      <div className="mb-6 flex items-center gap-5">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: "#3338A0" }}>
            MS
          </div>
          <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white" style={{ backgroundColor: "#FCC61D" }}>
            <Camera className="h-3 w-3 text-black" />
          </button>
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "#111827" }}>Profile Photo</p>
          <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>JPG, GIF or PNG. Max size 2MB.</p>
          <button className="mt-1.5 text-xs font-medium" style={{ color: "#3338A0" }}>Upload new photo</button>
        </div>
      </div>
      <FieldRow label="Full Name" description="Your display name visible to others.">
        <Input defaultValue="Maria Santos" />
      </FieldRow>
      <FieldRow label="Username" description="Your unique username.">
        <Input defaultValue="m.santos" />
      </FieldRow>
      <FieldRow label="Bio" description="A brief description about yourself.">
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          defaultValue="Accounting Clerk II, Finance Division — DPWH Regional Office XIII"
        />
      </FieldRow>
      <FieldRow label="URLs" description="Add links to your website or social profiles.">
        <div className="space-y-2">
          <Input placeholder="https://example.com" />
          <button className="text-xs font-medium" style={{ color: "#3338A0" }}>+ Add another URL</button>
        </div>
      </FieldRow>
      <div className="mt-6 flex justify-end">
        <Button style={{ backgroundColor: "#3338A0", color: "#fff" }}>Update profile</Button>
      </div>
    </div>
  );
}

function AccountPanel() {
  return (
    <div>
      <SectionHeader title="Account" description="Update your account settings and change your password." />
      <FieldRow label="Email Address" description="Your login email.">
        <Input type="email" defaultValue="user@dpwh.gov.ph" />
      </FieldRow>
      <FieldRow label="Current Password" description="Enter your current password to make changes.">
        <Input type="password" placeholder="••••••••" />
      </FieldRow>
      <FieldRow label="New Password" description="At least 8 characters.">
        <Input type="password" placeholder="••••••••" />
      </FieldRow>
      <FieldRow label="Confirm Password" description="Re-enter your new password.">
        <Input type="password" placeholder="••••••••" />
      </FieldRow>
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-700">Danger Zone</p>
        <p className="mt-1 text-xs text-red-500">Once you delete your account, there is no going back.</p>
        <button className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100">
          Delete Account
        </button>
      </div>
      <div className="mt-6 flex justify-end">
        <Button style={{ backgroundColor: "#3338A0", color: "#fff" }}>Save changes</Button>
      </div>
    </div>
  );
}

function AppearancePanel() {
  const [theme, setTheme] = useState("light");
  const [font, setFont] = useState("system");
  return (
    <div>
      <SectionHeader title="Appearance" description="Customize the look and feel of your interface." />
      <FieldRow label="Theme" description="Select the interface theme.">
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "light",  label: "Light",  desc: "Clean white interface" },
            { id: "dark",   label: "Dark",   desc: "Easy on the eyes" },
            { id: "system", label: "System", desc: "Follows OS setting" },
          ].map((t) => (
            <RadioCard key={t.id} label={t.label} description={t.desc} selected={theme === t.id} onClick={() => setTheme(t.id)} />
          ))}
        </div>
      </FieldRow>
      <FieldRow label="Font Size" description="Choose your preferred reading size.">
        <div className="space-y-2">
          {[
            { id: "system",      label: "Default (System)", desc: "Inherits from browser" },
            { id: "compact",     label: "Compact",          desc: "Smaller, denser layout" },
            { id: "comfortable", label: "Comfortable",      desc: "More breathing room" },
          ].map((f) => (
            <RadioCard key={f.id} label={f.label} description={f.desc} selected={font === f.id} onClick={() => setFont(f.id)} />
          ))}
        </div>
      </FieldRow>
      <div className="mt-6 flex justify-end">
        <Button style={{ backgroundColor: "#3338A0", color: "#fff" }}>Apply appearance</Button>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const [s, setS] = useState({ email_docs: true, email_overdue: true, email_digest: false, push_docs: true, push_alerts: true, push_mentions: false });
  const toggle = (key: keyof typeof s) => setS((prev) => ({ ...prev, [key]: !prev[key] }));
  return (
    <div>
      <SectionHeader title="Notifications" description="Configure how you receive notifications." />
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Email Notifications</p>
      <FieldRow label="Document Updates" description="Notify when a document status changes.">
        <Toggle checked={s.email_docs} onChange={() => toggle("email_docs")} />
      </FieldRow>
      <FieldRow label="Overdue Alerts" description="Send email when documents are overdue.">
        <Toggle checked={s.email_overdue} onChange={() => toggle("email_overdue")} />
      </FieldRow>
      <FieldRow label="Weekly Digest" description="A summary of activity every Monday.">
        <Toggle checked={s.email_digest} onChange={() => toggle("email_digest")} />
      </FieldRow>
      <p className="text-xs font-semibold uppercase tracking-wider mt-6 mb-1" style={{ color: "#9CA3AF" }}>Push Notifications</p>
      <FieldRow label="Document Activity" description="In-app alerts for document changes.">
        <Toggle checked={s.push_docs} onChange={() => toggle("push_docs")} />
      </FieldRow>
      <FieldRow label="Urgent Alerts" description="Immediate push for flagged documents.">
        <Toggle checked={s.push_alerts} onChange={() => toggle("push_alerts")} />
      </FieldRow>
      <FieldRow label="Mentions" description="Notify when someone mentions you.">
        <Toggle checked={s.push_mentions} onChange={() => toggle("push_mentions")} />
      </FieldRow>
      <div className="mt-6 flex justify-end">
        <Button style={{ backgroundColor: "#3338A0", color: "#fff" }}>Save preferences</Button>
      </div>
    </div>
  );
}

function DisplayPanel() {
  const [density, setDensity] = useState("default");
  const [columns, setColumns] = useState(["id", "title", "division", "date", "status"]);
  const allColumns = [
    { id: "id",       label: "Document ID" },
    { id: "title",    label: "Title" },
    { id: "division", label: "Division" },
    { id: "date",     label: "Date" },
    { id: "status",   label: "Status" },
    { id: "remarks",  label: "Remarks" },
  ];
  const toggleCol = (id: string) => setColumns((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);
  return (
    <div>
      <SectionHeader title="Display" description="Customize what and how content is displayed in tables and lists." />
      <FieldRow label="Table Density" description="Controls row spacing in document tables.">
        <div className="space-y-2">
          {[
            { id: "compact",     label: "Compact",     desc: "Tight rows, more data visible" },
            { id: "default",     label: "Default",     desc: "Balanced spacing" },
            { id: "comfortable", label: "Comfortable", desc: "Relaxed, easy to scan" },
          ].map((d) => (
            <RadioCard key={d.id} label={d.label} description={d.desc} selected={density === d.id} onClick={() => setDensity(d.id)} />
          ))}
        </div>
      </FieldRow>
      <FieldRow label="Visible Columns" description="Choose which columns appear in document tables.">
        <div className="grid grid-cols-2 gap-2">
          {allColumns.map(({ id, label }) => {
            const active = columns.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleCol(id)}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all"
                style={{ borderColor: active ? "#3338A0" : "#E5E7EB", backgroundColor: active ? "#EEF0FB" : "#fff", color: active ? "#3338A0" : "#6B7280" }}
              >
                <div
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                  style={{ backgroundColor: active ? "#3338A0" : "#F3F4F6", borderColor: active ? "#3338A0" : "#D1D5DB" }}
                >
                  {active && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                {label}
              </button>
            );
          })}
        </div>
      </FieldRow>
      <div className="mt-6 flex justify-end">
        <Button style={{ backgroundColor: "#3338A0", color: "#fff" }}>Save display settings</Button>
      </div>
    </div>
  );
}

const panels: Record<string, React.ReactNode> = {
  profile:       <ProfilePanel />,
  account:       <AccountPanel />,
  appearance:    <AppearancePanel />,
  notifications: <NotificationsPanel />,
  display:       <DisplayPanel />,
};

export default function UserAccountPage() {
  const [active, setActive] = useState("profile");
  return (
    <main className="min-h-screen p-6 sm:p-8" style={{ backgroundColor: "#F7F7F7" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1E1E2E" }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          Manage your account settings and set e-mail preferences.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left Nav */}
        <nav
          className="w-48 shrink-0 rounded-xl overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
        >
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors text-left border-b last:border-0"
              style={{
                borderColor: "#F3F4F6",
                backgroundColor: active === id ? "#EEF0FB" : "transparent",
                color: active === id ? "#3338A0" : "#6B7280",
                borderLeft: active === id ? "3px solid #3338A0" : "3px solid transparent",
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <Card className="flex-1 min-w-0">
          <CardContent className="pt-6">
            {panels[active]}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
