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
      className={`${plexMono.variable} ${plexSans.variable} flex flex-1 flex-col bg-[#F7F9FC] font-[family-name:var(--font-plex-sans)] text-[#172B4D] dark:bg-[#0E1624] dark:text-[#E4E7EC]`}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#DFE1E6] px-6 py-4 dark:border-[#2A3547]">
        <span className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tracking-[0.15em] uppercase">
          Flowbase
        </span>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded px-2 py-1 text-sm text-[#172B4D]/70 transition-colors hover:text-[#172B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5CFF] dark:text-[#E4E7EC]/70 dark:hover:text-[#E4E7EC]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-[#0B5CFF] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0747A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F9FC] dark:bg-[#4C9AFF] dark:text-[#0E1624] dark:hover:bg-[#79B1FF] dark:focus-visible:ring-offset-[#0E1624]"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:py-24">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-xs font-medium tracking-[0.12em] text-[#0B5CFF] uppercase dark:text-[#4C9AFF]">
            For small IT teams &amp; construction crews
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-plex-mono)] text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
            Same board.
            <br />
            Different job.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#172B4D]/75 dark:text-[#E4E7EC]/75">
            Flowbase is a kanban tracker that relabels itself for your trade — sprints and bugs
            for dev shops, punch lists and inspections for the crew. Customize columns, card
            types, and workflows from day one.
          </p>
          <div className="mt-7 flex items-center gap-5">
            <Link
              href="/signup"
              className="rounded-md bg-[#0B5CFF] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0747A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F9FC] dark:bg-[#4C9AFF] dark:text-[#0E1624] dark:hover:bg-[#79B1FF] dark:focus-visible:ring-offset-[#0E1624]"
            >
              Start free
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[#172B4D]/70 underline decoration-[#DFE1E6] underline-offset-4 transition-colors hover:text-[#172B4D] hover:decoration-[#0B5CFF] dark:text-[#E4E7EC]/70 dark:hover:text-[#E4E7EC]"
            >
              See how it works
            </a>
          </div>
        </div>

        <BoardDemo />
      </section>

      {/* Features, presented as a backlog column */}
      <section id="how-it-works" className="border-t border-[#DFE1E6] px-6 py-16 dark:border-[#2A3547]">
        <div className="mx-auto w-full max-w-6xl">
          <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
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
                  className="w-64 shrink-0 rounded-lg border border-[#DFE1E6] bg-white p-4 dark:border-[#2A3547] dark:bg-[#161D2E]"
                >
                  <h3 className="text-sm font-semibold text-[#172B4D] dark:text-[#E4E7EC]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#172B4D]/70 dark:text-[#E4E7EC]/70">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 bottom-2 w-16 bg-gradient-to-l from-[#F7F9FC] to-transparent dark:from-[#0E1624]"
            />
          </div>
        </div>
      </section>

      {/* Two trades comparison */}
      <section className="border-t border-[#DFE1E6] px-6 py-16 dark:border-[#2A3547]">
        <div className="mx-auto w-full max-w-6xl">
          <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
            Same engine
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-plex-mono)] text-2xl font-semibold tracking-tight">
            Two trades. One engine.
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-[#DFE1E6] bg-white p-5 dark:border-[#2A3547] dark:bg-[#161D2E]">
              <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#0B5CFF] uppercase dark:text-[#4C9AFF]">
                IT / Dev
              </span>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#DE350B]" />
                <span className="font-[family-name:var(--font-plex-mono)] text-[10px] tracking-wide text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
                  Bug · High priority
                </span>
              </div>
              <p className="mt-2 text-[15px] font-medium">Fix Safari session bug</p>
              <p className="mt-1 text-[13px] text-[#172B4D]/60 dark:text-[#E4E7EC]/60">
                Assignee: Unassigned
              </p>
              <div className="mt-3 flex w-fit items-center gap-1.5 rounded bg-[#DE350B]/10 px-2 py-1.5 dark:bg-[#FF5630]/15">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#DE350B] dark:bg-[#FF5630]" />
                <span className="text-xs text-[#DE350B] dark:text-[#FF5630]">
                  Blocked — waiting on design review
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-[#DFE1E6] bg-white p-5 dark:border-[#2A3547] dark:bg-[#161D2E]">
              <span className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.15em] text-[#0B5CFF] uppercase dark:text-[#4C9AFF]">
                Construction
              </span>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#6554C0]" />
                <span className="font-[family-name:var(--font-plex-mono)] text-[10px] tracking-wide text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
                  Inspection · Bldg 2, Unit 4
                </span>
              </div>
              <p className="mt-2 text-[15px] font-medium">Electrical rough-in</p>
              <p className="mt-1 text-[13px] text-[#172B4D]/60 dark:text-[#E4E7EC]/60">
                Assignee: Unassigned
              </p>
              <div className="mt-3 flex w-fit items-center gap-1.5 rounded bg-[#DE350B]/10 px-2 py-1.5 dark:bg-[#FF5630]/15">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#DE350B] dark:bg-[#FF5630]" />
                <span className="text-xs text-[#DE350B] dark:text-[#FF5630]">
                  Blocked — waiting on inspector
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA band */}
      <section className="bg-[#0747A6] px-6 py-16 dark:bg-[#04294D]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-plex-mono)] text-2xl font-semibold tracking-tight text-white">
              Free to run. No credit card.
            </h2>
            <p className="mt-2 text-[15px] text-white/75">
              Sign up, create a workspace, and start moving cards in under a minute.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-[#0747A6] transition-colors hover:bg-[#F7F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0747A6]"
          >
            Start free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-[#DFE1E6] px-6 py-6 dark:border-[#2A3547]">
        <span className="font-[family-name:var(--font-plex-mono)] text-xs tracking-[0.15em] text-[#5E6C84] uppercase dark:text-[#8C9BAB]">
          Flowbase
        </span>
        <span className="rotate-[-2deg] rounded border border-[#DFE1E6] px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] tracking-wide text-[#5E6C84] uppercase dark:border-[#2A3547] dark:text-[#8C9BAB]">
          Rev. 01 · {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
