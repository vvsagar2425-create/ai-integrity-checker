import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-40 left-10 h-[260px] w-[260px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-[320px] w-[320px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* Nav */}
        <header className="flex items-center justify-between">
          <div className="font-semibold tracking-tight">AI Integrity Checker</div>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="text-white/70 hover:text-white" href="/check">
              Check
            </Link>
            <Link className="text-white/70 hover:text-white" href="/calibrate">
              Calibrate
            </Link>
            <a
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-white/90 hover:bg-white/10"
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="mt-14 grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Check writing for citation issues and AI-like patterns —{" "}
              <span className="text-white/70">with evidence, not accusations.</span>
            </h1>
            <p className="mt-4 text-white/70 leading-relaxed">
              This tool surfaces *signals* (not proof): missing Works Cited, numbers/dates
              without citations, and AI-like sentence patterns. It’s designed to help students
              fix writing — and help teachers review fairly.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/check"
                className="rounded-xl bg-white text-black px-4 py-2 font-medium hover:bg-white/90"
              >
                Try the checker
              </Link>
              <Link
                href="/calibrate"
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-medium hover:bg-white/10"
              >
                Calibrate Human vs AI
              </Link>
            </div>

            <div className="mt-6 text-xs text-white/50">
              Tip: Calibration improves the “Human vs AI” verdict for *your* writing style.
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-semibold">Sentence-level evidence</div>
              <div className="text-sm text-white/60 mt-1">
                Highlights specific sentences and explains why they were flagged.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-semibold">Citation checks (no paid APIs)</div>
              <div className="text-sm text-white/60 mt-1">
                Detects missing Works Cited/References, and common “needs a source” claims.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-semibold">Ethical “not proof” output</div>
              <div className="text-sm text-white/60 mt-1">
                Reports uncertainty and confidence so it’s harder to misuse.
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 pt-8 text-xs text-white/50">
          Built with Next.js + Tailwind. Designed for transparency and student-safe feedback.
        </footer>
      </div>
    </main>
  );
}
