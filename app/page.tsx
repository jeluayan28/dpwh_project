export default function Home() {
  return (
    <main style={{ backgroundColor: "#F7F7F7" }}>
      <section
        className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center py-16 text-center px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: "url('/img/bg1.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <h1 className="relative scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance text-white">
          Track Payroll Documents with Ease
        </h1>
        <p className="relative leading-7 [&:not(:first-child)]:mt-6 max-w-lg text-white">
          Organize and monitor payroll documents with ease while reducing manual
          errors, and maintaining a secure and reliable system.
        </p>
        <button
          className="relative mt-6 rounded-md px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#FCC61D" }}
        >
          Get Started
        </button>
      </section>

      <section
        id="about"
        className="w-full border-t border-border py-16 sm:py-20 text-center"
        style={{ backgroundColor: "#F7F7F7" }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight">About</h2>
        <p className="mt-3" style={{ color: "#374151" }}>
          D-Track is a web-based platform developed to streamline the tracking
          and monitoring of internal documents within organizational divisions.
          It improves accountability, reduces document delays, and provides
          clear visibility of document movement across departments.
        </p>
        </div>
      </section>

      <section
        id="system-features"
        className="w-full border-t border-border py-16 sm:py-20"
        style={{ backgroundColor: "#F7F7F7" }}
      >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            System Features
          </h2>
          <div className="mx-auto mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: "#FCC61D" }} />
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article
            className="group relative rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: "#FCC61D22" }}>
              📄
            </div>
            <h3 className="text-base font-semibold" style={{ color: "#3338A0" }}>Document Tracking</h3>
            <p className="mt-2 text-sm" style={{ color: "#374151" }}>
              Track documents across divisions with a unique reference number
              and real-time status updates.
            </p>
            <div className="mx-auto mt-4 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-16" style={{ backgroundColor: "#FCC61D" }} />
          </article>
          <article
            className="group relative rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: "#FCC61D22" }}>
              📋
            </div>
            <h3 className="text-base font-semibold" style={{ color: "#3338A0" }}>Online Logbook</h3>
            <p className="mt-2 text-sm" style={{ color: "#374151" }}>
              Maintain a digital chain of custody showing the movement of
              documents from one department to another.
            </p>
            <div className="mx-auto mt-4 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-16" style={{ backgroundColor: "#FCC61D" }} />
          </article>
          <article
            className="group relative rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: "#FCC61D22" }}>
              🔔
            </div>
            <h3 className="text-base font-semibold" style={{ color: "#3338A0" }}>Status Alerts</h3>
            <p className="mt-2 text-sm" style={{ color: "#374151" }}>
              Automatically flag urgent and overdue documents to prevent
              processing delays.
            </p>
            <div className="mx-auto mt-4 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-16" style={{ backgroundColor: "#FCC61D" }} />
          </article>
        </div>
      </div>
      </section>

      <footer
        id="contacts"
        className="w-full border-t border-border py-6"
        style={{ backgroundColor: "#F7F7F7" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <p className="text-sm" style={{ color: "#374151" }}>
            © 2026{" "}
            <span className="font-semibold" style={{ color: "#3338A0" }}>D-Track</span>
            {" "}
            <span style={{ color: "#6B7280" }}>(Document Tracking System)</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
