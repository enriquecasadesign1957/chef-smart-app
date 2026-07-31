# Chef Smart — setup Supabase (proyecto independiente)

Senior Safe **no** debe usarse. Crea un proyecto nuevo en https://supabase.com llamado `chef_smart`.

## 1. Crear proyecto

1. New project → nombre `chef_smart` → región cercana (ej. South America).
2. Copia **Project URL** y **anon public** key.

## 2. SQL

En SQL Editor, ejecuta en orden:

1. `supabase/migrations/20260731120000_init_recipes_weekly_plans.sql`
2. `supabase/migrations/20260731120100_seed_recipes.sql`

## 3. Frontend

```bash
cp .env.example .env.local
# pega URL + anon key de chef_smart
npm run dev
```

## Capas de datos

| Capa | Rol |
|------|-----|
| `src/lib/api/recipes.ts` | Contrato tipo `POST /recipes` (ingredientes + presupuesto) |
| `src/lib/api/weekly-plan.ts` | Contrato tipo `POST /weekly-plan` (genera + guarda si hay Auth) |
| `src/hooks/use-recipes.ts` | Hook lectura/búsqueda |
| `src/hooks/use-weekly-plan.ts` | Hook generación/persistencia |

Con **Cloudflare Pages (static export)** no hay Route Handlers de Next; el cliente habla con Supabase directo (anon + RLS). Si no hay `.env.local`, el UI usa **demo local**.

## Auth

`weekly_plans.user_id` → `auth.users`. Sin login, el plan se genera pero **no** se guarda. Activa Email auth en el proyecto `chef_smart` cuando quieras cuentas.
