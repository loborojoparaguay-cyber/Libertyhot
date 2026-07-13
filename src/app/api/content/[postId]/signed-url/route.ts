import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAccessToPost } from "@/lib/content-access";

/**
 * Devuelve una Signed URL temporal (60s) al archivo real de un post SOLO si:
 * - El post no esta bloqueado (is_locked = false), o
 * - El usuario logueado tiene suscripcion activa / pago realizado.
 *
 * Asi el archivo de Storage nunca se expone directo en el HTML/JSON del feed.
 */
export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: post, error } = await supabase
    .from("content_posts")
    .select("id, creator_id, media_url, is_locked")
    .eq("id", params.postId)
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

  // media_url guarda el path dentro del bucket "content", ej: "content/{creatorId}/foto1.jpg"
  const { data: signed, error: signError } = await supabase.storage
    .from("content")
    .createSignedUrl(post.media_url, 60);

  if (signError || !signed) {
    return NextResponse.json({ error: "No se pudo generar la URL" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
