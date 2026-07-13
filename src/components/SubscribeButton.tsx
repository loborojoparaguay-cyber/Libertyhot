"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Al hacer click, llama a /api/subscriptions/create. Esa ruta decide:
 * - Si el plan es gratis -> activa la suscripcion directo.
 * - Si el plan es pago -> crea un cargo en Coinbase Commerce y redirige
 *   al usuario a la pagina de pago (hosted checkout).
 */
export default function SubscribeButton({
  planId,
  creatorId,
  label,
}: {
  planId: string;
  creatorId: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/subscriptions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, creatorId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      setError(data.error || "Ocurrió un error");
      return;
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className="btn-primary text-sm">
        {loading ? "Procesando..." : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
