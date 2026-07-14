import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware global:
 * 1. Refresca la sesion de Supabase en cada request.
 * 2. Bloquea el acceso a rutas protegidas si el usuario no confirmo ser mayor de edad
 *    (el gate de edad se guarda en una cookie httpOnly "age_verified").
 * 3. Protege rutas de creador/suscriptor que requieren login.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Las rutas de API (/api/**) NUNCA deben redirigirse a una pagina HTML:
  // el codigo del navegador espera JSON. Si no hay confirmacion de edad o
  // sesion, devolvemos un error JSON en vez de redirigir, para no romper
  // los fetch() del frontend (esto era la causa de que la UI se quedara
  // trabada en "Verificando..." sin mostrar ningun error real).
  const isApiPath = pathname.startsWith("/api");

  const isAgeVerified = request.cookies.get("age_verified")?.value === "true";
  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/age-gate") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/_next") ||
    isApiPath;

  // Gate de edad: nadie navega el sitio sin confirmar +18, sin excepcion.
  if (!isAgeVerified && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/age-gate";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const protectedPrefixes = ["/dashboard", "/creator", "/subscriptions", "/settings"];
  const requiresAuth = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (requiresAuth && !user) {
    if (isApiPath) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
