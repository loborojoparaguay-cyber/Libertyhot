import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MySubscriptionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_end, creator:creator_id(username, display_name)")
    .eq("subscriber_id", user.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Mis suscripciones</h1>

      {!subscriptions || subscriptions.length === 0 ? (
        <div className="card text-center text-white/60">
          Todavía no estás suscripto a ningún creador.
          <div className="mt-4">
            <Link href="/explore" className="btn-primary">
              Explorar creadores
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub: any) => (
            <div key={sub.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{sub.creator?.display_name}</p>
                <p className="text-sm text-white/50">@{sub.creator?.username}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  sub.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {sub.status === "active" ? "Activa" : sub.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
