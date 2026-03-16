# Aquario

Aquario is a Hono + Vue app for managing resume context and generating tailored hiring materials with AI support.

## Features

- Capture structured experience, skills, links, and career notes
- Connect a GitHub account and pull repository context for AI prompts
- Upload an existing resume for reference
- Paste a job description and generate tailored resumes, CVs, supporting documents, and interview responses

## Stack

- `apps/api`: Hono API running on Node.js locally and on Cloudflare Workers for deployment
- `apps/web`: Vue 3 + Vite frontend
- Local JSON storage for fast iteration, with D1 and R2 bindings available on Cloudflare

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `apps/api/.env` from `apps/api/.env.example` and set:

- `AUTH_PASSWORD`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` if you want Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` if you want GitHub OAuth
- `GEMINI_API_KEY`
- `GITHUB_TOKEN` if you want GitHub repo context sync
- `APP_ORIGIN` for the frontend origin
- `API_ORIGIN` for OAuth callback generation

3. Launch both apps together:

```bash
npm run launch
```

4. Or run them separately if you prefer:

```bash
npm run dev:api
npm run dev:web
```

## Cloudflare setup

1. Copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars` for local `wrangler` usage.
2. Authenticate once:

```bash
npx wrangler login
npx wrangler whoami
```

3. Create the Cloudflare resources:

```bash
npx wrangler d1 create aquario-db
npx wrangler r2 bucket create aquario-resumes
```

4. Paste the returned D1 `database_id` into [`apps/api/wrangler.jsonc`](/Users/taufeeqali/Projects/Aquario/apps/api/wrangler.jsonc). The app already uses:
- D1 binding: `APP_DB`
- R2 binding: `RESUME_BUCKET`

5. Apply the database schema:

```bash
npm run cf:d1:apply:remote --workspace apps/api
```

This also creates the catalog tables used for shared skills and technologies. Default terms are seeded into D1 automatically on first catalog use.

6. Set production secrets with Wrangler:

```bash
npx wrangler secret put AUTH_PASSWORD
npx wrangler secret put AUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GITHUB_TOKEN
```

7. Set `APP_ORIGIN` to your deployed web origin, `API_ORIGIN` to your API origin, and `COOKIE_SECURE` to `true` in production.
8. In GitHub and Google, configure the OAuth callback URLs as:

```text
https://your-api-origin/api/auth/github/callback
https://your-api-origin/api/auth/google/callback
```

9. Deploy the Worker:

```bash
npm run deploy:api
```

10. For local Cloudflare-backed dev instead of Node fallback:

```bash
npm run dev:worker
```

## Notes

- Uploaded resumes are stored locally under `apps/api/uploads/`.
- App data is stored locally under `apps/api/data/`.
- PDF and DOCX resume text extraction is wired in through `pdf-parse` and `mammoth`.
- The API now protects app state, GitHub sync, resume uploads, and generation routes behind an authenticated session cookie.
- The sign-in screen supports password auth plus GitHub and Google OAuth when those credentials are configured.
- On Cloudflare, app state is stored in D1 and uploaded resumes are stored in R2.
- Shared skills and technology terms can be searched and resolved through:
  - `GET /api/catalog/search?kind=skill&q=react`
  - `GET /api/catalog/search?kind=technology&q=cloud`
  - `POST /api/catalog/resolve`
- The AI generation backend uses the Gemini API.
