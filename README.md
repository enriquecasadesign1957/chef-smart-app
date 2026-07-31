# Chef Smart

Frontend visual (PWA + base móvil) **independiente** de Senior Safe.

- **Stack:** Next.js (App Router) + Tailwind CSS
- **Deploy:** GitHub Actions → Cloudflare Pages (`out/` static export)
- **Sin** compartir repo, DB, workers ni integraciones con Senior Safe

## Pantallas

| Ruta | Función |
|------|---------|
| `/` | Ingredientes + presupuesto |
| `/recetas` | Recetas sugeridas (costo, dificultad, tiempo) |
| `/plan` | Menú semanal vs presupuesto |
| `/compras` | Lista de compras por categorías |

Datos actuales: **demo local** (`src/lib/demo-data.ts`). Backend/IA se agrega después en este mismo repo.

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Build estático (Cloudflare Pages)

```bash
npm run build
# salida en ./out
```

### Secrets de GitHub (Actions)

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Crea el proyecto Pages llamado `chef-smart-app` en Cloudflare (o deja que el primer deploy lo cree si tu token lo permite).

## PWA (iPhone / Android)

- `public/manifest.webmanifest`
- Service worker `public/sw.js`
- En iPhone: Safari → Compartir → Añadir a pantalla de inicio

## Android (.aab) — preparación

1. Tras `npm run build` (genera `out/`):

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android --save
npx cap add android
npx cap sync android
```

2. Abrir Android Studio → `android/` → generar **Android App Bundle (.aab)**.

`capacitor.config.ts` ya apunta `webDir` a `out` y `appId` a `app.chefsmart.mobile`.

## Base de datos (Supabase)

Proyecto **independiente** `chef_smart` — ver [docs/SUPABASE.md](docs/SUPABASE.md).

Tablas: `recipes`, `weekly_plans`. Hooks: `useRecipes`, `useWeeklyPlan`.

## Separación de Senior Safe

Este proyecto vive en `chef-smart-app` (repo propio). No importar código, env vars ni Cloudflare Workers de `senior-life-guardian`.
