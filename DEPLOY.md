# Deployment (Fly.io backend + Cloudflare Pages frontend)

This repo runs locally by default. This guide makes it reachable at real HTTPS URLs.

## Backend → Fly.io

From `backend/`:

1. `fly launch` (uses `backend/Dockerfile` and `backend/fly.toml`).
2. Create a persistent volume for SQLite + model cache:
   - `fly volumes create apex_data --size 1 --region <your-region>`

### Required secrets (production)

Set these (example shown):

- `APEX_ENV=production`
- `APEX_JWT_SECRET=<random 48+ bytes>`
- `APEX_CORS_ORIGINS=https://<your-pages-domain>`

Example:

```bash
fly secrets set \
  APEX_ENV=production \
  APEX_JWT_SECRET="$(python -c "import secrets;print(secrets.token_urlsafe(48))")" \
  APEX_CORS_ORIGINS="https://apex-500.pages.dev"
```

Fly will mount a volume at `/data` (configured in `backend/fly.toml`). The backend reads:

- SQLite DB from `APEX_DB_PATH` or `APEX_DATA_DIR` (defaults to local `backend/data/apex.db`).
- Model cache from `APEX_MODELS_DIR` (defaults to local `backend/models_cache/`).

## Frontend → Cloudflare Pages

1. Connect the GitHub repo.
2. Build settings:
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Set environment variable:
   - `VITE_API_URL=https://<your-fly-app>.fly.dev`

## After deploy

- Backend docs: `https://<fly-app>.fly.dev/docs`
- Frontend: `https://<pages-site>.pages.dev`

