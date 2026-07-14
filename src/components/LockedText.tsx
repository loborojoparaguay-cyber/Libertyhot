"use client";

import { useState } from "react";

/**
 * Publicacion de solo texto (tipo Facebook). Si esta bloqueada, muestra
 * un preview difuminado y solo revela el texto completo cuando el usuario
 * confirma que tiene acceso (suscripcion activa o pago).
 */
export default function LockedText({
  postId,
  isLocked,
  previewCaption,
}: {
  postId: string;
  isLocked: boolean;
  previewCaption: string | null;
}) {
  const [caption, setCaption] = useState<string | null>(isLocked ? null : previewCaption);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(!isLocked);

  async function unlock() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/content/${postId}/text`);

      if (res.status === 401) {
        setErrorMessage("Necesitás iniciar sesión para ver esta publicación.");
        return;
      }

      if (res.status === 403) {
        setNeedsSubscription(true);
        return;
      }

      if (!res.ok) {
        setErrorMessage("No se pudo cargar la publicación.");
        return;
      }

      const data = await res.json();
      setCaption(data.caption);
      setRevealed(true);
    } catch {
      setErrorMessage("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (revealed) {
    return <p className="whitespace-pre-wrap text-white/90">{caption}</p>;
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-black/40 p-6 text-center">
      <p className="select-none whitespace-pre-wrap text-white/20 blur-sm">
        {previewCaption?.slice(0, 60) || "Contenido exclusivo para suscriptores de este creador."}
      </p>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 p-4">
        {needsSubscription ? (
          <>
            <p className="font-semibold">🔒 Publicación exclusiva</p>
            <p className="text-sm text-white/70">Suscribite para leer el contenido completo</p>
          </>
        ) : (
          <>
            <button onClick={unlock} disabled={loading} className="btn-primary text-sm">
              {loading ? "Verificando..." : "🔒 Ver publicación"}
            </button>
            {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}
          </>
        )}
      </div>
    </div>
  );
}
