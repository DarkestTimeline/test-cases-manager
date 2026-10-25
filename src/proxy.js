import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { createTimer } from "@/lib/timing";

function redirectTo(request, supabaseResponse, pathname, params = {}) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );

  const response = NextResponse.redirect(url);
  supabaseResponse.cookies
    .getAll()
    .forEach((cookie) => response.cookies.set(cookie));
  return response;
}

async function handle(request, timed) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await timed("auth", supabase.auth.getClaims());
  const userId = data?.claims?.sub ?? null;

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = pathname === "/login" || pathname === "/signup";

  if (!userId && !isPublicRoute) {
    return redirectTo(request, supabaseResponse, "/login");
  }

  if (userId && isPublicRoute) {
    return redirectTo(request, supabaseResponse, "/");
  }

  if (userId) {
    const { data: profile } = await timed(
      "profile",
      supabase.from("profiles").select("is_active").eq("id", userId).single(),
    );
    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return redirectTo(request, supabaseResponse, "/login", {
        error: "deactivated",
      });
    }
  }

  return supabaseResponse;
}

export async function proxy(request) {
  const { timed, finish } = createTimer("proxy");
  const response = await handle(request, timed);
  finish();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.js).*)"],
};
