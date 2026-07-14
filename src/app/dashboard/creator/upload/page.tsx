"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

/**
 * Formulario para que el creador suba fotos/videos a su bucket "content"
 * (privado). Se guarda como content/{creatorId}/{timestamp}-{filename}.
 * Por defecto los posts se crean bloqueados (is_locked = true), es decir
 * solo visibles para suscriptores.
 */
export default function UploadContentPage() {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Necesitás iniciar sesión.");
      setUploading(false);
      return;
    }

    const mediaType = file.type.startsWith("video") ? "video" : "image";
    const path = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("content")
      .upload(path, file);

    if (uploadError) {
      setMessage(`Error al subir el archivo: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("content_posts").insert({
      creator_id: user.id,
      caption,
      media_url: path,
      media_type: mediaType,
      is_locked: isLocked,
    });

    setUploading(false);

    if (insertError) {
      setMessage(`Se subió el archivo pero falló al crear el post: ${insertError.message}`);
      return;
    }

    setMessage("¡Contenido publicado con éxito!");
    setFile(null);
    setCaption("");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Subir contenido</h1>

      <form onSubmit={handleUpload} className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm text-white/70">Foto o video</label>
          <input
            type="file"
            accept="image/*,video/*"
            required
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/70">Descripción (opcional)</label>
          <textarea
            className="input"
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="isLocked"
            type="checkbox"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.target.checked)}
          />
          <label htmlFor="isLocked" className="text-sm text-white/70">
            Contenido exclusivo (solo para suscriptores)
          </label>
        </div>

        {message && <p className="text-sm text-white/70">{message}</p>}

        <button type="submit" disabled={uploading || !file} className="btn-primary w-full">
          {uploading ? "Subiendo..." : "Publicar"}
        </button>
      </form>
      </main>
    </>
  );
}
