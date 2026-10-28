import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@gigbridge/data/server";
import { detectLocale, LOCALE_COOKIE } from "@gigbridge/config";

/**
 * Next.js 16 renombró el middleware: exporta `proxy`, no `middleware`, y
 * el archivo se llama `proxy.ts` — ver GigBridge/gigbridge/src/proxy.ts.
 * No crear `middleware.ts`.
 *
 * Protección de rutas igual a v1, ahora que las páginas de auth ya
 * existen: /dashboard requiere sesión; las rutas de auth redirigen a
 * /dashboard si ya hay sesión; /auth/setup redirige a /dashboard si el
 * usuario ya tiene profile (no debe volver a pasar por el wizard).
 * /tour/* sigue sin protección — no forma parte de este alcance todavía.
 */

const PROTECTED_ROUTES = ["/dashboard"];
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/check-email"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookiesToSet) => {
      for (const { name, value } of cookiesToSet) {
        request.cookies.set(name, value);
      }
      response = NextResponse.next({ request });
      for (const { name, value, options } of cookiesToSet) {
        response.cookies.set(name, value, options);
      }
    },
  });

  // Refresca la sesión — no quitar esto.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  let redirectPath: string | null = null;

  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !user) {
    redirectPath = "/auth/login";
  } else if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && user) {
    redirectPath = "/dashboard";
  } else if (pathname === "/auth/setup" && user) {
    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (profile) redirectPath = "/dashboard";
  }

  if (redirectPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = redirectPath;
    if (redirectPath === "/auth/login") redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Visitante nuevo sin cookie de idioma todavía: default por
  // geolocalización/Accept-Language. Un cambio manual (LanguageSwitcher,
  // cuando exista) pone esta misma cookie y nunca se sobreescribe aquí.
  if (!request.cookies.has(LOCALE_COOKIE)) {
    const locale = detectLocale({
      country: request.headers.get("x-vercel-ip-country"),
      acceptLanguage: request.headers.get("accept-language"),
    });
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  // Archivos de la PWA fuera: no necesitan sesión y se piden sin cookies.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icon/|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
