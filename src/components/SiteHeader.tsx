"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Encabezado compartido con el nombre/logo de Libertyhot. Se usa en todas
 * las paginas internas (dashboard, explorar, perfil de creador, etc) para
 * que la marca siempre este visible y el usuario pueda volver al inicio
 * o cerrar sesion facilmente.
 */
export default function SiteHeader() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-12">
      <Link href="/" className="text-xl font-extrabold text-brand">
        Libertyhot
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/explore" className="text-white/70 hover:text-white">
          Explorar
        </Link>
        <Link href="/dashboard" className="text-white/70 hover:text-white">
          Mi panel
        </Link>
        <Link href="/dashboard/settings" className="text-white/70 hover:text-white">
          ⚙️ Personalizar
        </Link>
        <button onClick={handleSignOut} className="text-white/70 hover:text-white">
          Cerrar sesión
        </button>
      </nav>
    </header>
  );
}
