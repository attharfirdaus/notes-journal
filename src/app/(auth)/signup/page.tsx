import Link from "next/link";
import type { Metadata } from "next";
import { signUp } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { Input } from "@/components/ui";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 font-display text-2xl font-bold">Join Tuckbury</h1>
      <p className="mb-5 text-sm text-ink-soft">A cozy home for your lists, plans and feelings.</p>
      <AuthForm
        action={signUp}
        submitLabel="Create my account"
        hideOnSuccess
        footer={
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-ink underline decoration-primary decoration-2 underline-offset-2"
            >
              Log in
            </Link>
          </>
        }
      >
        <Input
          label="What should we call you?"
          name="display_name"
          autoComplete="nickname"
          maxLength={40}
          placeholder="Nickname"
        />
        <Input label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </AuthForm>
    </>
  );
}
