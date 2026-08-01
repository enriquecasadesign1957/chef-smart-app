# Mi Menú Smart

Frontend PWA + API Worker + Supabase — **independiente** de Senior Safe.  
Repo: `chef-smart-app` · Marca: **Mi Menú Smart** · Corto PWA: **Mi Menú**

Guía: [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md) · DB: [docs/SUPABASE.md](docs/SUPABASE.md)

**Live**
- Web: https://mi-menu-smart.pages.dev  
- API: https://mi-menu-smart-api.enriquecasadesign.workers.dev  

## Pantallas

| Ruta | Función |
|------|---------|
| `/` | Ingredientes + presupuesto |
| `/recetas` | Recetas (Worker IA / Supabase / demo) |
| `/plan` | Menú semanal |
| `/compras` | Lista de compras |

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Deploy

- Pages: `.github/workflows/deploy.yml`
- Worker: `.github/workflows/deploy-worker.yml`
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` + Worker secrets (ORCHESTRATION.md)

## Android / iOS

```bash
npm run build && npx cap sync android
npx cap open android
```

AppId: `app.chefsmart.mobile` · PWA corto: **Mi Menú**
