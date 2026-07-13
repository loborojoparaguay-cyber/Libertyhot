# Libertyhot 🔥

Plataforma de contenido exclusivo (tipo OnlyFans) para creadores en Paraguay/LATAM.

Stack: **Next.js 14 + TypeScript + Tailwind CSS + Supabase (DB, Auth, Storage)**.
Pensado para arrancar con costo **casi cero** y escalar de a poco.

---

## ⚠️ Antes de nada: lo legal no es opcional

Esta plataforma maneja contenido para adultos. Como mínimo necesitás:

1. **Verificación de edad** de todos los usuarios (ya incluida: `/age-gate`).
2. **Verificación de identidad (KYC)** de cada creador antes de publicar y cobrar
   (ya incluida: `/dashboard/creator/verification`, revisión manual por admin).
3. **Términos de Servicio y Política de Privacidad** redactados por un abogado
   paraguayo, adaptados a este tipo de negocio (edad mínima, retención de datos
   de identidad, DMCA, etc). El código deja los links listos en `/legal/terminos`
   y `/legal/privacidad`, pero el contenido real de esas páginas **hay que
   escribirlo con asesoría legal**, no es algo que se resuelva solo con código.
4. Revisar los **Términos de Servicio de cada proveedor** (Hostinger, Supabase,
   Cloudflare, Coinbase Commerce) para confirmar que permiten contenido adulto.
   Muchos proveedores "genéricos" (AWS S3, Google Cloud, Stripe, PayPal) lo
   prohíben explícitamente y te pueden cerrar la cuenta sin previo aviso.

---

## 🧱 Qué incluye este proyecto

| Área | Estado |
|---|---|
| Landing page + gate de edad (+18) | ✅ |
| Registro/Login (Supabase Auth) | ✅ |
| Roles: suscriptor / creador / admin | ✅ |
| Perfil público de creador + feed | ✅ |
| Contenido bloqueado con Signed URLs (nunca se expone el archivo real sin permiso) | ✅ |
| Planes de suscripción (gratis o pagos) | ✅ |
| Upload de fotos/videos | ✅ |
| Verificación KYC de creadores (manual) | ✅ |
| Pagos en cripto vía Coinbase Commerce | ✅ (base funcional) |
| Pagos locales (Bancard / Pagopar) | 🚧 Pendiente, ver sección de pagos |
| Panel de administración para aprobar creadores | 🚧 Pendiente (por ahora se aprueba a mano en Supabase) |

---

## 🚀 Setup paso a paso

### 1. Cloná el repo y entrá a la carpeta

```bash
git clone https://github.com/loborojoparaguay-cyber/Libertyhot.git
cd Libertyhot
npm install
```

### 2. Creá tu proyecto en Supabase (gratis)

1. Entrá a https://supabase.com y creá un proyecto nuevo.
2. Ve a **SQL Editor** y ejecutá, en orden, los archivos de `supabase/migrations/`:
   - `0001_init.sql`
   - `0002_policies.sql`
   - `0003_storage_buckets.sql`
3. Ve a **Project Settings > API** y copiá:
   - `Project URL`
   - `anon public key`
   - `service_role key` (¡nunca la expongas en el frontend!)

### 3. Configurá las variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local` con tus datos de Supabase. Por ahora podés dejar vacías
las variables de Coinbase/Pagopar/Bunny hasta que las necesites.

### 4. Corré el proyecto en desarrollo

```bash
npm run dev
```

Abrí http://localhost:3000

### 5. Volvete admin para aprobar creadores (manual, por ahora)

En Supabase, tabla `profiles`, editá tu usuario:
- `role` = `admin`
- Para aprobar un creador: en `profiles` poné `is_creator_verified = true` y
  `creator_verification_status = 'approved'` (revisando antes sus documentos
  en el bucket privado `kyc-documents` desde el panel de Supabase Storage).

---

## 💳 Pagos: cómo está armado y qué falta

**Ya funciona:** Coinbase Commerce (pagos en cripto: BTC, USDT, ETH).
1. Creá una cuenta en https://commerce.coinbase.com/
2. Sacá tu API Key y pegala en `COINBASE_COMMERCE_API_KEY`.
3. Configurá el webhook en Coinbase apuntando a:
   `https://tudominio.lat/api/webhooks/coinbase`
4. Copiá el "Webhook Shared Secret" a `COINBASE_COMMERCE_WEBHOOK_SECRET`.

**Pendiente de integrar (recomendado para pagos locales en Paraguay):**
- **Pagopar** (https://www.pagopar.com/) o **Bancard** (Zimple, Tarjetas locales,
  Giros Tigo, Personal Pay). Cuando tengas la cuenta comercial aprobada, avisame
  y armamos el Route Handler de checkout + webhook igual que el de Coinbase
  (`src/lib/payments/coinbase.ts` es la plantilla a seguir).
- **PayPal / Stripe NO son opciones viables** para este tipo de contenido: sus
  Términos de Servicio prohíben contenido para adultos explícito y pueden
  congelar fondos o cerrar la cuenta sin aviso.

---

## 📦 Almacenamiento de archivos

Por defecto usa **Supabase Storage** (1GB gratis), suficiente para arrancar.
Cuando crezcas, la migración a **Bunny.net** (CDN + storage barato, acepta
contenido adulto) es sencilla: solo hay que cambiar la lógica de
`src/app/api/content/[postId]/signed-url/route.ts` para generar URLs firmadas
de Bunny en vez de Supabase. El resto del código no cambia.

---

## ☁️ Despliegue en Cloudflare Pages

1. Pusheá este repo a GitHub (ya hecho si estás leyendo esto desde ahí).
2. En Cloudflare Dashboard → **Workers & Pages** → **Create application** →
   **Pages** → **Connect to Git** → elegí este repositorio.
3. Framework preset: **Next.js**.
4. Build command: `npx @cloudflare/next-on-pages@1`
   Output directory: `.vercel/output/static`
   (Cloudflare Pages necesita el adaptador `@cloudflare/next-on-pages` para
   correr Next.js con App Router y Route Handlers. Alternativa más simple:
   desplegar en **Vercel**, que soporta Next.js nativo sin adaptador, y usar
   Cloudflare solo como DNS/proxy para tu dominio `.lat`).
5. Agregá las mismas variables de entorno de `.env.local` en la configuración
   del proyecto en Cloudflare/Vercel.

> 💡 Recomendación: si es tu primer despliegue, usá **Vercel** (gratis, cero
> configuración extra para Next.js) y dejá Cloudflare solo para el dominio
> `.lat` (DNS) y protección DDoS. Es más simple y rápido para empezar.

---

## 🗺️ Roadmap sugerido

1. Desplegar en Vercel + dominio `.lat` en Cloudflare DNS.
2. Conseguir tus primeros 5-10 creadores con **plan gratis** para validar.
3. Activar Coinbase Commerce para los primeros pagos reales.
4. Gestionar cuenta con Pagopar/Bancard en paralelo (puede tardar en aprobarse).
5. Cuando el storage de Supabase se llene, migrar a Bunny.net.
6. Redirigir `.lat` → `.py` cuando el presupuesto lo permita.

---

## 🛠️ Stack técnico

- **Frontend/Backend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Base de datos + Auth + Storage:** Supabase (PostgreSQL)
- **Pagos:** Coinbase Commerce (cripto) — Pagopar/Bancard (pendiente)
- **Hosting sugerido:** Vercel (app) + Cloudflare (DNS/CDN del dominio)
