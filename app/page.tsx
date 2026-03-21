export default function Home() {
  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col items-center justify-center py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Hello, Next.js
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Department of Public Works and Highways
        </p>
      </section>

      <section
        id="about"
        className="mx-auto max-w-3xl scroll-mt-20 border-t border-border py-16 sm:py-20"
      >
        <h2 className="text-2xl font-semibold tracking-tight">About</h2>
        <p className="mt-3 text-muted-foreground">
          D-Track supports DPWH operations and tracking. Replace this copy with
          your project overview, mission, and key features.
        </p>
      </section>

      <section
        id="system-features"
        className="mx-auto max-w-5xl border-t border-border py-16 sm:py-20"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">
            System Features
          </h2>
          <p className="mt-3 text-muted-foreground">
            Core tools designed to support tracking, monitoring, and reporting
            workflows for DPWH teams.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <h3 className="text-base font-medium">Project Tracking</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitor project status, milestones, and completion progress in one
              place.
            </p>
          </article>
          <article className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <h3 className="text-base font-medium">Document Management</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Organize permits, reports, and supporting files with centralized
              access.
            </p>
          </article>
          <article className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <h3 className="text-base font-medium">Analytics Dashboard</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              View key performance indicators and operational summaries at a
              glance.
            </p>
          </article>
        </div>
      </section>

      <footer
        id="contacts"
        className="mx-auto w-full max-w-7xl border-t border-border py-8"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-foreground">D-Track</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Email: support@dtrack.gov.ph</p>
            <p>Phone: +63 2 1234 5678</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
