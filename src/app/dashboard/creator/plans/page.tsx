"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: "PYG" | "USD";
  interval: "monthly" | "yearly";
  is_free: boolean;
  is_active: boolean;
}

/**
 * Panel simple para que el creador cree/edite sus planes de suscripcion.
 * Empieza simple: nombre, precio, moneda, gratis o pago.
 */
export default function CreatorPlansPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("Plan mensual");
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState<"PYG" | "USD">("PYG");
  const [isFree, setIsFree] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    setPlans(data || []);
    setLoading(false);
  }

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("subscription_plans").insert({
      creator_id: user.id,
      name,
      price: isFree ? 0 : Number(price),
      currency,
      is_free: isFree,
      interval: "monthly",
    });

    // Mantenemos sincronizado el precio "de vidriera" en el perfil publico.
    await supabase
      .from("profiles")
      .update({ subscription_price_monthly: isFree ? 0 : Number(price), currency })
      .eq("id", user.id);

    setSaving(false);
    setName("Plan mensual");
    setPrice("0");
    setIsFree(true);
    loadPlans();
  }

  async function togglePlan(planId: string, isActive: boolean) {
    await supabase.from("subscription_plans").update({ is_active: !isActive }).eq("id", planId);
    loadPlans();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Mis planes de suscripción</h1>

      <form onSubmit={createPlan} className="card mb-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-white/70">Nombre del plan</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="isFree"
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
          />
          <label htmlFor="isFree" className="text-sm text-white/70">
            Plan gratuito (recomendado para empezar y ganar suscriptores)
          </label>
        </div>

        {!isFree && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-white/70">Precio mensual</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Moneda</label>
              <select
                className="input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "PYG" | "USD")}
              >
                <option value="PYG">PYG (Gs.)</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Guardando..." : "Crear plan"}
        </button>
      </form>

      <h2 className="mb-3 text-lg font-bold">Planes existentes</h2>
      {loading ? (
        <p className="text-white/50">Cargando...</p>
      ) : plans.length === 0 ? (
        <p className="text-white/50">Todavía no creaste ningún plan.</p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{plan.name}</p>
                <p className="text-sm text-white/60">
                  {plan.is_free ? "Gratis" : `${plan.currency} ${plan.price} / mes`}
                </p>
              </div>
              <button
                onClick={() => togglePlan(plan.id, plan.is_active)}
                className="btn-secondary text-xs"
              >
                {plan.is_active ? "Desactivar" : "Activar"}
              </button>
            </div>
          ))}
        </div>
      )}
      </main>
    </>
  );
}
