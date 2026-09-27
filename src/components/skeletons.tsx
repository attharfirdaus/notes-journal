// Loading skeletons for each route segment.
//
// These are Server Components with no client JS, so Next.js can prefetch them
// as part of the partial prefetch for our dynamic routes — that is what makes
// sidebar navigation feel instant. Shapes mirror the real layout closely so
// content swaps in without shifting.

import clsx from "clsx";

/** A shimmering placeholder block. */
export function Sk({ className }: { className?: string }) {
  return <span className={clsx("skeleton block rounded-xl", className)} />;
}

function Card({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={clsx("rounded-blob border-2 border-line bg-card p-4 shadow-soft", className)}>{children}</div>;
}

function Header({ wide }: { wide?: boolean }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <Sk className={clsx("h-9 rounded-2xl", wide ? "w-64" : "w-44")} />
      <Sk className="h-11 w-32 rounded-2xl" />
    </div>
  );
}

function Rows({ n, className }: { n: number; className?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }, (_, i) => (
        <Sk key={i} className={clsx("h-16 rounded-2xl", className)} />
      ))}
    </div>
  );
}

/** Generic fallback for any segment without its own skeleton. */
export function PageSkeleton() {
  return (
    <div>
      <Header />
      <Rows n={5} />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <header>
        <Sk className="h-4 w-40" />
        <Sk className="mt-2 h-10 w-72 rounded-2xl sm:h-11" />
      </header>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-end gap-3">
            <Sk className="h-[132px] w-[132px] shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 pb-6">
              <Sk className="h-16 w-full rounded-3xl" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Sk className="h-4 w-40" />
            <Sk className="h-3 w-12" />
          </div>
          <Sk className="mt-2 h-2.5 w-full rounded-full" />
        </Card>
        <div className="space-y-4">
          <Card className="flex items-center gap-4">
            <Sk className="h-16 w-16 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Sk className="h-6 w-24" />
              <Sk className="h-3 w-40" />
              <Sk className="h-3 w-28" />
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <Sk className="h-10 w-10 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Sk className="h-5 w-44" />
              <Sk className="h-3 w-52" />
            </div>
          </Card>
        </div>
      </div>

      <Card className="flex items-center gap-2">
        <Sk className="h-6 w-6 shrink-0 rounded-full" />
        <Sk className="h-6 flex-1" />
        <Sk className="h-11 w-24 rounded-2xl" />
      </Card>

      <section>
        <Sk className="mb-3 h-7 w-40 rounded-2xl" />
        <Rows n={3} />
      </section>
    </div>
  );
}

export function NotesSkeleton() {
  return (
    <div>
      <Header />
      <div className="space-y-3">
        <Sk className="h-12 w-full rounded-2xl" />
        <div className="flex gap-2 overflow-hidden">
          {["w-14", "w-28", "w-24", "w-26", "w-20"].map((w) => (
            <Sk key={w} className={clsx("h-8 shrink-0 rounded-full", w)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Sk className="h-10 w-28 rounded-xl" />
          <Sk className="h-10 w-28 rounded-xl" />
          <Sk className="h-10 w-40 rounded-xl" />
        </div>
      </div>
      {/* Varied heights so the masonry columns read like real note cards. */}
      <div className="mt-5 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {["h-32", "h-44", "h-28", "h-40", "h-32", "h-48"].map((h, i) => (
          <Sk key={i} className={clsx("mb-4 w-full rounded-blob", h)} />
        ))}
      </div>
    </div>
  );
}

export function NoteDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between">
        <Sk className="h-8 w-24 rounded-xl" />
        <div className="flex gap-1">
          <Sk className="h-10 w-10 rounded-xl" />
          <Sk className="h-10 w-10 rounded-xl" />
          <Sk className="h-10 w-10 rounded-xl" />
        </div>
      </div>
      <section className="rounded-[2rem] border-2 border-line bg-card p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <Sk className="h-14 w-14 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Sk className="h-8 w-56 rounded-2xl" />
            <Sk className="h-4 w-40" />
          </div>
        </div>
        <div className="mt-3 flex gap-1.5">
          <Sk className="h-6 w-24 rounded-full" />
          <Sk className="h-6 w-20 rounded-full" />
        </div>
        <Sk className="mt-4 h-11 w-full rounded-2xl" />
      </section>
      <div className="mt-5">
        <Rows n={4} className="h-14" />
        <Sk className="mt-3 h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function JournalSkeleton() {
  return (
    <div>
      <Header />
      <Card className="mb-5 flex items-center gap-4">
        <Sk className="h-16 w-16 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Sk className="h-6 w-24" />
          <Sk className="h-3 w-44" />
        </div>
      </Card>
      <div className="flex flex-wrap items-center gap-2">
        <Sk className="h-11 min-w-0 flex-1 rounded-2xl" />
        <Sk className="h-11 w-48 rounded-2xl" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Sk key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Sk key={i} className="h-24 w-full rounded-blob" />
        ))}
      </div>
    </div>
  );
}

