# Mi Menú Smart

Frontend PWA + API Worker + Supabase — **independiente** de Senior Safe.  
Repo: `chef-smart-app` · Marca: **Mi Menú Smart** · Corto PWA: **Mi Menú**

Guía completa: [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md) · DB: [docs/SUPABASE.md](docs/SUPABASE.md)

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

API local:

```bash
cd workers && npm install && npm run dev
```

## Deploy

- Pages: `.github/workflows/deploy-pages.yml`
- Worker: `.github/workflows/deploy-worker.yml`
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` + secrets del Worker (ver ORCHESTRATION.md)

## Android / iOS

Ver sección Capacitor en ORCHESTRATION.md. AppId: `app.chefsmart.mobile`.
