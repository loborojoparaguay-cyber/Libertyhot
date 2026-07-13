import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createCryptoCharge } from "@/lib/payments/coinbase";

/**
 * Crea (o reactiva) una suscripcion de un fan hacia un creador.
 *
 * - Si el plan es gratis (is_free = true): activa la suscripcion directo,
 *   sin pasar por ningun procesador de pago.
 * - Si el plan es pago: crea un "charge" en Coinbase Commerce y devuelve
 *   la URL de checkout hosteado para que el usuario pague con cripto.
 *   La suscripcion queda en estado "pending_payment" hasta que el webhook
 *   de Coinbase confirme el pago (ver /api/webhooks/coinbase).
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { planId, creatorId } = await request.json();

  if (!planId || !creatorId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  if (user.id === creatorId) {
    return NextResponse.json({ error: "No podés suscribirte a tu propio perfil" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: plan, error: planError } = await admin
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .eq("creator_id", creatorId)
    .eq("is_active", true)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  const periodEnd = new Date();
  if (plan.interval === "yearly") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // --- Plan gratis: activar directo, sin pago ---
  if (plan.is_free || Number(plan.price) === 0) {
    const { error: upsertError } = await admin
      .from("subscriptions")
      .upsert(
        {
          subscriber_id: user.id,
          creator_id: creatorId,
          plan_id: plan.id,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        },
        { onConflict: "subscriber_id,creator_id" }
      );

    if (upsertError) {
      return NextResponse.json({ error: "No se pudo activar la suscripción" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // --- Plan pago: crear suscripcion pendiente + charge en Coinbase Commerce ---
  const { data: subscription, error: subError } = await admin
    .from("subscriptions")
    .upsert(
      {
        subscriber_id: user.id,
        creator_id: creatorId,
        plan_id: plan.id,
        status: "pending_payment",
        current_period_end: periodEnd.toISOString(),
      },
      { onConflict: "subscriber_id,creator_id" }
    )
    .select()
    .single();

  if (subError || !subscription) {
    return NextResponse.json({ error: "No se pudo iniciar la suscripción" }, { status: 500 });
  }

  try {
    const charge = await createCryptoCharge({
      name: `Suscripción a creador (${plan.name})`,
      description: "Pago de suscripción mensual en Libertyhot",
      amount: plan.price,
      currency: plan.currency,
      metadata: {
        subscriptionId: subscription.id,
        payerId: user.id,
        creatorId,
        type: "subscription",
      },
    });

    return NextResponse.json({ checkoutUrl: charge.hosted_url });
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo iniciar el pago. Intentá de nuevo en unos minutos." },
      { status: 502 }
    );
  }
}
