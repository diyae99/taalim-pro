# Taalim Pro

Taalim Pro is a React/Vite SaaS prototype for schools and teachers to manage and download ready-made exams from a local exam bank. It uses fake authentication and localStorage data so the product flow can be tested without a backend.

## Main Features

- Landing page with demo-video placeholder support.
- Fake localStorage login and registration.
- Admin approval workflow for client accounts.
- Client profiles with school identity, logo, niveau, and matière.
- Admin user management with activation, suspension, password regeneration, and status filters.
- Admin exam management with create, edit, delete, activate/deactivate.
- PDF upload/download for original exam PDFs stored as data URLs in localStorage.
- Personalized PDF export with school logo/name added at download time.
- Protected client and admin routes.
- Vercel SPA route fallback via `vercel.json`.

## Technologies

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- localStorage
- jsPDF

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env.local` for local overrides if needed:

```bash
cp .env.example .env.local
```

Available variables:

```env
VITE_DEFAULT_ADMIN_EMAIL=admin@example.com
VITE_DEFAULT_ADMIN_PASSWORD=change_this_demo_password
```

These values are for prototype-only frontend authentication. Do not put real private credentials, service-role keys, database passwords, or private API keys in a Vite frontend environment variable.

## Local Development

```bash
npm run dev
```

Default local URL:

```text
http://127.0.0.1:5173/
```

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
4. Add optional environment variables in Vercel:
   - `VITE_DEFAULT_ADMIN_EMAIL`
   - `VITE_DEFAULT_ADMIN_PASSWORD`
5. Deploy.

The included `vercel.json` rewrites all routes to `index.html` so React Router routes work after refresh.

## Prototype Admin Account

If no environment variables are configured, the local demo fallback is:

```text
Email: admin@taalimpro.ma
Password: admin123
```

Change these values through environment variables before sharing a public demo.
