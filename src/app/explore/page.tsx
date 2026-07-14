import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";

export const revalidate = 0;

export default async function ExplorePage() {
  const supabase = createClient();

  const { data: creators } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, cover_url, bio, subscription_price_monthly, currency")
    .eq("role", "creator")
    .eq("is_creator_verified", true);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Explorar <span className="text-brand">creadores</span>
        </h1>
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Volver al inicio
        </Link>
      </div>

      {!creators || creators.length === 0 ? (
        <div className="card text-center text-white/60">
          Todavía no hay creadores verificados. ¡Sé el primero en unirte!
          <div className="mt-4">
            <Link href="/register?role=creator" className="btn-primary">
              Registrarme como creador/a
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creator/${creator.username}`}
              className="card transition hover:border-brand/50"
            >
              <div
                className="mb-3 h-32 w-full rounded-xl bg-cover bg-center bg-gradient-to-br from-brand/40 to-brand-dark/40"
                style={
                  (creator as any).cover_url
                    ? { backgroundImage: `url(${(creator as any).cover_url})` }
                    : undefined
                }
              />
              <div className="-mt-10 mb-2 ml-2">
                <div
                  className="h-14 w-14 rounded-full border-4 border-base-card bg-cover bg-center bg-gradient-to-br from-brand/40 to-brand-dark/40"
                  style={
                    creator.avatar_url
                      ? { backgroundImage: `url(${creator.avatar_url})` }
                      : undefined
                  }
                />
              </div>
              <h3 className="font-bold">{creator.display_name}</h3>
              <p className="text-sm text-white/50">@{creator.username}</p>
              <p className="mt-2 text-sm text-white/70 line-clamp-2">{creator.bio}</p>
              <p className="mt-3 text-sm font-semibold text-brand">
                {creator.subscription_price_monthly > 0
                  ? `${creator.currency} ${creator.subscription_price_monthly} / mes`
                  : "Suscripción gratuita"}
              </p>
            </Link>
          ))}
        </div>
      )}
      </main>
    </>
  );
}
