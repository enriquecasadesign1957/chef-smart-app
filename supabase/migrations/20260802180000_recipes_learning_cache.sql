-- =============================================================================
-- Mi Menú Smart — recipes learning cache
-- Proyecto: aknloedykengemrlehyp (NO Senior Safe)
-- Archivo: supabase/migrations/20260802180000_recipes_learning_cache.sql
--
-- Compatible con Worker mi-menu-smart-api:
--   columnas: id, name, ingredients (jsonb), cost, difficulty, time,
--             steps, photo_keyword, ingredients_key, created_at
-- ingredients_key ejemplo: "cebolla,papas,tomates" (orden alfabético)
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1) Si NO existe: crear tabla completa (Worker-compatible)
--    Nota: usamos name/cost/time (no title/estimated_cost/cooking_time)
--          porque el Worker inserta con esos nombres.
-- -----------------------------------------------------------------------------
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ingredients jsonb not null default '[]'::jsonb,
  ingredients_key text,
  steps jsonb not null default '[]'::jsonb,
  time integer not null check (time > 0),
  difficulty text not null check (difficulty in ('Fácil', 'Media', 'Chef')),
  cost numeric(12, 2) not null check (cost >= 0),
  photo_keyword text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2) Si YA existe: añadir columnas de aprendizaje sin romper datos previos
-- -----------------------------------------------------------------------------
alter table public.recipes
  add column if not exists ingredients_key text;

alter table public.recipes
  add column if not exists steps jsonb;

alter table public.recipes
  add column if not exists photo_keyword text;

-- Defaults seguros para filas antiguas (no fuerza NOT NULL hasta rellenar)
update public.recipes
set steps = '[]'::jsonb
where steps is null;

alter table public.recipes
  alter column steps set default '[]'::jsonb;

alter table public.recipes
  alter column steps set not null;

-- -----------------------------------------------------------------------------
-- 3) Índice para caché ultra rápida por ingredients_key
-- -----------------------------------------------------------------------------
create index if not exists recipes_ingredients_key_idx
  on public.recipes (ingredients_key);

create index if not exists recipes_cost_idx
  on public.recipes (cost);

create index if not exists recipes_ingredients_gin
  on public.recipes using gin (ingredients);

-- -----------------------------------------------------------------------------
-- 4) Comentarios / contrato con el Worker
-- -----------------------------------------------------------------------------
comment on table public.recipes is
  'Catálogo de recetas Mi Menú Smart (aprendizaje autónomo Groq → Supabase)';

comment on column public.recipes.name is
  'Título del plato (Worker: name)';

comment on column public.recipes.ingredients is
  'Array JSON de ingredientes (Worker: ingredients jsonb)';

comment on column public.recipes.ingredients_key is
  'Ingredientes clave limpios + orden alfabético, unidos por coma. Ej: cebolla,papas,tomates';

comment on column public.recipes.steps is
  'Instrucciones paso a paso (jsonb array de text)';

comment on column public.recipes.time is
  'Tiempo de cocción en minutos (Worker: time / cooking_time)';

comment on column public.recipes.difficulty is
  'Fácil | Media | Chef';

comment on column public.recipes.cost is
  'Costo estimado CLP (Worker: cost / estimated_cost)';

comment on column public.recipes.photo_keyword is
  'Keyword inglés Unsplash, kebab-case. Ej: baked-potato, tomato-soup';

-- -----------------------------------------------------------------------------
-- 5) RLS (idempotente): lectura pública; escritura vía service_role del Worker
-- -----------------------------------------------------------------------------
alter table public.recipes enable row level security;

drop policy if exists "recipes_select_public" on public.recipes;
create policy "recipes_select_public"
  on public.recipes for select
  to anon, authenticated
  using (true);
