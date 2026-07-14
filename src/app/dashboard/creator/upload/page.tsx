"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

type PostKind = "media" | "text";

/**
 * Formulario para que el creador publique:
 * - Foto/video (sube al bucket "content", privado).
 * - Publicacion de solo texto (tipo Facebook), sin necesidad de archivo.
 * Por defecto los posts se crean bloqueados (is_locked = true), es decir
 * solo visibles para suscriptores.
 */
export default function UploadContentPage() {
  const supabase = createClient();
  const [postKind, setPostKind] = useState<PostKind>("media");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (postKind === "media" && !file) return;
    if (postKind === "text" && !caption.trim()) return;

    setUploading(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Necesitás iniciar sesión.");
      setUploading(false);
      return;
    }

    // --- Publicacion de solo texto, tipo Facebook ---
    if (postKind === "text") {
      const { error: insertError } = await supabase.from("content_posts").insert({
        creator_id: user.id,
        caption,
        media_url: null,
        media_type: "text",
        is_locked: isLocked,
      });

      setUploading(false);

      if (insertError) {
        setMessage(`No se pudo publicar: ${insertError.message}`);
        return;
      }

      setMessage("¡Publicación de texto creada con éxito!");
      setCaption("");
      return;
    }

    // --- Publicacion de foto/video ---
    if (!file) return;

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
        <h1 className="mb-6 text-2xl font-bold">Crear publicación</h1>

        <div className="mb-6 flex rounded-xl border border-white/10 p-1">
          <button
            type="button"
            onClick={() => setPostKind("media")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              postKind === "media" ? "bg-brand text-white" : "text-white/60"
            }`}
          >
            📷 Foto o video
          </button>
          <button
            type="button"
            onClick={() => setPostKind("text")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              postKind === "text" ? "bg-brand text-white" : "text-white/60"
            }`}
          >
            ✏️ Solo texto
          </button>
        </div>

        <form onSubmit={handleUpload} className="card space-y-4">
          {postKind === "media" ? (
            <div>
              <label className="mb-1 block text-sm text-white/70">Foto o video</label>
              <input
                type="file"
                accept="image/*,video/*"
                required={postKind === "media"}
                className="input"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm text-white/70">
              {postKind === "text" ? "¿Qué estás pensando?" : "Descripción (opcional)"}
            </label>
            <textarea
              className="input"
              rows={postKind === "text" ? 5 : 3}
              required={postKind === "text"}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={
                postKind === "text" ? "Escribí algo para tus fans..." : undefined
              }
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

          <button
            type="submit"
            disabled={uploading || (postKind === "media" ? !file : !caption.trim())}
            className="btn-primary w-full"
          >
            {uploading ? "Publicando..." : "Publicar"}
          </button>
        </form>
      </main>
    </>
  );
}
