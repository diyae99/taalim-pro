alter table public.profiles
  add column if not exists city text,
  add column if not exists school_name text,
  add column if not exists school_level text,
  add column if not exists school_subject text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    city,
    school_name,
    school_level,
    school_subject,
    role,
    account_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'city'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'school_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'school_level'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'school_subject'), ''),
    'teacher',
    'pending'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

update public.profiles as profile
set
  full_name = coalesce(
    nullif(btrim(profile.full_name), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    profile.full_name
  ),
  phone = coalesce(
    nullif(btrim(profile.phone), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'phone'), ''),
    profile.phone
  ),
  city = coalesce(
    nullif(btrim(profile.city), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'city'), ''),
    profile.city
  ),
  school_name = coalesce(
    nullif(btrim(profile.school_name), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'school_name'), ''),
    profile.school_name
  ),
  school_level = coalesce(
    nullif(btrim(profile.school_level), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'school_level'), ''),
    profile.school_level
  ),
  school_subject = coalesce(
    nullif(btrim(profile.school_subject), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'school_subject'), ''),
    profile.school_subject
  )
from auth.users as auth_user
where auth_user.id = profile.id
  and (
    (nullif(btrim(profile.full_name), '') is null and nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), '') is not null)
    or (nullif(btrim(profile.phone), '') is null and nullif(btrim(auth_user.raw_user_meta_data ->> 'phone'), '') is not null)
    or (nullif(btrim(profile.city), '') is null and nullif(btrim(auth_user.raw_user_meta_data ->> 'city'), '') is not null)
    or (nullif(btrim(profile.school_name), '') is null and nullif(btrim(auth_user.raw_user_meta_data ->> 'school_name'), '') is not null)
    or (nullif(btrim(profile.school_level), '') is null and nullif(btrim(auth_user.raw_user_meta_data ->> 'school_level'), '') is not null)
    or (nullif(btrim(profile.school_subject), '') is null and nullif(btrim(auth_user.raw_user_meta_data ->> 'school_subject'), '') is not null)
  );
