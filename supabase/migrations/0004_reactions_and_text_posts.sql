-- ============================================================
-- Libertyhot - Publicaciones de texto + Reacciones (like, dislike, fuego, corazon)
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase DESPUES de 0001, 0002 y 0003.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Permitir posts de solo texto (sin foto/video)
-- ------------------------------------------------------------
alter table public.content_posts
  drop constraint if exists content_posts_media_type_check;

alter table public.content_posts
  add constraint content_posts_media_type_check
  check (media_type in ('image', 'video', 'text'));

-- media_url y media_type ahora pueden ser null cuando es un post de texto puro
alter table public.content_posts
  alter column media_url drop not null;

alter table public.content_posts
  alter column media_type drop not null;

-- ------------------------------------------------------------
-- 2. Tabla de reacciones (me gusta, no me gusta, fuego, corazon)
-- ------------------------------------------------------------
create table if not exists public.post_reactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.content_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike', 'fire', 'heart')),
  created_at timestamptz not null default now(),
  -- Un usuario solo puede tener UNA reaccion por post (si eligio "fuego" y
  -- despues toca "corazon", se reemplaza; no se acumulan reacciones distintas
  -- del mismo usuario sobre el mismo post).
  unique (post_id, user_id)
);

create index if not exists idx_post_reactions_post on public.post_reactions(post_id);
create index if not exists idx_post_reactions_user on public.post_reactions(user_id);

alter table public.post_reactions enable row level security;

create policy "Las reacciones son visibles por todos"
  on public.post_reactions for select
  using (true);

create policy "Un usuario crea su propia reaccion"
  on public.post_reactions for insert
  with check (auth.uid() = user_id);

create policy "Un usuario edita su propia reaccion"
  on public.post_reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Un usuario borra su propia reaccion"
  on public.post_reactions for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. Permitir que el propio usuario actualice su avatar/portada/bio
-- ------------------------------------------------------------
-- (Ya existe la policy "Un usuario solo edita su propio perfil" desde
-- 0002_policies.sql, que ya cubre avatar_url, cover_url, bio, display_name.
-- No se necesita nada nuevo aca, solo lo dejamos documentado.)
