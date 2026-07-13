import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback para flujos de auth basados en link (magic link, confirmacion de email).
 * Supabase redirige aca con un "code" que intercambiamos por una sesion.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/dashboard";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
