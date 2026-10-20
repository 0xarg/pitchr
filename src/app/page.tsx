import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { navGhost, navPrimary, SiteNav } from "./components/SiteNav";
import {
  CheckIcon,
  CopyIcon,
  FileIcon,
  PenIcon,
  RefreshIcon,
  SparkIcon,
  VideoIcon,
} from "./components/icons";

const FEATURES = [
  {
    Icon: PenIcon,
    title: "Hooks that diagnose",
    body: "Opens with the likely cause of the client's problem and how you'd fix it, so the preview line already proves you get it.",
  },
  {
    Icon: VideoIcon,
    title: "Loom scripts",
    body: "A 60-90 second video script with timestamps and on-screen cues, ready to record and attach.",
  },
  {
    Icon: FileIcon,
    title: "Only your real experience",
    body: "Proof points come from your resume. No invented clients, numbers or tools.",
  },
  {
    Icon: CheckIcon,
    title: "No AI tells",
    body: "No “Dear Hiring Manager”, no “I'm thrilled to apply”, no em-dashes. Reads like a busy expert wrote it.",
  },
  {
    Icon: RefreshIcon,
    title: "Regenerate either one",
    body: "Not quite right? Rewrite just the proposal or just the script, without losing the other.",
  },
  {
    Icon: CopyIcon,
    title: "Paste-ready",
    body: "Plain text that drops straight into Upwork. One click to copy.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload your resume",
    body: "Once. Pitchr keeps it on file for every job after.",
  },
  {
    n: "02",
    title: "Paste the job post",
    body: "Add notes like the client's name, your rate or portfolio links.",
  },
  {
    n: "03",
    title: "Copy and send",
    body: "Get a proposal and a Loom script in seconds. Tweak, copy, apply.",
  },
];

const card =
  "rounded-3xl border border-zinc-200/80 bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none";

export default async function Landing() {
  const user = await getUser(await createClient());
  const ctaHref = user ? "/app" : "/login";
  const ctaLabel = user ? "Open Pitchr" : "Get started free";

  return (
    <div className="flex flex-1 flex-col">
      <SiteNav>
        {user ? (
          <Link href="/app" className={navPrimary}>
            Open app
          </Link>
        ) : (
          <Link href="/login" className={navGhost}>
            Sign in
          </Link>
        )}
      </SiteNav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-5 pt-20 pb-16 sm:pt-28">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_65%)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)]" />
          <div className="mx-auto max-w-4xl animate-fade-up text-center">
            <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              For Upwork freelancers
            </p>
            <h1 className="text-5xl font-semibold tracking-[-0.045em] text-balance sm:text-7xl">
              Win the client in the first line.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-balance text-zinc-600 sm:text-xl dark:text-zinc-400">
              Pitchr turns a job post and your resume into a proposal that gets
              straight to the point, plus a Loom script to go with it.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={ctaHref}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-zinc-950 px-7 text-[15px] font-medium text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                <SparkIcon width={16} height={16} />
                {ctaLabel}
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 items-center rounded-full px-6 text-[15px] font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Product preview */}
          <div
            className="mx-auto mt-16 max-w-5xl animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className={`${card} overflow-hidden p-2`}>
              <div className="flex items-center gap-1.5 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-white/15" />
              </div>
              <div className="grid gap-2 md:grid-cols-[2fr_3fr]">
                <div className="rounded-[20px] bg-zinc-50 p-6 dark:bg-white/[0.03]">
                  <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Job post
                  </p>
                  <p className="mt-3 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
                    We have a React + Supabase MVP for booking yoga classes.
                    Users sometimes get double-booked and the admin dashboard is
                    slow with 10k+ bookings. Need someone to fix the bugs and
                    improve performance.
                  </p>
                </div>
                <div className="rounded-[20px] border border-zinc-200/80 bg-white p-6 dark:border-white/[0.08] dark:bg-black/30">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                      Proposal
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-400">
                      <CopyIcon width={12} height={12} />
                      Copy
                    </span>
                  </div>
                  <p className="mt-3 text-[15px] leading-7 text-zinc-900 dark:text-zinc-100">
                    Double-bookings in a Supabase app almost always come from
                    checking availability on the client and then inserting, so
                    two users can pass the check at the same time. The fix is a
                    database-level guard, like a unique constraint or a Postgres
                    function that checks capacity and inserts in one
                    transaction.
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-white/[0.06]" />
                    <div className="h-2.5 w-11/12 rounded-full bg-zinc-100 dark:bg-white/[0.06]" />
                    <div className="h-2.5 w-3/4 rounded-full bg-zinc-100 dark:bg-white/[0.06]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Before / after */}
        <section className="px-5 py-14">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Clients decide in about 200 characters.
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                That&apos;s all Upwork shows in the applicant list. Most
                proposals spend it on a greeting. Pitchr spends it on the
                client&apos;s problem.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className={`${card} p-6`}>
                <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                  Typical opener
                </p>
                <p className="mt-4 text-[15px] leading-7 text-zinc-400 line-through decoration-zinc-300 dark:decoration-zinc-600">
                  Dear Hiring Manager, I hope this finds you well. I am thrilled
                  to apply for this position. As a passionate full-stack
                  developer with 5 years of experience…
                </p>
              </div>
              <div className={`${card} p-6`}>
                <p className="text-xs font-medium tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                  Pitchr opener
                </p>
                <p className="mt-4 text-[15px] leading-7">
                  6+ second mobile loads on a headless Shopify storefront
                  usually come from client-side data fetching and unoptimized
                  images. I cut load time 60% for an e-commerce client by fixing
                  exactly that.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-5 py-14">
          <div className="mx-auto max-w-5xl">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Everything you need to apply, nothing you don&apos;t.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ Icon, title, body }) => (
                <div key={title} className={`${card} p-6`}>
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-100 text-zinc-800 dark:bg-white/[0.06] dark:text-zinc-200">
                    <Icon width={18} height={18} />
                  </span>
                  <h3 className="mt-5 font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 px-5 py-14">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              How it works
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="border-t border-zinc-200 pt-6 dark:border-white/10"
                >
                  <p className="font-mono text-sm text-zinc-400">{s.n}</p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-14">
          <div className="mx-auto max-w-5xl rounded-[32px] bg-zinc-950 px-8 py-16 text-center text-white sm:py-20 dark:bg-white dark:text-zinc-950">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
              Your next proposal takes 30 seconds.
            </h2>
            <Link
              href={ctaHref}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-medium text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.98] dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
            >
              {ctaLabel}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200/80 px-5 py-8 dark:border-white/[0.08]">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-zinc-500">
          <span className="font-semibold tracking-[-0.03em] text-zinc-900 dark:text-zinc-100">
            Pitchr
          </span>
          <span>Proposals that get opened.</span>
        </div>
      </footer>
    </div>
  );
}
