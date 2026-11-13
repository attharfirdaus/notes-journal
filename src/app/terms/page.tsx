import type { Metadata } from "next";
import Link from "next/link";
import { Contact, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="14 November 2026">
      <section>
        <h2>Using Keepsake</h2>
        <p>
          Keepsake is a free notes and journal app for personal use. You need an account, and you are responsible for
          keeping your password to yourself.
        </p>
      </section>
      <section>
        <h2>Your content</h2>
        <p>
          What you write stays yours. Keepsake stores it only to show it back to you and to send the reminders you set.
          How it is stored is described in the{" "}
          <Link href="/privacy" className="font-bold underline underline-offset-4">
            privacy page
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>No guarantees</h2>
        <p>
          The service is provided as it is. It can be unavailable, and data can be lost, so keep your own copy of
          anything you cannot afford to lose. Reminders can arrive late or not at all.
        </p>
      </section>
      <section>
        <h2>Fair use</h2>
        <p>Do not use Keepsake to break the law, to attack the service, or to get into someone else&apos;s account.</p>
      </section>
      <section>
        <h2>Leaving</h2>
        <p>
          You can delete your account from Settings at any time. Accounts that abuse the service may be removed.
        </p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>These terms may change. The date at the top shows when they last did.</p>
        <Contact />
      </section>
    </LegalPage>
  );
}
