/**
 * Integracion minima con Coinbase Commerce para aceptar pagos en cripto
 * (BTC, USDT, ETH, etc). Elegido como primer procesador porque:
 * - No pide aprobacion previa de "contenido para adultos" como Stripe/PayPal.
 * - Sin costos de setup, solo % por transaccion (~1%).
 * - Ideal para arrancar mientras se gestiona Bancard/Pagopar en Paraguay.
 *
 * Docs: https://docs.cdp.coinbase.com/commerce-onchain/docs/getting-started
 */

const COINBASE_API_URL = "https://api.commerce.coinbase.com/charges";

export async function createCryptoCharge(params: {
  name: string;
  description: string;
  amount: number;
  currency: "PYG" | "USD";
  metadata: Record<string, string>;
}) {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Falta configurar COINBASE_COMMERCE_API_KEY en las variables de entorno."
    );
  }

  // Coinbase Commerce factura en USD/fiat estandar; si el monto esta en PYG
  // hay que convertirlo antes de llegar aca (ver nota en README sobre tipo de cambio).
  const res = await fetch(COINBASE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CC-Api-Key": apiKey,
      "X-CC-Version": "2018-03-22",
    },
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      pricing_type: "fixed_price",
      local_price: {
        amount: params.amount.toFixed(2),
        currency: params.currency === "PYG" ? "USD" : params.currency,
      },
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Coinbase Commerce error: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.data as { hosted_url: string; id: string; code: string };
}
