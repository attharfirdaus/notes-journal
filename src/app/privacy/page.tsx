import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="14 November 2026">
      <section>
        <h2>What Keepsake stores</h2>
        <ul>
          <li>Your email address and password. Sign-in is handled by Supabase Auth, which stores the password hashed.</li>
          <li>What you enter in your profile: nickname, birthday, sidekick name, time zone and appearance settings.</li>
          <li>What you write: notes and their items, journal entries, moods, focus sessions and time capsules.</li>
          <li>If you turn on push notifications, the address your browser gives us to deliver them to that device.</li>
        </ul>
      </section>
      <section>
        <h2>Where it lives</h2>
        <p>
          The database and sign-in run on Supabase. The website runs on Vercel. Both process your data to provide the
          service.
        </p>
      </section>
      <section>
        <h2>Who can read it</h2>
        <p>
          Inside the app, the database only returns rows that belong to the account that is signed in. The person who
          operates this site has administrator access to the database, as with any hosted service.
        </p>
      </section>
      <section>
        <h2>What Keepsake does not do</h2>
        <ul>
          <li>It shows no ads and loads no analytics or tracking scripts.</li>
          <li>It sets one cookie, the one that keeps you signed in.</li>
          <li>It does not sell or share your data with anyone else.</li>
        </ul>
      </section>
      <section>
        <h2>Emails and notifications</h2>
        <p>
          You get an email to confirm your address and when you ask to reset your password. Reminders arrive inside the
          app, and as push notifications only on devices where you turned them on.
        </p>
      </section>
      <section>
        <h2>Deleting your data</h2>
        <p>
          Settings, then Delete account, permanently removes your account and everything listed above. It cannot be
          undone.
        </p>
        <Contact />
      </section>
    </LegalPage>
  );
}