export function JournalEntrySkeleton() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between">
        <Sk className="h-8 w-24 rounded-xl" />
        <div className="flex gap-1">
          <Sk className="h-10 w-10 rounded-xl" />
          <Sk className="h-10 w-10 rounded-xl" />
        </div>
      </div>
      <Sk className="mb-4 h-9 w-56 rounded-2xl" />
      <section className="rounded-[2rem] border-2 border-line bg-card p-5 shadow-soft">
        <Sk className="mb-3 h-5 w-40" />
        <div className="flex justify-between gap-1 sm:justify-start sm:gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Sk key={i} className="h-20 w-16 rounded-2xl sm:w-20" />
          ))}
        </div>
        <Sk className="mb-2 mt-5 h-5 w-32" />
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => (
            <Sk key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </section>
      <Sk className="mt-4 h-16 w-full rounded-2xl" />
      <Sk className="mt-4 h-72 w-full rounded-[2rem]" />
    </div>
  );
}

export function FocusSkeleton() {
  return (
    <div>
      <Header />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <section className="flex flex-col items-center rounded-[2rem] border-2 border-line bg-card p-5 shadow-soft">
          <Sk className="h-12 w-full max-w-sm rounded-2xl" />
          <Sk className="my-6 h-64 w-64 rounded-full" />
          <div className="flex items-center gap-3">
            <Sk className="h-10 w-10 rounded-xl" />
            <Sk className="h-13 w-40 rounded-2xl" />
            <Sk className="h-10 w-10 rounded-xl" />
          </div>
          <Sk className="mt-5 h-20 w-full rounded-2xl" />
        </section>
        <div className="space-y-5">
          <Sk className="h-36 w-full rounded-[2rem]" />
          <Sk className="h-72 w-full rounded-[2rem]" />
          <Sk className="h-40 w-full rounded-[2rem]" />
        </div>
      </div>
    </div>
  );
}

export function PixelsSkeleton() {
  return (
    <div>
      <Header />
      <Sk className="mb-5 h-4 w-96 max-w-full" />
      <div className="flex items-center justify-center gap-3">
        <Sk className="h-10 w-10 rounded-xl" />
        <Sk className="h-8 w-24 rounded-2xl" />
        <Sk className="h-10 w-10 rounded-xl" />
      </div>
      <Sk className="mt-5 h-[28rem] w-full rounded-blob" />
      <Sk className="mt-5 h-56 w-full rounded-blob" />
    </div>
  );
}

export function CapsulesSkeleton() {
  return (
    <div>
      <Header />
      <Sk className="mb-5 h-4 w-96 max-w-full" />
      <Sk className="h-13 w-56 rounded-2xl" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Sk key={i} className="h-36 w-full rounded-blob" />
        ))}
      </div>
    </div>
  );
}

export function CategoriesSkeleton() {
  return (
    <div>
      <Header />
      <Sk className="mb-5 h-4 w-full max-w-xl" />
      <Sk className="h-32 w-full rounded-blob" />
      <div className="mt-6 flex justify-end">
        <Sk className="h-11 w-40 rounded-2xl" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Sk key={i} className="h-28 w-full rounded-blob" />
        ))}
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl">
      <Header />
      <div className="mb-3 flex justify-end gap-2">
        <Sk className="h-9 w-32 rounded-xl" />
        <Sk className="h-9 w-24 rounded-xl" />
      </div>
      <Rows n={6} />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl">
      <Header />
      <div className="space-y-5">
        {["h-56", "h-96", "h-72", "h-52"].map((h, i) => (
          <Sk key={i} className={clsx("w-full rounded-[2rem]", h)} />
        ))}
      </div>
    </div>
  );
}
