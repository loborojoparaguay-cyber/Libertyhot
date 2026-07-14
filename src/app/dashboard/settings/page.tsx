"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

/**
 * Panel de personalizacion: foto de perfil, foto de portada, nombre y bio.
 * Las imagenes se suben al bucket publico "avatars" (accesible sin firmar,
 * a diferencia del bucket "content" que es privado para el contenido pago).
 */
export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, bio, avatar_url, cover_url")
      .eq("id", user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url);
      setCoverUrl(profile.cover_url);
    }

    setLoading(false);
  }

  async function uploadImage(file: File, folder: "avatar" | "cover") {
    if (!userId) return null;

    const path = `${userId}/${folder}-${Date.now()}-${file.name}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
    });

    if (error) {
      setMessage(`Error al subir la imagen: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    let newAvatarUrl = avatarUrl;
    let newCoverUrl = coverUrl;

    if (avatarFile) {
      const uploaded = await uploadImage(avatarFile, "avatar");
      if (uploaded) newAvatarUrl = uploaded;
    }

    if (coverFile) {
      const uploaded = await uploadImage(coverFile, "cover");
      if (uploaded) newCoverUrl = uploaded;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        bio,
        avatar_url: newAvatarUrl,
        cover_url: newCoverUrl,
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setMessage(`No se pudieron guardar los cambios: ${error.message}`);
      return;
    }

    setAvatarUrl(newAvatarUrl);
    setCoverUrl(newCoverUrl);
    setAvatarFile(null);
    setCoverFile(null);
    setMessage("¡Perfil actualizado con éxito!");
    router.refresh();
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-6 py-10 text-white/60">Cargando...</main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold">Personalizar mi perfil</h1>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Foto de portada */}
          <div className="card">
            <label className="mb-2 block text-sm font-semibold text-white/80">
              Foto de portada
            </label>
            <div
              className="mb-3 h-32 w-full rounded-xl bg-cover bg-center bg-gradient-to-br from-brand/40 to-brand-dark/40"
              style={{
                backgroundImage: coverFile
                  ? `url(${URL.createObjectURL(coverFile)})`
                  : coverUrl
                  ? `url(${coverUrl})`
                  : undefined,
              }}
            />
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
            <p className="mt-1 text-xs text-white/40">
              Se recomienda una imagen horizontal (ej: 1200x400px).
            </p>
          </div>

          {/* Foto de perfil */}
          <div className="card">
            <label className="mb-2 block text-sm font-semibold text-white/80">
              Foto de perfil
            </label>
            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 flex-shrink-0 rounded-full bg-cover bg-center bg-gradient-to-br from-brand/40 to-brand-dark/40"
                style={{
                  backgroundImage: avatarFile
                    ? `url(${URL.createObjectURL(avatarFile)})`
                    : avatarUrl
                    ? `url(${avatarUrl})`
                    : undefined,
                }}
              />
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* Nombre y bio */}
          <div className="card space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">Nombre para mostrar</label>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Biografía</label>
              <textarea
                className="input"
                rows={4}
                maxLength={280}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Contales algo sobre vos a tus fans..."
              />
              <p className="mt-1 text-right text-xs text-white/40">{bio.length}/280</p>
            </div>
          </div>

          {message && <p className="text-sm text-white/70">{message}</p>}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </main>
    </>
  );
}
