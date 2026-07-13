-- ============================================================
-- Libertyhot - Esquema inicial de base de datos (Supabase/Postgres)
-- ============================================================
-- Como aplicar:
--   1. Crea un proyecto en https://supabase.com (gratis).
--   2. Ve a SQL Editor y pega/ejecuta este archivo completo.
--   3. Luego ejecuta 0002_policies.sql
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- PROFILES: 1 fila por usuario, extiende auth.users de Supabase
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  role text not null default 'subscriber' check (role in ('subscriber', 'creator', 'admin')),
  avatar_url text,
  cover_url text,
  bio text,
  -- Verificacion de edad del USUARIO (obligatoria para navegar contenido +18)
  is_age_verified boolean not null default false,
  birth_date date,
  -- Verificacion KYC del CREADOR (documento de identidad, obligatoria antes de publicar)
  is_creator_verified boolean not null default false,
  creator_verification_status text default 'not_submitted'
    check (creator_verification_status in ('not_submitted', 'pending', 'approved', 'rejected')),
  subscription_price_monthly numeric(10,2) default 0,
  currency text default 'PYG' check (currency in ('PYG', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil publico/privado de cada usuario. role define si es suscriptor, creador o admin.';

-- ------------------------------------------------------------
-- CREATOR VERIFICATION DOCS: documentos de identidad (privado, solo admin)
-- ------------------------------------------------------------
create table if not exists public.creator_verifications (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  document_front_url text not null,
  document_back_url text,
  selfie_with_document_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

comment on table public.creator_verifications is 'Documentos KYC de creadores. Acceso restringido solo a admins via RLS.';

-- ------------------------------------------------------------
-- SUBSCRIPTION PLANS: planes que cada creador define
-- ------------------------------------------------------------
create table if not exists public.subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Plan mensual',
  price numeric(10,2) not null default 0,
  currency text not null default 'PYG' check (currency in ('PYG', 'USD')),
  interval text not null default 'monthly' check (interval in ('monthly', 'yearly')),
  is_free boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SUBSCRIPTIONS: relacion suscriptor <-> creador
-- ------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'pending_payment'
    check (status in ('active', 'canceled', 'expired', 'pending_payment')),
  current_period_start timestamptz default now(),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  unique (subscriber_id, creator_id)
);

-- ------------------------------------------------------------
-- CONTENT POSTS: fotos/videos publicados por creadores
-- ------------------------------------------------------------
create table if not exists public.content_posts (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  is_locked boolean not null default true,
  price_unlock numeric(10,2), -- pay-per-view opcional, null = solo con suscripcion
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PAYMENTS: registro de todos los pagos (crypto, Pagopar, Bancard, etc)
-- ------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  payer_id uuid not null references public.profiles(id),
  creator_id uuid references public.profiles(id),
  subscription_id uuid references public.subscriptions(id),
  content_post_id uuid references public.content_posts(id),
  amount numeric(10,2) not null,
  currency text not null check (currency in ('PYG', 'USD', 'USDT', 'BTC')),
  provider text not null check (provider in ('coinbase_commerce', 'pagopar', 'bancard', 'manual')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  reference text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Trigger: crear perfil automaticamente al registrarse en auth.users
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)),
    coalesce(new.raw_user_meta_data->>'display_name', 'Usuario')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indices utiles
create index if not exists idx_content_posts_creator on public.content_posts(creator_id);
create index if not exists idx_subscriptions_creator on public.subscriptions(creator_id);
create index if not exists idx_subscriptions_subscriber on public.subscriptions(subscriber_id);
create index if not exists idx_payments_payer on public.payments(payer_id);
