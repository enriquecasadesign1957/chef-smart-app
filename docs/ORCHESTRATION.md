# Orquestación Mi Menú Smart

Separación total de Senior Safe. Repo: `chef-smart-app`.

## Estado (julio 2026)

| Pieza | Estado |
|------|--------|
| GitHub Actions Pages | OK → proyecto `mi-menu-smart` |
| GitHub Actions Worker | OK → `mi-menu-smart-api` |
| Frontend live | https://mi-menu-smart.pages.dev |
| API live | https://mi-menu-smart-api.enriquecasadesign.workers.dev |
| Supabase tablas | OK (`recipes`, `weekly_plans`) en `aknloedykengemrlehyp` |
| Secrets Worker (Groq/Supabase/Twilio) | Pendiente `wrangler secret put` |
| Dominio `cocinaconpresupuesto.cl` | Pendiente DNS + custom domain |
| Capacitor Android | Config + `android/` (generar `.aab` en Studio) |

## Arquitectura

| Capa | Recurso |
|------|---------|
| Frontend PWA | Cloudflare Pages `mi-menu-smart` |
| API | Worker `mi-menu-smart-api` |
| DB | Supabase `aknloedykengemrlehyp` |
| WhatsApp | Twilio **cuenta/número propios** (no Senior Safe) |
| IA | Groq (prioridad) / OpenAI |

Dominio: `cocinaconpresupuesto.cl`  
- Web / PWA → Pages  
- `api.cocinaconpresupuesto.cl` → Worker  

## CI/CD

- `.github/workflows/deploy.yml` → build estático + Pages  
- `.github/workflows/deploy-worker.yml` → Worker API  

Secrets GitHub: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

`NEXT_PUBLIC_MENU_API_URL` y keys publishable de Supabase se hornean en el build de Actions (export estático).

## 1. Supabase

Ya aplicadas las migraciones en el proyecto. SQL de referencia:

1. `supabase/migrations/20260731120000_init_recipes_weekly_plans.sql`
2. `supabase/migrations/20260731120100_seed_recipes.sql`

## 2. Worker — secrets

Nombre en código: **`SUPABASE_SECRET_KEY`** (no `SUPABASE_KEY`).

```bash
cd workers
npm install
npx wrangler login
npx wrangler secret put SUPABASE_URL
# https://aknloedykengemrlehyp.supabase.co
npx wrangler secret put SUPABASE_SECRET_KEY
# service_role / sb_secret_… (solo Worker)
npx wrangler secret put GROQ_API_KEY
# opcional: OPENAI_API_KEY
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_WHATSAPP_FROM
# whatsapp:+XXXXXXXXXXX  (número Mi Menú Smart)
```

### Endpoints

- `POST /recipes` → `{ ingredients, budget, output: "recipes" }`
- `POST /weekly-plan` → menú semanal; opcional `recipient` + `notify: true`
- `POST /notify/whatsapp` → `{ recipient }` → "Tu menú semanal está listo 🍳"

## 3. Frontend

```env
NEXT_PUBLIC_SUPABASE_URL=https://aknloedykengemrlehyp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_MENU_API_URL=https://mi-menu-smart-api.enriquecasadesign.workers.dev
```

## 4. Dominio Cloudflare

1. Zona `cocinaconpresupuesto.cl`
2. Pages custom domain: `cocinaconpresupuesto.cl` (+ `www`)
3. Worker route: `api.cocinaconpresupuesto.cl/*` → `mi-menu-smart-api`
4. Actualizar `NEXT_PUBLIC_MENU_API_URL` en `deploy.yml` y redesplegar

## 5. Twilio (aislado)

Número **distinto** al de Senior Safe. Mensaje: "Tu menú semanal está listo 🍳".

## 6. Android + iOS PWA

```bash
npm run build
npx cap sync android
npx cap open android
```

- `.aab` en Android Studio (`app.chefsmart.mobile`)
- iPhone: Safari → Añadir a inicio → **Mi Menú**

## Prompt IA base

```json
{
  "ingredients": ["pollo", "arroz", "tomate"],
  "budget": 7000,
  "output": "recipes"
}
```
