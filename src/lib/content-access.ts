import { createClient as createAdminClient } from "@/lib/supabase/server";

/**
 * Verifica si un usuario tiene acceso a un post bloqueado:
 * - Tiene una suscripcion activa con el creador, o
 * - Pago individualmente ese post (pay-per-view).
 *
 * Esto se usa en Route Handlers/Server Actions ANTES de generar una Signed URL
 * hacia el archivo real en Storage. Nunca se expone el media_url crudo de un
 * post bloqueado sin pasar por esta verificacion.
 */
export async function hasAccessToPost(params: {
  userId: string;
  creatorId: string;
  postId: string;
}): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_end")
    .eq("subscriber_id", params.userId)
    .eq("creator_id", params.creatorId)
    .eq("status", "active")
    .maybeSingle();

  if (subscription) {
    const stillValid =
      !subscription.current_period_end ||
      new Date(subscription.current_period_end) > new Date();
    if (stillValid) return true;
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("payer_id", params.userId)
    .eq("content_post_id", params.postId)
    .eq("status", "completed")
    .maybeSingle();

  return Boolean(payment);
}
