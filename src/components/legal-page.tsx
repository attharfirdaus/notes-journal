import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";

/** Set `NEXT_PUBLIC_CONTACT_EMAIL` to show a contact address on the legal pages. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-20">
      <header className="py-5">
        <Link href="/" className="inline-flex min-h-11 items-center text-3xl">
          <Wordmark />
        </Link>
      </header>
      <main>
        <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated {updated}</p>
        <div className="mt-8 space-y-7 text-[17px] leading-relaxed [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-1.5 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  );
}

export function Contact() {
  return CONTACT_EMAIL ? (
    <p>
      Questions go to{" "}
      <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline underline-offset-4">
        {CONTACT_EMAIL}
      </a>
      .
    </p>
  ) : null;
}
