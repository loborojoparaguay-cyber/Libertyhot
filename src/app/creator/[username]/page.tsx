import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LockedMedia from "@/components/LockedMedia";
import SubscribeButton from "@/components/SubscribeButton";
import SiteHeader from "@/components/SiteHeader";
import PostReactions from "@/components/PostReactions";
import LockedText from "@/components/LockedText";

export const revalidate = 0;

export default async function CreatorProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = createClient();

  const { data: creator } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .eq("role", "creator")
    .maybeSingle();

  if (!creator) notFound();

  const { data: rawPosts } = await supabase
    .from("content_posts")
    .select("id, caption, media_type, media_url, is_locked, price_unlock, created_at")
    .eq("creator_id", creator.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Aunque la policy de RLS permite leer el caption de cualquier post publicado
  // (es metadata publica para posts con foto/video, donde el archivo real esta
  // protegido por Signed URL), en un post de tipo "text" el caption ES el
  // contenido completo. Por eso lo ocultamos aca mismo si esta bloqueado,
  // ademas de la proteccion que ya tiene el endpoint /api/content/[id]/text.
  const posts = rawPosts?.map((post) =>
    post.media_type === "text" && post.is_locked
      ? { ...post, caption: null }
      : post
  );

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("creator_id", creator.id)
    .eq("is_active", true);

  // Revisamos si el usuario logueado ya tiene una suscripcion (activa o
  // pendiente de pago) con este creador, para no mostrarle "Suscribirme"
  // de nuevo como si nada, y evitar que piense que la suscripcion no funciono.
  const { data: { user } } = await supabase.auth.getUser();
  let existingSubscription: { status: string } | null = null;

  if (user) {
    const { data } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("subscriber_id", user.id)
      .eq("creator_id", creator.id)
      .maybeSingle();
    existingSubscription = data;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="card mb-8">
        <div
          className="mb-4 h-32 w-full rounded-xl bg-cover bg-center bg-gradient-to-br from-brand/40 to-brand-dark/40"
          style={creator.cover_url ? { backgroundImage: `url(${creator.cover_url})` } : undefined}
        />
        <div className="flex items-center gap-4">
          <div
            className="-mt-14 h-20 w-20 flex-shrink-0 rounded-full border-4 border-base-card bg-cover bg-center bg-gradient-to-br from-brand/40 to-brand-dark/40"
            style={creator.avatar_url ? { backgroundImage: `url(${creator.avatar_url})` } : undefined}
          />
          <div>
            <h1 className="text-2xl font-bold">{creator.display_name}</h1>
            <p className="text-white/50">@{creator.username}</p>
          </div>
        </div>
        <p className="mt-3 text-white/70">{creator.bio}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {existingSubscription?.status === "active" ? (
            <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-400">
              ✅ Ya estás suscripto/a
            </span>
          ) : existingSubscription?.status === "pending_payment" ? (
            <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-sm font-semibold text-yellow-400">
              ⏳ Pago pendiente de confirmación
            </span>
          ) : plans && plans.length > 0 ? (
            plans.map((plan) => (
              <SubscribeButton
                key={plan.id}
                planId={plan.id}
                creatorId={creator.id}
                label={
                  plan.is_free
                    ? "Suscribirme gratis"
                    : `Suscribirme · ${plan.currency} ${plan.price}/mes`
                }
              />
            ))
          ) : (
            <p className="text-sm text-white/50">
              Este creador todavía no configuró planes de suscripción.
            </p>
          )}
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold">Publicaciones</h2>
      <div className="space-y-4">
        {posts?.map((post) => (
          <div key={post.id} className="card">
            {post.media_type === "text" ? (
              <LockedText
                postId={post.id}
                isLocked={post.is_locked}
                // Si esta bloqueada, NUNCA pasamos el texto real como preview
                // (el texto completo es el "contenido" en si mismo). Solo se
                // revela pasando por el endpoint protegido /api/content/[id]/text.
                previewCaption={post.is_locked ? null : post.caption}
              />
            ) : (
              <>
                <LockedMedia
                  postId={post.id}
                  isLocked={post.is_locked}
                  mediaType={post.media_type as "image" | "video"}
                />
                {post.caption && <p className="mt-3 text-sm text-white/70">{post.caption}</p>}
              </>
            )}
            <PostReactions postId={post.id} />
          </div>
        ))}
        {(!posts || posts.length === 0) && (
          <p className="text-sm text-white/50">Este creador todavía no publicó contenido.</p>
        )}
      </div>
      </main>
    </>
  );
}
