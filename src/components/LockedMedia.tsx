"use client";

import { useState } from "react";

/**
 * Muestra un placeholder borroso para contenido bloqueado, y solo pide la
 * Signed URL real (via API) cuando el usuario hace click en "Ver contenido".
 * Si no tiene acceso, la API responde 403 y mostramos el mensaje de suscripcion.
 */
export default function LockedMedia({
  postId,
  isLocked,
  mediaType,
  previewUrl,
}: {
  postId: string;
  isLocked: boolean;
  mediaType: "image" | "video";
  previewUrl?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [loading, setLoading] = useState(false);

  async function unlock() {
    setLoading(true);
    const res = await fetch(`/api/content/${postId}/signed-url`);
    setLoading(false);

    if (res.status === 403) {
      setNeedsSubscription(true);
      return;
    }

    if (res.ok) {
      const data = await res.json();
      setUrl(data.url);
    }
  }

  if (url) {
    return mediaType === "video" ? (
      <video src={url} controls className="w-full rounded-xl" />
    ) : (
      <img src={url} alt="Contenido" className="w-full rounded-xl object-cover" />
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40">
      {previewUrl && (
        <img
          src={previewUrl}
          alt=""
          className="h-full w-full object-cover blur-2xl scale-110"
        />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 p-4 text-center">
        {needsSubscription ? (
          <>
            <p className="font-semibold">🔒 Contenido exclusivo</p>
            <p className="text-sm text-white/70">Suscribite para desbloquear</p>
          </>
        ) : (
          <button onClick={unlock} disabled={loading} className="btn-primary text-sm">
            {loading ? "Verificando..." : isLocked ? "🔒 Ver contenido" : "▶ Ver contenido"}
          </button>
        )}
      </div>
    </div>
  );
}
