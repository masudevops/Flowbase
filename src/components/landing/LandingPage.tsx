import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { BoardDemo } from "./BoardDemo";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

const BOARD_FEATURES = [
  {
    title: "Columns that rename themselves",
    body: "Start from an IT/Dev or Construction template, or blank. Rename, reorder, add, or delete columns any time.",
  },
  {
    title: "Blocked isn't just a column",
    body: "Flag any card blocked, in any column, with a reason. The dashboard counts it either way.",
  },
  {
    title: "A record of who changed what",
    body: "Every status change, assignment, and deletion is logged — useful when an inspector asks who signed off.",
  },
  {
    title: "Backlog lives on its own",
    body: "Filter and sort what's not on a board yet, then drag it in when it's time.",
  },
  {
    title: "Walled off by database, not just login",
    body: "Every table is scoped to your organization and enforced by Postgres row-level security.",
  },
];

export function LandingPage() {
  return (
    <div
      className={`${plexMono.variable} ${plexSans.variable} flex flex-1 flex-col bg-[#F7F5F0] font-[family-name:var(--font-plex-sans)] text-[#14181F] dark:bg-[#0F1216] dark:text-[#F2F0EA]`}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#D8D3C7] px-6 py-4 dark:border-[#2A2F38]">
        <span className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] uppercase">
          Flowbase
        </span>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded px-2 py-1 text-sm text-[#14181F]/70 transition-colors hover:text-[#14181F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B5FE0] dark:text-[#F2F0EA]/70 dark:hover:text-[#F2F0EA]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-[#14181F] px-3 py-1.5 text-sm font-medium text-[#F7F5F0] transition-colors hover:bg-[#2B5FE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B5FE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F0] dark:bg-[#F2F0EA] dark:text-[#0F1216] dark:hover:bg-[#5C8AFF] dark:focus-visible:ring-offset-[#0F1216]"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:py-24">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-xs font-medium tracking-[0.12em] text-[#2B5FE0] uppercase">
            For small IT teams &amp; construction crews
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-plex-mono)] text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
            Same board.
            <br />
            Different job.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#14181F]/75 dark:text-[#F2F0EA]/75">
            Flowbase is a kanban tracker that relabels itself for your trade — sprints and bugs
            for dev shops, punch lists and inspections for the crew. Customize columns, card
            types, and workflows from day one.
          </p>
          <div className="mt-7 flex items-center gap-5">
            <Link
              href="/signup"
              className="rounded-md bg-[#14181F] px-5 py-2.5 text-sm font-medium text-[#F7F5F0] transition-colors hover:bg-[#2B5FE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B5FE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F0] dark:bg-[#F2F0EA] dark:text-[#0F1216] dark:hover:bg-[#5C8AFF] dark:focus-visible:ring-offset-[#0F1216]"
            >
              Start free
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[#14181F]/70 underline decoration-[#D8D3C7] underline-offset-4 transition-colors hover:text-[#14181F] hover:decoration-[#2B5FE0] dark:text-[#F2F0EA]/70 dark:hover:text-[#F2F0EA]"
            >
              See how it works
            </a>
          </div>
        </div>

        <BoardDemo />
      </section>

      {/* Features, presented as a backlog column */}
      <section id="how-it-works" className="border-t border-[#D8D3C7] px-6 py-16 dark:border-[#2A2F38]">
        <div className="mx-auto w-full max-w-6xl">
          <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#6B7280] uppercase">
            Backlog
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-plex-mono)] text-2xl font-semibold tracking-tight">
            What&apos;s on the board
          </h2>

          <div className="relative mt-8">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {BOARD_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="w-64 shrink-0 rounded-lg border border-[#D8D3C7] bg-white p-4 dark:border-[#2A2F38] dark:bg-[#171B21]"
                >
                  <h3 className="text-sm font-semibold text-[#14181F] dark:text-[#F2F0EA]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#14181F]/70 dark:text-[#F2F0EA]/70">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 bottom-2 w-16 bg-gradient-to-l from-[#F7F5F0] to-transparent dark:from-[#0F1216]"
            />
          </div>
        </div>
      </section>

      {/* Two trades comparison */}
      <section className="border-t border-[#D8D3C7] px-6 py-16 dark:border-[#2A2F38]">
        <div className="mx-auto w-full max-w-6xl">
          <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#6B7280] uppercase">
            Same engine
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-plex-mono)] text-2xl font-semibold tracking-tight">
            Two trades. One engine.
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-[#D8D3C7] bg-white p-5 dark:border-[#2A2F38] dark:bg-[#171B21]">
              <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#2B5FE0] uppercase">
                IT / Dev
              </span>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#D64545]" />
                <span className="font-[family-name:var(--font-plex-mono)] text-[10px] tracking-wide text-[#6B7280] uppercase">
                  Bug · High priority
                </span>
              </div>
              <p className="mt-2 text-[15px] font-medium">Fix Safari session bug</p>
              <p className="mt-1 text-[13px] text-[#14181F]/60 dark:text-[#F2F0EA]/60">
                Assignee: Unassigned
              </p>
              <div className="mt-3 flex items-center gap-1.5 rounded bg-[#F26B1D]/10 px-2 py-1.5 w-fit">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F26B1D]" />
                <span className="text-xs text-[#B24F12] dark:text-[#F26B1D]">
                  Blocked — waiting on design review
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-[#D8D3C7] bg-white p-5 dark:border-[#2A2F38] dark:bg-[#171B21]">
              <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#2B5FE0] uppercase">
                Construction
              </span>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                <span className="font-[family-name:var(--font-plex-mono)] text-[10px] tracking-wide text-[#6B7280] uppercase">
                  Inspection · Bldg 2, Unit 4
                </span>
              </div>
              <p className="mt-2 text-[15px] font-medium">Electrical rough-in</p>
              <p className="mt-1 text-[13px] text-[#14181F]/60 dark:text-[#F2F0EA]/60">
                Assignee: Unassigned
              </p>
              <div className="mt-3 flex items-center gap-1.5 rounded bg-[#F26B1D]/10 px-2 py-1.5 w-fit">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F26B1D]" />
                <span className="text-xs text-[#B24F12] dark:text-[#F26B1D]">
                  Blocked — waiting on inspector
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA band */}
      <section className="bg-[#14181F] px-6 py-16 dark:bg-[#0A0C0F]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-plex-mono)] text-2xl font-semibold tracking-tight text-[#F7F5F0]">
              Free to run. No credit card.
            </h2>
            <p className="mt-2 text-[15px] text-[#F7F5F0]/70">
              Sign up, create a workspace, and start moving cards in under a minute.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 rounded-md bg-[#F7F5F0] px-5 py-2.5 text-sm font-medium text-[#14181F] transition-colors hover:bg-[#5C8AFF] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8AFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14181F]"
          >
            Start free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-[#D8D3C7] px-6 py-6 dark:border-[#2A2F38]">
        <span className="font-[family-name:var(--font-plex-mono)] text-xs tracking-[0.15em] text-[#6B7280] uppercase">
          Flowbase
        </span>
        <span className="rotate-[-2deg] rounded border border-[#D8D3C7] px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] tracking-wide text-[#6B7280] uppercase dark:border-[#2A2F38]">
          Rev. 01 · {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
