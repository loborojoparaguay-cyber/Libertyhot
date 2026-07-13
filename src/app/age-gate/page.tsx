"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

/**
 * Gate de verificacion de edad. Se muestra ANTES de dejar entrar a cualquier
 * parte del sitio (ver src/middleware.ts). Guarda una cookie "age_verified"
 * que el middleware revisa en cada request.
 *
 * IMPORTANTE: esto es una declaracion del usuario, NO reemplaza la verificacion
 * de identidad real de los creadores (eso se hace con documento, ver KYC).
 * Para produccion seria bueno reforzar esto con un verificador de edad de terceros
 * (ej. Yoti, Veriff) antes de permitir pagos.
 */
function AgeGateContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const [rejected, setRejected] = useState(false);

  function confirmAge() {
    document.cookie = `age_verified=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    router.push(redirect);
  }

  function denyAge() {
    setRejected(true);
  }

  if (rejected) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">Lo sentimos</h1>
          <p className="text-white/70">
            Este sitio contiene material exclusivo para adultos. Debes ser mayor de 18 años
            para acceder a Libertyhot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <h1 className="mb-2 text-3xl font-bold text-brand">Libertyhot</h1>
        <p className="mb-6 text-white/70">
          Este sitio contiene contenido exclusivo para adultos y está disponible
          únicamente para personas mayores de 18 años.
        </p>
        <p className="mb-8 font-semibold">¿Confirmas que eres mayor de 18 años?</p>
        <div className="flex gap-3">
          <button onClick={denyAge} className="btn-secondary flex-1">
            No, salir
          </button>
          <button onClick={confirmAge} className="btn-primary flex-1">
            Sí, soy mayor de 18
          </button>
        </div>
        <p className="mt-6 text-xs text-white/40">
          Al continuar aceptas nuestros{" "}
          <a href="/legal/terminos" className="underline">
            Términos de Servicio
          </a>{" "}
          y{" "}
          <a href="/legal/privacidad" className="underline">
            Política de Privacidad
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default function AgeGatePage() {
  return (
    <Suspense fallback={null}>
      <AgeGateContent />
    </Suspense>
  );
}
