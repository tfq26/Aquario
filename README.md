# Aquario

Aquario is a simple Hono + Vue app for managing resume context and generating tailored hiring materials with AI support.

## Features

- Capture structured experience, skills, links, and career notes
- Connect a GitHub account and pull repository context for AI prompts
- Upload an existing resume for reference
- Paste a job description and generate tailored resumes, CVs, supporting documents, and interview responses

## Stack

- `apps/api`: Hono API running on Node.js
- `apps/web`: Vue 3 + Vite frontend
- Local JSON file storage for fast iteration

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `apps/api/.env` from `apps/api/.env.example` and set:

- `GEMINI_API_KEY`
- `GITHUB_TOKEN` if you want GitHub repo context sync

3. Launch both apps together:

```bash
npm run launch
```

4. Or run them separately if you prefer:

```bash
npm run dev:api
npm run dev:web
```

## Notes

- Uploaded resumes are stored locally under `apps/api/uploads/`.
- App data is stored locally under `apps/api/data/`.
- PDF and DOCX resume text extraction is wired in through `pdf-parse` and `mammoth`.
- The AI generation backend uses the Gemini API.
