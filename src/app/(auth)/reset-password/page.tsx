import Link from "next/link";
import type { Metadata } from "next";
import { updatePassword } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { Input } from "@/components/ui";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-1 font-display text-2xl font-bold">Pick a new password 🔑</h1>
      <p className="mb-5 text-sm text-ink-soft">Make it something only you (and not Pip) would guess.</p>
      <AuthForm
        action={updatePassword}
        submitLabel="Save new password"
        hideOnSuccess
        footer={
          <Link href="/home" className="font-bold text-ink underline decoration-primary decoration-2 underline-offset-2">
            Go to Tuckbury →
          </Link>
        }
      >
        <Input label="New password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <Input label="Confirm password" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </AuthForm>
    </>
  );
}
