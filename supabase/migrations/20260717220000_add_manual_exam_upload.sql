-- Manual exam PDF metadata and private Storage bucket.
-- Authorization uses immutable Auth app_metadata, never user-editable user_metadata.

create extension if not exists pgcrypto;

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exam_type text not null,
  level text not null,
  subject text not null,
  semester text not null,
  language text not null,
  themes text[] not null,
  instructions text,
  file_path text not null unique,
  file_name text not null,
  file_size bigint not null,
  mime_type text not null default 'application/pdf',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint exams_language_check check (language in ('fr', 'ar', 'en')),
  constraint exams_themes_check check (cardinality(themes) > 0),
  constraint exams_file_path_check check (file_path like 'exams/%' and lower(file_path) like '%.pdf'),
  constraint exams_file_name_check check (lower(file_name) like '%.pdf'),
  constraint exams_file_size_check check (file_size > 0 and file_size <= 20971520),
  constraint exams_mime_type_check check (mime_type = 'application/pdf')
);

alter table public.exams add column if not exists exam_type text;
alter table public.exams add column if not exists language text;
alter table public.exams add column if not exists themes text[];
alter table public.exams add column if not exists instructions text;
alter table public.exams add column if not exists file_path text;
alter table public.exams add column if not exists file_name text;
alter table public.exams add column if not exists file_size bigint;
alter table public.exams add column if not exists mime_type text default 'application/pdf';
alter table public.exams add column if not exists active boolean default true;
alter table public.exams add column if not exists created_at timestamptz default now();
alter table public.exams add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Preserve legacy rows while retiring old generation-only fields.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exams' and column_name = 'duration') then
    alter table public.exams alter column duration drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exams' and column_name = 'bareme') then
    alter table public.exams alter column bareme drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exams' and column_name = 'content') then
    alter table public.exams alter column content drop not null;
  end if;
end $$;

grant select, insert, update, delete on table public.exams to authenticated;
alter table public.exams enable row level security;

drop policy if exists "Authenticated users can view exams" on public.exams;
create policy "Authenticated users can view exams"
on public.exams for select to authenticated
using (true);

drop policy if exists "Admins can create exams" on public.exams;
create policy "Admins can create exams"
on public.exams for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admins can update exams" on public.exams;
create policy "Admins can update exams"
on public.exams for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete exams" on public.exams;
create policy "Admins can delete exams"
on public.exams for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exam-files', 'exam-files', false, 20971520, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authorized users can download exam PDFs" on storage.objects;
create policy "Authorized users can download exam PDFs"
on storage.objects for select to authenticated
using (bucket_id = 'exam-files' and (storage.foldername(name))[1] = 'exams');

drop policy if exists "Admins can upload exam PDFs" on storage.objects;
create policy "Admins can upload exam PDFs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'exam-files'
  and (storage.foldername(name))[1] = 'exams'
  and lower(storage.extension(name)) = 'pdf'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admins can replace exam PDFs" on storage.objects;
create policy "Admins can replace exam PDFs"
on storage.objects for update to authenticated
using (bucket_id = 'exam-files' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check (
  bucket_id = 'exam-files'
  and (storage.foldername(name))[1] = 'exams'
  and lower(storage.extension(name)) = 'pdf'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admins can delete exam PDFs" on storage.objects;
create policy "Admins can delete exam PDFs"
on storage.objects for delete to authenticated
using (
  bucket_id = 'exam-files'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
