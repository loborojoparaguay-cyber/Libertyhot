"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = params.get("role") === "creator" ? "creator" : "subscriber";
  const supabase = createClient();

  const [role, setRole] = useState<"subscriber" | "creator">(defaultRole);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function isAdult(dateStr: string) {
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isAdult(birthDate)) {
      setError("Debés ser mayor de 18 años para registrarte en Libertyhot.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, username },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // Actualizamos el perfil creado automaticamente por el trigger handle_new_user
    // con el rol elegido y la fecha de nacimiento / verificacion de edad.
    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          role,
          birth_date: birthDate,
          is_age_verified: true,
        })
        .eq("id", data.user.id);
    }

    setLoading(false);

    // Guardamos la cookie de age-gate ya que confirmo su fecha de nacimiento.
    document.cookie = `age_verified=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

    router.push(role === "creator" ? "/dashboard/creator/onboarding" : "/explore");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-brand">Libertyhot</h1>
        <p className="mb-6 text-white/60">Creá tu cuenta</p>

        <div className="mb-6 flex rounded-xl border border-white/10 p-1">
          <button
            type="button"
            onClick={() => setRole("subscriber")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              role === "subscriber" ? "bg-brand text-white" : "text-white/60"
            }`}
          >
            Soy fan
          </button>
          <button
            type="button"
            onClick={() => setRole("creator")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              role === "creator" ? "bg-brand text-white" : "text-white/60"
            }`}
          >
            Soy creador/a
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/70">Nombre para mostrar</label>
            <input
              required
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej: María"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Nombre de usuario</label>
            <input
              required
              pattern="[a-z0-9_]+"
              title="Solo minúsculas, números y guión bajo"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="ej: maria_lat"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Fecha de nacimiento</label>
            <input
              type="date"
              required
              className="input"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <p className="mt-1 text-xs text-white/40">Debés ser mayor de 18 años.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        {role === "creator" && (
          <p className="mt-4 rounded-lg bg-white/5 p-3 text-xs text-white/50">
            Como creador/a vas a necesitar verificar tu identidad (documento) antes de
            poder publicar contenido y recibir pagos. Te lo pedimos en el siguiente paso.
          </p>
        )}

        <p className="mt-6 text-center text-sm text-white/60">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-brand underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
