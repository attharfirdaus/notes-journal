import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../env";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/privacy", "/terms"];
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  // Supabase falls back to the project's Site URL ("/?code=...") when the
  // redirect it was given isn't on its allow list. Finish the sign-in anyway.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/confirm";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Do not run code between createServerClient and getClaims. It refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;

  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    const [pathname, query] = to.split("?");
    url.pathname = pathname;
    url.search = query ? `?${query}` : "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  const isPublic = PUBLIC_PATHS.includes(path) || path.startsWith("/auth/");
  if (!signedIn && !isPublic) {
    return redirect(`/login?next=${encodeURIComponent(path + request.nextUrl.search)}`);
  }
  if (signedIn && (GUEST_ONLY.includes(path) || path === "/")) {
    return redirect("/home");
  }
  return response;
}
