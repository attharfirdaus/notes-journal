import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/**
 * The caller's profile for this request, or null when not signed in.
 *
 * Note there is no `.eq("id", …)` filter: RLS on `profiles` already narrows the
 * result to the caller's own row, and PostgREST verifies the JWT before running
 * the query. Resolving the id first would mean an extra `getClaims()` call, and
 * on a project using symmetric JWT keys that is a network round-trip to the
 * auth server on *every* render, measurably the most expensive thing in a cold
 * navigation. Cached per request, so the many callers below share one query.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").maybeSingle();
  return (data as Profile | null) ?? null;
});

/** Verified user id for this request, or null. Shares getProfile's query. */
export const getUserId = cache(async (): Promise<string | null> => {
  return (await getProfile())?.id ?? null;
});

/** For pages inside the app shell: must be signed in and onboarded. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarded) redirect("/onboarding");
  return profile;
}

/** For server actions: the Supabase client plus the verified user id. */
export async function authed() {
  const [supabase, uid] = await Promise.all([createClient(), getUserId()]);
  if (!uid) throw new Error("Not signed in");
  return { supabase, uid };
}
