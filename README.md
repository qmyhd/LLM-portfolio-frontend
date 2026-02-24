# LLM Portfolio Frontend

Next.js 14 dashboard for the LLM Portfolio Journal system.

## Project Structure

The Next.js app lives in `./frontend/` (contains `package.json`, `next.config.mjs`, `src/app/`).

**All frontend commands must be run from `./frontend`:**

```bash
cd frontend
npm ci
npm run dev    # local dev server
npm run build  # production build
npm run lint   # ESLint
```

Or use the convenience scripts from the repo root:

```bash
npm run frontend:dev
npm run frontend:build
npm run frontend:lint
```

## Vercel Deployment

Vercel is configured with **Root Directory = `frontend`** in Project Settings.
Pushes to `main` trigger automatic deployments.

## Backend

The backend repo is [LLM-portfolio-project](https://github.com/qmyhd/LLM-portfolio-project) (FastAPI + Python).
The frontend proxies API calls via Next.js API routes using the BFF pattern.
