# Taalim Pro

Taalim Pro is a React/Vite SaaS prototype for schools and teachers to manage and download ready-made exams from a local exam bank. It uses fake localStorage authentication for the prototype UI and a Vercel Function for secure AI-powered exam generation.

## Main Features

- Landing page with demo-video placeholder support.
- Fake localStorage login and registration.
- Admin approval workflow for client accounts.
- Client profiles with school identity, logo, niveau, and matière.
- Admin user management with activation, suspension, password regeneration, and status filters.
- Admin exam management with create, edit, delete, activate/deactivate.
- AI-assisted exam creation and existing personalized PDF export.
- AI exam generation through a server-side Vercel Function.
- Separate AI exports for student PDF and teacher correction PDF.
- Protected client and admin routes.
- Vercel SPA route fallback that preserves `/api/*` functions.

## AI Generation Architecture

```text
React frontend
→ POST /api/generate-exam
→ Vercel Node.js Function
→ OpenAI Responses API
→ Structured JSON exam
→ Frontend preview and PDF export
```

The browser never calls `api.openai.com` directly. The OpenAI client is created only in `api/generate-exam.ts`, and the API key is read only from `process.env.OPENAI_API_KEY`.

## Technologies

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- localStorage
- jsPDF
- OpenAI JavaScript SDK
- Zod
- Vercel Functions

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env.local` for local server-side testing with Vercel tooling:

```bash
cp .env.example .env.local
```

Required for AI generation:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.6-luna
```

`OPENAI_API_KEY` must remain server-side only. Do not create `VITE_OPENAI_API_KEY`, do not put private keys in React/Vite client code, and do not commit `.env` or `.env.local`.

If `OPENAI_MODEL` is omitted, the function uses:

```text
gpt-5.6-luna
```

## Local Development

For normal frontend development:

```bash
npm run dev
```

For full frontend plus `/api/generate-exam` testing, use Vercel development tooling:

```bash
npm install -g vercel
vercel dev
```

Then open the local Vercel URL and generate an exam from Admin → Examens → Ajouter un examen.

## Production Build

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the GitHub repository in Vercel.
3. Use the Vite defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables in Vercel:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional)
5. Deploy.
6. After deployment, log in as admin, open Admin → Examens → Ajouter un examen, and test AI generation.

The included `vercel.json` keeps `/api/*` available for Vercel Functions while rewriting React routes to `index.html`.

## PDF Notes

AI-generated exams can be exported in two separate ways:

- Student PDF: exam content only, with school metadata/logo, instructions, questions, scores, and no answers.
- Teacher correction PDF: answer key, expected answers, explanations, and scores.

Arabic preview uses RTL in the browser. The current PDF layer uses jsPDF; production-grade Arabic PDF rendering may require bundling a compatible Arabic font and shaping strategy.

## Security Notes

This project is still a prototype. localStorage authentication is not sufficient for a public production application. Before public launch, replace fake auth with a real authentication provider and enforce authorization server-side.

AI generation can create usage costs. Add production-grade rate limiting before public access. Do not use an in-memory-only limiter on Vercel Functions because functions can run on multiple instances.

TODO:

- Add Supabase Auth or another production authentication system.
- Add persistent user/account storage.
- Add persistent rate limiting using a database or rate-limit store.
- Audit and improve Arabic PDF rendering with a bundled font.

## Prototype Admin Account

The local demo fallback is:

```text
Email: admin@taalimpro.ma
Password: admin123
```

These are prototype credentials only, not production authentication.
