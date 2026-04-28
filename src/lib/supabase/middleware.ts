import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieSetItem = { name: string; value: string; options: CookieOptions };

const PROTECTED_PREFIXES = ["/home", "/train", "/gym", "/shop", "/crew", "/trainers", "/activity", "/music"];

function isProtected(pathname: string) {
  // /shop and /shop/[slug] are also public on (site); the (app) versions live at the same paths.
  // Auth gate covers /home, /train, /gym, /crew, /trainers, /activity, /music — the app-only routes.
  // /shop is dual-mode; we keep it public.
  return PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/")) && !pathname.startsWith("/shop");
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieSetItem[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && isProtected(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
