import Link from "next/link";
import type { Metadata } from "next";
import { requestPasswordReset } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { Input } from "@/components/ui";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-1 font-display text-2xl font-bold">Forgot your password?</h1>
      <p className="mb-5 text-sm text-ink-soft">Happens to the best squirrels. We&apos;ll email you a reset link.</p>
      <AuthForm
        action={requestPasswordReset}
        submitLabel="Send reset link"
        hideOnSuccess
        footer={
          <Link
            href="/login"
            className="font-bold text-ink underline decoration-primary decoration-2 underline-offset-2"
          >
            Back to log in
          </Link>
        }
      >
        <Input label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </AuthForm>
    </>
  );
}
