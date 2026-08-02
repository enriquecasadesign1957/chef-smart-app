-- Mi Menú Smart — aprendizaje de recetas (caché por ingredientes clave)
-- Ejecutar en SQL Editor del proyecto aknloedykengemrlehyp

alter table public.recipes
  add column if not exists steps jsonb not null default '[]'::jsonb;

alter table public.recipes
  add column if not exists photo_keyword text;

alter table public.recipes
  add column if not exists ingredients_key text;

create index if not exists recipes_ingredients_key_idx
  on public.recipes (ingredients_key);

comment on column public.recipes.steps is 'Pasos / instrucciones de preparación (json array de text)';
comment on column public.recipes.photo_keyword is 'Keyword inglés para imagen del plato (ej. baked-potato)';
comment on column public.recipes.ingredients_key is 'Ingredientes clave limpios y ordenados, unidos por |';
