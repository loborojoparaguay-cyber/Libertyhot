import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Webhook de Coinbase Commerce. Coinbase llama a esta URL cuando un pago
 * cambia de estado (confirmed, failed, etc). Verificamos la firma con
 * COINBASE_COMMERCE_WEBHOOK_SECRET antes de confiar en el payload.
 *
 * Configurar esta URL en: Coinbase Commerce Dashboard > Settings > Webhooks
 *   https://tudominio.lat/api/webhooks/coinbase
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-cc-webhook-signature") || "";
  const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || "";

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!secret || signature !== expectedSignature) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event?.type;
  const charge = event.event?.data;
  const metadata = charge?.metadata || {};

  const admin = createAdminClient();

  if (eventType === "charge:confirmed") {
    // Registrar el pago como completado
    await admin.from("payments").insert({
      payer_id: metadata.payerId,
      creator_id: metadata.creatorId || null,
      subscription_id: metadata.subscriptionId || null,
      content_post_id: metadata.contentPostId || null,
      amount: Number(charge.pricing?.local?.amount || 0),
      currency: "USDT",
      provider: "coinbase_commerce",
      status: "completed",
      reference: charge.code,
      raw_payload: event,
    });

    // Si era una suscripcion, activarla
    if (metadata.subscriptionId) {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await admin
        .from("subscriptions")
        .update({
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .eq("id", metadata.subscriptionId);
    }
  }

  if (eventType === "charge:failed") {
    if (metadata.subscriptionId) {
      await admin
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", metadata.subscriptionId);
    }
  }

  return NextResponse.json({ received: true });
}
