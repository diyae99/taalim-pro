# Taalim Pro

Taalim Pro is a React/Vite prototype for schools and teachers to manage and download ready-made exams uploaded by an administrator as PDF files.

## Main features

- Existing local prototype authentication and admin approval workflow.
- Admin exam creation and editing with required PDF upload, themes, and optional instructions.
- PDF validation (format and 20 MB limit), replacement, deletion, and download.
- Exam filtering by teacher level and subject.
- Private Supabase Storage and RLS migration ready for the production authentication transition.

## Current persistence model

The existing prototype authentication and exam metadata remain in `localStorage`. PDF blobs are stored durably in IndexedDB so they survive refreshes without exceeding `localStorage` limits. This preserves the existing demo login and navigation.

The migration in `supabase/migrations` defines the production `exams` table, the private `exam-files` bucket, metadata validation, and policies based on Supabase Auth `app_metadata.role`. It must only be applied when the application is connected to Supabase Auth; anonymous uploads are intentionally not enabled.

## Installation and checks

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

For local development:

```bash
npm run dev
```

Optional prototype admin overrides:

```env
VITE_DEFAULT_ADMIN_EMAIL=admin@taalimpro.ma
VITE_DEFAULT_ADMIN_PASSWORD=admin123
```

No OpenAI environment variable is used by the exam workflow.

## Supabase migration

After linking a Supabase project and migrating authentication to Supabase Auth, apply migrations with the installed CLI:

```bash
supabase db push
```

Administrative access is determined by `public.profiles.role = 'platform_admin'`; frontend authorization never trusts editable user metadata. The migration creates a private `exam-files` bucket with a 20 MB limit and `application/pdf` as its only accepted MIME type. Never expose a service-role key in the frontend.
