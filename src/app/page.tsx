import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-2xl font-extrabold text-brand">Libertyhot</span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/80 hover:text-white">
            Iniciar sesión
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            Registrarme
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-16 text-center md:py-24">
        <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
          Contenido exclusivo,{" "}
          <span className="text-brand">directo de tus creadores favoritos</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/70">
          Libertyhot es la plataforma paraguaya para que creadores compartan contenido
          exclusivo con su comunidad y reciban apoyo directo de sus fans.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/register?role=creator" className="btn-primary">
            Quiero ser creador/a
          </Link>
          <Link href="/explore" className="btn-secondary">
            Explorar creadores
          </Link>
        </div>
        <p className="mt-6 text-xs uppercase tracking-wide text-white/40">
          🔒 Sitio exclusivo para mayores de 18 años · Pagos seguros
        </p>
      </section>

      {/* Beneficios */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-3">
        <div className="card">
          <h3 className="mb-2 text-lg font-bold text-brand">Para creadores</h3>
          <p className="text-sm text-white/70">
            Publicá fotos y videos, definí tu precio de suscripción y recibí pagos
            de tu comunidad. Vos tenés el control de tu contenido.
          </p>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-bold text-brand">Para fans</h3>
          <p className="text-sm text-white/70">
            Suscribite a tus creadores favoritos y accedé a contenido exclusivo que
            no vas a encontrar en ningún otro lado.
          </p>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-bold text-brand">Pagos flexibles</h3>
          <p className="text-sm text-white/70">
            Aceptamos pagos locales y criptomonedas, pensado para Paraguay y
            Latinoamérica.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Libertyhot. Todos los derechos reservados. Sitio
        exclusivo para mayores de 18 años. Cumplimos verificación de identidad de
        creadores conforme a normativa vigente.
      </footer>
    </main>
  );
}
