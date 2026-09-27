import Link from "next/link";
import { LandingHero } from "@/components/landing-hero";

const FEATURES = [
  { emoji: "🛒", title: "Lists for everything", body: "Groceries, homework, packing, gift ideas. Type “Groceries: milk, eggs” and it's done." },
  { emoji: "✨", title: "Auto-sorted", body: "Notes find their own categories — in English or Bahasa Indonesia. Teach it new words anytime." },
  { emoji: "⏰", title: "Never miss a deadline", body: "“Essay due friday 5pm” sets the date for you. Reminders arrive in-app and as push notifications." },
  { emoji: "📔", title: "Daily journal & moods", body: "Pick a mood, write a line, keep your 🔥 streak alive. Streak freezes forgive the odd missed day." },
  { emoji: "🐿️", title: "A sidekick that grows", body: "Hatch an acorn into a squirrel who cheers you on and evolves as you show up." },
  { emoji: "🍅", title: "Focus with ambience", body: "Pomodoro timer with rain, wind and cozy noise — generated live in your browser." },
  { emoji: "🟪", title: "Year in Pixels", body: "Watch your year paint itself, one mood-colored square per day." },
  { emoji: "💌", title: "Time capsules", body: "Seal a letter to future you. Even you can't peek until it unlocks." },
];

export default async function Landing({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/40 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full bg-primary/30 blur-3xl" aria-hidden />

      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="font-display text-2xl font-bold">🌰 Tuckbury</span>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="rounded-2xl px-4 py-2 font-bold hover:bg-soft">
            Log in
          </Link>
          <Link href="/signup" className="btn-pop rounded-2xl bg-primary px-4 py-2 font-bold text-primary-ink">
            Sign up free
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-20">
        {sp.bye ? (
          <p className="mx-auto mb-6 max-w-md rounded-2xl bg-card p-3 text-center font-bold shadow-soft">
            Your account was deleted. Pip waves goodbye 👋
          </p>
        ) : null}
        <LandingHero />

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="rounded-blob border-2 border-line bg-card p-5 shadow-soft transition hover:-translate-y-1"
              style={{ rotate: `${i % 2 ? 0.8 : -0.8}deg` }}
            >
              <div className="text-3xl">{f.emoji}</div>
              <h3 className="mt-2 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-[2.5rem] border-2 border-line bg-card p-8 text-center shadow-soft">
          <h2 className="font-display text-3xl font-bold">Your brain is for having ideas, not holding them.</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink-soft">Tuck them away in Tuckbury. Free, private, and a little bit silly.</p>
          <Link href="/signup" className="btn-pop mt-5 inline-block rounded-2xl bg-primary px-6 py-3 text-lg font-bold text-primary-ink">
            Hatch your acorn 🐣
          </Link>
        </section>
      </main>
      <footer className="pb-8 text-center text-xs text-ink-soft">Made with 🌰 · Tuckbury</footer>
    </div>
  );
}
