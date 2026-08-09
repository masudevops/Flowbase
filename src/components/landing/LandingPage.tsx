import Link from "next/link";
import { BoardDemo } from "./BoardDemo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const BOARD_FEATURES = [
  {
    eyebrow: "Templates",
    color: "#1D5C8A",
    title: "Start from how your team already works",
    body: "IT/Dev, Construction, General Project Management, or blank. Rename, reorder, add, or delete columns any time — or save your own setup as a template for next time.",
  },
  {
    eyebrow: "Blocked",
    color: "#C1440E",
    title: "Blocked isn't just a column",
    body: "Flag any piece of work blocked, in any column, with a reason. Dashboards and My Work count it either way.",
  },
  {
    eyebrow: "Activity",
    color: "#0F7A5C",
    title: "A record of who changed what",
    body: "Every status change, assignment, and deletion is logged — useful when someone asks who signed off, and when.",
  },
];

export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-[#F5F7F4] text-[#14242E] dark:bg-[#0B1F2E] dark:text-[#E7EEF0]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#D3DBD8] px-6 py-4 dark:border-[#23414F]">
        <span className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] uppercase">
          Kelbara
        </span>
        <nav className="flex items-center gap-4">
          <ThemeToggle className="rounded p-1.5 text-[#14242E]/70 hover:bg-[#14242E]/5 hover:text-[#14242E] dark:text-[#E7EEF0]/70 dark:hover:bg-[#E7EEF0]/10 dark:hover:text-[#E7EEF0]" />
          <Link
            href="/login"
            className="rounded px-2 py-1 text-sm text-[#14242E]/70 transition-colors hover:text-[#14242E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D5C8A] dark:text-[#E7EEF0]/70 dark:hover:text-[#E7EEF0]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-[#1D5C8A] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#123F5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D5C8A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F7F4] dark:bg-[#5FB4E0] dark:text-[#0B1F2E] dark:hover:bg-[#8FCBEA] dark:focus-visible:ring-offset-[#0B1F2E]"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="blueprint-grid mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:py-24">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-xs font-medium tracking-[0.12em] text-[#1D5C8A] uppercase dark:text-[#5FB4E0]">
            Flexible work management for every team
          </p>
          <h1 className="mt-4 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
            Same board.
            <br />
            Different job.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#14242E]/75 dark:text-[#E7EEF0]/75">
            Kelbara is a flexible work management platform that adapts to how your team works.
            Plan projects, organize tasks, customize workflows, and keep everyone aligned — all
            in one place.
          </p>
          <div className="mt-7 flex items-center gap-5">
            <Link
              href="/signup"
              className="rounded-md bg-[#1D5C8A] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#123F5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D5C8A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F7F4] dark:bg-[#5FB4E0] dark:text-[#0B1F2E] dark:hover:bg-[#8FCBEA] dark:focus-visible:ring-offset-[#0B1F2E]"
            >
              Start free
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[#14242E]/70 underline decoration-[#D3DBD8] underline-offset-4 transition-colors hover:text-[#14242E] hover:decoration-[#1D5C8A] dark:text-[#E7EEF0]/70 dark:hover:text-[#E7EEF0]"
            >
              See how it works
            </a>
          </div>
        </div>

        <BoardDemo />
      </section>

      {/* Features */}
      <section id="how-it-works" className="border-t border-[#D3DBD8] px-6 py-16 dark:border-[#23414F]">
        <div className="mx-auto w-full max-w-6xl">
          <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#55707D] uppercase dark:text-[#8FA8B3]">
            How it works
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Built to bend, not to be worked around
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {BOARD_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-[#D3DBD8] bg-white p-5 dark:border-[#23414F] dark:bg-[#0F2A3D]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: feature.color }} />
                  <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.1em] text-[#55707D] uppercase dark:text-[#8FA8B3]">
                    {feature.eyebrow}
                  </span>
                </div>
                <h3 className="mt-2.5 text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#14242E]/70 dark:text-[#E7EEF0]/70">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two trades comparison */}
      <section className="border-t border-[#D3DBD8] px-6 py-16 dark:border-[#23414F]">
        <div className="mx-auto w-full max-w-6xl">
          <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#55707D] uppercase dark:text-[#8FA8B3]">
            Same engine
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Different teams. One flexible platform.
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-[#D3DBD8] bg-white p-5 dark:border-[#23414F] dark:bg-[#0F2A3D]">
              <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#1D5C8A] uppercase dark:text-[#5FB4E0]">
                IT / Dev
              </span>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#C1440E]" />
                <span className="font-[family-name:var(--font-plex-mono)] text-[10px] tracking-wide text-[#55707D] uppercase dark:text-[#8FA8B3]">
                  Bug · High priority
                </span>
              </div>
              <p className="mt-2 text-[15px] font-medium">Fix Safari session bug</p>
              <p className="mt-1 text-[13px] text-[#14242E]/60 dark:text-[#E7EEF0]/60">
                Assignee: Unassigned
              </p>
              <div className="mt-3 flex w-fit items-center gap-1.5 rounded bg-[#C1440E]/10 px-2 py-1.5 dark:bg-[#E8703A]/15">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C1440E] dark:bg-[#E8703A]" />
                <span className="text-xs text-[#C1440E] dark:text-[#E8703A]">
                  Blocked — waiting on design review
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-[#D3DBD8] bg-white p-5 dark:border-[#23414F] dark:bg-[#0F2A3D]">
              <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#1D5C8A] uppercase dark:text-[#5FB4E0]">
                Construction
              </span>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#6554C0]" />
                <span className="font-[family-name:var(--font-plex-mono)] text-[10px] tracking-wide text-[#55707D] uppercase dark:text-[#8FA8B3]">
                  Inspection · Bldg 2, Unit 4
                </span>
              </div>
              <p className="mt-2 text-[15px] font-medium">Electrical rough-in</p>
              <p className="mt-1 text-[13px] text-[#14242E]/60 dark:text-[#E7EEF0]/60">
                Assignee: Unassigned
              </p>
              <div className="mt-3 flex w-fit items-center gap-1.5 rounded bg-[#C1440E]/10 px-2 py-1.5 dark:bg-[#E8703A]/15">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C1440E] dark:bg-[#E8703A]" />
                <span className="text-xs text-[#C1440E] dark:text-[#E8703A]">
                  Blocked — waiting on inspector
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA band */}
      <section className="bg-[#123F5C] px-6 py-16 dark:bg-[#04294D]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Start free. No credit card required.
            </h2>
            <p className="mt-2 text-[15px] text-white/75">
              Sign up, create a workspace, and start organizing your team&apos;s work in under a
              minute.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-[#123F5C] transition-colors hover:bg-[#F5F7F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#123F5C]"
          >
            Start free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-[#D3DBD8] px-6 py-6 dark:border-[#23414F]">
        <span className="font-[family-name:var(--font-plex-mono)] text-xs tracking-[0.15em] text-[#55707D] uppercase dark:text-[#8FA8B3]">
          Kelbara
        </span>
        <span className="rotate-[-2deg] rounded border border-[#D3DBD8] px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] tracking-wide text-[#55707D] uppercase dark:border-[#23414F] dark:text-[#8FA8B3]">
          Rev. 01 · {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
