import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hasAccessToPost } from "@/lib/content-access";

/**
 * Devuelve el texto completo de una publicacion de solo texto SOLO si:
 * - El post no esta bloqueado (is_locked = false), o
 * - El usuario logueado tiene suscripcion activa / pago realizado.
 *
 * Analogo a /api/content/[postId]/signed-url pero para posts sin archivo.
 */
export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: post, error } = await admin
      .from("content_posts")
      .select("id, creator_id, caption, is_locked, media_type")
      .eq("id", params.postId)
      .eq("media_type", "text")
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
    }

    if (post.is_locked) {
      const allowed = await hasAccessToPost({
        userId: user.id,
        creatorId: post.creator_id,
        postId: post.id,
      });

      if (!allowed) {
        return NextResponse.json(
          { error: "Necesitás una suscripción activa para ver este contenido" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ caption: post.caption });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
