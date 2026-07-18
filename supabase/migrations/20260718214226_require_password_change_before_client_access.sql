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
      and not profile.must_change_password
  );
$$;

revoke all on function public.is_active_teacher() from public;
grant execute on function public.is_active_teacher() to authenticated;
