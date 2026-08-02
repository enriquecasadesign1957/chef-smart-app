# Mi Menú Smart — setup Supabase (proyecto independiente)

Senior Safe **no** debe usarse. Proyecto remoto: `aknloedykengemrlehyp`.

## 1. Variables locales

```env
NEXT_PUBLIC_SUPABASE_URL=https://aknloedykengemrlehyp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

(Archivo `.env.local` en la raíz del repo; no se sube a Git.)

## 2. SQL (obligatorio una vez)

En [SQL Editor](https://supabase.com/dashboard/project/aknloedykengemrlehyp/sql/new) ejecuta en orden:

1. `supabase/migrations/20260731120000_init_recipes_weekly_plans.sql`
2. `supabase/migrations/20260731120100_seed_recipes.sql`
3. `supabase/migrations/20260802180000_recipes_learning_cache.sql` (steps, photo_keyword, ingredients_key)

O con CLI (tras login + link):

```bash
npx supabase login
npx supabase link --project-ref aknloedykengemrlehyp
npx supabase db push
```

`link` pide la **database password** (Dashboard → Settings → Database).

## Capas de datos

| Capa | Rol |
|------|-----|
| `src/lib/api/recipes.ts` | Contrato tipo `POST /recipes` |
| `src/lib/api/weekly-plan.ts` | Contrato tipo `POST /weekly-plan` |
| `src/hooks/use-recipes.ts` | Hook lectura/búsqueda |
| `src/hooks/use-weekly-plan.ts` | Hook generación/persistencia |

Sin `.env.local` → UI usa **demo local**. Con keys pero sin tablas → error hasta correr migraciones.

## Auth

`weekly_plans.user_id` → `auth.users`. Sin login, el plan se genera pero **no** se guarda.
