-- Chef Smart — proyecto Supabase independiente (NO Senior Safe)
-- Proyecto sugerido: chef_smart
-- Ejecutar en SQL Editor o via CLI: supabase db push

create extension if not exists "pgcrypto";

-- Catálogo de recetas (público de lectura)
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ingredients jsonb not null default '[]'::jsonb,
  cost numeric(12, 2) not null check (cost >= 0),
  difficulty text not null check (difficulty in ('Fácil', 'Media', 'Chef')),
  time integer not null check (time > 0),
  created_at timestamptz not null default now()
);

create index if not exists recipes_cost_idx on public.recipes (cost);
create index if not exists recipes_ingredients_gin on public.recipes using gin (ingredients);

-- Plan semanal por usuario (auth.users de Supabase Auth)
create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day text not null check (
    day in ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')
  ),
  meal_type text not null check (meal_type in ('desayuno', 'almuerzo', 'cena')),
  recipe_id uuid not null references public.recipes (id) on delete restrict,
  budget numeric(12, 2) not null check (budget >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, day, meal_type)
);

create index if not exists weekly_plans_user_idx on public.weekly_plans (user_id);

alter table public.recipes enable row level security;
alter table public.weekly_plans enable row level security;

-- Recetas: cualquiera puede leer; solo service role escribe (seed / admin)
drop policy if exists "recipes_select_public" on public.recipes;
create policy "recipes_select_public"
  on public.recipes for select
  to anon, authenticated
  using (true);

-- Planes: solo el dueño
drop policy if exists "weekly_plans_select_own" on public.weekly_plans;
create policy "weekly_plans_select_own"
  on public.weekly_plans for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "weekly_plans_insert_own" on public.weekly_plans;
create policy "weekly_plans_insert_own"
  on public.weekly_plans for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "weekly_plans_update_own" on public.weekly_plans;
create policy "weekly_plans_update_own"
  on public.weekly_plans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "weekly_plans_delete_own" on public.weekly_plans;
create policy "weekly_plans_delete_own"
  on public.weekly_plans for delete
  to authenticated
  using (auth.uid() = user_id);
