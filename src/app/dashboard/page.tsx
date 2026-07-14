import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role === "creator") {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-bold">Hola, {profile.display_name} 👋</h1>
        <p className="mb-8 text-white/60">Panel de creador/a</p>

        {profile.creator_verification_status !== "approved" && (
          <div className="card mb-6 border-yellow-500/30 bg-yellow-500/5">
            <p className="font-semibold text-yellow-400">
              ⚠️ Verificación de identidad pendiente
            </p>
            <p className="mt-1 text-sm text-white/60">
              Necesitás verificar tu identidad antes de poder publicar y recibir pagos.
            </p>
            <Link href="/dashboard/creator/verification" className="btn-primary mt-3 inline-block text-sm">
              Verificar mi identidad
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/creator/upload" className="card hover:border-brand/50">
            <h3 className="font-bold">📤 Subir contenido</h3>
            <p className="text-sm text-white/60">Publicá fotos y videos para tus suscriptores.</p>
          </Link>
          <Link href="/dashboard/creator/plans" className="card hover:border-brand/50">
            <h3 className="font-bold">💳 Mis planes</h3>
            <p className="text-sm text-white/60">Configurá tus precios de suscripción.</p>
          </Link>
          <Link href={`/creator/${profile.username}`} className="card hover:border-brand/50">
            <h3 className="font-bold">👤 Ver mi perfil público</h3>
            <p className="text-sm text-white/60">Así te ven tus fans.</p>
          </Link>
        </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold">Hola, {profile?.display_name} 👋</h1>
      <p className="mb-8 text-white/60">Tu panel de suscriptor</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/explore" className="card hover:border-brand/50">
          <h3 className="font-bold">🔍 Explorar creadores</h3>
          <p className="text-sm text-white/60">Descubrí contenido exclusivo.</p>
        </Link>
        <Link href="/dashboard/subscriptions" className="card hover:border-brand/50">
          <h3 className="font-bold">❤️ Mis suscripciones</h3>
          <p className="text-sm text-white/60">Gestioná a quién estás suscripto.</p>
        </Link>
      </div>
      </main>
    </>
  );
}
