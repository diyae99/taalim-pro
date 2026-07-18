create or replace function public.is_active_teacher()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'teacher'
      and profile.account_status = 'active'
  );
$$;

create or replace function public.protect_profile_authorization_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.account_status is distinct from old.account_status)
    and not public.is_platform_admin()
  then
    raise exception 'Only an active platform administrator can change role or account status'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.is_active_teacher() from public;
grant execute on function public.is_active_teacher() to authenticated;
revoke all on function public.protect_profile_authorization_fields() from public, anon, authenticated;
