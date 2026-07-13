-- ============================================================
-- Libertyhot - Row Level Security (RLS)
-- ============================================================
-- IMPORTANTE: sin estas politicas, cualquier usuario autenticado
-- podria leer/editar datos de otros usuarios via la API publica
-- de Supabase. Ejecutar este archivo DESPUES de 0001_init.sql.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.creator_verifications enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.content_posts enable row level security;
alter table public.payments enable row level security;

-- ---------------- PROFILES ----------------
create policy "Perfiles publicos son visibles por todos"
  on public.profiles for select
  using (true);

create policy "Un usuario solo edita su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------- CREATOR VERIFICATIONS (privado) ----------------
create policy "El creador sube su propia verificacion"
  on public.creator_verifications for insert
  with check (auth.uid() = creator_id);

create policy "El creador ve solo su propia verificacion"
  on public.creator_verifications for select
  using (auth.uid() = creator_id);
-- Nota: los admins deben usar la Service Role Key (bypassa RLS) para revisar y aprobar.

-- ---------------- SUBSCRIPTION PLANS ----------------
create policy "Planes activos son visibles por todos"
  on public.subscription_plans for select
  using (is_active = true);

create policy "El creador administra sus propios planes"
  on public.subscription_plans for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- ---------------- SUBSCRIPTIONS ----------------
create policy "El suscriptor ve sus propias suscripciones"
  on public.subscriptions for select
  using (auth.uid() = subscriber_id or auth.uid() = creator_id);

create policy "El suscriptor crea su propia suscripcion"
  on public.subscriptions for insert
  with check (auth.uid() = subscriber_id);

-- ---------------- CONTENT POSTS ----------------
-- El contenido "bloqueado" (is_locked = true) NO se expone directo por esta policy:
-- la app debe pedir la URL firmada de storage solo si hay suscripcion activa
-- o pago realizado. Aqui solo dejamos ver los METADATOS del post.
create policy "Los metadatos de posts publicados son visibles por todos"
  on public.content_posts for select
  using (is_published = true);

create policy "El creador administra sus propios posts"
  on public.content_posts for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- ---------------- PAYMENTS ----------------
create policy "El usuario ve solo sus propios pagos"
  on public.payments for select
  using (auth.uid() = payer_id or auth.uid() = creator_id);

-- Los INSERT/UPDATE de payments se hacen SIEMPRE desde el servidor
-- (webhooks de Coinbase/Pagopar) usando la Service Role Key, que bypassa RLS.
-- No se crea policy de insert/update para clientes normales a proposito.
