"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeNext, siteUrl } from "@/lib/env";
import { authed } from "@/lib/auth";

export type FormState = { error?: string; message?: string } | undefined;

const email = z.email("That email doesn't look right").max(254);
const password = z.string().min(8, "Use at least 8 characters").max(72, "That's a bit too long");

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({ email, password, display_name: z.string().trim().max(40).optional() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=/onboarding`,
      data: { display_name: parsed.data.display_name ?? "" },
    },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/onboarding");
  return { message: "Check your inbox! We sent you a link to confirm your email. 💌" };
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({ email, password: z.string().min(1, "Enter your password"), next: z.string().optional() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Please confirm your email first. Check your inbox." };
    return { error: "Wrong email or password." };
  }
  redirect(safeNext(parsed.data.next));
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/reset-password`,
  });
  if (error?.status === 429) return { error: "Too many requests. Please wait a minute and try again." };
  // Same answer whether or not the account exists, so emails can't be probed.
  return { message: "If that email has an account, a reset link is on its way. 📬" };
}

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  return { message: "Password updated! 🔐" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("confirm") !== "DELETE") return { error: 'Type DELETE to confirm.' };
  const { supabase, uid } = await authed();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) return { error: "Could not delete the account. Please try again." };
  await supabase.auth.signOut();
  redirect("/?bye=1");
}
