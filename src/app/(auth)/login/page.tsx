import Link from "next/link";
import type { Metadata } from "next";
import { signIn } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { Input } from "@/components/ui";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  const linkError = sp.error === "link";
  return (
    <>
      <h1 className="mb-1 font-display text-2xl font-bold">Welcome back! 👋</h1>
      <p className="mb-5 text-sm text-ink-soft">Your acorns missed you.</p>
      {linkError ? (
        <p className="mb-4 rounded-2xl bg-[#EF5B5B]/15 px-4 py-2.5 text-sm font-bold">
          That link has expired or was already used. Please try again.
        </p>
      ) : null}
      <AuthForm
        action={signIn}
        submitLabel="Log in"
        footer={
          <>
            New here?{" "}
            <Link href="/signup" className="font-bold text-ink underline decoration-primary decoration-2 underline-offset-2">
              Create an account
            </Link>
          </>
        }
      >
        <input type="hidden" name="next" value={next} />
        <Input label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        <Input label="Password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        <div className="-mt-1 text-right">
          <Link href="/forgot-password" className="text-sm font-bold text-ink-soft hover:text-ink">
            Forgot password?
          </Link>
        </div>
      </AuthForm>
    </>
  );
}
