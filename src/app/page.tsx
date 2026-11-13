import Link from "next/link";
import { LandingDemo } from "@/components/landing-demo";
import { LandingHero } from "@/components/landing-hero";
import { Wordmark } from "@/components/wordmark";

// The smaller things in the box. A plain list: none of them needs a card.
const ALSO: [string, string][] = [
  ["A sidekick that grows", "Pip starts as an acorn and grows on the days you check something off, write or focus."],
  ["Focus timer", "A pomodoro timer with rain and wind you can mix, generated in your browser."],
  ["Year in Pixels", "One square per day, colored by the mood you logged."],
  ["Time capsules", "A letter to yourself that stays sealed until the date you pick."],
  ["Categories that sort themselves", "Notes are filed by keywords you can edit, in English or Bahasa Indonesia."],
];

export default async function Landing({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-5xl px-5">
      <header className="flex items-center justify-between py-5">
        <Wordmark className="text-3xl" />
        <nav className="flex items-center gap-1" aria-label="Account">
          <Link href="/login" className="rounded-btn px-4 py-2.5 font-bold transition-colors hover:bg-soft">
            Log in
          </Link>
          <Link href="/signup" className="rounded-btn border border-edge px-4 py-2.5 font-bold transition-colors hover:bg-soft">
            Sign up
          </Link>
        </nav>
      </header>

      <main className="pb-24">
        {sp.bye ? (
          <p className="mb-2 rounded-paper border border-line bg-card p-3 text-center font-bold" role="status">
            Your account and everything in it were deleted.
          </p>
        ) : null}

        <LandingHero />
        <LandingDemo />

        <section className="mt-24 grid gap-x-12 gap-y-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Lists that remember their deadlines.</h2>
            <p className="mt-3 text-lg text-ink-soft">
              Checklists for shopping and packing, task lists with due dates, a schedule for appointments. Write
              &ldquo;friday 5pm&rdquo; and the date is set. Reminders show up in the app, and as push notifications if
              you turn them on. Daily, weekly and monthly items come back on their own after you check them off.
            </p>
          </div>
          <div className="md:pt-16">
            <h2 className="font-display text-3xl font-bold tracking-tight">A page a day.</h2>
            <p className="mt-3 text-lg text-ink-soft">
              Pick a mood and write a line. Days you write count toward a streak, and a streak freeze covers a single
              missed day.
            </p>
          </div>
        </section>

        <section className="mt-20 border-t border-line pt-10">
          <h2 className="hand text-ink-soft">also in the box</h2>
          <dl className="mt-4 grid gap-x-12 gap-y-5 sm:grid-cols-2">
            {ALSO.map(([term, detail]) => (
              <div key={term}>
                <dt className="font-bold">{term}</dt>
                <dd className="text-ink-soft">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-20 max-w-xl">
          <p className="text-lg">
            Keepsake is free. Your notes and journal belong to your account, and you can delete all of it from Settings
            whenever you want.
          </p>
          <Link
            href="/signup"
            className="btn-pop mt-5 inline-block rounded-btn bg-primary px-6 py-3 text-lg font-bold text-primary-ink"
          >
            Hatch your acorn
          </Link>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-sm text-ink-soft">
        <span>Keepsake</span>
        <nav className="flex gap-4" aria-label="Legal">
          <Link href="/privacy" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-ink">
            Terms
          </Link>
        </nav>
      </footer>
    </div>
  );
}
