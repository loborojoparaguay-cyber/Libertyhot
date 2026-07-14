"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

/**
 * Formulario de verificacion KYC del creador: documento de identidad +
 * selfie sosteniendo el documento. Los archivos van al bucket privado
 * "kyc-documents" y NADIE los puede leer via policy de cliente (solo un
 * admin usando la Service Role Key desde un panel interno).
 */
export default function CreatorVerificationPage() {
  const supabase = createClient();
  const [docFront, setDocFront] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docFront || !selfie) return;

    setSubmitting(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const frontPath = `${user.id}/documento-frente-${Date.now()}.jpg`;
    const selfiePath = `${user.id}/selfie-${Date.now()}.jpg`;

    const [frontUpload, selfieUpload] = await Promise.all([
      supabase.storage.from("kyc-documents").upload(frontPath, docFront),
      supabase.storage.from("kyc-documents").upload(selfiePath, selfie),
    ]);

    if (frontUpload.error || selfieUpload.error) {
      setMessage("Error al subir los documentos. Intentá de nuevo.");
      setSubmitting(false);
      return;
    }

    await supabase.from("creator_verifications").insert({
      creator_id: user.id,
      document_front_url: frontPath,
      selfie_with_document_url: selfiePath,
      status: "pending",
    });

    await supabase
      .from("profiles")
      .update({ creator_verification_status: "pending" })
      .eq("id", user.id);

    setSubmitting(false);
    setMessage(
      "¡Documentos enviados! Vamos a revisar tu identidad en las próximas 24-48 horas."
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">Verificación de identidad</h1>
      <p className="mb-6 text-sm text-white/60">
        Por seguridad y cumplimiento legal, todos los creadores deben verificar su
        identidad antes de publicar contenido y recibir pagos. Tus documentos son
        privados y solo los revisa nuestro equipo.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm text-white/70">
            Documento de identidad (frente)
          </label>
          <input
            type="file"
            accept="image/*"
            required
            className="input"
            onChange={(e) => setDocFront(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/70">
            Selfie sosteniendo el documento
          </label>
          <input
            type="file"
            accept="image/*"
            required
            className="input"
            onChange={(e) => setSelfie(e.target.files?.[0] || null)}
          />
        </div>

        {message && <p className="text-sm text-white/70">{message}</p>}

        <button
          type="submit"
          disabled={submitting || !docFront || !selfie}
          className="btn-primary w-full"
        >
          {submitting ? "Enviando..." : "Enviar para revisión"}
        </button>
      </form>
      </main>
    </>
  );
}
