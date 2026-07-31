# Orquestación Mi Menú Smart

Separación total de Senior Safe. Repo: `chef-smart-app`.

## Arquitectura

| Capa | Recurso |
|------|---------|
| Frontend PWA | Cloudflare Pages (`chef-smart-app`) |
| API | Cloudflare Worker `mi-menu-smart-api` |
| DB | Supabase `aknloedykengemrlehyp` |
| WhatsApp | Twilio **cuenta/número propios** (no Senior Safe) |
| IA | Groq (prioridad) / OpenAI |

Dominio: `cocinaconpresupuesto.cl`  
- Web / PWA → Pages  
- `api.cocinaconpresupuesto.cl` → Worker  

## 1. Supabase (tablas)

SQL Editor del proyecto → ejecutar:

1. `supabase/migrations/20260731120000_init_recipes_weekly_plans.sql`
2. `supabase/migrations/20260731120100_seed_recipes.sql`

## 2. Worker — secrets

```bash
cd workers
npm install
npx wrangler login
npx wrangler secret put SUPABASE_URL
# https://aknloedykengemrlehyp.supabase.co
npx wrangler secret put SUPABASE_SECRET_KEY
# sb_secret_… o service_role (solo Worker)
npx wrangler secret put GROQ_API_KEY
# opcional: OPENAI_API_KEY
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_WHATSAPP_FROM
# whatsapp:+XXXXXXXXXXX  (número Mi Menú Smart)
npx wrangler deploy
```

### Endpoints

- `POST /recipes` → getRecipes `{ ingredients, budget, output: "recipes" }`
- `POST /weekly-plan` → generateWeeklyPlan + opcional `recipient` + `notify: true`
- `POST /notify/whatsapp` → `{ recipient }` → "Tu menú semanal está listo 🍳"

## 3. Frontend

`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aknloedykengemrlehyp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_MENU_API_URL=https://mi-menu-smart-api.XXX.workers.dev
```

GitHub Actions Pages: secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.  
Opcional Pages env: `NEXT_PUBLIC_MENU_API_URL`.

## 4. Dominio Cloudflare

1. Añadir zona `cocinaconpresupuesto.cl`
2. Pages project custom domain: `cocinaconpresupuesto.cl` (+ `www`)
3. Worker route: `api.cocinaconpresupuesto.cl/*` → `mi-menu-smart-api`
4. Actualizar `NEXT_PUBLIC_MENU_API_URL=https://api.cocinaconpresupuesto.cl`

## 5. Twilio (aislado)

Usar Messaging Service / número **distinto** al de Senior Safe.  
Sandbox o número dedicado solo a menús.

## 6. Android + iOS PWA

```bash
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/android --save
npx cap add android
npx cap sync android
npx cap open android
```

- `.aab` desde Android Studio (appId `app.chefsmart.mobile`, nombre **Mi Menú Smart**)
- iPhone: Safari → Añadir a inicio → nombre corto **Mi Menú**

## Prompt IA base

```json
{
  "ingredients": ["pollo", "arroz", "tomate"],
  "budget": 7000,
  "output": "recipes"
}
```
